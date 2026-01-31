import { NextResponse } from 'next/server'
import type { ApiSuccessResponse } from '@/types/api'

export function success<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
  })
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
