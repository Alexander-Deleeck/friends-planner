import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import CalendarShell from '../../components/CalendarShell';

export default async function AvailabilityPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const hdrs = await headers();
  const host = hdrs.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const base = process.env.BASE_URL ?? (host ? `${protocol}://${host}` : 'http://localhost:3000');

  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${base}/api/calendar`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  });

  const feed = await res.json();

  return <CalendarShell initialData={feed} />;
}

