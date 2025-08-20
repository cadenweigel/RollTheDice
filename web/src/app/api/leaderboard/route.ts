import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { LeaderboardQuerySchema } from '@/lib/validation'
import { handleUnexpectedError } from '@/lib/errors'
import { z } from 'zod'

export const runtime = 'nodejs'

async function GETHandler(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		
		// Validate query parameters using Zod
		let validatedParams: { limit: number; page: number }
		try {
			validatedParams = LeaderboardQuerySchema.parse({
				limit: searchParams.get('limit'),
				page: searchParams.get('page'),
			})
		} catch (error) {
			if (error instanceof z.ZodError) {
				return NextResponse.json({
					error: 'Invalid query parameters',
					code: 'INVALID_INPUT',
					details: error.issues,
				}, { status: 400 })
			}
			return NextResponse.json({
				error: 'Invalid query parameters',
				code: 'INVALID_INPUT',
			}, { status: 400 })
		}

		const { limit, page } = validatedParams
		const skip = (page - 1) * limit

		// Get total count for pagination
		const [total, games] = await Promise.all([
			prisma.game.count({
				where: {
					completedAt: { not: null },
					rollCount: 10,
				},
			}),
			prisma.game.findMany({
				where: {
					completedAt: { not: null },
					rollCount: 10,
				},
				orderBy: [{ totalScore: 'desc' }, { createdAt: 'desc' }],
				skip,
				take: limit,
				select: {
					id: true,
					playerName: true,
					totalScore: true,
					rollCount: true,
					createdAt: true,
					completedAt: true,
				},
			}),
		])

		const totalPages = Math.ceil(total / limit)

		return NextResponse.json({
			games,
			pagination: {
				page,
				limit,
				total,
				totalPages,
			},
		})
	} catch (error) {
		return handleUnexpectedError(error)
	}
}

// Apply rate limiting
export const GET = withRateLimit(RATE_LIMITS.READ_ONLY, GETHandler) 