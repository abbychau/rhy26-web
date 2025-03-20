import { Pool } from 'pg'

const pool = new Pool({
  connectionString: "postgres://default:X5wVlGOg0Dfx@ep-black-thunder-a1hpfn2l-pooler.ap-southeast-1.aws.neon.tech/verceldb?sslmode=require"
})

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      key_hash TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS records (
      id SERIAL PRIMARY KEY,
      user_key_hash TEXT,
      title TEXT,
      music_file_path TEXT,
      note_file_path TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS note_charts (
      id SERIAL PRIMARY KEY,
      user_key_hash TEXT,
      music_path TEXT,
      note_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS songs (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_by TEXT,
      file_size BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export { pool }
