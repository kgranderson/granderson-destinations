import { NextResponse } from 'next/server';
import { syncEventOverrides } from '@/lib/pricelabs/sync';
import { PROPERTIES } from '@/lib/constants';

export async function POST(request) {
  const { propertySlug } = await request.json();
  const property = PROPERTIES.find((p) => p.slug === propertySlug);
  if (!property) {
    return NextResponse.json({ ok: false, error: 'unknown property' }, { status: 400 });
  }
  try {
    const result = await syncEventOverrides({ property });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
