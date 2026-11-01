import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from './authState';
import { getSupabaseClient } from './supabase';
import { getAvatarForKey } from './avatars';
import { loadApplicationSnapshot } from '../services/applicationService';
import { createOrResetProfile, resetCurrentProfile } from '../services/profileService';
import { createPost as savePost, deletePost as removePost } from '../services/postService';
import { createComment as saveComment, deleteComment as removeComment } from '../services/commentService';
import { toggleReaction as saveReaction } from '../services/reactionService';
import {
  createOrGetChat as createChat,
  endChat as removeChat,
  sendMessage,
} from '../services/chatService';
import type { ReportCategory, ReportTargetType } from '../services/reportService';
import { submitReport as saveReport } from '../services/reportService';

export type ReactionType = '❤️' | '🌱' | '✨' | '🤍';

export interface Reaction {
  id: string;
  postId: string;
  authorId: string;
  type: ReactionType;
}

export interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  parentCommentId?: string | null;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  content: string;
  authorId: string;
  createdAt: number;
}

export interface Chat {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string | null>;
  updatedAt: number;
}

export interface DbState {
  cycleId: string | null;
  cycleStartTime: number | null;
  cycleExpiresAt: number | null;
  serverTimeOffsetMs: number;
  myIdentityId: string | null;
  myIdentityName: string | null;
  myIdentityAvatar: string | null;
  posts: Post[];
  comments: Comment[];
  chats: Chat[];
  messages: ChatMessage[];
  reactions: Reaction[];
  loading: boolean;
  error: string | null;
  realtimeError: string | null;
  refresh: (showLoading?: boolean) => Promise<void>;
  resetIdentity: () => Promise<void>;
  report: (
    targetType: ReportTargetType,
    targetId: string,
    category: ReportCategory,
    reason: string,
  ) => Promise<string>;
}

const emptyData = {
  cycleId: null,
  cycleStartTime: null,
  cycleExpiresAt: null,
  serverTimeOffsetMs: 0,
  myIdentityId: null,
  myIdentityName: null,
  myIdentityAvatar: null,
  posts: [],
  comments: [],
  chats: [],
  messages: [],
  reactions: [],
};

type AppData = Omit<
  DbState,
  'loading' | 'error' | 'realtimeError' | 'refresh' | 'resetIdentity' | 'report'
>;

const DbContext = createContext<DbState | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { pathname } = useLocation();
  const authUserId = auth.user?.id;
  const hasAuthenticatedUser = Boolean(authUserId);
  const [data, setData] = useState<AppData>(emptyData);
  const activeChatId = pathname.match(/^\/chat\/([0-9a-f-]{36})$/i)?.[1];
  const isCurrentChatParticipant = activeChatId
    ? data.chats.some((chat) => chat.id === activeChatId)
    : false;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);

  const refresh = useCallback(async (showLoading = false) => {
    if (auth.loading || auth.error || !hasAuthenticatedUser) return;
    if (showLoading) setLoading(true);
    setError(null);
    const request = loadApplicationSnapshot()
      .then((snapshot) => {
        const toAvatar = (key: string | null | undefined) => key ? getAvatarForKey(key) : null;
        setData({
          cycleId: snapshot.cycle.id,
          cycleStartTime: snapshot.cycle.startedAt,
          cycleExpiresAt: snapshot.cycle.expiresAt,
          serverTimeOffsetMs: snapshot.cycle.serverTimeOffsetMs,
          myIdentityId: snapshot.profile?.id ?? null,
          myIdentityName: snapshot.profile?.nickname ?? null,
          myIdentityAvatar: toAvatar(snapshot.profile?.avatarKey),
          posts: snapshot.posts.map((post) => ({
            id: post.id,
            content: post.content,
            authorId: post.author_profile_id,
            authorName: post.author?.nickname ?? 'ผู้ใช้ไม่ทราบชื่อ',
            authorAvatar: toAvatar(post.author?.avatar_key),
            createdAt: Date.parse(post.created_at),
          })),
          comments: snapshot.comments.map((comment) => ({
            id: comment.id,
            postId: comment.post_id,
            content: comment.content,
            authorId: comment.author_profile_id,
            authorName: comment.author?.nickname ?? 'ผู้ใช้ไม่ทราบชื่อ',
            authorAvatar: toAvatar(comment.author?.avatar_key),
            parentCommentId: comment.parent_comment_id,
            createdAt: Date.parse(comment.created_at),
          })),
          chats: snapshot.chats.map((chat) => {
            const participantIds = [chat.participant_a_profile_id, chat.participant_b_profile_id];
            const participantsById = new Map(chat.participants.map((participant) => [participant.id, participant]));
            return {
              id: chat.id,
              participantIds,
              participantNames: Object.fromEntries(participantIds.map((id) => [
                id,
                participantsById.get(id)?.nickname ?? 'ผู้ใช้ที่ไม่รู้จัก',
              ])),
              participantAvatars: Object.fromEntries(participantIds.map((id) => [
                id,
                toAvatar(participantsById.get(id)?.avatarKey),
              ])),
              updatedAt: Date.parse(chat.updated_at),
            };
          }),
          messages: snapshot.messages.map((message) => ({
            id: message.id,
            chatId: message.chat_id,
            content: message.content,
            authorId: message.sender_profile_id,
            createdAt: Date.parse(message.created_at),
          })),
          reactions: snapshot.reactions.map((reaction) => ({
            id: reaction.id,
            postId: reaction.post_id,
            authorId: reaction.profile_id,
            type: reaction.type as ReactionType,
          })),
        });
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Unable to load application data.');
      })
      .finally(() => {
        setLoading(false);
      });
    return request;
  }, [auth.error, auth.loading, hasAuthenticatedUser]);

  useEffect(() => {
    if (!authUserId || auth.error) return;
    const timeout = window.setTimeout(() => void refresh(true), 0);
    return () => window.clearTimeout(timeout);
  }, [auth.error, authUserId, refresh]);

  useEffect(() => {
    if (!authUserId || !data.cycleId || !data.myIdentityId) return;

    const client = getSupabaseClient();
    const channels: RealtimeChannel[] = [];
    let refreshTimeout: number | undefined;
    const refreshSoon = () => {
      if (refreshTimeout !== undefined) window.clearTimeout(refreshTimeout);
      refreshTimeout = window.setTimeout(() => {
        refreshTimeout = undefined;
        void refresh();
      }, 120);
    };
    const onStatus = (status: string, cause?: Error) => {
      if (status === 'SUBSCRIBED') {
        setRealtimeError(null);
        refreshSoon();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setRealtimeError(cause?.message || 'Realtime connection failed. Updates may be delayed.');
      }
    };

    channels.push(
      client
        .channel(`cycle:${data.cycleId}`, { config: { private: true } })
        .on('broadcast', { event: 'change' }, refreshSoon)
        .subscribe(onStatus),
    );

    if (activeChatId && isCurrentChatParticipant) {
      channels.push(
        client
          .channel(`chat:${activeChatId}`, { config: { private: true } })
          .on('broadcast', { event: 'change' }, refreshSoon)
          .subscribe(onStatus),
      );
    } else if (pathname === '/chats') {
      channels.push(
        client
          .channel(`inbox:${authUserId}`, { config: { private: true } })
          .on('broadcast', { event: 'change' }, refreshSoon)
          .subscribe(onStatus),
      );
    }

    return () => {
      if (refreshTimeout !== undefined) window.clearTimeout(refreshTimeout);
      channels.forEach((channel) => {
        void client.removeChannel(channel);
      });
    };
  }, [authUserId, activeChatId, data.cycleId, data.myIdentityId, hasAuthenticatedUser, isCurrentChatParticipant, pathname, refresh]);

  const resetIdentity = useCallback(async () => {
    await resetCurrentProfile();
    setData((current) => ({
      ...current,
      myIdentityId: null,
      myIdentityName: null,
      myIdentityAvatar: null,
    }));
  }, []);

  const report = useCallback<DbState['report']>(
    (targetType, targetId, category, reason) => saveReport(targetType, targetId, category, reason),
    [],
  );

  const value = useMemo<DbState>(() => ({
    ...data,
    loading,
    error,
    realtimeError,
    refresh,
    resetIdentity,
    report,
  }), [data, loading, error, realtimeError, refresh, resetIdentity, report]);

  return createElement(DbContext.Provider, { value }, children);
}

export const useDb = (): DbState => {
  const context = useContext(DbContext);
  if (!context) throw new Error('useDb must be used within DbProvider.');
  return context;
};

export const setMyIdentity = async (name: string, avatarKey: string): Promise<void> => {
  await createOrResetProfile(name, avatarKey);
};

export const createPost = savePost;
export const deletePost = removePost;
export const createComment = saveComment;
export const deleteComment = removeComment;
export const toggleReaction = saveReaction;
export const sendChatMessage = sendMessage;
export const endChat = removeChat;
export const getOrCreateChat = createChat;
