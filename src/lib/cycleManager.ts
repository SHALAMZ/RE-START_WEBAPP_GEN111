import { useEffect, useRef, useState } from 'react';
import { useDb } from './store';

export const CYCLE_HOURS = 48;
export const CYCLE_MS = CYCLE_HOURS * 60 * 60 * 1000;

export const useCycleTimer = () => {
  const { cycleId, cycleExpiresAt, serverTimeOffsetMs, refresh } = useDb();
  const [now, setNow] = useState(() => Date.now());
  const [hasReset, setHasReset] = useState(false);
  const previousCycleId = useRef<string | null>(null);
  const refreshingAtExpiry = useRef(false);
  const timeLeft = cycleExpiresAt
    ? Math.max(0, cycleExpiresAt - (now + serverTimeOffsetMs))
    : 0;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeLeft > 0 || !cycleExpiresAt || refreshingAtExpiry.current) return;
    refreshingAtExpiry.current = true;
    void refresh().finally(() => {
      refreshingAtExpiry.current = false;
    });
  }, [cycleExpiresAt, refresh, timeLeft]);

  useEffect(() => {
    if (previousCycleId.current && cycleId && previousCycleId.current !== cycleId) {
      setHasReset(true);
      const timeout = window.setTimeout(() => setHasReset(false), 5000);
      previousCycleId.current = cycleId;
      return () => window.clearTimeout(timeout);
    }
    previousCycleId.current = cycleId;
  }, [cycleId]);

  return { timeLeft, hasReset };
};

export const formatTimeLeft = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
