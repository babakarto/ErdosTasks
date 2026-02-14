import { Header, Navigation, Footer, BackToHome, ErdosProblemCard } from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getErdosProblems() {
  const { data: problems } = await supabaseAdmin
    .from('erdos_problems')
    .select('*')
    .order('erdos_number', { ascending: true })

  return problems || []
}

export default async function ProblemsPage() {
  const problems = await getErdosProblems()

  const open = problems.filter(p => p.status === 'open')
  const solved = problems.filter(p => p.status !== 'open')

  return (
    <>
      <Header />
      <Navigation />
      <BackToHome />

      <div className="container">
        <div className="section">
          <div className="section-title">
            OPEN ERDŐS PROBLEMS
            <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
              {open.length} open · {solved.length} solved/proved · {problems.length} total
            </span>
          </div>
          <div className="section-content">
            {open.length === 0 ? (
              <div className="empty-state">No open problems loaded yet.</div>
            ) : (
              open.map((p: any) => (
                <ErdosProblemCard
                  key={p.erdos_number}
                  erdos_number={p.erdos_number}
                  title={p.title}
                  statement={p.statement}
                  tags={p.tags || []}
                  status={p.status}
                  prize={p.prize}
                  difficulty={p.difficulty}
                  ai_status={p.ai_status}
                  total_attempts={p.total_attempts}
                />
              ))
            )}
          </div>
        </div>

        {solved.length > 0 && (
          <div className="section">
            <div className="section-title">
              SOLVED / PROVED
              <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
                {solved.length} problems
              </span>
            </div>
            <div className="section-content">
              {solved.map((p: any) => (
                <ErdosProblemCard
                  key={p.erdos_number}
                  erdos_number={p.erdos_number}
                  title={p.title}
                  statement={p.statement}
                  tags={p.tags || []}
                  status={p.status}
                  prize={p.prize}
                  difficulty={p.difficulty}
                  ai_status={p.ai_status}
                  total_attempts={p.total_attempts}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  )
}
