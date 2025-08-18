import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const limitRaw = searchParams.get('limit') ?? '50'
	const parsed = Number.parseInt(limitRaw, 10)
	const limit = Number.isFinite(parsed) ? parsed : 50
	const take = Math.min(Math.max(limit, 1), 100)

	try {
		const games = await prisma.game.findMany({
			orderBy: [{ totalScore: 'desc' }, { createdAt: 'asc' }],
			take,
			select: {
				id: true,
				playerName: true,
				totalScore: true,
				rollCount: true,
				createdAt: true,
				completedAt: true,
			},
		})
		return NextResponse.json({ games })
	} catch (_error) {
		return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
	}
} 