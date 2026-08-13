import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

export type OAuthProvider = 'google' | 'apple';

/**
 * Lovable's hosted auth helper only works on Lovable-hosted origins.
 * On any other host (Vercel, custom domain, localhost build) we fall back to
 * the standard Supabase OAuth redirect flow, which works anywhere as long as
 * the origin is added to the backend's allowed redirect URLs.
 */
export const isLovableHost = () =>
  typeof window !== 'undefined' &&
  /(^|\.)lovable\.(app|dev)$/.test(window.location.hostname);

export const signInWithProvider = async (
  provider: OAuthProvider,
): Promise<{ error?: { message: string }; redirected?: boolean }> => {
  const redirectTo = `${window.location.origin}/`;

  if (isLovableHost()) {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: redirectTo });
    if (result.error) return { error: { message: result.error.message } };
    return { redirected: (result as { redirected?: boolean }).redirected };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, queryParams: { prompt: 'select_account' } },
  });
  if (error) return { error: { message: error.message } };
  // Supabase performs a full-page redirect to the provider.
  return { redirected: true };
};
