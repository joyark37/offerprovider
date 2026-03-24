import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const data = readFileSync(join(process.cwd(), 'src/data/bitget-jobs.json'), 'utf-8')
    const jobs = JSON.parse(data)
    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error loading jobs:', error)
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
  }
}
