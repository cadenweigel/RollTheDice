import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { FinishGameSchema, validateGameId } from '@/lib/validation'
import { ErrorResponses, handleUnexpectedError } from '@/lib/errors'
import { z } from 'zod'

export const runtime = 'nodejs'

async function POSTHandler(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	const { id: gameId } = await context.params
	
	// Validate game ID
	if (!gameId || !validateGameId(gameId)) {
		return ErrorResponses.invalidGameId()
	}

	let playerName: string | undefined
	
	// Parse and validate request body
	try {
		if (req.headers.get('content-type')?.includes('application/json')) {
			const body = await req.json().catch(() => ({}))
			
			// Validate using Zod schema
			try {
				const validated = FinishGameSchema.parse(body)
				playerName = validated.playerName
			} catch (error) {
				if (error instanceof z.ZodError) {
					return NextResponse.json({
						error: 'Invalid player name',
						code: 'INVALID_PLAYER_NAME',
						details: error.issues,
					}, { status: 400 })
				}
			}
		}
	} catch (error) {
		// If JSON parsing fails, continue without player name
		console.warn('Failed to parse JSON body:', error)
	}

	try {
		const game = await prisma.game.findUnique({ where: { id: gameId } })
		if (!game) {
			return ErrorResponses.gameNotFound()
		}

		// Check if game is already completed
		if (game.completedAt) {
			return ErrorResponses.gameAlreadyCompleted()
		}

		// Check if game has the required 10 rolls
		if (game.rollCount < 10) {
			return NextResponse.json({
				error: 'Game must have 10 rolls before it can be completed',
				code: 'GAME_INCOMPLETE',
				details: { currentRolls: game.rollCount, requiredRolls: 10 },
			}, { status: 400 })
		}

		const updated = await prisma.game.update({
			where: { id: gameId },
			data: {
				completedAt: new Date(),
				...(playerName ? { playerName } : {}),
			},
		})

		// Return the full game object that matches our interface
		return NextResponse.json({
			id: updated.id,
			playerName: updated.playerName,
			totalScore: updated.totalScore,
			rollCount: updated.rollCount,
			completedAt: updated.completedAt,
		})
	} catch (error) {
		return handleUnexpectedError(error)
	}
}

// Apply rate limiting
export const POST = withRateLimit(RATE_LIMITS.FINISH_GAME, POSTHandler) 