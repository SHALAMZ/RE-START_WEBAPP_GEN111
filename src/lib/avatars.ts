import avatar1 from '../assets/avatars/avatar1.png';
import avatar2 from '../assets/avatars/avatar2.png';
import avatar3 from '../assets/avatars/avatar3.png';
import avatar4 from '../assets/avatars/avatar4.png';
import avatar5 from '../assets/avatars/avatar5.png';
import avatar6 from '../assets/avatars/avatar6.png';
import avatar7 from '../assets/avatars/avatar7.png';
import avatar8 from '../assets/avatars/avatar8.png';
import type { DbState } from './store';

export const AVATARS = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
];

const KNOWN_NAMES_MAP: Record<string, string> = {
  'หมีน้อย': avatar1,
  'หมาโกลด์': avatar2,
  'เต่าซัน': avatar3,
  'สิงโต': avatar4,
  'กระรอก': avatar5,
  'นกแก้ว': avatar6,
  'แมวส้ม': avatar7,
  'ผึ้งน้อย': avatar8,
};

export const getAvatarForUser = (
  db: DbState,
  userId: string,
  userName?: string
): string => {
  if (userId === db.myIdentityId && db.myIdentityAvatar) {
    return db.myIdentityAvatar;
  }

  // 1. From chat participantAvatars
  for (const chat of db.chats) {
    if (chat.participantAvatars && chat.participantAvatars[userId]) {
      return chat.participantAvatars[userId]!;
    }
  }

  // 2. From posts
  const post = db.posts.find((p) => p.authorId === userId && p.authorAvatar);
  if (post?.authorAvatar) return post.authorAvatar;

  // 3. From comments
  const comment = db.comments.find((c) => c.authorId === userId && c.authorAvatar);
  if (comment?.authorAvatar) return comment.authorAvatar;

  // 4. By matching known name
  if (userName && KNOWN_NAMES_MAP[userName]) {
    return KNOWN_NAMES_MAP[userName];
  }

  // 5. Hash userId or userName to pick one of the 8 avatars consistently
  const seedStr = userId || userName || 'user';
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATARS.length;
  return AVATARS[index];
};
