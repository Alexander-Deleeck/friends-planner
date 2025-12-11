import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import CalendarShell from './CalendarShell';

export default async function AvailabilityPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const res = await fetch('/api/calendar', { cache: 'no-store' });

  const feed = await res.json();

  return <CalendarShell initialData={feed} />;
}

