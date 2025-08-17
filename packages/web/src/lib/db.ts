import knex, { Knex } from 'knex'
import path from 'path'

const DB_PATH = process.env.DATABASE_PATH || path.resolve(process.cwd(), '../../data', 'reading.db')

declare global {
  var __app_db: Knex | undefined
}

export function getDb(): Knex {
  if (!global.__app_db) {
    global.__app_db = knex({
      client: 'better-sqlite3',
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
    
    // 启用WAL模式以支持并发读写
    const db = global.__app_db
    db.raw('PRAGMA journal_mode = WAL;').then(() => {
      console.log('WAL mode enabled for SQLite database')
    }).catch(err => {
      console.error('Failed to enable WAL mode:', err)
    })
    
    // 设置其他性能优化PRAGMA
    db.raw('PRAGMA synchronous = NORMAL;').catch(err => console.error('PRAGMA synchronous failed:', err))
    db.raw('PRAGMA cache_size = 1000;').catch(err => console.error('PRAGMA cache_size failed:', err))
    db.raw('PRAGMA temp_store = memory;').catch(err => console.error('PRAGMA temp_store failed:', err))
    
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
