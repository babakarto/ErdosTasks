import Link from 'next/link'
import { Header, Navigation, Footer, TaskList } from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Task, Problem, TaskType, Difficulty, TaskStatus } from '@/types/database'

interface TaskWithProblem extends Task {
  problem: Problem
}

interface SearchParams {
  problem?: string
  type?: string
  difficulty?: string
  status?: string
  page?: string
}

async function getTasks(searchParams: SearchParams) {
  const supabase = supabaseAdmin
  const page = parseInt(searchParams.page || '1', 10)
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('tasks')
    .select('*, problem:problems(*)', { count: 'exact' })

  if (searchParams.problem) {
    const { data: problemData } = await supabase
      .from('problems')
      .select('id')
      .eq('slug', searchParams.problem)
      .single()
    if (problemData) {
      query = query.eq('problem_id', problemData.id)
    }
  }

  if (searchParams.type) {
    query = query.eq('type', searchParams.type.toUpperCase())
  }

  if (searchParams.difficulty) {
    query = query.eq('difficulty', searchParams.difficulty)
  }

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  } else {
    query = query.eq('status', 'open')
  }

  const { data: tasks, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return {
    tasks: (tasks || []) as TaskWithProblem[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

async function getProblems() {
  const supabase = supabaseAdmin
  const { data } = await supabase.from('problems').select('slug, name').order('name')
  return data || []
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [{ tasks, total, page, totalPages }, problems] = await Promise.all([
    getTasks(params),
    getProblems(),
  ])

  const taskTypes: TaskType[] = ['COMPUTE', 'VERIFY', 'SEARCH', 'PATTERN', 'EXTEND']
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'extreme']
  const statuses: TaskStatus[] = ['open', 'claimed', 'completed']

  return (
    <>
      <Header />
      <Navigation />

      <div className="container">
        <div className="section">
          <div className="section-title">
            ALL TASKS
            <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
              {total} tasks found
            </span>
          </div>
          <div className="section-content">
            <div className="filter-controls">
              <select
                name="problem"
                defaultValue={params.problem || ''}
              >
                <option value="">All Problems</option>
                {problems.map((p: { slug: string; name: string }) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                name="type"
                defaultValue={params.type || ''}
              >
                <option value="">All Types</option>
                {taskTypes.map((t) => (
                  <option key={t} value={t.toLowerCase()}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                name="difficulty"
                defaultValue={params.difficulty || ''}
              >
                <option value="">All Difficulties</option>
                {difficulties.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>

              <select
                name="status"
                defaultValue={params.status || 'open'}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>

              <noscript>
                <button type="submit">Filter</button>
              </noscript>
            </div>

            <TaskList tasks={tasks} emptyMessage="No tasks match your filters" />

            {totalPages > 1 && (
              <div className="pagination">
                {page > 1 && (
                  <Link
                    href={`/tasks?${new URLSearchParams({
                      ...params,
                      page: String(page - 1),
                    })}`}
                  >
                    &laquo; Prev
                  </Link>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 2
                  )
                  .map((p, i, arr) => {
                    const showEllipsis = i > 0 && arr[i - 1] !== p - 1
                    return (
                      <span key={p}>
                        {showEllipsis && <span>...</span>}
                        <Link
                          href={`/tasks?${new URLSearchParams({
                            ...params,
                            page: String(p),
                          })}`}
                          className={p === page ? 'active' : ''}
                        >
                          {p}
                        </Link>
                      </span>
                    )
                  })}

                {page < totalPages && (
                  <Link
                    href={`/tasks?${new URLSearchParams({
                      ...params,
                      page: String(page + 1),
                    })}`}
                  >
                    Next &raquo;
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
