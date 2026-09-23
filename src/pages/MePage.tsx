import { useNavigate } from 'react-router-dom';
import { useDb } from '../lib/store';
import { useCycleTimer, formatTimeLeft } from '../lib/cycleManager';

export default function MePage() {
  const db = useDb();
  const { timeLeft } = useCycleTimer();
  const navigate = useNavigate();

  const myPosts = db.posts.filter(p => p.authorId === db.myIdentityId);
  const myComments = db.comments.filter(c => c.authorId === db.myIdentityId);

  return (
    <div className="animate-fade-in">
      <header className="mb-lg text-center">
        <h2>Me</h2>
      </header>

      <div className="card text-center mb-lg flex flex-col items-center">
        <div style={{ width: '80px', height: '80px', marginBottom: '12px' }}>
          {db.myIdentityAvatar ? (
            <img src={db.myIdentityAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '3rem' }}>👤</span>
          )}
        </div>
        <h3>{db.myIdentityName}</h3>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
          ตัวตนนี้จะถูกรีเซ็ตในอีก {formatTimeLeft(timeLeft)}
        </p>
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
      
      {/* Dev Tool to help testing flow without waiting 48h */}
      <div className="mt-xl text-center">
         <button className="btn btn-ghost" style={{ fontSize: '0.75rem', opacity: 0.5 }} onClick={() => {
           localStorage.removeItem('restart_db_v1');
           window.location.reload();
         }}>
           [Dev] บังคับรีเซ็ตระบบ
         </button>
      </div>
    </div>
  );
}
