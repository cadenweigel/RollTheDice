import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
	try {
		const game = await prisma.game.create({
			data: {},
		})
		return NextResponse.json({ gameId: game.id }, { status: 201 })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
	}
} 