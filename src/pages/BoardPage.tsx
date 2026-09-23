import { useNavigate } from 'react-router-dom';
import { useDb } from '../lib/store';
import { useCycleTimer, formatTimeLeft } from '../lib/cycleManager';
import { MessageCircle } from 'lucide-react';
import ReactionPicker from '../components/ReactionPicker';
import { type ReactionType } from '../lib/store';

import logoText from '../assets/logo-text.png';
import logoIcon from '../assets/logo-icon.png';

export default function BoardPage() {
  const navigate = useNavigate();
  const db = useDb();
  const { timeLeft } = useCycleTimer();

  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (userId !== db.myIdentityId) {
      navigate(`/user/${userId}`);
    } else {
      navigate('/me');
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="text-center mb-lg flex flex-col items-center">
        <div className="flex items-center justify-center mb-xs" style={{ marginLeft: '-15px' }}>
          <img src={logoIcon} alt="Icon" style={{ width: '44px', height: '44px', position: 'relative', zIndex: 1 }} />
          <img src={logoText} alt="RE:START" style={{ height: '28px', marginLeft: '-24px' }} />
        </div>
        <h2 style={{ fontSize: '1.2rem', marginTop: '4px' }}>วันนี้ไฟเป็นยังไง?</h2>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          พื้นที่เล็ก ๆ ที่ให้เราได้เล่า โดยไม่ต้องบอกว่าเราเป็นใคร
        </p>
      </header>

      {/* Timer Card */}
      <div className="card mb-md" style={{ 
        background: 'linear-gradient(135deg, #e4efe0 0%, #f4f5eb 100%)',
        position: 'relative',
        overflow: 'hidden',
        color: '#3d523e',
        padding: '12px 16px',
        border: 'none',
        textAlign: 'left'
      }}>
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.4)', filter: 'blur(15px)', pointerEvents: 'none'
        }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, margin: 0 }}>กระดานจะเริ่มใหม่ใน</p>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '2px 0', letterSpacing: '0.5px' }}>{formatTimeLeft(timeLeft)}</h3>
          <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: 0 }}>
            โพสต์และข้อความจะอยู่ร่วมกันจนกว่าจะเริ่มรอบใหม่
          </p>
        </div>
      </div>

      {/* Create Post Button */}
      <button 
        className="btn btn-outline mb-md" 
        style={{ width: '100%', borderStyle: 'dashed' }}
        onClick={() => navigate('/create')}
      >
        + เขียนโพสต์
      </button>

      {/* Posts */}
      <div className="flex flex-col" style={{ gap: '12px' }}>
        {db.posts.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🌱</p>
            <h3 style={{ marginBottom: '8px' }}>ยังไม่มีโพสต์</h3>
            <p>พื้นที่นี้ยังว่างอยู่<br/>อยากเป็นคนแรกที่เล่าไหม?</p>
          </div>
        ) : (
          db.posts.map(post => {
            const postComments = db.comments.filter(c => c.postId === post.id);
            const reactionCounts: Record<ReactionType, number> = { '❤️': 0, '🌱': 0, '✨': 0, '🤍': 0 };
            db.reactions.filter(r => r.postId === post.id).forEach(r => { reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1; });
            const myReaction = db.reactions.find(r => r.postId === post.id && r.authorId === db.myIdentityId)?.type ?? null;

            return (
              <div
                key={post.id}
                className="card post-card"
                onClick={() => handlePostClick(post.id)}
                style={{ cursor: 'pointer', marginBottom: 0 }}
              >
                {/* Author Row */}
                <div className="flex items-center gap-sm mb-sm">
                  <div
                    className="avatar-bubble"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => handleUserClick(e, post.authorId)}
                  >
                    {post.authorAvatar
                      ? <img src={post.authorAvatar} alt={post.authorName} />
                      : <span style={{ fontSize: '1.1rem' }}>👤</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <span
                      className="font-bold"
                      style={{ cursor: 'pointer', fontSize: '0.95rem' }}
                      onClick={(e) => handleUserClick(e, post.authorId)}
                    >
                      {post.authorName}
                    </span>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {new Date(post.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p style={{ marginBottom: '12px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{post.content}</p>

                {/* Reaction + Comment count */}
                <div className="flex items-center justify-between" style={{ marginBottom: postComments.length > 0 ? '10px' : 0 }}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ReactionPicker postId={post.id} myReaction={myReaction} reactionCounts={reactionCounts} />
                  </div>
                  <button
                    className="flex items-center gap-xs"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}
                    onClick={(e) => { e.stopPropagation(); handlePostClick(post.id); }}
                  >
                    <MessageCircle size={16} />
                    {postComments.length > 0 && <span>{postComments.length}</span>}
                  </button>
                </div>

                {/* Comments */}
                {postComments.length > 0 && (
                  <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    {postComments.slice(0, 2).map(comment => (
                      <div key={comment.id} className="comment-row">
                        <div
                          className="avatar-bubble avatar-bubble-sm"
                          style={{ cursor: 'pointer', marginTop: '2px' }}
                          onClick={(e) => { e.stopPropagation(); handleUserClick(e, comment.authorId); }}
                        >
                          {comment.authorAvatar
                            ? <img src={comment.authorAvatar} alt={comment.authorName} />
                            : <span style={{ fontSize: '0.8rem' }}>👤</span>
                          }
                        </div>
                        <div className="comment-bubble">
                          <span
                            className="comment-author"
                            onClick={(e) => { e.stopPropagation(); handleUserClick(e, comment.authorId); }}
                          >
                            {comment.authorName}
                          </span>
                          {comment.content}
                        </div>
                      </div>
                    ))}
                    {postComments.length > 2 && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-primary)', paddingLeft: '34px', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); handlePostClick(post.id); }}>
                        ดูทั้งหมด {postComments.length} ความคิดเห็น →
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
