import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { minioClient } from '@/lib/s3'
import bcrypt from 'bcrypt'
import { initDb } from '@/lib/db'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB
const ALLOWED_TYPES = ['audio/wav', 'audio/ogg', 'audio/mpeg']

export async function POST(req: Request) {
  try {
    // Ensure database is initialized
    await initDb().catch(console.error)
    
    const formData = await req.formData()
    const key = formData.get('key') as string
    const title = formData.get('title') as string
    const author = formData.get('author') as string
    const file = formData.get('file') as File

    if (!title || !author || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only WAV, OGG, and MP3 are allowed.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 15MB.' }, { status: 400 })
    }

    // Verify user
    const { rows } = await pool.query('SELECT key_hash FROM users')
    const user = rows.find(row => bcrypt.compareSync(key, row.key_hash))
    if (!user) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
    }

    // Upload to S3
    const filePath = `songs/${Date.now()}-${file.name}`
    await minioClient.putObject('rhy26', filePath, Buffer.from(await file.arrayBuffer()))
    
    // .send(new PutObjectCommand({
    //   Bucket: 'rhy26',
    //   Key: filePath,
    //   Body: Buffer.from(await file.arrayBuffer()),
    //   ContentType: file.type
    // }))

    // Save to database
    await pool.query(
      'INSERT INTO songs (title, author, file_path, uploaded_by, file_size) VALUES ($1, $2, $3, $4, $5)',
      [title, author, filePath, user.key_hash, file.size]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to upload song' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Ensure database is initialized
    await initDb().catch(console.error)
    
    const { rows } = await pool.query(`
      SELECT s.*, u.username as uploader
      FROM songs s
      LEFT JOIN users u ON s.uploaded_by = u.key_hash
      ORDER BY s.created_at DESC
    `)
    return NextResponse.json(rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 })
  }
}
