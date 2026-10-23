import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Authorization is enforced at server pages and handlers, never only middleware.
export async function middleware(request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return NextResponse.next();
  try { return (await updateSession(request)).response; }
  catch { return NextResponse.next(); }
}
export const config = { matcher: ['/admin/:path*', '/auth/:path*', '/economics/:path*', '/pricing-engine/:path*', '/social/:path*'] };
