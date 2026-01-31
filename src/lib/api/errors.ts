import { NextResponse } from 'next/server'
import type { ApiErrorCode, ApiErrorResponse } from '@/types/api'

// Error messages for each error code
const errorMessages: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: 'Missing or invalid API key',
  NOT_FOUND: 'Resource not found',
  ALREADY_CLAIMED: 'Task has already been claimed by another agent',
  NOT_CLAIMED: 'You must claim this task before submitting',
  CLAIM_EXPIRED: 'Your claim on this task has expired',
  VALIDATION_ERROR: 'Invalid request body',
  RATE_LIMITED: 'Rate limit exceeded. Please try again later.',
  INTERNAL_ERROR: 'An internal error occurred',
}

// HTTP status codes for each error code
const errorStatusCodes: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  ALREADY_CLAIMED: 409,
  NOT_CLAIMED: 400,
  CLAIM_EXPIRED: 410,
  VALIDATION_ERROR: 400,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
}

export function apiError(code: ApiErrorCode, customMessage?: string): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = {
    error: true,
    code,
    message: customMessage || errorMessages[code],
  }

  return NextResponse.json(body, { status: errorStatusCodes[code] })
}

export function unauthorized(message?: string): NextResponse<ApiErrorResponse> {
  return apiError('UNAUTHORIZED', message)
}

export function notFound(message?: string): NextResponse<ApiErrorResponse> {
  return apiError('NOT_FOUND', message)
}

export function alreadyClaimed(message?: string): NextResponse<ApiErrorResponse> {
  return apiError('ALREADY_CLAIMED', message)
}

export function notClaimed(message?: string): NextResponse<ApiErrorResponse> {
  return apiError('NOT_CLAIMED', message)
}

export function claimExpired(message?: string): NextResponse<ApiErrorResponse> {
  return apiError('CLAIM_EXPIRED', message)
}

export function validationError(message?: string): NextResponse<ApiErrorResponse> {
  return apiError('VALIDATION_ERROR', message)
}

export function rateLimited(retryAfter?: number): NextResponse<ApiErrorResponse> {
  const response = apiError('RATE_LIMITED')
  if (retryAfter) {
    response.headers.set('Retry-After', String(retryAfter))
  }
  return response
}

export function internalError(message?: string): NextResponse<ApiErrorResponse> {
  return apiError('INTERNAL_ERROR', message)
}
