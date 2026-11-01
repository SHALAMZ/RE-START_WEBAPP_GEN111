import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';

let sessionInitialization: Promise<User> | null = null;

export const getOrCreateAnonymousSession = (): Promise<User> => {
  if (sessionInitialization) return sessionInitialization;

  const initialization = (async (): Promise<User> => {
    const supabase = getSupabaseClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (sessionData.session?.user) return sessionData.session.user;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user) throw new Error('Supabase did not return an anonymous user.');
    return data.user;
  })();

  sessionInitialization = initialization;
  return initialization.finally(() => {
    if (sessionInitialization === initialization) sessionInitialization = null;
  });
};
