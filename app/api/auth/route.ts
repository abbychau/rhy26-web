import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { pool } from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const key = crypto.randomBytes(16).toString('hex')
    const keyHash = await bcrypt.hash(key, 10)
    
    await pool.query('INSERT INTO users (key_hash) VALUES ($1)', [keyHash])
    
    return NextResponse.json({ key, keyHash })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { key, username } = await req.json()
    
    // Check if username already exists
    const { rows: existingUsers } = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )
    
    if (existingUsers.length > 0) {
      return NextResponse.json({ 
        error: 'Username already taken',
        code: 'USERNAME_TAKEN'
      }, { status: 409 })
    }
    
    // Find user by key
    const { rows } = await pool.query(
      'SELECT id, key_hash FROM users WHERE username IS NULL'
    )
    
    const user = rows.find(row => bcrypt.compareSync(key, row.key_hash))
    if (!user) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
    }
    
    // Update username
    await pool.query(
      'UPDATE users SET username = $1 WHERE id = $2',
      [username, user.id]
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update username' }, { status: 500 })
  }
}

// Add this new endpoint
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const key = url.searchParams.get('key')
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const { rows } = await pool.query('SELECT id, username, key_hash FROM users')
    const user = rows.find(row => bcrypt.compareSync(key, row.key_hash))
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true,
      username: user.username 
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to verify key' }, { status: 500 })
  }
}
