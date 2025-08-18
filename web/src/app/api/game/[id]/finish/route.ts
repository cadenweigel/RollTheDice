import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	const { id: gameId } = await context.params
	if (!gameId) {
		return NextResponse.json({ error: 'Missing game id' }, { status: 400 })
	}

	let playerName: string | undefined
	try {
		if (req.headers.get('content-type')?.includes('application/json')) {
			const body = await req.json().catch(() => ({})) as { playerName?: string }
			if (typeof body.playerName === 'string') {
				const trimmed = body.playerName.trim()
				if (trimmed.length > 0) {
					playerName = trimmed.slice(0, 50)
				}
			}
		}
	} catch {
		// ignore invalid json
	}

	try {
		const game = await prisma.game.findUnique({ where: { id: gameId } })
		if (!game) {
			return NextResponse.json({ error: 'Game not found' }, { status: 404 })
		}

		const updated = await prisma.game.update({
			where: { id: gameId },
			data: {
				completedAt: game.completedAt ?? new Date(),
				...(playerName ? { playerName } : {}),
			},
		})

		return NextResponse.json({ gameId: updated.id, completedAt: updated.completedAt, playerName: updated.playerName ?? null })
	} catch (_error) {
		return NextResponse.json({ error: 'Failed to finish game' }, { status: 500 })
	}
} 