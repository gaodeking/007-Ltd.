import { useState, useEffect } from 'react';

function StatusBar({ player }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e0e0] px-4 py-2 shadow-sm">
      <div className="max-w-4xl mx-auto flex justify-between text-sm text-[#8a7a7a]">
        <span>📊 挂机产出: {Math.floor((player.idleRate || 10) * (player.bonus || 1.0))}金币/秒</span>
        <span>⏱️ 本次休息: {hours}h{minutes.toString().padStart(2, '0')}m{seconds.toString().padStart(2, '0')}s</span>
      </div>
    </div>
  );
}

export default StatusBar;
