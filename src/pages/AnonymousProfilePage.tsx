import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDb, getOrCreateChat } from '../lib/store';
import { ChevronLeft, MessageCircle, AlertTriangle } from 'lucide-react';
import { getAvatarForKey } from '../lib/avatars';
import { getPublicProfile, type Profile } from '../services/profileService';
import { promptForReportDetails } from '../lib/reportPrompt';

export default function AnonymousProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const db = useDb();
  const [profileState, setProfileState] = useState<{
    profileId: string | undefined;
    profile: Profile | null;
    loading: boolean;
    error: string | null;
  }>({ profileId: undefined, profile: null, loading: true, error: null });
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const profileStateMatchesRoute = profileState.profileId === userId;
  const profile = profileStateMatchesRoute ? profileState.profile : null;
  const loadingProfile = !!userId && (!profileStateMatchesRoute || profileState.loading);
  const error = profileStateMatchesRoute ? profileState.error : null;

  useEffect(() => {
    let active = true;
    if (!userId) {
      return;
    }
    void getPublicProfile(userId)
      .then((result) => {
        if (active) setProfileState({ profileId: userId, profile: result, loading: false, error: null });
      })
      .catch((cause: unknown) => {
        if (active) {
          setProfileState({
            profileId: userId,
            profile: null,
            loading: false,
            error: cause instanceof Error ? cause.message : 'โหลดโปรไฟล์ไม่สำเร็จ',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [userId]);

  if (userId === db.myIdentityId) {
    navigate('/me');
    return null;
  }

  // Infer user info from posts or comments
  const userPost = db.posts.find(p => p.authorId === userId);
  const userComment = db.comments.find(c => c.authorId === userId);
  const userName = profile?.nickname || userPost?.authorName || userComment?.authorName || 'ผู้ใช้ไม่ทราบชื่อ';
  const userAvatar = profile
    ? getAvatarForKey(profile.avatarKey)
    : userPost?.authorAvatar || userComment?.authorAvatar || null;

  const userPosts = db.posts.filter(p => p.authorId === userId);
  const userCommentsCount = db.comments.filter(c => c.authorId === userId).length;

  const handleStartChat = async () => {
    if (!userId) return;
    try {
      const chatId = await getOrCreateChat(userId);
      await db.refresh();
      navigate(`/chat/${chatId}`);
    } catch (cause) {
      setProfileState((current) => ({
        ...current,
        error: cause instanceof Error ? cause.message : 'เริ่มการสนทนาไม่สำเร็จ',
      }));
    }
  };

  const handleReportProfile = async () => {
    if (!userId) return;
    setReportSubmitted(false);
    try {
      const details = promptForReportDetails();
      if (!details) return;
      await db.report('profile', userId, details.category, details.reason);
      setReportSubmitted(true);
    } catch (cause) {
      setProfileState((current) => ({
        ...current,
        error: cause instanceof Error ? cause.message : 'ส่งรายงานไม่สำเร็จ',
      }));
    }
  };

  if (loadingProfile) return <div className="empty-state">กำลังโหลดโปรไฟล์...</div>;
  if (!profile && !userPost && !userComment) {
    return (
      <div className="empty-state">
        <h3>ไม่พบโปรไฟล์นี้</h3>
        <p className="text-muted mb-md">{error || 'โปรไฟล์อาจหมดอายุหรือถูกลบไปแล้ว'}</p>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>กลับ</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-md">
        <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} /> กลับ
        </button>
      </header>

      {/* Profile Hero */}
      <div className="card text-center mb-md post-card" style={{ padding: '28px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #e4efe0, #d0e0c0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            border: '3px solid rgba(134,167,137,0.3)',
            boxShadow: '0 4px 12px rgba(134,167,137,0.2)',
          }}>
            {userAvatar
              ? <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
              : <span style={{ fontSize: '2.5rem' }}>👤</span>
            }
          </div>
        </div>

        <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{userName}</h3>
        <p className="text-muted" style={{ fontSize: '0.82rem' }}>
          ตัวตนชั่วคราวสำหรับรอบ 48 ชั่วโมงนี้
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-md mt-md" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '14px' }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>{userPosts.length}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>โพสต์</div>
          </div>
          <div style={{ width: '1px', background: 'var(--color-border)' }}></div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>{userCommentsCount}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>ความคิดเห็น</div>
          </div>
        </div>
      </div>

      {/* Send Encouragement CTA */}
      <div className="card mb-md" style={{
        background: 'linear-gradient(135deg, #e4efe0 0%, #f4f5eb 100%)',
        border: 'none',
        textAlign: 'center',
        padding: '20px',
      }}>
        <p style={{ color: '#3d523e', fontSize: '0.9rem', marginBottom: '12px' }}>
          🤍 อยากส่งกำลังใจให้ {userName} ไหม?
        </p>
        <button
          className="btn btn-primary flex items-center justify-center gap-sm"
          style={{ width: '100%', borderRadius: '12px' }}
          onClick={handleStartChat}
        >
          <MessageCircle size={18} /> ส่งข้อความให้กำลังใจ
        </button>
        <button
          className="btn btn-ghost flex items-center justify-center gap-sm mt-sm"
          style={{ width: '100%', fontSize: '0.85rem' }}
          onClick={handleReportProfile}
        >
          <AlertTriangle size={16} /> รายงานโปรไฟล์
        </button>
        {error && <p className="text-muted mt-md" role="alert" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      </div>
      {reportSubmitted && <p className="text-muted mb-md" role="status">บันทึกรายงานแล้ว ขอบคุณที่ช่วยดูแลชุมชน</p>}

      {/* Recent Posts */}
      {userPosts.length > 0 && (
        <div>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>โพสต์ล่าสุด</h3>
          {userPosts.slice(0, 3).map(post => (
            <div
              key={post.id}
              className="card post-card"
              style={{ cursor: 'pointer', marginBottom: '10px' }}
              onClick={() => navigate(`/post/${post.id}`)}
            >
              <p style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', color: 'var(--color-text-main)', lineHeight: 1.6 }}>
                {post.content.length > 100 ? post.content.slice(0, 100) + '...' : post.content}
              </p>
              <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '8px' }}>
                {new Date(post.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
