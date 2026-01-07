
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, MessageSquare } from 'lucide-react';
import { StepStatus } from '../types';

interface StopwatchProps {
  status: StepStatus;
  duration: number; // accumulated time in ms
  lastResumedAt: number | null;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onNoteChange: (note: string) => void;
  note: string;
}

export const Stopwatch: React.FC<StopwatchProps> = ({
  status,
  duration,
  lastResumedAt,
  onStart,
  onPause,
  onComplete,
  onNoteChange,
  note
}) => {
  const [displayTime, setDisplayTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === StepStatus.ACTIVE && lastResumedAt) {
      timerRef.current = window.setInterval(() => {
        const currentTotal = duration + (Date.now() - lastResumedAt);
        setDisplayTime(currentTotal);
      }, 100);
    } else {
      setDisplayTime(duration);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, duration, lastResumedAt]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCompleted = status === StepStatus.COMPLETED;

  return (
    <div className={`p-4 rounded-2xl border-2 transition-all ${
      status === StepStatus.ACTIVE ? 'border-orange-500 bg-orange-50' : 
      isCompleted ? 'border-green-200 bg-green-50 opacity-75' : 
      'border-stone-200 bg-white'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-4xl mono font-bold text-stone-800">
          {formatTime(displayTime)}
        </span>
        <div className="flex gap-2">
          {status !== StepStatus.ACTIVE && !isCompleted && (
            <button 
              onClick={onStart}
              className="bg-orange-600 text-white p-4 rounded-full shadow-lg active:scale-95 transition-transform"
            >
              <Play fill="currentColor" size={24} />
            </button>
          )}
          {status === StepStatus.ACTIVE && (
            <button 
              onClick={onPause}
              className="bg-stone-500 text-white p-4 rounded-full shadow-lg active:scale-95 transition-transform"
            >
              <Pause fill="currentColor" size={24} />
            </button>
          )}
          {(status === StepStatus.PAUSED || status === StepStatus.ACTIVE) && (
            <button 
              onClick={onComplete}
              className="bg-green-600 text-white p-4 rounded-full shadow-lg active:scale-95 transition-transform"
            >
              <Square fill="currentColor" size={24} />
            </button>
          )}
        </div>
      </div>
      
      {!isCompleted && (
        <div className="flex items-center gap-2 bg-stone-100 p-2 rounded-lg">
          <MessageSquare size={16} className="text-stone-400" />
          <input 
            type="text"
            placeholder="Observación..."
            className="bg-transparent border-none text-sm w-full focus:ring-0 placeholder-stone-400"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};
