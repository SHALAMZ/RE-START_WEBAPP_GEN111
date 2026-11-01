import { getSupabaseClient } from '../lib/supabase';

export interface Cycle {
  id: string;
  startedAt: number;
  expiresAt: number;
  createdAt: number;
  serverTimeOffsetMs: number;
}

interface CycleRecord {
  id: string;
  started_at: string;
  expires_at: string;
  created_at: string;
  server_now: string;
}

export const getActiveCycle = async (): Promise<Cycle> => {
  const requestStartedAt = Date.now();
  const { data, error } = await getSupabaseClient().rpc('get_active_cycle');
  const requestFinishedAt = Date.now();
  if (error) throw error;
  const cycle = (data as CycleRecord[] | null)?.[0];
  if (!cycle) throw new Error('Supabase did not return an active cycle.');
  return {
    id: cycle.id,
    startedAt: Date.parse(cycle.started_at),
    expiresAt: Date.parse(cycle.expires_at),
    createdAt: Date.parse(cycle.created_at),
    serverTimeOffsetMs: Date.parse(cycle.server_now) - (requestStartedAt + requestFinishedAt) / 2,
  };
};
