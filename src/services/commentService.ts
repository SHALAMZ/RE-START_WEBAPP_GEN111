import { getSupabaseClient } from '../lib/supabase';

export interface CommentRecord {
  id: string;
  cycle_id: string;
  post_id: string;
  parent_comment_id: string | null;
  author_profile_id: string;
  content: string;
  created_at: string;
}

export const listActiveComments = async (): Promise<CommentRecord[]> => {
  const { data, error } = await getSupabaseClient()
    .from('comments')
    .select('id, cycle_id, post_id, parent_comment_id, author_profile_id, content, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as CommentRecord[];
};

export const createComment = async (
  postId: string,
  content: string,
  parentCommentId: string | null = null,
): Promise<void> => {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 1000) throw new Error('Comment must be between 1 and 1000 characters.');
  const { error } = await getSupabaseClient().rpc('create_comment', {
    p_post_id: postId,
    p_content: trimmed,
    p_parent_comment_id: parentCommentId,
  });
  if (error) throw error;
};

export const deleteComment = async (commentId: string): Promise<void> => {
  const { error } = await getSupabaseClient().rpc('delete_comment', { p_comment_id: commentId });
  if (error) throw error;
};
