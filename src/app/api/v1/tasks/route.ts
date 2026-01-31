import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { internalError } from '@/lib/api/errors'
import type { ListTasksResponse, TaskWithProblem } from '@/types/api'
import type { TaskType, TaskStatus, Difficulty } from '@/types/database'

/**
 * GET /api/v1/tasks
 * List available tasks with optional filtering
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  // Parse query parameters
  const problem = searchParams.get('problem')
  const type = searchParams.get('type') as TaskType | null
  const difficulty = searchParams.get('difficulty') as Difficulty | null
  const status = searchParams.get('status') as TaskStatus | null
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // Build query
    let query = supabaseAdmin
      .from('tasks')
      .select(`
        *,
        problem:problems!inner(*)
      `, { count: 'exact' })

    // Apply filters
    if (problem) {
      query = query.eq('problem.slug', problem)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: tasks, error, count } = await query

    if (error) {
      console.error('Failed to fetch tasks:', error)
      return internalError('Failed to fetch tasks')
    }

    const response: ListTasksResponse = {
      tasks: (tasks || []) as TaskWithProblem[],
      total: count || 0,
      limit,
      offset,
    }

    return success(response)
  } catch (error) {
    console.error('Tasks fetch error:', error)
    return internalError('Failed to fetch tasks')
  }
}
