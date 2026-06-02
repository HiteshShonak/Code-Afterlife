import { redirect } from 'next/navigation';

/**
 * /new route — proxy.ts protects this path for authenticated users.
 * Project creation happens via the modal on /dashboard.
 * Redirect authenticated users there.
 */
export default function NewPage() {
  redirect('/dashboard');
}
