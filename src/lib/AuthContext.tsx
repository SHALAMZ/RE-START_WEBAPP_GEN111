import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { getOrCreateAnonymousSession } from '../services/authService';
import { AuthContext } from './authState';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | undefined;
    const initialize = async () => {
      try {
      const { data } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
        if (active) {
          setUser(session?.user ?? null);
          if (session?.user) {
            setError(null);
          } else if (event === 'SIGNED_OUT') {
            setError('Your anonymous session has ended. Retry to start a new temporary identity.');
          }
        }
      });
      subscription = data.subscription;
      const authenticatedUser = await getOrCreateAnonymousSession();
      if (active) {
        setUser(authenticatedUser);
        setError(null);
      }
      } catch (cause: unknown) {
        if (active) setError(cause instanceof Error ? cause.message : 'Anonymous sign-in failed.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void initialize();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [attempt]);

  const value = useMemo(() => ({ user, loading, error, retry }), [user, loading, error, retry]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
