import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { CreateGameSchema } from '@/lib/validation'
import { ErrorResponses, handleUnexpectedError } from '@/lib/errors'
import { z } from 'zod'

export const runtime = 'nodejs'

async function POSTHandler(req: NextRequest) {
	try {
		// Validate request body (even if empty, for future extensibility)
		try {
			await CreateGameSchema.parseAsync(await req.json().catch(() => ({})))
		} catch (error) {
			if (error instanceof z.ZodError) {
				return NextResponse.json({
					error: 'Invalid request body',
					code: 'INVALID_INPUT',
					details: error.issues,
				}, { status: 400 })
			}
		}

		const game = await prisma.game.create({
			data: {
				rollCount: 0,
				totalScore: 0,
			},
		})
		
		// Return the full game object that matches our interface
		return NextResponse.json({
			id: game.id,
			playerName: game.playerName,
			totalScore: game.totalScore,
			rollCount: game.rollCount,
			completedAt: game.completedAt,
		}, { status: 201 })
	} catch (error) {
		return handleUnexpectedError(error)
	}
}

// Apply rate limiting
export const POST = withRateLimit(RATE_LIMITS.CREATE_GAME, POSTHandler) 