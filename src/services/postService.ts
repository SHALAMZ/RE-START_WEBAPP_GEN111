import { getSupabaseClient } from '../lib/supabase';

export interface PublicAuthorRecord {
  id: string;
  nickname: string;
  avatar_key: string;
}

export interface PostRecord {
  id: string;
  cycle_id: string;
  author_profile_id: string;
  content: string;
  created_at: string;
}

export const listActivePosts = async (): Promise<PostRecord[]> => {
  const { data, error } = await getSupabaseClient()
    .from('posts')
    .select('id, cycle_id, author_profile_id, content, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PostRecord[];
};

export const createPost = async (content: string): Promise<void> => {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 2000) throw new Error('Post must be between 1 and 2000 characters.');
  const { error } = await getSupabaseClient().rpc('create_post', { p_content: trimmed });
  if (error) throw error;
};

export const deletePost = async (postId: string): Promise<void> => {
  const { error } = await getSupabaseClient().rpc('delete_post', { p_post_id: postId });
  if (error) throw error;
};
