import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { handleUnexpectedError } from '@/lib/errors'

export const runtime = 'nodejs'

async function GETHandler(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		
		// Get query parameters with defaults
		const limitParam = searchParams.get('limit')
		const pageParam = searchParams.get('page')
		
		// Parse and validate parameters manually for better error handling
		let limit = 50
		let page = 1
		
		if (limitParam) {
			const parsedLimit = parseInt(limitParam, 10)
			if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
				return NextResponse.json({
					error: 'Invalid limit parameter. Must be a number between 1 and 100.',
					code: 'INVALID_LIMIT',
				}, { status: 400 })
			}
			limit = parsedLimit
		}
		
		if (pageParam) {
			const parsedPage = parseInt(pageParam, 10)
			if (isNaN(parsedPage) || parsedPage < 1) {
				return NextResponse.json({
					error: 'Invalid page parameter. Must be a positive number.',
					code: 'INVALID_PAGE',
				}, { status: 400 })
			}
			page = parsedPage
		}
		
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
		console.error('Leaderboard API error:', error)
		return handleUnexpectedError(error)
	}
}

// Apply rate limiting
export const GET = withRateLimit(RATE_LIMITS.READ_ONLY, GETHandler) 