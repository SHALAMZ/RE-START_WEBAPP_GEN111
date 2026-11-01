import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, useDb } from '../lib/store';

export default function CreatePostPage() {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const db = useDb();

  const handleSubmit = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await createPost(content.trim());
      await db.refresh();
      navigate('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึกโพสต์ไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: '100%' }}>
      <header className="mb-md">
        <h2>วันนี้อยากเล่าอะไรไหม?</h2>
      </header>

      <textarea
        className="textarea mb-md"
        style={{ flex: 1, minHeight: '200px' }}
        placeholder="เขียนสิ่งที่อยู่ในใจได้เลย ไม่ต้องบอกว่าเป็นใคร..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={2000}
        autoFocus
      />

      {error && <p className="text-muted mb-md" role="alert" style={{ color: 'var(--color-danger)' }}>{error}</p>}

      <div className="flex gap-sm">
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate(-1)}>
          ยกเลิก
        </button>
        <button 
          className="btn btn-primary" 
          style={{ flex: 2 }} 
          onClick={handleSubmit}
          disabled={!content.trim() || saving}
        >
          {saving ? 'กำลังบันทึก...' : 'โพสต์แบบไม่ระบุตัวตน'}
        </button>
      </div>
    </div>
  );
}
