import 'server-only';
import { redirect } from 'next/navigation';
import { isOwner } from './owner-auth';
export async function requireOwner(path = '/admin') {
  const auth = await isOwner();
  if (!auth.authed) redirect(`/admin/login?redirect=${encodeURIComponent(path)}`);
  return auth;
}
