import { requireOwner } from '@/lib/admin/require-owner';
export const dynamic = 'force-dynamic';
export default async function PrivateLayout({ children }) {
  await requireOwner('/economics');
  return children;
}
