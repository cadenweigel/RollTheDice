import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	const { id: gameId } = await context.params
	if (!gameId) {
		return NextResponse.json({ error: 'Missing game id' }, { status: 400 })
	}

	try {
		// Parse the request body to get the actual dice values
		const body = await req.json()
		const { dieA, dieB } = body

		// Validate that we received the dice values
		if (typeof dieA !== 'number' || typeof dieB !== 'number' || 
			dieA < 1 || dieA > 6 || dieB < 1 || dieB > 6) {
			return NextResponse.json({ error: 'Invalid dice values' }, { status: 400 })
		}

		const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			const game = await tx.game.findUnique({ where: { id: gameId } })
			if (!game) {
				return { status: 404 as const, body: { error: 'Game not found' } }
			}
			if (game.completedAt) {
				return { status: 400 as const, body: { error: 'Game already completed' } }
			}
			if (game.rollCount >= 10) {
				return { status: 400 as const, body: { error: 'Max rolls reached' } }
			}

			// Use the actual dice values from the physics simulation
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

			const updated = await tx.game.update({
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
	} catch (_error) {
		return NextResponse.json({ error: 'Failed to roll dice' }, { status: 500 })
	}
} 