import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { useCycleTimer } from './lib/cycleManager';
import { DbProvider, useDb } from './lib/store';
import { AuthProvider } from './lib/AuthContext';
import { useAuth } from './lib/authState';

import WelcomePage from './pages/WelcomePage';
import BoardPage from './pages/BoardPage';
import CreatePostPage from './pages/CreatePostPage';
import PostDetailPage from './pages/PostDetailPage';
import AnonymousProfilePage from './pages/AnonymousProfilePage';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import MePage from './pages/MePage';

const AppLayout = () => {
  const { hasReset } = useCycleTimer();
  const db = useDb();
  const auth = useAuth();
  const handleRetry = () => {
    if (auth.error) auth.retry();
    else void db.refresh(true);
  };

  if (auth.error || db.error) {
    return (
      <div className="app-container">
        <div className="main-content text-center">
          <h2>ไม่สามารถเชื่อมต่อได้</h2>
          <p className="text-muted mb-md">{auth.error || db.error}</p>
          <button className="btn btn-primary" onClick={handleRetry}>ลองอีกครั้ง</button>
        </div>
      </div>
    );
  }

  if (auth.loading || db.loading) {
    return <div className="app-container"><div className="main-content text-center">กำลังเชื่อมต่อพื้นที่ RE:START...</div></div>;
  }

  if (!db.myIdentityId) {
    return <WelcomePage />;
  }

  return (
    <div className="app-container">
      {hasReset && (
        <div style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
          เริ่มต้นใหม่แล้ว 🌱 สิ่งที่เกิดขึ้นในรอบที่แล้วจะไม่ตามมาที่รอบใหม่
        </div>
      )}
      <div className="main-content">
        {db.realtimeError && (
          <p className="text-muted mb-md" role="status" style={{ color: 'var(--color-danger)' }}>
            การเชื่อมต่อสดขัดข้อง อาจได้รับข้อมูลล่าช้า: {db.realtimeError}
          </p>
        )}
        <Routes>
          <Route path="/" element={<BoardPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/post/:postId" element={<PostDetailPage />} />
          <Route path="/user/:userId" element={<AnonymousProfilePage />} />
          <Route path="/chats" element={<ChatListPage />} />
          <Route path="/chat/:chatId" element={<ChatRoomPage />} />
          <Route path="/me" element={<MePage />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <DbProvider>
          <AppLayout />
        </DbProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
