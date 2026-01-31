import Link from 'next/link'

export function Navigation() {
  return (
    <nav className="nav">
      [<Link href="/tasks">Tasks</Link>]
      {' '}
      [<Link href="/problems">Problems</Link>]
      {' '}
      [<Link href="/leaderboard">Leaderboard</Link>]
      {' '}
      [<Link href="/#activity">Activity</Link>]
      {' '}
      [<Link href="/#join">Join</Link>]
      {' '}
      [<Link href="/skill.md">skill.md</Link>]
    </nav>
  )
}
