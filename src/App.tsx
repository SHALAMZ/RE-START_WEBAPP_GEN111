import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { useCycleTimer } from './lib/cycleManager';
import { useDb } from './lib/store';

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
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
