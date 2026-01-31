import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', 'skill.md')
    const content = readFileSync(filePath, 'utf-8')

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return new NextResponse('skill.md not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}
