import { getDb } from '../lib/db';

const db = getDb();

// Seed users - adjust emails/names as needed
const users = [
  { email: 'alexanderdeleeck@hotmail.com', displayName: 'Alexander Deleeck', isAdmin: 1 },
  { email: 'friend1@example.com', displayName: 'Friend 1', isAdmin: 0 },
  { email: 'friend2@example.com', displayName: 'Friend 2', isAdmin: 0 },
];

console.log('Seeding users...');

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (email, display_name, is_admin)
  VALUES (?, ?, ?)
`);

const insertMany = db.transaction((users: Array<{ email: string; displayName: string; isAdmin: number }>) => {
  for (const user of users) {
    insertUser.run(user.email, user.displayName, user.isAdmin);
  }
});

insertMany(users);

const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
console.log(`✓ Seeded ${count.count} users`);

// List seeded users
const seededUsers = db.prepare('SELECT id, email, display_name FROM users').all() as Array<{
  id: number;
  email: string;
  display_name: string;
}>;

console.log('\nUsers in database:');
seededUsers.forEach((u) => {
  console.log(`  - ${u.email} (${u.display_name})`);
});

