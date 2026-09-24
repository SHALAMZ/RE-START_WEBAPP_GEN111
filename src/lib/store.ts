import { useState, useEffect } from 'react';

// --- Types ---
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
  cycleStartTime: number | null;
  myIdentityId: string | null;
  myIdentityName: string | null;
  myIdentityAvatar: string | null;
  posts: Post[];
  comments: Comment[];
  chats: Chat[];
  messages: ChatMessage[];
  reactions: Reaction[];
}

const DB_KEY = 'restart_db_v5';

// Identity generation logic removed as user will set it manually

const getInitialState = (): DbState => ({
  cycleStartTime: null,
  myIdentityId: null,
  myIdentityName: null,
  myIdentityAvatar: null,
  posts: [],
  comments: [],
  chats: [],
  messages: [],
  reactions: []
});

export const getDb = (): DbState => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse DB", e);
  }
  return getInitialState();
};

export const saveDb = (state: DbState) => {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('restart_db_updated'));
};

export const resetDb = () => {
  localStorage.removeItem(DB_KEY);
  saveDb(getInitialState());
};

export const resetIdentityOnly = () => {
  const db = getDb();
  db.myIdentityId = null;
  db.myIdentityName = null;
  db.myIdentityAvatar = null;
  saveDb(db);
};

// React hook to use DB
export const useDb = () => {
  const [db, setDb] = useState<DbState>(getDb());

  useEffect(() => {
    const handleUpdate = () => setDb(getDb());
    window.addEventListener('restart_db_updated', handleUpdate);
    // Also listen to cross-tab communication
    window.addEventListener('storage', (e) => {
      if (e.key === DB_KEY) {
        handleUpdate();
      }
    });
    return () => {
      window.removeEventListener('restart_db_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return db;
};

// API Helpers
export const initCycleIfNeeded = () => {
  const db = getDb();
  let updated = false;
  if (!db.cycleStartTime) {
    db.cycleStartTime = Date.now();
    updated = true;
  }
  if (updated) {
    saveDb(db);
  }
};

export const setMyIdentity = (name: string, avatar: string) => {
  const db = getDb();
  db.myIdentityId = `user_${Math.random().toString(36).substr(2, 9)}`;
  db.myIdentityName = name;
  db.myIdentityAvatar = avatar;
  saveDb(db);
};

export const createPost = (content: string) => {
  const db = getDb();
  if (!db.myIdentityId || !db.myIdentityName) return;
  
  const newPost: Post = {
    id: `post_${Date.now()}`,
    content,
    authorId: db.myIdentityId,
    authorName: db.myIdentityName,
    authorAvatar: db.myIdentityAvatar,
    createdAt: Date.now(),
  };
  db.posts.unshift(newPost);
  saveDb(db);
};

export const deletePost = (postId: string) => {
  const db = getDb();
  if (!db.myIdentityId) return;
  db.posts = db.posts.filter(p => p.id !== postId || p.authorId !== db.myIdentityId);
  db.comments = db.comments.filter(c => c.postId !== postId);
  db.reactions = db.reactions.filter(r => r.postId !== postId);
  saveDb(db);
};

export const toggleReaction = (postId: string, type: ReactionType) => {
  const db = getDb();
  if (!db.myIdentityId) return;
  const authorId = db.myIdentityId;
  
  const existing = db.reactions.find(r => r.postId === postId && r.authorId === authorId && r.type === type);
  if (existing) {
    db.reactions = db.reactions.filter(r => r.id !== existing.id);
  } else {
    db.reactions.push({
      id: `react_${Date.now()}_${Math.random()}`,
      postId,
      authorId,
      type
    });
  }
  saveDb(db);
};

export const createComment = (postId: string, content: string, parentCommentId?: string | null) => {
  const db = getDb();
  if (!db.myIdentityId || !db.myIdentityName) return;
  
  db.comments.push({
    id: `comment_${Date.now()}`,
    postId,
    content,
    authorId: db.myIdentityId,
    authorName: db.myIdentityName,
    authorAvatar: db.myIdentityAvatar,
    parentCommentId: parentCommentId || null,
    createdAt: Date.now()
  });
  saveDb(db);
};

export const deleteComment = (commentId: string) => {
  const db = getDb();
  if (!db.myIdentityId) return;
  db.comments = db.comments.filter(c => c.id !== commentId || c.authorId !== db.myIdentityId);
  saveDb(db);
};

export const getOrCreateChat = (targetUserId: string, targetUserName: string, targetUserAvatar?: string | null) => {
  const db = getDb();
  if (!db.myIdentityId || !db.myIdentityName) return null;
  
  const existingChat = db.chats.find(c => 
    c.participantIds.includes(db.myIdentityId!) && 
    c.participantIds.includes(targetUserId)
  );
  
  if (existingChat) return existingChat.id;
  
  const newChat: Chat = {
    id: `chat_${Date.now()}`,
    participantIds: [db.myIdentityId, targetUserId],
    participantNames: {
      [db.myIdentityId]: db.myIdentityName,
      [targetUserId]: targetUserName
    },
    participantAvatars: {
      [db.myIdentityId]: db.myIdentityAvatar,
      [targetUserId]: targetUserAvatar ?? null
    },
    updatedAt: Date.now()
  };
  
  db.chats.push(newChat);
  saveDb(db);
  return newChat.id;
};

export const sendChatMessage = (chatId: string, content: string) => {
  const db = getDb();
  if (!db.myIdentityId) return;
  
  const chatIndex = db.chats.findIndex(c => c.id === chatId);
  if (chatIndex === -1) return;
  
  db.messages.push({
    id: `msg_${Date.now()}`,
    chatId,
    content,
    authorId: db.myIdentityId,
    createdAt: Date.now()
  });
  
  db.chats[chatIndex].updatedAt = Date.now();
  saveDb(db);
};

export const endChat = (chatId: string) => {
  const db = getDb();
  db.chats = db.chats.filter(c => c.id !== chatId);
  db.messages = db.messages.filter(m => m.chatId !== chatId);
  saveDb(db);
};
