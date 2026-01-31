import { NextResponse } from 'next/server'
import type { ApiSuccessResponse } from '@/types/api'

export function success<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
  })
}

/**
 * Return a successful response with caching headers.
 * @param data - The response data
 * @param maxAge - Max age in seconds (how long to cache)
 * @param staleWhileRevalidate - Stale-while-revalidate time in seconds
 */
export function cachedSuccess<T>(
  data: T,
  maxAge: number = 60,
  staleWhileRevalidate: number = 300
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      headers: {
        'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
      },
    }
  )
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export function paginated<T>(data: PaginatedData<T>): NextResponse<ApiSuccessResponse<PaginatedData<T>>> {
  return success(data)
}
