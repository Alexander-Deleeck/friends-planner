import { randomBytes } from 'crypto';
import { getDb } from '../db';

const DEFAULT_TTL_MINUTES = 30;

const nowIso = () => new Date().toISOString();
const expiryIso = (ttlMinutes: number) => new Date(Date.now() + ttlMinutes * 60_000).toISOString();

export type ConsumeResult =
  | { ok: true; userId: number }
  | { ok: false; reason: 'not_found' | 'expired' | 'consumed' };

export const createLoginToken = (userId: number, ttlMinutes = DEFAULT_TTL_MINUTES) => {
  const token = randomBytes(32).toString('hex');
  const expiresAt = expiryIso(ttlMinutes);
  const db = getDb();

  db.prepare(
    `
    INSERT INTO login_tokens (token, user_id, expires_at)
    VALUES (?, ?, ?)
  `,
  ).run(token, userId, expiresAt);

  return { token, expiresAt };
};

export const consumeLoginToken = (token: string): ConsumeResult => {
  const db = getDb();

  const tx = db.transaction((value: string): ConsumeResult => {
    const row = db
      .prepare(
        `
        SELECT id, user_id, expires_at, consumed_at
        FROM login_tokens
        WHERE token = ?
      `,
      )
      .get(value) as { id: number; user_id: number; expires_at: string; consumed_at: string | null } | undefined;

    if (!row) return { ok: false, reason: 'not_found' };
    if (row.consumed_at) return { ok: false, reason: 'consumed' };
    if (new Date(row.expires_at) < new Date()) return { ok: false, reason: 'expired' };

    db.prepare('UPDATE login_tokens SET consumed_at = ? WHERE id = ?').run(nowIso(), row.id);
    return { ok: true, userId: row.user_id };
  });

  return tx(token);
};

export const deleteExpiredTokens = () => {
  const db = getDb();
  db.prepare('DELETE FROM login_tokens WHERE expires_at < datetime(\'now\', \'-1 day\')').run();
};

