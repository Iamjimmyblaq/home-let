import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const LOCAL_KEY = 'homelet-fav-seed';
const readLocal = (): string[] => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; } };
const writeLocal = (v: string[]) => localStorage.setItem(LOCAL_KEY, JSON.stringify(v));

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export const useFavorites = () => {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    const local = readLocal();
    if (!user) { setIds(local); return; }
    const { data } = await supabase.from('favorites').select('listing_id').eq('user_id', user.id);
    const dbIds = (data || []).map((r: any) => r.listing_id as string);
    setIds([...dbIds, ...local]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id: string) => {
    const has = ids.includes(id);
    if (!user || !isUuid(id)) {
      // mock id (seeded property) → store locally
      const next = has ? ids.filter((x) => x !== id) : [...ids, id];
      setIds(next);
      writeLocal(next.filter((x) => !isUuid(x)));
      return;
    }
    if (has) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: id });
    }
    load();
  };

  return { favorites: ids, toggle };
};
