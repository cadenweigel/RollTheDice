import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

// Normalize player names for consistency
function normalizePlayerName(name: string): string {
  return name
    .trim() // Remove leading/trailing whitespace
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Title case each word
    .join(' ')
}

// Validate and sanitize player names
function validatePlayerName(name: string): string | null {
  // Remove any non-alphabetic characters except spaces and common punctuation
  const sanitized = name
    .replace(/[^a-zA-Z\s\-'\.]/g, '') // Only allow letters, spaces, hyphens, apostrophes, and periods
    .trim()
  
  // Must be at least 1 character and no more than 50
  if (sanitized.length === 0 || sanitized.length > 50) {
    return null
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(sanitized)) {
    return null
  }
  
  return sanitized
}

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
				const validated = validatePlayerName(body.playerName)
				if (validated) {
					// Normalize the validated player name before saving
					playerName = normalizePlayerName(validated)
				} else {
					return NextResponse.json({ error: 'Invalid player name. Must contain only letters, spaces, hyphens, apostrophes, and periods (1-50 characters).' }, { status: 400 })
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

		// Return the full game object that matches our interface
		return NextResponse.json({
			id: updated.id,
			playerName: updated.playerName,
			totalScore: updated.totalScore,
			rollCount: updated.rollCount,
			completedAt: updated.completedAt,
		})
	} catch (_error) {
		return NextResponse.json({ error: 'Failed to finish game' }, { status: 500 })
	}
} 