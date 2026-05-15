import { NextResponse } from 'next/server';
import { isOwner } from '@/lib/admin/owner-auth';
import { vendorCsvTemplate } from '@/lib/maintenance/vendor-csv';

/**
 * GET /api/admin/vendors/template
 *
 * Streams a downloadable CSV template so the admin knows the exact column
 * shape the bulk uploader expects. Includes one example row.
 *
 * Owner-only.
 */
export async function GET() {
  const auth = await isOwner();
  if (!auth.authed) return new NextResponse('Not found', { status: 404 });

  const csv = vendorCsvTemplate();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="granderson-vendor-template.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
