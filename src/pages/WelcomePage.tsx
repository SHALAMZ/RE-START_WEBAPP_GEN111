import { useState } from 'react';
import { setMyIdentity, useDb } from '../lib/store';
import { Sparkles, AlertTriangle } from 'lucide-react';

import logoText from '../assets/logo-text.png';
import logoIcon from '../assets/logo-icon.png';

import { AVATARS, getAvatarKey } from '../lib/avatars';

export default function WelcomePage() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const db = useDb();

  const handleSubmit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await setMyIdentity(name.trim(), getAvatarKey(avatar));
      await db.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึกตัวตนไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col justify-center items-center" style={{ minHeight: '100vh', padding: 'var(--spacing-lg)' }}>
      <div className="text-center mb-xl flex flex-col items-center">
        <img src={logoIcon} alt="RE:START Icon" style={{ width: '80px', height: '80px', marginBottom: '4px' }} />
        <img src={logoText} alt="RE:START" style={{ height: '48px', marginBottom: '12px' }} />
        <p className="text-muted">พื้นที่เล็ก ๆ ที่ให้เราได้เล่า<br/>โดยไม่ต้องบอกว่าเราเป็นใคร</p>
      </div>

      <div className="card w-full" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', textAlign: 'center' }}>สร้างตัวตนชั่วคราวของคุณ</h2>
        
        <div className="mb-md">
          <label className="text-muted" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>เลือกรูปโปรไฟล์</label>
          <div className="flex flex-wrap gap-sm justify-center" style={{ maxHeight: '150px', overflowY: 'auto', padding: '4px' }}>
            {AVATARS.map((a, i) => (
              <button 
                key={i}
                className={`btn ${avatar === a ? 'btn-primary' : 'btn-outline'}`}
                style={{ width: '56px', height: '56px', padding: '8px', borderRadius: '12px' }}
                onClick={() => setAvatar(a)}
              >
                <img src={a} alt={`Avatar ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-lg">
          <label className="text-muted" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>ตั้งชื่อนามแฝง</label>
          <input 
            className="input" 
            placeholder="เช่น หมีน้อย, คนเหงา2024..." 
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
          />
          <p className="text-muted mt-xs" style={{ fontSize: '0.75rem' }}>*กรุณาไม่ใช้ชื่อจริงหรือข้อมูลส่วนตัว</p>
        </div>

        <div className="card text-danger flex gap-sm items-start mb-lg" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-danger)' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.85rem', margin: 0 }}>
            <strong>ตัวตนนี้มีอายุ 48 ชั่วโมง</strong><br/>
            ทุกอย่างที่คุณกำลังสร้าง ทั้งชื่อ โพสต์ และข้อความ จะหายไปและเริ่มต้นใหม่ทั้งหมดเมื่อครบกำหนด
          </p>
        </div>

        {error && <p className="text-muted mb-md" role="alert" style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <button 
          className="btn btn-primary flex items-center justify-center gap-sm" 
          style={{ width: '100%' }}
          onClick={handleSubmit}
          disabled={!name.trim() || saving}
        >
          <Sparkles size={18} /> {saving ? 'กำลังบันทึก...' : 'เข้าสู่พื้นที่ปลอดภัย'}
        </button>
      </div>
    </div>
  );
}
