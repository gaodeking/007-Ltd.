import { useState, useEffect } from 'react';

function CurrencyBar({ player, earnings }) {
  const [showEarn, setShowEarn] = useState(false);
  const [earnAmount, setEarnAmount] = useState(0);

  useEffect(() => {
    if (earnings > 0) {
      setEarnAmount(earnings);
      setShowEarn(true);
      const timer = setTimeout(() => setShowEarn(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [earnings]);

  return (
    <div className="bg-white border-b border-[#d4c8c8] px-4 py-3 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="text-lg font-bold text-[#b76e79]">⚜️ 加班007 部队大厅</div>
        <div className="flex items-center gap-2 relative">
          <div className="flex items-center gap-1 text-[#4a3a3a] font-bold">
            <span className="text-2xl">💰</span>
            <span className="text-2xl">{(player.money || 0).toLocaleString()}</span>
          </div>
          {showEarn && (
            <span className="absolute -top-4 right-0 text-[#8fbc8f] font-bold text-lg animate-float-up">
              +{earnAmount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default CurrencyBar;
