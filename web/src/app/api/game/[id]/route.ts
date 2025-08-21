import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { validateGameId } from '@/lib/validation'
import { ErrorResponses, handleUnexpectedError } from '@/lib/errors'

export const runtime = 'nodejs'

async function GETHandler(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	const { id: gameId } = await context.params
	
	// Validate game ID
	if (!gameId || !validateGameId(gameId)) {
		return ErrorResponses.invalidGameId()
	}

	try {
		// Check if game exists
		const game = await prisma.game.findUnique({
			where: { id: gameId },
			select: {
				id: true,
				playerName: true,
				totalScore: true,
				rollCount: true,
				createdAt: true,
				completedAt: true,
			},
		})

		if (!game) {
			return ErrorResponses.gameNotFound()
		}

		return NextResponse.json(game)
	} catch (error) {
		return handleUnexpectedError(error)
	}
}

// Apply rate limiting
export const GET = withRateLimit(RATE_LIMITS.READ_ONLY, GETHandler) 