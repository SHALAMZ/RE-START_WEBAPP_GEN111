import { getSupabaseClient } from '../lib/supabase';

export type ReportTargetType = 'post' | 'profile' | 'chat';
export type ReportCategory = 'harassment' | 'spam' | 'personal_info' | 'other';

export const submitReport = async (
  targetType: ReportTargetType,
  targetId: string,
  category: ReportCategory,
  reason: string,
): Promise<string> => {
  const trimmed = reason.trim();
  if (!trimmed || trimmed.length > 1000) throw new Error('A report reason of 1–1000 characters is required.');
  const { data, error } = await getSupabaseClient().rpc('submit_report', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_category: category,
    p_reason: trimmed,
  });
  if (error) throw error;
  if (!data) throw new Error('The report was not saved.');
  return data;
};
