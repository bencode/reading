import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.resolve(process.cwd(), '../../data', 'reading.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { verbose: console.log })
    console.log(`Database connected at: ${DB_PATH}`)
  }
  return db
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
    console.log('Database connection closed.')
  }
}
