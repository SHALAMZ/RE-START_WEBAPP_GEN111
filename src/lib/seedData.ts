import { getDb, saveDb } from './store';

// Import avatar images properly via Vite so paths are correct
import avatar1 from '../assets/avatars/avatar1.png';
import avatar2 from '../assets/avatars/avatar2.png';
import avatar3 from '../assets/avatars/avatar3.png';
import avatar4 from '../assets/avatars/avatar4.png';
import avatar5 from '../assets/avatars/avatar5.png';
import avatar6 from '../assets/avatars/avatar6.png';
import avatar8 from '../assets/avatars/avatar8.png';

// Seed mock data for demo/mockup purposes
// Only runs once when the board is empty
export const seedMockData = (_myId: string, _myAvatar: string | null) => {
  const db = getDb();
  if (db.posts.length > 0) return; // Already has data

  const u1 = { id: 'mock_u1', name: 'หมีน้อย',  avatar: avatar1 };
  const u2 = { id: 'mock_u2', name: 'เต่าซัน',   avatar: avatar3 };
  const u3 = { id: 'mock_u3', name: 'ผึ้งน้อย',  avatar: avatar8 };
  const u4 = { id: 'mock_u4', name: 'กระรอก',    avatar: avatar5 };
  const u5 = { id: 'mock_u5', name: 'สิงโต',     avatar: avatar4 };
  const u6 = { id: 'mock_u6', name: 'นกแก้ว',    avatar: avatar6 };
  const u7 = { id: 'mock_u7', name: 'หมาโกลด์',  avatar: avatar2 };

  const now = Date.now();

  db.posts = [
    {
      id: 'mock_p1',
      content: 'วันนี้รู้สึกหมดไฟมากเลย ส่งงานไม่ทัน นอนไม่หลับ\nอยากได้รับกำลังใจจากทุกคนหน่อยนะ 😔',
      authorId: u1.id, authorName: u1.name, authorAvatar: u1.avatar,
      createdAt: now - 1000 * 60 * 25,
    },
    {
      id: 'mock_p2',
      content: 'ไม่รู้ว่าตัวเองยังรักสิ่งที่เรียนอยู่ไหม\nบางทีก็ถามตัวเองว่าเรียนไปทำไม...',
      authorId: u2.id, authorName: u2.name, authorAvatar: u2.avatar,
      createdAt: now - 1000 * 60 * 60,
    },
    {
      id: 'mock_p3',
      content: 'วันนี้ทำสิ่งเล็กๆ ได้สำเร็จ คือตื่นเช้า ทำกาแฟ แล้วก็เปิดหนังสืออ่านครึ่งชั่วโมง\nเล็กน้อยมากแต่รู้สึกดีขึ้นนิดนึง 🌱',
      authorId: u3.id, authorName: u3.name, authorAvatar: u3.avatar,
      createdAt: now - 1000 * 60 * 100,
    },
    {
      id: 'mock_p4',
      content: 'stress มากจนรู้สึกว่าร่างกายไม่ไหวแล้ว\nใครมีวิธีผ่อนคลายบ้างช่วยแนะนำหน่อยได้มั้ย',
      authorId: u4.id, authorName: u4.name, authorAvatar: u4.avatar,
      createdAt: now - 1000 * 60 * 150,
    },
    {
      id: 'mock_p5',
      content: 'อยากบอกทุกคนว่า "ยังมีพรุ่งนี้เสมอ" 🌿\nไม่ต้องแบกทุกอย่างไว้คนเดียวนะ',
      authorId: u5.id, authorName: u5.name, authorAvatar: u5.avatar,
      createdAt: now - 1000 * 60 * 200,
    },
  ];

  db.comments = [
    { id: 'mock_c1', postId: 'mock_p1', content: 'อยู่เคียงข้างนะ ค่อยๆ ไปก็ได้ 🤍', authorId: u2.id, authorName: u2.name, authorAvatar: u2.avatar, createdAt: now - 1000 * 60 * 18 },
    { id: 'mock_c2', postId: 'mock_p1', content: 'เข้าใจเลย เราก็เป็นแบบนี้เหมือนกัน ✨', authorId: u3.id, authorName: u3.name, authorAvatar: u3.avatar, createdAt: now - 1000 * 60 * 12 },
    { id: 'mock_c3', postId: 'mock_p2', content: 'ความรู้สึกนี้ถูกต้องมาก ไม่ต้องรีบหาคำตอบนะ', authorId: u1.id, authorName: u1.name, authorAvatar: u1.avatar, createdAt: now - 1000 * 60 * 50 },
    { id: 'mock_c4', postId: 'mock_p3', content: 'เก่งมากเลย ขอชื่นชม 💚 เล็กน้อยแต่มีความหมายมาก', authorId: u4.id, authorName: u4.name, authorAvatar: u4.avatar, createdAt: now - 1000 * 60 * 90 },
    { id: 'mock_c5', postId: 'mock_p4', content: 'ลอง "Box Breathing" ดูนะ หายใจเข้า 4 วิ กลั้น 4 วิ หายใจออก 4 วิ', authorId: u6.id, authorName: u6.name, authorAvatar: u6.avatar, createdAt: now - 1000 * 60 * 140 },
    { id: 'mock_c6', postId: 'mock_p4', content: 'เราก็ผ่านช่วงแบบนี้มาแล้ว ให้กำลังใจนะ 💪', authorId: u7.id, authorName: u7.name, authorAvatar: u7.avatar, createdAt: now - 1000 * 60 * 130 },
    { id: 'mock_c7', postId: 'mock_p5', content: 'ขอบคุณมากเลย ต้องการคำนี้มากเลยวันนี้ 🌱', authorId: u1.id, authorName: u1.name, authorAvatar: u1.avatar, createdAt: now - 1000 * 60 * 185 },
  ];

  db.reactions = [
    { id: 'mock_r1', postId: 'mock_p1', authorId: u2.id, type: '❤️' },
    { id: 'mock_r2', postId: 'mock_p1', authorId: u3.id, type: '🤍' },
    { id: 'mock_r3', postId: 'mock_p1', authorId: u4.id, type: '✨' },
    { id: 'mock_r4', postId: 'mock_p2', authorId: u1.id, type: '🌱' },
    { id: 'mock_r5', postId: 'mock_p2', authorId: u5.id, type: '🤍' },
    { id: 'mock_r6', postId: 'mock_p3', authorId: u2.id, type: '✨' },
    { id: 'mock_r7', postId: 'mock_p3', authorId: u1.id, type: '❤️' },
    { id: 'mock_r8', postId: 'mock_p3', authorId: u6.id, type: '🌱' },
    { id: 'mock_r9', postId: 'mock_p4', authorId: u5.id, type: '❤️' },
    { id: 'mock_r10', postId: 'mock_p5', authorId: u3.id, type: '✨' },
    { id: 'mock_r11', postId: 'mock_p5', authorId: u4.id, type: '🌱' },
    { id: 'mock_r12', postId: 'mock_p5', authorId: u7.id, type: '❤️' },
  ];

  saveDb(db);
};
