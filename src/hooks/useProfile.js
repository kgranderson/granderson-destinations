'use client';

import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';

/**
 * Profile hook — mirrors the Scholarship-Winner useProfile pattern.
 * In stub mode (no Supabase) returns a guest profile so UI shells render.
 */
export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) {
      setProfile({ id: null, full_name: 'Guest', tier: 'guest', onboarding_completed: false, stub: true });
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (alive) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (alive) {
        setProfile(data);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { profile, loading, isPro: profile?.tier === 'member' || profile?.tier === 'admin' };
}
