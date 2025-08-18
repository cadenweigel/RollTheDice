import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

function randomDie(): number {
	return Math.floor(Math.random() * 6) + 1
}

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
	const { id: gameId } = await context.params
	if (!gameId) {
		return NextResponse.json({ error: 'Missing game id' }, { status: 400 })
	}

	try {
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

			const dieA = randomDie()
			const dieB = randomDie()
			const sum = dieA + dieB
			const index = game.rollCount

			await tx.roll.create({
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
					gameId,
					index,
					dieA,
					dieB,
					sum,
					rollCount: updated.rollCount,
					totalScore: updated.totalScore,
				},
			}
		})

		return NextResponse.json(result.body, { status: result.status })
	} catch (_error) {
		return NextResponse.json({ error: 'Failed to roll dice' }, { status: 500 })
	}
} 