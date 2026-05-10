import 'server-only';
/**
 * Economics data loader. Tries Supabase monthly_financials first;
 * falls back to the synthetic seed so the dashboard renders
 * end-to-end before real Rent Manager exports are loaded.
 */
import { unstable_cache } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  generateFinancialsSeed,
  flattenSeedForRollup,
  categoryBaselines,
} from './seed';

async function _loadMonthly(propertySlug) {
  const supabase = getAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('monthly_financials')
      .select('month, revenue, expense, expense_category, source')
      .order('month', { ascending: true });
    if (!error && data?.length) {
      const rows = data.map((r) => ({
        month: r.month,
        revenue: r.revenue || 0,
        expense: r.expense || 0,
        expenseCategory: r.expense_category,
      }));
      // Compute baselines from the live rows (last 12 mo per category, excluding most recent)
      const byCategory = {};
      const expenseRows = rows.filter((r) => r.expenseCategory);
      for (const r of expenseRows) {
        (byCategory[r.expenseCategory] = byCategory[r.expenseCategory] || []).push(r);
      }
      const baselines = {};
      for (const [cat, list] of Object.entries(byCategory)) {
        const sorted = [...list].sort((a, b) => a.month.localeCompare(b.month));
        const last12 = sorted.slice(-13, -1);
        baselines[cat] =
          last12.reduce((s, r) => s + r.expense, 0) / Math.max(1, last12.length);
      }
      return { stub: false, rows, baselines };
    }
  }
  // Fall back to seed
  const seed = generateFinancialsSeed();
  return {
    stub: true,
    rows: flattenSeedForRollup(seed, propertySlug),
    baselines: categoryBaselines(seed, propertySlug),
  };
}

export const loadMonthly = unstable_cache(_loadMonthly, ['economics-monthly'], {
  revalidate: 600,
  tags: ['economics'],
});
