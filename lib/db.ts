import Database from 'better-sqlite3';

type SqliteInstance = Database.Database;

let cachedDb: SqliteInstance | null = null;

const resolveDbPath = () => process.env.DATABASE_PATH || './data/planner.db';

export const getDb = (): SqliteInstance => {
  if (cachedDb) return cachedDb;

  const db = new Database(resolveDbPath());

  // Safety + concurrency settings for SQLite
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  if (process.env.NODE_ENV !== 'production') {
    // Cache on global to survive Next.js HMR in dev
    const g = global as typeof globalThis & { __SQLITE__?: SqliteInstance };
    if (!g.__SQLITE__) {
      g.__SQLITE__ = db;
    }
    cachedDb = g.__SQLITE__!;
  } else {
    cachedDb = db;
  }

  return cachedDb!;
};

export type { SqliteInstance };

