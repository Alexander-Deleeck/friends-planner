import fs from 'fs';
import path from 'path';
import { getDb, SqliteInstance } from '../lib/db';

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');

type MigrationStatus = {
  applied: string[];
  pending: string[];
};

const ensureSchemaMigrationsTable = (db: SqliteInstance) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
};

const listMigrationFiles = (): string[] => {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
};

const readAppliedMigrations = (db: SqliteInstance): string[] => {
  const rows = db.prepare('SELECT filename FROM schema_migrations ORDER BY filename ASC').all() as {
    filename: string;
  }[];
  return rows.map((row) => row.filename);
};

const getStatus = (db: SqliteInstance): MigrationStatus => {
  const files = listMigrationFiles();
  const applied = readAppliedMigrations(db);
  const appliedSet = new Set(applied);
  const pending = files.filter((file) => !appliedSet.has(file));
  return { applied, pending };
};

const applyMigrations = (db: SqliteInstance, filenames: string[]) => {
  const run = db.transaction((names: string[]) => {
    for (const filename of names) {
      const fullPath = path.join(MIGRATIONS_DIR, filename);
      const sql = fs.readFileSync(fullPath, 'utf8');
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)').run(filename);
    }
  });

  run(filenames);
};

const printStatus = ({ applied, pending }: MigrationStatus) => {
  console.log('Applied migrations:');
  if (applied.length === 0) {
    console.log('  (none)');
  } else {
    applied.forEach((name) => console.log(`  - ${name}`));
  }

  console.log('\nPending migrations:');
  if (pending.length === 0) {
    console.log('  (none)');
  } else {
    pending.forEach((name) => console.log(`  - ${name}`));
  }
};

const main = () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('--status');

  const db = getDb();
  ensureSchemaMigrationsTable(db);

  const status = getStatus(db);

  if (dryRun) {
    printStatus(status);
    return;
  }

  if (status.pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  console.log(`Applying ${status.pending.length} migration(s)...`);
  applyMigrations(db, status.pending);
  console.log('Migrations applied successfully.');
  printStatus(getStatus(db));
};

main();

