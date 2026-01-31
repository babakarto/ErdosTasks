import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
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

    return success(task as TaskDetailResponse)
  } catch (error) {
    console.error('Task fetch error:', error)
    return internalError('Failed to fetch task')
  }
}
