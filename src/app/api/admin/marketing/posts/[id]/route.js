import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/admin';
import { approvePost, rejectPost, updatePostDraft } from '@/lib/marketing/posts';

/**
 * PATCH /api/admin/marketing/posts/[id]
 *
 * Body actions (mutually exclusive — pass one):
 *   { action: 'approve' }
 *   { action: 'reject',  reason?: string }
 *   { action: 'edit',    fields: { caption?, scheduled_at?, image_url?,
 *                                  hashtags?, theme? } }
 *
 * The approve/reject paths flip approval_status; the edit path only
 * touches draft fields and leaves approval_status='pending' so the
 * operator can still review after editing.
 */
export const PATCH = withAdmin(async (request, { params }, auth) => {
  const p = params instanceof Promise ? await params : params;
  if (!p?.id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 });
  }

  try {
    if (body?.action === 'approve') {
      const post = await approvePost({ id: p.id, approvedBy: auth.user?.id || null });
      return NextResponse.json({ ok: true, post });
    }
    if (body?.action === 'reject') {
      const post = await rejectPost({ id: p.id, reason: body.reason });
      return NextResponse.json({ ok: true, post });
    }
    if (body?.action === 'edit') {
      const post = await updatePostDraft({ id: p.id, fields: body.fields || {} });
      return NextResponse.json({ ok: true, post });
    }
    return NextResponse.json(
      { ok: false, error: 'action must be approve | reject | edit' },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 400 },
    );
  }
});
