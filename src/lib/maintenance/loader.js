import 'server-only';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * Load maintenance requests with property slug resolved for
 * easier UI rendering.
 */
export async function listMaintenance({ status, propertySlug } = {}) {
  const supabase = getAdminClient();
  if (!supabase) return { stub: true, items: [] };

  let q = supabase
    .from('maintenance_requests')
    .select('*, property:property_id(slug,name,short_name)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (status) q = q.eq('status', status);
  if (propertySlug) {
    const { data: prop } = await supabase
      .from('properties').select('id').eq('slug', propertySlug).maybeSingle();
    if (prop?.id) q = q.eq('property_id', prop.id);
  }
  const { data, error } = await q;
  if (error) return { stub: false, items: [], error: error.message };
  return { stub: false, items: data ?? [] };
}

export async function countByStatus() {
  const supabase = getAdminClient();
  if (!supabase) return { open: 0, in_progress: 0, scheduled: 0, completed: 0 };
  const counts = {};
  for (const status of ['open', 'in_progress', 'scheduled', 'completed']) {
    const { count } = await supabase
      .from('maintenance_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    counts[status] = count || 0;
  }
  return counts;
}
