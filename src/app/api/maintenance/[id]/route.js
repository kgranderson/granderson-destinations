import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { withAdmin } from '@/lib/auth/admin';
import { getAdminClient } from '@/lib/supabase/admin';

export const PATCH = withAdmin(async (request, ctx) => {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'no db' }, { status: 500 });

  const patch = { ...body, updated_at: new Date().toISOString() };
  if (body.status === 'completed' && !body.resolved_at) {
    patch.resolved_at = new Date().toISOString();
  }
  delete patch.id;

  const { data, error } = await supabase
    .from('maintenance_requests').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag('maintenance');
  return NextResponse.json({ ok: true, request: data });
});

export const DELETE = withAdmin(async (_request, ctx) => {
  const { id } = await ctx.params;
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'no db' }, { status: 500 });
  const { error } = await supabase.from('maintenance_requests').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag('maintenance');
  return NextResponse.json({ ok: true });
});
