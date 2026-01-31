import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cachedSuccess } from '@/lib/api/responses'
import { notFound, internalError } from '@/lib/api/errors'
import type { TaskDetailResponse } from '@/types/api'

/**
 * GET /api/v1/tasks/[id]
 * Get full details for a specific task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        problem:problems!inner(*)
      `)
      .eq('id', id)
      .single()

    if (error || !task) {
      return notFound(`Task '${id}' not found`)
    }

    // Cache for 2 minutes with 5 minute stale-while-revalidate
    return cachedSuccess(task as TaskDetailResponse, 120, 300)
  } catch (error) {
    console.error('Task fetch error:', error)
    return internalError('Failed to fetch task')
  }
}
