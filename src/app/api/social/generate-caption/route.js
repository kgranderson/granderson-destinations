import { NextResponse } from 'next/server';
import { generateCaption } from '@/lib/ai/claude';
import { buildHashtags } from '@/lib/social/hashtags';
import { PROPERTIES } from '@/lib/constants';
import { withAdmin } from '@/lib/auth/admin';

export const POST = withAdmin(async (request) => {
  try {
    const { propertySlug, theme = 'lifestyle' } = await request.json();
    const property = PROPERTIES.find((p) => p.slug === propertySlug);
    if (!property) {
      return NextResponse.json({ error: 'unknown property' }, { status: 400 });
    }

    const { caption: rawCaption, stub } = await generateCaption({ property, theme });
    // Strip any inline trailing hashtag block — the composer renders
    // hashtags separately so the single source of truth is buildHashtags().
    // Prevents duplicate brand tags when the stub caption includes them inline.
    const caption = rawCaption.replace(/\n*#[^\n]*$/m, '').trim();
    const hashtags = buildHashtags({ market: property.slug, theme });

    return NextResponse.json({ caption, hashtags, stub });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
});
