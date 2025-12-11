import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/user';
import AvailabilityClient from './AvailabilityClient';

export default async function AvailabilityPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">My Availability</h1>
      <AvailabilityClient />
    </div>
  );
}

