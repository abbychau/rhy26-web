import { initDb } from './db'

export async function initializeApp() {
  try {
    await initDb()
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
  }
}
