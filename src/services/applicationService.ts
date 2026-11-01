import { getActiveCycle, type Cycle } from './cycleService';
import { listActiveComments, type CommentRecord } from './commentService';
import { listActivePosts, type PostRecord } from './postService';
import { listActiveReactions, type ReactionRecord } from './reactionService';
import { getCurrentProfile, getPublicProfiles, type Profile } from './profileService';
import { listMessagesForChats, listMyChats, type ChatMessageRecord, type ChatWithParticipants } from './chatService';
import type { PublicAuthorRecord } from './postService';

export type HydratedPostRecord = PostRecord & { author: PublicAuthorRecord | null };
export type HydratedCommentRecord = CommentRecord & { author: PublicAuthorRecord | null };
export interface ApplicationSnapshot {
  cycle: Cycle;
  profile: Profile | null;
  posts: HydratedPostRecord[];
  comments: HydratedCommentRecord[];
  reactions: ReactionRecord[];
  chats: ChatWithParticipants[];
  messages: ChatMessageRecord[];
}

const loadSnapshot = async (): Promise<ApplicationSnapshot> => {
  const [cycle, profile] = await Promise.all([getActiveCycle(), getCurrentProfile()]);
  if (!profile) {
    return { cycle, profile, posts: [], comments: [], reactions: [], chats: [], messages: [] };
  }
  const [posts, comments, reactions, chats] = await Promise.all([
    listActivePosts(),
    listActiveComments(),
    listActiveReactions(),
    listMyChats(),
  ]);
  const authorIds = [...new Set([
    ...posts.map((post) => post.author_profile_id),
    ...comments.map((comment) => comment.author_profile_id),
  ])];
  const [authors, messages] = await Promise.all([
    getPublicProfiles(authorIds),
    listMessagesForChats(chats.map((chat) => chat.id)),
  ]);
  const authorsById = new Map(authors.map((author) => [author.id, author]));
  const toAuthor = (profile: Profile | undefined): PublicAuthorRecord | null => profile
    ? { id: profile.id, nickname: profile.nickname, avatar_key: profile.avatarKey }
    : null;
  return {
    cycle,
    profile,
    posts: posts.map((post) => ({ ...post, author: toAuthor(authorsById.get(post.author_profile_id)) })),
    comments: comments.map((comment) => ({ ...comment, author: toAuthor(authorsById.get(comment.author_profile_id)) })),
    reactions,
    chats,
    messages,
  };
};

let snapshotRequest: Promise<ApplicationSnapshot> | null = null;

export const loadApplicationSnapshot = (): Promise<ApplicationSnapshot> => {
  if (snapshotRequest) return snapshotRequest;
  const request = loadSnapshot().finally(() => {
    if (snapshotRequest === request) snapshotRequest = null;
  });
  snapshotRequest = request;
  return request;
};
