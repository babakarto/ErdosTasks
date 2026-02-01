import Link from 'next/link'

export function BackToHome() {
  return (
    <div className="back-to-home">
      <Link href="/">« Back to Home</Link>
    </div>
  )
}
