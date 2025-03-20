import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { minioClient } from '@/lib/s3'
import bcrypt from 'bcrypt'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const key = formData.get('key') as string
    const title = formData.get('title') as string
    const musicFile = formData.get('music') as File
    const noteData = formData.get('notes') as string

    // Verify user
    const { rows } = await pool.query('SELECT id, key_hash FROM users')
    const user = rows.find(row => bcrypt.compareSync(key, row.key_hash))
    if (!user) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
    }

    // Upload files to MinIO
    const musicPath = `music/${Date.now()}-${musicFile.name}`
    const notePath = `notes/${Date.now()}.txt`

    await minioClient.putObject(
      'rhy26',
      musicPath,
      Buffer.from(await musicFile.arrayBuffer()),
      musicFile.size,
      { 'Content-Type': musicFile.type }
    )

    await minioClient.putObject(
      'rhy26',
      notePath,
      Buffer.from(noteData),
      noteData.length,
      { 'Content-Type': 'text/plain' }
    )

    // Save record to database
    await pool.query(
      'INSERT INTO records (user_id, title, music_file_path, note_file_path) VALUES ($1, $2, $3, $4)',
      [user.id, title, musicPath, notePath]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save record' }, { status: 500 })
  }
}
