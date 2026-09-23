import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../lib/store';

export default function CreatePostPage() {
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (content.trim()) {
      createPost(content.trim());
      navigate('/');
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
        autoFocus
      />

      <div className="flex gap-sm">
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate(-1)}>
          ยกเลิก
        </button>
        <button 
          className="btn btn-primary" 
          style={{ flex: 2 }} 
          onClick={handleSubmit}
          disabled={!content.trim()}
        >
          โพสต์แบบไม่ระบุตัวตน
        </button>
      </div>
    </div>
  );
}
