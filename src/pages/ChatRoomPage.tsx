import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDb, sendChatMessage, endChat } from '../lib/store';
import { getAvatarForUser } from '../lib/avatars';
import { ChevronLeft, MoreHorizontal, AlertTriangle, UserX } from 'lucide-react';

export default function ChatRoomPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const db = useDb();
  
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = db.chats.find(c => c.id === chatId);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [db.messages]); // Scroll to bottom when new messages arrive

  if (!chat) {
    return (
      <div className="animate-fade-in text-center mt-xl">
        <h3>ไม่พบการสนทนา</h3>
        <p className="text-muted mb-md">การสนทนานี้อาจจบลงแล้ว</p>
        <button className="btn btn-outline" onClick={() => navigate('/chats')}>กลับไปหน้ารวมข้อความ</button>
      </div>
    );
  }

  const otherUserId = chat.participantIds.find(id => id !== db.myIdentityId) || '';
  const otherUserName = chat.participantNames[otherUserId] || 'ผู้ใช้ที่ไม่รู้จัก';
  const otherAvatar = getAvatarForUser(db, otherUserId, otherUserName);
  
  const messages = db.messages.filter(m => m.chatId === chatId).sort((a, b) => a.createdAt - b.createdAt);

  const handleSend = () => {
    if (message.trim()) {
      sendChatMessage(chatId!, message.trim());
      setMessage('');
    }
  };

  const handleEndChat = () => {
    if (window.confirm('คุณต้องการจบการสนทนาและลบประวัติใช่หรือไม่?')) {
      endChat(chatId!);
      navigate('/chats');
    }
  };

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 80px)', margin: 'calc(-1 * var(--spacing-md))', padding: 'var(--spacing-md)' }}>
      <header className="flex justify-between items-center mb-md" style={{ backgroundColor: 'var(--color-bg)', paddingBottom: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => navigate('/chats')}>
          <ChevronLeft size={24} />
        </button>
        
        <div 
          className="flex items-center gap-sm" 
          style={{ cursor: 'pointer' }} 
          onClick={() => navigate(`/user/${otherUserId}`)}
        >
          <div className="avatar-bubble" style={{ width: '34px', height: '34px' }}>
            <img src={otherAvatar} alt={otherUserName} />
          </div>
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{otherUserName}</h3>
        </div>
        
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => setShowOptions(!showOptions)}>
            <MoreHorizontal size={24} />
          </button>
          
          {showOptions && (
            <div className="card" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 10, minWidth: '160px', padding: '8px' }}>
              <button className="btn btn-ghost text-danger flex items-center gap-sm" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-danger)' }} onClick={handleEndChat}>
                <UserX size={16} /> จบการสนทนา
              </button>
              <button className="btn btn-ghost flex items-center gap-sm mt-xs" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => { alert('รายงานผู้ใช้แล้ว'); setShowOptions(false); }}>
                <AlertTriangle size={16} /> รายงาน
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="messages-area flex-1 flex flex-col gap-sm" style={{ overflowY: 'auto', paddingBottom: '80px' }}>
        {messages.length === 0 && (
          <div className="empty-state text-center text-muted mt-lg">
            <p style={{ fontSize: '0.85rem' }}>เริ่มต้นพูดคุยกับ {otherUserName} ได้เลย<br/>ข้อความทั้งหมดจะถูกลบเมื่อครบ 48 ชั่วโมง</p>
          </div>
        )}
        
        {messages.map(msg => {
          const isMe = msg.authorId === db.myIdentityId;
          return (
            <div key={msg.id} style={{ 
              display: 'flex', 
              alignItems: 'flex-end',
              justifyContent: isMe ? 'flex-end' : 'flex-start',
              gap: '6px',
              marginBottom: '4px'
            }}>
              {!isMe && (
                <div className="avatar-bubble avatar-bubble-sm" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                  <img src={otherAvatar} alt={otherUserName} />
                </div>
              )}
              <div style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: '16px',
                borderBottomRightRadius: isMe ? '4px' : '16px',
                borderBottomLeftRadius: !isMe ? '4px' : '16px',
                backgroundColor: isMe ? 'var(--color-primary)' : 'var(--color-surface)',
                color: isMe ? 'white' : 'var(--color-text-main)',
                border: isMe ? 'none' : '1px solid var(--color-border)',
                wordBreak: 'break-word'
              }}>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{msg.content}</p>
                <div style={{ fontSize: '0.65rem', textAlign: 'right', marginTop: '4px', opacity: 0.7 }}>
                  {new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area" style={{ position: 'fixed', bottom: '80px', left: 0, right: 0, padding: '10px', backgroundColor: 'var(--color-bg)', borderTop: '1px solid var(--color-border)', maxWidth: '480px', margin: '0 auto' }}>
        <div className="flex gap-sm">
          <input 
            className="input" 
            placeholder="พิมพ์ข้อความ..." 
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            style={{ padding: '12px' }}
          />
          <button 
            className="btn btn-primary" 
            style={{ padding: '0 20px', borderRadius: 'var(--radius-lg)' }}
            onClick={handleSend}
            disabled={!message.trim()}
          >
            ส่ง
          </button>
        </div>
      </div>
    </div>
  );
}
