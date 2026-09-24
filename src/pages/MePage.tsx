import { useNavigate } from 'react-router-dom';
import { useDb, resetDb, resetIdentityOnly } from '../lib/store';
import { useCycleTimer, formatTimeLeft, forceExpireCycle } from '../lib/cycleManager';
import { RefreshCw, UserMinus, Clock } from 'lucide-react';

export default function MePage() {
  const db = useDb();
  const { timeLeft } = useCycleTimer();
  const navigate = useNavigate();

  const myPosts = db.posts.filter(p => p.authorId === db.myIdentityId);
  const myComments = db.comments.filter(c => c.authorId === db.myIdentityId);

  const handleResetIdentity = () => {
    if (window.confirm('คุณต้องการเปลี่ยนตัวตนใหม่ใช่หรือไม่? ระบบจะพาไปหน้าสร้างโปรไฟล์ทันที')) {
      resetIdentityOnly();
      navigate('/');
    }
  };

  const handleForceExpire = () => {
    if (window.confirm('ต้องการจำลองหมดเวลา 48 ชม. ใช่หรือไม่? ข้อมูลกระดานและตัวตนจะถูกรีเซ็ตใหม่ทั้งหมด')) {
      forceExpireCycle();
      navigate('/');
    }
  };

  const handleResetAll = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดและสร้างโปรไฟล์ใหม่ใช่หรือไม่?')) {
      resetDb();
      navigate('/');
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="mb-lg text-center">
        <h2>Me</h2>
      </header>

      <div className="card text-center mb-lg flex flex-col items-center post-card">
        <div className="avatar-bubble mb-sm" style={{ width: '88px', height: '88px', border: '3px solid rgba(134,167,137,0.3)', boxShadow: '0 4px 12px rgba(134,167,137,0.15)' }}>
          {db.myIdentityAvatar ? (
            <img src={db.myIdentityAvatar} alt="Avatar" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '2.5rem' }}>👤</span>
          )}
        </div>
        <h3 style={{ fontSize: '1.25rem', marginTop: '4px', marginBottom: '2px' }}>{db.myIdentityName}</h3>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
          ตัวตนนี้จะถูกรีเซ็ตในอีก {formatTimeLeft(timeLeft)}
        </p>

        <div className="flex gap-sm mt-md">
          <button 
            className="btn btn-outline flex items-center gap-xs" 
            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            onClick={handleResetIdentity}
          >
            <UserMinus size={14} /> สร้างตัวตนใหม่
          </button>
        </div>
      </div>

      <h3 className="mb-md" style={{ fontSize: '1.1rem' }}>กิจกรรมในรอบนี้</h3>
      
      {myPosts.length === 0 && myComments.length === 0 ? (
        <div className="empty-state card">
          <p>คุณยังไม่มีโพสต์หรือความคิดเห็นในรอบนี้</p>
        </div>
      ) : (
        <div className="flex flex-col gap-sm mb-lg">
          <div className="card flex justify-between items-center" style={{ marginBottom: 0 }}>
            <span>โพสต์ที่สร้าง</span>
            <strong>{myPosts.length}</strong>
          </div>
          <div className="card flex justify-between items-center" style={{ marginBottom: 0 }}>
            <span>ความคิดเห็น</span>
            <strong>{myComments.length}</strong>
          </div>
        </div>
      )}

      <div className="card mt-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '8px' }}>พื้นที่นี้ปลอดภัยสำหรับทุกคน</h3>
        <ul className="text-muted" style={{ fontSize: '0.85rem', paddingLeft: '20px', marginBottom: '16px' }}>
          <li>เคารพความรู้สึกของผู้อื่น</li>
          <li>ไม่เปิดเผยข้อมูลส่วนตัว</li>
          <li>ไม่ตัดสินหรือล้อเลียน</li>
          <li>ไม่คุกคามหรือทำร้ายผู้อื่น</li>
        </ul>
        <p className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
          RE:START เป็นพื้นที่สำหรับการรับฟังและให้กำลังใจกัน ไม่ใช่บริการทดแทนผู้เชี่ยวชาญด้านสุขภาพจิต
        </p>
      </div>
      
      {/* Simulation / Reset Tools */}
      <div className="mt-xl text-center flex flex-col items-center gap-sm">
        <button 
          className="btn btn-ghost flex items-center gap-xs" 
          style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }} 
          onClick={handleForceExpire}
        >
          <Clock size={14} /> [ทดสอบ] จำลองหมดเวลา 48 ชม. (เริ่มรอบใหม่)
        </button>
        <button 
          className="btn btn-ghost flex items-center gap-xs" 
          style={{ fontSize: '0.75rem', opacity: 0.6 }} 
          onClick={handleResetAll}
        >
          <RefreshCw size={12} /> รีเซ็ตข้อมูลทั้งหมด
        </button>
      </div>
    </div>
  );
}
