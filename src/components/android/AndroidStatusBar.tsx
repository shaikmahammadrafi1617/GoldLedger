import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Sparkles } from 'lucide-react';

export const AndroidStatusBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#1E293B] text-slate-200 px-5 py-2.5 flex items-center justify-between text-[11px] font-semibold tracking-wider select-none shrink-0 border-b border-slate-800/80">
      {/* Time */}
      <span className="font-mono text-xs text-white font-bold">{currentTime || '10:30 AM'}</span>

      {/* Android Camera Punch Hole Simulation in center */}
      <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
      </div>

      {/* Status Icons */}
      <div className="flex items-center space-x-2">
        <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/20 px-1 rounded">5G</span>
        <Wifi className="w-3.5 h-3.5 text-slate-200 stroke-[2.5]" />
        <div className="flex items-center space-x-0.5 text-slate-200">
          <Battery className="w-4 h-4 stroke-[2.2] text-emerald-400" />
          <span className="text-[10px] font-mono font-bold text-white">98%</span>
        </div>
      </div>
    </div>
  );
};
