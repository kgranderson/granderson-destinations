'use client';

import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';
import { PROPERTIES } from '@/lib/constants';

/**
 * Returns the property record for a slug. In stub mode (no Supabase
 * envs) it returns the in-memory seed from constants.js.
 */
export function useProperty(slug) {
  const [property, setProperty] = useState(() => PROPERTIES.find((p) => p.slug === slug) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return; // stub mode — seed already set
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('properties')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!alive) return;
      if (err) setError(err);
      if (data) setProperty(data);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  return { property, loading, error };
}
