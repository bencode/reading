import knex, { Knex } from 'knex'
import path from 'path'

const DB_PATH = path.resolve(process.cwd(), '../../data', 'reading.db')

declare global {
  var __app_db: Knex | undefined
}

export function getDb(): Knex {
  if (!global.__app_db) {
    global.__app_db = knex({
      client: 'sqlite3',
      connection: {
        filename: DB_PATH
      },
      useNullAsDefault: true,
      pool: {
        min: 1,
        max: 10,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000
      }
    })
    
    globalThis.console.log(`Database connected at: ${DB_PATH}`)
    
    // 优雅关闭处理
    const cleanup = async () => {
      if (global.__app_db) {
        await global.__app_db.destroy()
        delete global.__app_db
        globalThis.console.log('Database connection closed.')
      }
    }
    
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
    process.on('exit', cleanup)
  }
  
  return global.__app_db
}

export async function closeDb(): Promise<void> {
  if (global.__app_db) {
    await global.__app_db.destroy()
    delete global.__app_db
    globalThis.console.log('Database connection closed.')
  }
}
