import { useNavigate } from 'react-router-dom';
import { useDb } from '../lib/store';
import { getAvatarForUser } from '../lib/avatars';

export default function ChatListPage() {
  const db = useDb();
  const navigate = useNavigate();

  // Find chats where I am a participant
  const myChats = db.chats.filter(c => c.participantIds.includes(db.myIdentityId!))
                          .sort((a, b) => b.updatedAt - a.updatedAt);

  const getOtherParticipant = (chat: any) => {
    const otherId = chat.participantIds.find((id: string) => id !== db.myIdentityId) || '';
    const otherName = chat.participantNames[otherId] || 'ผู้ใช้ที่ไม่รู้จัก';
    const avatar = getAvatarForUser(db, otherId, otherName);
    return { id: otherId, name: otherName, avatar };
  };

  const getLastMessage = (chatId: string) => {
    const messages = db.messages.filter(m => m.chatId === chatId).sort((a, b) => b.createdAt - a.createdAt);
    return messages.length > 0 ? messages[0].content : 'เริ่มการสนทนา';
  };

  return (
    <div className="animate-fade-in">
      <header className="mb-lg text-center">
        <h2>ข้อความส่วนตัว</h2>
      </header>

      <div className="chats-list">
        {myChats.length === 0 ? (
          <div className="empty-state">
            <h3 style={{ marginBottom: '8px' }}>ยังไม่มีการสนทนา</h3>
            <p>คุณสามารถเริ่มพูดคุยส่วนตัวได้จากโปรไฟล์ของผู้อื่น</p>
          </div>
        ) : (
          myChats.map(chat => {
            const other = getOtherParticipant(chat);
            return (
              <div 
                key={chat.id} 
                className="card flex items-center gap-md" 
                onClick={() => navigate(`/chat/${chat.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="avatar-bubble" style={{ width: '48px', height: '48px', flexShrink: 0 }}>
                  <img src={other.avatar} alt={other.name} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div className="flex justify-between items-center mb-xs">
                    <strong style={{ fontSize: '1rem' }}>{other.name}</strong>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {new Date(chat.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getLastMessage(chat.id)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
