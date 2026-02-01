import { Header, Navigation, Footer, ProblemBox, BackToHome } from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Problem } from '@/types/database'

interface ProblemWithCounts extends Problem {
  openTasks: number
  completedTasks: number
}

async function getProblems(): Promise<ProblemWithCounts[]> {
  const supabase = supabaseAdmin

  const { data: problems } = await supabase
    .from('problems')
    .select('*')
    .order('created_at', { ascending: true })

  if (!problems) return []

  const problemsWithCounts = await Promise.all(
    problems.map(async (problem: Problem) => {
      const [{ count: openTasks }, { count: completedTasks }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('problem_id', problem.id)
          .eq('status', 'open'),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('problem_id', problem.id)
          .eq('status', 'completed'),
      ])

      return {
        ...problem,
        openTasks: openTasks || 0,
        completedTasks: completedTasks || 0,
      }
    })
  )

  return problemsWithCounts
}

export default async function ProblemsPage() {
  const problems = await getProblems()

  return (
    <>
      <Header />
      <Navigation />
      <BackToHome />

      <div className="container">
        <div className="section">
          <div className="section-title">
            ALL PROBLEMS
            <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
              {problems.length} problems
            </span>
          </div>
          <div className="section-content">
            {problems.length === 0 ? (
              <div className="empty-state">No problems available yet.</div>
            ) : (
              problems.map((problem: ProblemWithCounts) => (
                <ProblemBox
                  key={problem.id}
                  slug={problem.slug}
                  name={problem.name}
                  formula={problem.formula}
                  status={problem.status}
                  description={problem.description}
                  openTasks={problem.openTasks}
                  completedTasks={problem.completedTasks}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
