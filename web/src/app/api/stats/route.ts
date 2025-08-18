import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
	try {
		const [gameAgg, sumGroups, pairGroups] = await Promise.all([
			prisma.game.aggregate({ _sum: { totalScore: true }, _count: true }),
			prisma.roll.groupBy({ by: ['sum'], _count: { _all: true } }),
			prisma.roll.groupBy({ by: ['dieA', 'dieB'], _count: { _all: true } }),
		])

		const totalScoreAllTime = gameAgg._sum.totalScore ?? 0
		const totalGames = gameAgg._count
		const averageScorePerGame = totalGames > 0 ? totalScoreAllTime / totalGames : 0

		const sumDistribution: number[] = Array.from({ length: 13 }, () => 0)
		for (const g of sumGroups) {
			if (g.sum >= 2 && g.sum <= 12) sumDistribution[g.sum] = g._count._all
		}

		const pairDistribution: number[][] = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => 0))
		for (const g of pairGroups) {
			if (g.dieA >= 1 && g.dieA <= 6 && g.dieB >= 1 && g.dieB <= 6) {
				pairDistribution[g.dieA - 1][g.dieB - 1] = g._count._all
			}
		}

		return NextResponse.json({
			totalScoreAllTime,
			totalGames,
			averageScorePerGame,
			sumDistribution,
			pairDistribution,
		})
	} catch (_error) {
		return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
	}
} 