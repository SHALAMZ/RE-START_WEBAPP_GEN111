import { useState, useRef, useCallback } from 'react';
import { type ReactionType, toggleReaction, useDb } from '../lib/store';

interface ReactionOption {
  type: ReactionType;
  label: string;
}

const REACTIONS: ReactionOption[] = [
  { type: '❤️', label: 'ให้กำลังใจ' },
  { type: '🌱', label: 'เติบโตนะ' },
  { type: '✨', label: 'เข้าใจเลย' },
  { type: '🤍', label: 'อยู่เคียงข้าง' },
];

interface ReactionPickerProps {
  postId: string;
  myReactions: ReactionType[];
  reactionCounts: Record<ReactionType, number>;
}

export default function ReactionPicker({ postId, myReactions, reactionCounts }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const db = useDb();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalCount = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  // Long-press handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    longPressTimer.current = setTimeout(() => {
      setOpen(true);
    }, 400);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  // Hover for desktop
  const handleMouseEnter = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 300);
  }, []);

  const handlePickerMouseEnter = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const handlePickerMouseLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 300);
  }, []);

  const applyReaction = async (type: ReactionType) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await toggleReaction(postId, type);
      await db.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึกปฏิกิริยาไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleReactionClick = (e: React.MouseEvent | React.TouchEvent, type: ReactionType) => {
    e.stopPropagation();
    setOpen(false);
    void applyReaction(type);
  };

  const handleMainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // On desktop, single click toggles heart; on mobile, single tap closes menu if open
    if (!open) {
      // Quick tap = toggle the previously selected or default ❤️
      const current = myReactions[0] || '❤️';
      void applyReaction(current);
    } else {
      setOpen(false);
    }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', userSelect: 'none' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Reaction Picker Popup */}
      {open && (
        <div
          className="reaction-picker-popup"
          onMouseEnter={handlePickerMouseEnter}
          onMouseLeave={handlePickerMouseLeave}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '0',
            display: 'flex',
            gap: '8px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '999px',
            padding: '8px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 50,
            animation: 'popupIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            whiteSpace: 'nowrap',
          }}
        >
          {REACTIONS.map(({ type, label }) => (
            <div
              key={type}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredReaction(type)}
              onMouseLeave={() => setHoveredReaction(null)}
              onClick={(e) => handleReactionClick(e, type)}
              onTouchEnd={(e) => handleReactionClick(e, type)}
            >
              <span
                style={{
                  fontSize: hoveredReaction === type ? '2rem' : '1.5rem',
                  transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: hoveredReaction === type ? 'translateY(-4px)' : 'none',
                  display: 'block',
                  filter: myReactions.includes(type) ? 'drop-shadow(0 0 4px rgba(100,200,100,0.8))' : 'none',
                }}
              >
                {type}
              </span>
              {hoveredReaction === type && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  background: 'rgba(100,190,100,0.1)',
                  borderRadius: '999px',
                  padding: '2px 6px',
                  whiteSpace: 'nowrap',
                  animation: 'fadeIn 0.15s ease',
                }}>
                  {label}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main Reaction Button */}
      <button
        onClick={handleMainClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={saving}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 8px 4px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '1.1rem',
          color: myReactions.length > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
          transition: 'transform 0.1s',
        }}
      >
        <span style={{ transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: myReactions.length > 0 ? 'scale(1.15)' : 'scale(1)' }}>
          {myReactions[0] || '🤍'}
        </span>
        {totalCount > 0 && (
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{totalCount}</span>
        )}
      </button>
      {error && <span role="alert" className="text-muted" style={{ fontSize: '0.7rem', color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  );
}
