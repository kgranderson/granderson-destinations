import Link from 'next/link';
import { Upload } from 'lucide-react';

/**
 * "Import T12" button rendered on the per-property economics
 * dashboard header. Links to the auth-gated import page,
 * pre-selecting this property.
 */
export function ImportTriggerLink({ propertySlug }) {
  return (
    <Link
      href={`/admin/import?property=${propertySlug}`}
      className="inline-flex items-center gap-2 rounded-full bg-brand-gold px-4 py-2 text-xs font-medium text-brand-ink hover:bg-brand-gold/85"
    >
      <Upload size={12} /> Import T12
    </Link>
  );
}
