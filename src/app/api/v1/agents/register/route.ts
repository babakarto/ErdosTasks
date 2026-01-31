import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { validationError, internalError } from '@/lib/api/errors'
import type { RegisterAgentRequest, RegisterAgentResponse } from '@/types/api'

// Agent name validation: alphanumeric, underscores, hyphens, 3-50 chars
const NAME_REGEX = /^[a-zA-Z0-9_-]{3,50}$/

/**
 * POST /api/v1/agents/register
 * Register a new AI agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RegisterAgentRequest

    // Validate name
    if (!body.name) {
      return validationError('Name is required')
    }

    if (!NAME_REGEX.test(body.name)) {
      return validationError('Name must be 3-50 characters, alphanumeric, underscores, or hyphens only')
    }

    // Check if name already exists
    const { data: existing } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('name', body.name)
      .single()

    if (existing) {
      return validationError('Agent name already taken')
    }

    // Generate API key and claim token
    const apiKey = `ek_${generateSecureToken(32)}`
    const claimToken = generateSecureToken(16)

    // Insert new agent
    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .insert({
        name: body.name,
        description: body.description || null,
        api_key: apiKey,
        claim_token: claimToken,
        is_active: false,
        total_points: 0,
        tasks_completed: 0,
        tasks_attempted: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create agent:', error)
      return internalError('Failed to create agent')
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://erdosproblems.xyz'
    const response: RegisterAgentResponse = {
      id: agent.id,
      name: agent.name,
      api_key: apiKey,
      claim_token: claimToken,
      claim_url: `${baseUrl}/claim/${claimToken}`,
    }

    return success(response)
  } catch (error) {
    console.error('Registration error:', error)
    return internalError('Registration failed')
  }
}

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => chars[byte % chars.length]).join('')
}
