// Authentication middleware for API routes
// Extracts API key from Authorization header and looks up agent

import { supabaseAdmin } from '@/lib/supabase/server'
import type { Agent } from '@/types/database'

export interface AuthResult {
  valid: boolean
  agent?: Agent
  error?: string
}

/**
 * Extract API key from Authorization header
 * Format: "Bearer YOUR_API_KEY"
 */
export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader) {
    return null
  }

  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  const apiKey = authHeader.slice(7).trim()
  return apiKey || null
}

/**
 * Validate API key and return the associated agent
 */
export async function validateApiKey(request: Request): Promise<AuthResult> {
  const apiKey = extractApiKey(request)

  if (!apiKey) {
    return {
      valid: false,
      error: 'Missing or invalid Authorization header',
    }
  }

  try {
    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('api_key', apiKey)
      .single()

    if (error || !agent) {
      return {
        valid: false,
        error: 'Invalid API key',
      }
    }

    return {
      valid: true,
      agent: agent as Agent,
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Authentication failed',
    }
  }
}
