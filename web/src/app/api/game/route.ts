import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest) {
	try {
		const game = await prisma.game.create({
			data: {
				rollCount: 0,
				totalScore: 0,
			},
		})
		
		// Return the full game object that matches our interface
		return NextResponse.json({
			id: game.id,
			playerName: game.playerName,
			totalScore: game.totalScore,
			rollCount: game.rollCount,
			completedAt: game.completedAt,
		}, { status: 201 })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
	}
} 