import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { handleUnexpectedError } from '@/lib/errors'

export const runtime = 'nodejs'

async function GETHandler(req: NextRequest) {
	try {
		// Only count completed games
		const [gameAgg, sumGroups, pairGroups] = await Promise.all([
			prisma.game.aggregate({ 
				where: { completedAt: { not: null } },
				_sum: { totalScore: true }, 
				_count: true 
			}),
			// Only count rolls from completed games
			prisma.roll.groupBy({ 
				by: ['sum'], 
				_count: { _all: true },
				where: {
					game: {
						completedAt: { not: null }
					}
				}
			}),
			// Only count dice pairs from completed games
			prisma.roll.groupBy({ 
				by: ['dieA', 'dieB'], 
				_count: { _all: true },
				where: {
					game: {
						completedAt: { not: null }
					}
				}
			}),
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
	} catch (error) {
		return handleUnexpectedError(error)
	}
}

// Apply rate limiting
export const GET = withRateLimit(RATE_LIMITS.READ_ONLY, GETHandler) 