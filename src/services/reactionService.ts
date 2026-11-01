import { getSupabaseClient } from '../lib/supabase';
import type { ReactionType } from '../lib/store';

export interface ReactionRecord {
  id: string;
  cycle_id: string;
  post_id: string;
  profile_id: string;
  type: ReactionType;
  created_at: string;
}

export const listActiveReactions = async (): Promise<ReactionRecord[]> => {
  const { data, error } = await getSupabaseClient()
    .from('reactions')
    .select('id, cycle_id, post_id, profile_id, type, created_at');
  if (error) throw error;
  return (data ?? []) as ReactionRecord[];
};

export const toggleReaction = async (postId: string, type: ReactionType): Promise<boolean> => {
  const { data, error } = await getSupabaseClient().rpc('toggle_reaction', {
    p_post_id: postId,
    p_type: type,
  });
  if (error) throw error;
  return data;
};
