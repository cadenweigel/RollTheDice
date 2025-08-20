import { z } from 'zod'

// Common validation schemas
export const GameIdSchema = z.string().cuid().min(1)
export const PlayerNameSchema = z
  .string()
  .min(1, 'Player name must be at least 1 character')
  .max(50, 'Player name must be 50 characters or less')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Player name can only contain letters, spaces, hyphens, apostrophes, and periods')
  .refine(val => val.trim().length > 0, 'Player name cannot be only whitespace')
  .refine(val => /[a-zA-Z]/.test(val), 'Player name must contain at least one letter')
  .transform(val => val.trim().replace(/\s+/g, ' '))
  .transform(val => 
    val.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  )

export const DiceValueSchema = z.number().int().min(1).max(6)
export const DicePairSchema = z.object({
  dieA: DiceValueSchema,
  dieB: DiceValueSchema,
})

// API request schemas
export const CreateGameSchema = z.object({
  // Currently no body needed, but keeping for future extensibility
}).passthrough()

export const RollDiceSchema = z.object({
  dieA: DiceValueSchema,
  dieB: DiceValueSchema,
})

export const FinishGameSchema = z.object({
  playerName: PlayerNameSchema.optional(),
})

export const LeaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  page: z.coerce.number().int().min(1).default(1),
})

// Response schemas for type safety
export const GameResponseSchema = z.object({
  id: z.string(),
  playerName: z.string().nullable(),
  totalScore: z.number(),
  rollCount: z.number(),
  completedAt: z.string().nullable(),
})

export const RollResponseSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  index: z.number(),
  dieA: z.number(),
  dieB: z.number(),
  sum: z.number(),
  createdAt: z.string(),
})

export const LeaderboardResponseSchema = z.object({
  games: z.array(GameResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export const StatsResponseSchema = z.object({
  totalScoreAllTime: z.number(),
  totalGames: z.number(),
  averageScorePerGame: z.number(),
  sumDistribution: z.array(z.number()),
  pairDistribution: z.array(z.array(z.number())),
})

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
})

// Validation utility functions
export function validateGameId(id: string): string | null {
  try {
    return GameIdSchema.parse(id)
  } catch (_error) {
    return null
  }
}

export function validatePlayerName(name: string): string | null {
  try {
    return PlayerNameSchema.parse(name)
  } catch (_error) {
    return null
  }
}

export function validateDiceValues(dieA: number, dieB: number): { dieA: number; dieB: number } | null {
  try {
    return DicePairSchema.parse({ dieA, dieB })
  } catch (_error) {
    return null
  }
}

// Rate limiting and security utilities
export const RATE_LIMIT_CONFIG = {
  MAX_ROLLS_PER_MINUTE: 60, // Allow up to 60 rolls per minute per IP
  MAX_GAMES_PER_HOUR: 10,   // Allow up to 10 new games per hour per IP
  MAX_REQUESTS_PER_MINUTE: 100, // General rate limit
}

// Input sanitization utilities
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 1000) // Prevent extremely long inputs
}

export function sanitizeNumber(input: unknown): number | null {
  const num = Number(input)
  return Number.isFinite(num) ? num : null
}

// Business logic validation
export function validateGameState(game: unknown): { isValid: boolean; error?: string } {
  if (!game || typeof game !== 'object' || game === null) {
    return { isValid: false, error: 'Game not found' }
  }
  
  const gameObj = game as { completedAt?: Date | null; rollCount?: number }
  
  if (gameObj.completedAt) {
    return { isValid: false, error: 'Game already completed' }
  }
  
  if (typeof gameObj.rollCount === 'number' && gameObj.rollCount >= 10) {
    return { isValid: false, error: 'Maximum rolls (10) already reached' }
  }
  
  return { isValid: true }
}

export function validateRollRequest(game: unknown, dieA: number, dieB: number): { isValid: boolean; error?: string } {
  const gameValidation = validateGameState(game)
  if (!gameValidation.isValid) {
    return gameValidation
  }
  
  if (dieA < 1 || dieA > 6 || dieB < 1 || dieB > 6) {
    return { isValid: false, error: 'Dice values must be between 1 and 6' }
  }
  
  return { isValid: true }
} 