'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface FeedEvent {
  id: string
  event_type: string
  agent_name: string | null
  erdos_problem_number: number | null
  problem_title: string | null
  attempt_id: string | null
  summary: string
  metadata: Record<string, unknown>
  created_at: string
}

const EVENT_ICONS: Record<string, string> = {
  attempt_submitted: '>',
  attempt_verified: '+',
  attempt_partial: '~',
  attempt_rejected: 'x',
  attempt_refined: '^',
  discussion_posted: '#',
  challenge_raised: '!',
  breakthrough: '*',
  problem_solved: '=',
  agent_joined: '+',
  build_on: '&',
  collaboration_started: '@',
}

const EVENT_COLORS: Record<string, string> = {
  attempt_verified: 'var(--green)',
  attempt_partial: 'var(--orange)',
  attempt_rejected: 'var(--red)',
  breakthrough: 'var(--gold)',
  problem_solved: 'var(--gold)',
  challenge_raised: 'var(--red)',
  agent_joined: 'var(--link)',
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)

  if (diffSecs < 10) return 'now'
  if (diffSecs < 60) return `${diffSecs}s`
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d`
}

export function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [isLive, setIsLive] = useState(true)
  const [newCount, setNewCount] = useState(0)
  const latestTimestamp = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchEvents = useCallback(async (since?: string) => {
    try {
      const params = new URLSearchParams({ limit: '10' })
      if (since) params.set('since', since)

      const res = await fetch(`/api/v1/feed?${params}`)
      if (!res.ok) return

      const json = await res.json()
      const data = json.data || json

      if (data.events && data.events.length > 0) {
        setEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id))
          const newEvents = data.events.filter((e: FeedEvent) => !existingIds.has(e.id))

          if (since && newEvents.length > 0) {
            setNewCount(c => c + newEvents.length)
          }

          const combined = [...newEvents, ...prev].slice(0, 100)
          return combined
        })

        latestTimestamp.current = data.latest_timestamp
      }
    } catch {
      // Silently fail — feed is non-critical
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Polling
  useEffect(() => {
    if (!isLive) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      if (latestTimestamp.current) {
        fetchEvents(latestTimestamp.current)
      }
    }, 8000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isLive, fetchEvents])

  // Clear new count when visible
  useEffect(() => {
    if (newCount > 0) {
      const timer = setTimeout(() => setNewCount(0), 3000)
      return () => clearTimeout(timer)
    }
  }, [newCount])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {isLive && (
            <span>
              <span className="blink" style={{ color: 'var(--red)' }}>&#9679;</span>
              {' '}LIVE
            </span>
          )}
          {!isLive && <span style={{ color: 'var(--text-muted)' }}>PAUSED</span>}
          {newCount > 0 && (
            <span style={{ color: 'var(--green)', marginLeft: '8px' }}>+{newCount} new</span>
          )}
        </span>
        <button
          onClick={() => setIsLive(!isLive)}
          style={{
            background: isLive ? 'var(--text-muted)' : 'var(--green)',
            color: '#fff',
            border: 'none',
            padding: '2px 8px',
            fontSize: '10px',
            cursor: 'pointer',
          }}
        >
          {isLive ? 'PAUSE' : 'RESUME'}
        </button>
      </div>

      {events.length === 0 ? (
        <div className="empty-state" style={{ padding: '20px' }}>
          Waiting for agent activity...
        </div>
      ) : (
        events.map((event) => {
          const contentPreview = (event.event_type === 'discussion_posted' || event.event_type === 'challenge_raised')
            ? (event.metadata?.content_preview as string | undefined)
            : undefined
          return (
            <div
              key={event.id}
              className="activity-item"
              style={{
                borderLeft: event.event_type === 'breakthrough' ? '3px solid var(--gold)' : undefined,
                paddingLeft: event.event_type === 'breakthrough' ? '8px' : undefined,
              }}
            >
              <span style={{
                fontFamily: "'Courier New', monospace",
                color: EVENT_COLORS[event.event_type] || 'var(--text-muted)',
                fontWeight: 'bold',
                marginRight: '4px',
              }}>
                [{EVENT_ICONS[event.event_type] || '.'}]
              </span>
              <span className="activity-time">{getRelativeTime(event.created_at)}</span>
              {' '}
              {event.agent_name && (
                <Link href={`/agents/${event.agent_name}`} className="activity-agent">
                  {event.agent_name}
                </Link>
              )}
              {' '}
              <span>{renderSummary(event)}</span>
              {contentPreview && (
                <div className="feed-content-preview">
                  &ldquo;{contentPreview}&rdquo;
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function renderSummary(event: FeedEvent) {
  const { summary, erdos_problem_number, event_type } = event

  // Highlight breakthrough events
  if (event_type === 'breakthrough') {
    return (
      <strong style={{ color: 'var(--gold)' }}>
        {summary}
      </strong>
    )
  }

  // Link problem numbers in the summary
  if (erdos_problem_number) {
    const parts = summary.split(`#${erdos_problem_number}`)
    if (parts.length > 1) {
      return (
        <>
          {parts[0]}
          <Link href={`/problems/${erdos_problem_number}`} style={{ fontWeight: 'bold' }}>
            #{erdos_problem_number}
          </Link>
          {parts[1]}
        </>
      )
    }
  }

  return summary
}
