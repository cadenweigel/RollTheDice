import { NextResponse } from 'next/server'
import { z } from 'zod'

// Standard error codes for consistent error handling
export enum ErrorCode {
  // Validation errors (400)
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_GAME_ID = 'INVALID_GAME_ID',
  INVALID_DICE_VALUES = 'INVALID_DICE_VALUES',
  INVALID_PLAYER_NAME = 'INVALID_PLAYER_NAME',
  
  // Business logic errors (400)
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  GAME_ALREADY_COMPLETED = 'GAME_ALREADY_COMPLETED',
  MAX_ROLLS_REACHED = 'MAX_ROLLS_REACHED',
  GAME_INCOMPLETE = 'GAME_INCOMPLETE',
  
  // Rate limiting errors (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// Error response interface
export interface ErrorResponse {
  error: string
  code: ErrorCode
  details?: Record<string, unknown>
}

// Create standardized error responses
export function createErrorResponse(
  message: string,
  code: ErrorCode,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(details && { details }),
    },
    { status }
  )
}

// Common error responses
export const ErrorResponses = {
  invalidGameId: () => createErrorResponse(
    'Invalid game ID format',
    ErrorCode.INVALID_GAME_ID,
    400
  ),
  
  gameNotFound: () => createErrorResponse(
    'Game not found',
    ErrorCode.GAME_NOT_FOUND,
    404
  ),
  
  gameAlreadyCompleted: () => createErrorResponse(
    'Game already completed',
    ErrorCode.GAME_ALREADY_COMPLETED,
    400
  ),
  
  maxRollsReached: () => createErrorResponse(
    'Maximum rolls (10) already reached',
    ErrorCode.MAX_ROLLS_REACHED,
    400
  ),
  
  invalidDiceValues: () => createErrorResponse(
    'Dice values must be between 1 and 6',
    ErrorCode.INVALID_DICE_VALUES,
    400
  ),
  
  invalidPlayerName: (details?: string) => createErrorResponse(
    'Invalid player name. Must contain only letters, spaces, hyphens, apostrophes, and periods (1-50 characters).',
    ErrorCode.INVALID_PLAYER_NAME,
    400,
    details ? { suggestion: details } : undefined
  ),
  
  rateLimitExceeded: (retryAfter?: number) => createErrorResponse(
    'Rate limit exceeded. Please try again later.',
    ErrorCode.RATE_LIMIT_EXCEEDED,
    429,
    retryAfter ? { retryAfter } : undefined
  ),
  
  internalError: (details?: string) => createErrorResponse(
    'Internal server error',
    ErrorCode.INTERNAL_ERROR,
    500,
    details ? { details } : undefined
  ),
  
  databaseError: (details?: string) => createErrorResponse(
    'Database operation failed',
    ErrorCode.DATABASE_ERROR,
    500,
    details ? { details } : undefined
  ),
}

// Zod error handler for validation failures
export function handleZodError(error: z.ZodError): NextResponse<ErrorResponse> {
  const firstError = error.issues[0]
  const field = firstError.path.join('.')
  const message = firstError.message
  
  return createErrorResponse(
    `Validation failed: ${field} - ${message}`,
    ErrorCode.INVALID_INPUT,
    400,
    {
      field,
      message,
      allErrors: error.issues.map((e: z.ZodIssue) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    }
  )
}

// Generic error handler for unexpected errors
export function handleUnexpectedError(error: unknown): NextResponse<ErrorResponse> {
  console.error('Unexpected error:', error)
  
  if (error instanceof z.ZodError) {
    return handleZodError(error)
  }
  
  if (error instanceof Error) {
    return createErrorResponse(
      'An unexpected error occurred',
      ErrorCode.INTERNAL_ERROR,
      500,
      { message: error.message }
    )
  }
  
  return createErrorResponse(
    'An unexpected error occurred',
    ErrorCode.INTERNAL_ERROR,
    500
  )
}

// Input validation helpers
export function validateRequiredField<T>(
  value: T | undefined | null,
  fieldName: string
): T {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`)
  }
  return value
}

export function validateStringField(
  value: unknown,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 1000
): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`)
  }
  
  const trimmed = value.trim()
  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`)
  }
  
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be no more than ${maxLength} characters`)
  }
  
  return trimmed
}

export function validateNumberField(
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): number {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    throw new Error(`${fieldName} must be a valid number`)
  }
  
  if (min !== undefined && num < min) {
    throw new Error(`${fieldName} must be at least ${min}`)
  }
  
  if (max !== undefined && num > max) {
    throw new Error(`${fieldName} must be no more than ${max}`)
  }
  
  return num
} 