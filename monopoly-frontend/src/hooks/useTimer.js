import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook để quản lý timer cho trận đấu
 * @param {number} duration - Thời gian (phút)
 * @param {function} onTimeUp - Callback khi hết giờ
 */
export const useTimer = (duration, onTimeUp) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  
  /**
   * Bắt đầu timer
   */
  const start = useCallback(() => {
    setIsRunning(true);
  }, []);
  
  /**
   * Dừng timer
   */
  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  /**
   * Reset timer
   */
  const reset = useCallback((newDuration) => {
    stop();
    setTimeLeft((newDuration || duration) * 60);
  }, [duration, stop]);
  
  /**
   * Format time display (MM:SS)
   */
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Effect: countdown
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Hết giờ
            stop();
            if (onTimeUp) {
              onTimeUp();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, stop, onTimeUp]);
  
  return {
    timeLeft,
    isRunning,
    start,
    stop,
    reset,
    formatTime: formatTime(timeLeft),
  };
};
