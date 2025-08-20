import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { RollDiceSchema, validateGameId } from '@/lib/validation'
import { ErrorResponses, handleUnexpectedError } from '@/lib/errors'
import { z } from 'zod'

export const runtime = 'nodejs'

async function POSTHandler(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	const { id: gameId } = await context.params
	
	// Validate game ID
	if (!gameId || !validateGameId(gameId)) {
		return ErrorResponses.invalidGameId()
	}

	try {
		// Parse and validate request body
		let body: unknown
		try {
			body = await req.json()
		} catch {
			return NextResponse.json({
				error: 'Invalid JSON in request body',
				code: 'INVALID_INPUT',
			}, { status: 400 })
		}

		// Validate dice values using Zod
		let validatedDice: { dieA: number; dieB: number }
		try {
			validatedDice = RollDiceSchema.parse(body)
		} catch (error) {
			if (error instanceof z.ZodError) {
				return NextResponse.json({
					error: 'Invalid dice values',
					code: 'INVALID_DICE_VALUES',
					details: error.issues,
				}, { status: 400 })
			}
			return ErrorResponses.invalidDiceValues()
		}

		const { dieA, dieB } = validatedDice

		const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			const game = await tx.game.findUnique({ where: { id: gameId } })
			if (!game) {
				return { status: 404 as const, body: ErrorResponses.gameNotFound() }
			}
			if (game.completedAt) {
				return { status: 400 as const, body: ErrorResponses.gameAlreadyCompleted() }
			}
			if (game.rollCount >= 10) {
				return { status: 400 as const, body: ErrorResponses.maxRollsReached() }
			}

			// Use the validated dice values
			const sum = dieA + dieB
			const index = game.rollCount

			const roll = await tx.roll.create({
				data: {
					gameId,
					index,
					dieA,
					dieB,
					sum,
				},
			})

			await tx.game.update({
				where: { id: gameId },
				data: {
					rollCount: { increment: 1 },
					totalScore: { increment: sum },
				},
			})

			return {
				status: 200 as const,
				body: {
					id: roll.id,
					gameId,
					index,
					dieA,
					dieB,
					sum,
					createdAt: roll.createdAt.toISOString(),
				},
			}
		})

		return NextResponse.json(result.body, { status: result.status })
	} catch (error) {
		return handleUnexpectedError(error)
	}
}

// Apply rate limiting
export const POST = withRateLimit(RATE_LIMITS.ROLL_DICE, POSTHandler) 