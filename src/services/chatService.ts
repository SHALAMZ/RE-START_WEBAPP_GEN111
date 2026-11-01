import { getSupabaseClient } from '../lib/supabase';
import { getPublicProfiles, type Profile } from './profileService';

export interface ChatRecord {
  id: string;
  cycle_id: string;
  participant_a_profile_id: string;
  participant_b_profile_id: string;
  updated_at: string;
}

export interface ChatMessageRecord {
  id: string;
  cycle_id: string;
  chat_id: string;
  sender_profile_id: string;
  content: string;
  created_at: string;
}

export interface ChatWithParticipants extends ChatRecord {
  participants: Profile[];
}

export const listMyChats = async (): Promise<ChatWithParticipants[]> => {
  const { data, error } = await getSupabaseClient()
    .from('chats')
    .select('id, cycle_id, participant_a_profile_id, participant_b_profile_id, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  const chats = (data ?? []) as ChatRecord[];
  const profileIds = [...new Set(chats.flatMap((chat) => [
    chat.participant_a_profile_id,
    chat.participant_b_profile_id,
  ]))];
  const profiles = await getPublicProfiles(profileIds);
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  return chats.map((chat) => ({
    ...chat,
    participants: [byId.get(chat.participant_a_profile_id), byId.get(chat.participant_b_profile_id)]
      .filter((profile): profile is Profile => profile !== undefined),
  }));
};

export const listMessages = async (chatId: string): Promise<ChatMessageRecord[]> => {
  const { data, error } = await getSupabaseClient()
    .from('chat_messages')
    .select('id, cycle_id, chat_id, sender_profile_id, content, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessageRecord[];
};

export const listMessagesForChats = async (chatIds: string[]): Promise<ChatMessageRecord[]> => {
  if (chatIds.length === 0) return [];
  const { data, error } = await getSupabaseClient()
    .from('chat_messages')
    .select('id, cycle_id, chat_id, sender_profile_id, content, created_at')
    .in('chat_id', chatIds)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessageRecord[];
};

export const createOrGetChat = async (targetProfileId: string): Promise<string> => {
  const { data, error } = await getSupabaseClient().rpc('create_or_get_chat', {
    p_target_profile_id: targetProfileId,
  });
  if (error) throw error;
  const chat = (data as ChatRecord[] | null)?.[0];
  if (!chat) throw new Error('Supabase did not return the conversation.');
  return chat.id;
};

export const sendMessage = async (chatId: string, content: string): Promise<void> => {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 2000) throw new Error('Message must be between 1 and 2000 characters.');
  const { error } = await getSupabaseClient().rpc('send_chat_message', {
    p_chat_id: chatId,
    p_content: trimmed,
  });
  if (error) throw error;
};

export const endChat = async (chatId: string): Promise<void> => {
  const { error } = await getSupabaseClient().rpc('end_chat', { p_chat_id: chatId });
  if (error) throw error;
};
