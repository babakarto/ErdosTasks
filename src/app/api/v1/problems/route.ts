import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cachedSuccess, success } from '@/lib/api/responses'
import { internalError } from '@/lib/api/errors'
import type { ErdosProblemStatus, ErdosDifficulty, ErdosAiStatus } from '@/types/database'

/**
 * GET /api/v1/problems
 * List Erdős problems with filters
 *
 * Query params:
 *   status    — open, proved, disproved, partially_solved
 *   difficulty — accessible, intermediate, hard, notorious
 *   ai_status — none, attempted, partial_progress, solved
 *   tags      — comma-separated: "number theory,combinatorics"
 *   prize     — "yes" or "no"
 *   formalized — "true" or "false"
 *   search    — text search in title/statement
 *   sort      — number, difficulty, activity, prize (default: number)
 *   limit     — max results (default: 50, max: 200)
 *   offset    — pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const status = searchParams.get('status') as ErdosProblemStatus | null
    const difficulty = searchParams.get('difficulty') as ErdosDifficulty | null
    const aiStatus = searchParams.get('ai_status') as ErdosAiStatus | null
    const tags = searchParams.get('tags')
    const prize = searchParams.get('prize')
    const formalized = searchParams.get('formalized')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'number'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query
    let query = supabaseAdmin
      .from('erdos_problems')
      .select('*', { count: 'exact' })

    // Filters
    if (status) {
      query = query.eq('status', status)
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }
    if (aiStatus) {
      query = query.eq('ai_status', aiStatus)
    }
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim())
      query = query.overlaps('tags', tagList)
    }
    if (prize === 'yes') {
      query = query.neq('prize', 'no')
    } else if (prize === 'no') {
      query = query.eq('prize', 'no')
    }
    if (formalized === 'true') {
      query = query.eq('formalized', true)
    } else if (formalized === 'false') {
      query = query.eq('formalized', false)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,statement.ilike.%${search}%`)
    }

    // Sorting
    switch (sort) {
      case 'difficulty':
        // Order by difficulty enum: accessible < intermediate < hard < notorious
        query = query.order('difficulty', { ascending: true })
        break
      case 'activity':
        query = query.order('updated_at', { ascending: false })
        break
      case 'prize':
        query = query.order('prize', { ascending: false })
        break
      case 'number':
      default:
        query = query.order('erdos_number', { ascending: true })
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: problems, error, count } = await query

    if (error) {
      console.error('Failed to fetch problems:', error)
      return internalError('Failed to fetch problems')
    }

    // Truncate statements by default to save agent tokens.
    // Agents should use GET /problems/:n for the full statement.
    const briefProblems = (problems || []).map(p => ({
      ...p,
      statement: p.statement.length > 200
        ? p.statement.slice(0, 200) + '...'
        : p.statement,
    }))

    return cachedSuccess({
      problems: briefProblems,
      total: count || 0,
      limit,
      offset,
    }, 60, 300)
  } catch (error) {
    console.error('Problems fetch error:', error)
    return internalError('Failed to fetch problems')
  }
}
