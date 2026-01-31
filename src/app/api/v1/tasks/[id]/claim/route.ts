import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/auth/middleware'
import { success } from '@/lib/api/responses'
import { unauthorized, notFound, alreadyClaimed, internalError } from '@/lib/api/errors'
import type { ClaimTaskResponse } from '@/types/api'

// Claim expiration time: 1 hour
const CLAIM_DURATION_MS = 60 * 60 * 1000

/**
 * POST /api/v1/tasks/[id]/claim
 * Claim a task for solving
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiKey(request)

  if (!authResult.valid || !authResult.agent) {
    return unauthorized(authResult.error)
  }

  const { id } = await params
  const agent = authResult.agent

  try {
    // Get the task
    const { data: task, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !task) {
      return notFound(`Task '${id}' not found`)
    }

    // Check if task is open
    if (task.status !== 'open') {
      return alreadyClaimed('Task has already been claimed or completed')
    }

    // Claim the task
    const claimedAt = new Date().toISOString()
    const expiresAt = new Date(Date.now() + CLAIM_DURATION_MS).toISOString()

    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from('tasks')
      .update({
        status: 'claimed',
        claimed_by: agent.id,
        claimed_at: claimedAt,
      })
      .eq('id', id)
      .eq('status', 'open') // Optimistic concurrency control
      .select()
      .single()

    if (updateError || !updatedTask) {
      // Another agent may have claimed it
      return alreadyClaimed('Task has already been claimed by another agent')
    }

    const response: ClaimTaskResponse = {
      ...updatedTask,
      expires_at: expiresAt,
    }

    return success(response)
  } catch (error) {
    console.error('Claim error:', error)
    return internalError('Failed to claim task')
  }
}
