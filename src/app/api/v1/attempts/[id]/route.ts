import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { notFound, internalError } from '@/lib/api/errors'

/**
 * GET /api/v1/attempts/:id
 * Get full details of an attempt + discussions + refinement chain
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch attempt with agent and problem info
    const { data: attempt, error } = await supabaseAdmin
      .from('attempts')
      .select(`
        *,
        agents!inner(name, agent_type, model_used),
        erdos_problems!inner(erdos_number, title, statement, status, difficulty, tags, prize)
      `)
      .eq('id', id)
      .single()

    if (error || !attempt) {
      return notFound('Attempt not found')
    }

    // Fetch discussions on this attempt
    const { data: discussions } = await supabaseAdmin
      .from('discussions')
      .select(`
        *,
        agents!inner(name, agent_type)
      `)
      .eq('attempt_id', id)
      .order('created_at', { ascending: true })

    // Fetch refinement chain (previous versions by same agent)
    const { data: refinementChain } = await supabaseAdmin
      .from('attempts')
      .select('id, category, approach, status, points_awarded, created_at')
      .eq('erdos_problem_number', attempt.erdos_problem_number)
      .eq('agent_id', attempt.agent_id)
      .neq('id', id)
      .order('created_at', { ascending: true })

    // Fetch attempts that built upon this one
    const { data: builtUponBy } = await supabaseAdmin
      .from('attempts')
      .select(`
        id, category, approach, status, points_awarded, created_at,
        agents!inner(name, agent_type)
      `)
      .eq('build_on_attempt_id', id)
      .order('created_at', { ascending: true })

    return success({
      id: attempt.id,
      erdos_problem_number: attempt.erdos_problem_number,
      agent: {
        name: (attempt as any).agents?.name,
        agent_type: (attempt as any).agents?.agent_type,
        model_used: (attempt as any).agents?.model_used,
      },
      problem: (attempt as any).erdos_problems,
      category: attempt.category,
      content: attempt.content,
      approach: attempt.approach,
      status: attempt.status,
      verification_feedback: attempt.verification_feedback,
      points_awarded: attempt.points_awarded,
      parent_attempt_id: attempt.parent_attempt_id,
      build_on_attempt_id: attempt.build_on_attempt_id,
      created_at: attempt.created_at,
      updated_at: attempt.updated_at,
      discussions: (discussions || []).map(d => ({
        id: d.id,
        agent_name: (d as any).agents?.name,
        agent_type: (d as any).agents?.agent_type,
        interaction_type: d.interaction_type,
        content: d.content,
        references_step: d.references_step,
        created_at: d.created_at,
      })),
      refinement_chain: refinementChain || [],
      built_upon_by: (builtUponBy || []).map(b => ({
        ...b,
        agent_name: (b as any).agents?.name,
        agent_type: (b as any).agents?.agent_type,
      })),
    })
  } catch (error) {
    console.error('Attempt detail error:', error)
    return internalError()
  }
}
