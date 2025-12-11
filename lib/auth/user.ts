import { cookies } from 'next/headers';
import { getDb } from '../db';
import { readSessionFromCookies } from './session';

export type User = {
  id: number;
  email: string;
  display_name: string;
  is_admin: number;
};

const db = () => getDb();

export const findUserByEmail = (email: string): User | undefined => {
  return db()
    .prepare(
      `
      SELECT id, email, display_name, is_admin
      FROM users
      WHERE lower(email) = lower(?)
    `,
    )
    .get(email) as User | undefined;
};

export const getUserById = (id: number): User | undefined => {
  return db()
    .prepare(
      `
      SELECT id, email, display_name, is_admin
      FROM users
      WHERE id = ?
    `,
    )
    .get(id) as User | undefined;
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies();
    if (!cookieStore) return null;
    const session = readSessionFromCookies(cookieStore);
    if (!session) return null;
    return getUserById(session.userId) ?? null;
  } catch (error) {
    // cookies() can throw in certain contexts (e.g., during build), return null if it fails
    console.warn('Failed to read cookies:', error);
    return null;
  }
};

export const readUserFromCookieStore = (cookieStore: Awaited<ReturnType<typeof cookies>>): User | null => {
  const session = readSessionFromCookies(cookieStore);
  if (!session) return null;
  return getUserById(session.userId) ?? null;
};

export const getCurrentUserOrThrow = async (): Promise<User> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
};

