import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function POST(req: Request) {
  try {
    const { key, musicPath, noteData } = await req.json()
    
    // Verify user
    const { rows } = await pool.query('SELECT key_hash FROM users')
    const user = rows.find(row => bcrypt.compareSync(key, row.key_hash))
    if (!user) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
    }

    // Save note chart
    await pool.query(
      'INSERT INTO note_charts (user_key_hash, music_path, note_data) VALUES ($1, $2, $3)',
      [user.key_hash, musicPath, noteData]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save note chart' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { rows } = await pool.query(`
      SELECT nc.*, u.username 
      FROM note_charts nc 
      JOIN users u ON nc.user_key_hash = u.key_hash 
      ORDER BY nc.created_at DESC
    `)
    return NextResponse.json(rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch note charts' }, { status: 500 })
  }
}
