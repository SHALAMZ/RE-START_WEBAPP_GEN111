import { useEffect, useState } from 'react';
import { getDb, resetDb, initCycleIfNeeded } from './store';

export const CYCLE_HOURS = 48;
export const CYCLE_MS = CYCLE_HOURS * 60 * 60 * 1000;

export const checkCycleAndReset = () => {
  const db = getDb();
  if (!db.cycleStartTime) return false;
  
  const now = Date.now();
  if (now - db.cycleStartTime >= CYCLE_MS) {
    resetDb();
    initCycleIfNeeded(); // start new time
    return true; // indicates a reset happened
  }
  return false;
};

export const useCycleTimer = () => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasReset, setHasReset] = useState<boolean>(false);

  useEffect(() => {
    initCycleIfNeeded();
    
    const updateTimer = () => {
      const db = getDb();
      if (!db.cycleStartTime) return;
      
      const now = Date.now();
      const elapsed = now - db.cycleStartTime;
      const remaining = Math.max(0, CYCLE_MS - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        const reset = checkCycleAndReset();
        if (reset) {
          setHasReset(true);
          // Hide reset message after 5 seconds
          setTimeout(() => setHasReset(false), 5000);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { timeLeft, hasReset };
};

export const formatTimeLeft = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
