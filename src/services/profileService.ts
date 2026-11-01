import { getSupabaseClient } from '../lib/supabase';

export interface Profile {
  id: string;
  cycleId: string;
  nickname: string;
  avatarKey: string;
  isCurrent: boolean;
  createdAt: number;
  updatedAt: number;
}

interface ProfileRecord {
  id: string;
  cycle_id: string;
  nickname: string;
  avatar_key: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

const mapProfile = (record: ProfileRecord): Profile => ({
  id: record.id,
  cycleId: record.cycle_id,
  nickname: record.nickname,
  avatarKey: record.avatar_key,
  isCurrent: record.is_current,
  createdAt: Date.parse(record.created_at),
  updatedAt: Date.parse(record.updated_at),
});

export const getCurrentProfile = async (): Promise<Profile | null> => {
  const { data, error } = await getSupabaseClient().rpc('current_profile');
  if (error) throw error;
  const record = (data as ProfileRecord[] | null)?.[0];
  return record ? mapProfile(record) : null;
};

export const createOrResetProfile = async (nickname: string, avatarKey: string): Promise<Profile> => {
  const trimmedNickname = nickname.trim();
  if (!trimmedNickname || trimmedNickname.length > 20) {
    throw new Error('Nickname must be between 1 and 20 characters.');
  }
  const { data, error } = await getSupabaseClient().rpc('create_or_reset_profile', {
    p_nickname: trimmedNickname,
    p_avatar_key: avatarKey,
  });
  if (error) throw error;
  const record = (data as ProfileRecord[] | null)?.[0];
  if (!record) throw new Error('Supabase did not return the saved profile.');
  return mapProfile(record);
};

export const resetCurrentProfile = async (): Promise<void> => {
  const { error } = await getSupabaseClient().rpc('reset_current_profile');
  if (error) throw error;
};

export const getPublicProfiles = async (profileIds: string[]): Promise<Profile[]> => {
  if (profileIds.length === 0) return [];
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('id, cycle_id, nickname, avatar_key, is_current, created_at, updated_at')
    .in('id', profileIds);
  if (error) throw error;
  return (data as ProfileRecord[]).map(mapProfile);
};

export const getPublicProfile = async (profileId: string): Promise<Profile | null> => {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('id, cycle_id, nickname, avatar_key, is_current, created_at, updated_at')
    .eq('id', profileId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as ProfileRecord) : null;
};
