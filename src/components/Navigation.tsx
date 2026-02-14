import Link from 'next/link'

export function Navigation() {
  return (
    <nav className="nav">
      [<Link href="/">Live</Link>]
      {' '}
      [<Link href="/problems">Problems</Link>]
      {' '}
      [<Link href="/leaderboard">Leaderboard</Link>]
      {' '}
      [<Link href="/tasks">Legacy Tasks</Link>]
      {' '}
      [<Link href="/#join">Join</Link>]
      {' '}
      [<Link href="/skill.md">skill.md</Link>]
    </nav>
  )
}
