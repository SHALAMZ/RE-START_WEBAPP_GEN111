import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDb, type ReactionType, createComment, deletePost, deleteComment } from '../lib/store';
import { ChevronLeft, MoreHorizontal, Trash2, AlertTriangle, CornerDownRight } from 'lucide-react';
import ReactionPicker from '../components/ReactionPicker';

interface CommentItemProps {
  comment: ReturnType<typeof useDb>['comments'][0];
  replies: ReturnType<typeof useDb>['comments'];
  db: ReturnType<typeof useDb>;
  onReply: (commentId: string, authorName: string) => void;
  onNavigate: (userId: string) => void;
  onDelete: (commentId: string) => void;
}

function CommentItem({ comment: c, replies, db, onReply, onNavigate, onDelete }: CommentItemProps) {
  return (
    <div>
      {/* Main comment */}
      <div className="comment-row">
        <div
          className="avatar-bubble"
          style={{ cursor: 'pointer', marginTop: '2px', flexShrink: 0 }}
          onClick={() => onNavigate(c.authorId)}
        >
          {c.authorAvatar
            ? <img src={c.authorAvatar} alt={c.authorName} />
            : <span style={{ fontSize: '1rem' }}>👤</span>
          }
        </div>
        <div style={{ flex: 1 }}>
          <div className="comment-bubble">
            <span className="comment-author" onClick={() => onNavigate(c.authorId)}>
              {c.authorName}
            </span>
            <span style={{ whiteSpace: 'pre-wrap' }}>{c.content}</span>
          </div>
          <div className="flex items-center gap-sm" style={{ paddingLeft: '10px', marginTop: '4px' }}>
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>
              {new Date(c.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}
              onClick={() => onReply(c.id, c.authorName)}
            >
              <CornerDownRight size={12} /> ตอบกลับ
            </button>
            {c.authorId === db.myIdentityId && (
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} onClick={() => onDelete(c.id)}>
                <Trash2 size={11} color="var(--color-danger)" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies indented */}
      {replies.length > 0 && (
        <div style={{ marginLeft: '44px', borderLeft: '2px solid rgba(134,167,137,0.2)', paddingLeft: '12px', marginBottom: '6px' }}>
          {replies.map(reply => (
            <div key={reply.id} className="comment-row" style={{ marginBottom: '4px' }}>
              <div
                className="avatar-bubble avatar-bubble-sm"
                style={{ cursor: 'pointer', marginTop: '2px', flexShrink: 0 }}
                onClick={() => onNavigate(reply.authorId)}
              >
                {reply.authorAvatar
                  ? <img src={reply.authorAvatar} alt={reply.authorName} />
                  : <span style={{ fontSize: '0.7rem' }}>👤</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div className="comment-bubble" style={{ fontSize: '0.82rem' }}>
                  <span className="comment-author" style={{ color: 'var(--color-primary)' }} onClick={() => onNavigate(reply.authorId)}>
                    {reply.authorName}
                  </span>
                  <span style={{ whiteSpace: 'pre-wrap' }}>{reply.content}</span>
                </div>
                <div className="flex items-center gap-sm" style={{ paddingLeft: '10px', marginTop: '2px' }}>
                  <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                    {new Date(reply.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {reply.authorId === db.myIdentityId && (
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px' }} onClick={() => onDelete(reply.id)}>
                      <Trash2 size={10} color="var(--color-danger)" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const db = useDb();
  
  const [commentText, setCommentText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const post = db.posts.find(p => p.id === postId);
  
  if (!post) {
    return (
      <div className="animate-fade-in text-center mt-xl">
        <h3>ไม่พบโพสต์นี้</h3>
        <p className="text-muted mb-md">โพสต์อาจถูกลบไปแล้ว หรือรอบ 48 ชั่วโมงได้จบลงแล้ว</p>
        <button className="btn btn-outline" onClick={() => navigate('/')}>กลับไปหน้าแรก</button>
      </div>
    );
  }

  // Only top-level comments (no parent)
  const topLevelComments = db.comments.filter(c => c.postId === postId && !c.parentCommentId);
  const getReplies = (commentId: string) => db.comments.filter(c => c.postId === postId && c.parentCommentId === commentId);

  const reactionCounts: Record<ReactionType, number> = { '❤️': 0, '🌱': 0, '✨': 0, '🤍': 0 };
  db.reactions.filter(r => r.postId === postId).forEach(r => { reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1; });
  const myReaction = db.reactions.find(r => r.postId === postId && r.authorId === db.myIdentityId)?.type ?? null;
  const totalComments = db.comments.filter(c => c.postId === postId).length;

  const submitComment = () => {
    if (commentText.trim()) {
      createComment(postId!, commentText.trim(), replyTo?.id ?? null);
      setCommentText('');
      setReplyTo(null);
    }
  };

  const handleDeletePost = () => {
    if (window.confirm('คุณต้องการลบโพสต์นี้ใช่หรือไม่?')) {
      deletePost(post.id);
      navigate('/');
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('ลบความคิดเห็นนี้ใช่ไหม?')) {
      deleteComment(commentId);
    }
  };

  const handleAuthorClick = (userId: string) => {
    navigate(userId === db.myIdentityId ? '/me' : `/user/${userId}`);
  };

  const isMyPost = post.authorId === db.myIdentityId;

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: '100%' }}>
      {/* Header */}
      <header className="flex justify-between items-center mb-md">
        <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => navigate('/')}>
          <ChevronLeft size={24} /> กลับ
        </button>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => setShowOptions(!showOptions)}>
            <MoreHorizontal size={24} />
          </button>
          {showOptions && (
            <div className="card" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 10, minWidth: '150px', padding: '8px' }}>
              {isMyPost ? (
                <button className="btn btn-ghost flex items-center gap-sm" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-danger)' }} onClick={handleDeletePost}>
                  <Trash2 size={16} /> ลบโพสต์
                </button>
              ) : (
                <button className="btn btn-ghost flex items-center gap-sm" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => { alert('รายงานโพสต์แล้ว'); setShowOptions(false); }}>
                  <AlertTriangle size={16} /> รายงาน
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Post Card */}
      <div className="card mb-md post-card">
        <div className="flex items-center gap-sm mb-md" style={{ cursor: 'pointer' }} onClick={() => handleAuthorClick(post.authorId)}>
          <div className="avatar-bubble">
            {post.authorAvatar ? <img src={post.authorAvatar} alt={post.authorName} /> : <span style={{ fontSize: '1.1rem' }}>👤</span>}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{post.authorName}</div>
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
              {new Date(post.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <p style={{ marginBottom: '20px', fontSize: '1.05rem', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{post.content}</p>

        <div>
          <ReactionPicker postId={post.id} myReaction={myReaction} reactionCounts={reactionCounts} />
          {Object.entries(reactionCounts).some(([, c]) => c > 0) && (
            <div className="flex flex-wrap gap-sm mt-md">
              {(Object.entries(reactionCounts) as [ReactionType, number][]).filter(([, c]) => c > 0).map(([type, count]) => (
                <span key={type} style={{ background: 'var(--color-bg)', borderRadius: '999px', padding: '4px 10px', fontSize: '0.82rem', border: '1px solid rgba(0,0,0,0.07)' }}>
                  {type} {count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: '100px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>ความคิดเห็น ({totalComments})</h3>
        
        {topLevelComments.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--spacing-lg) 0' }}>
            <p>ยังไม่มีความคิดเห็น<br/>เป็นคนแรกที่ตอบกลับได้เลย</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {topLevelComments.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                replies={getReplies(c.id)}
                db={db}
                onReply={(id, name) => { setReplyTo({ id, name }); }}
                onNavigate={handleAuthorClick}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div style={{
        position: 'fixed',
        bottom: '64px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        background: 'var(--color-bg)',
        padding: '8px 16px',
        borderTop: replyTo ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
        zIndex: 90,
      }}>
        {replyTo && (
          <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 500 }}>
              ↩ ตอบกลับ {replyTo.name}
            </span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.78rem' }} onClick={() => setReplyTo(null)}>
              ยกเลิก ✕
            </button>
          </div>
        )}
        <div className="flex items-center gap-sm">
          <div className="avatar-bubble" style={{ flexShrink: 0, width: '30px', height: '30px' }}>
            {db.myIdentityAvatar ? <img src={db.myIdentityAvatar} alt="me" /> : <span style={{ fontSize: '0.9rem' }}>👤</span>}
          </div>
          <input
            className="input"
            style={{ borderRadius: '999px', padding: '8px 16px', fontSize: '0.9rem' }}
            placeholder={replyTo ? `ตอบกลับ ${replyTo.name}...` : 'เขียนความคิดเห็น...'}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitComment()}
            autoFocus={!!replyTo}
          />
          <button
            className="btn btn-primary"
            style={{ padding: '8px 14px', borderRadius: '999px', fontSize: '0.9rem', flexShrink: 0 }}
            onClick={submitComment}
            disabled={!commentText.trim()}
          >
            ส่ง
          </button>
        </div>
      </div>
    </div>
  );
}
