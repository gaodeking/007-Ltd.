import { useState, useEffect } from 'react';
import CopyIdButton from './CopyIdButton';

function PlayerInfoCard({ player, earnings, earnTrigger, onOpenProfile, playerId }) {
  const [showEarn, setShowEarn] = useState(false);
  const [earnAmount, setEarnAmount] = useState(0);

  useEffect(() => {
    if (earnings > 0) {
      setEarnAmount(earnings);
      setShowEarn(true);
      const timer = setTimeout(() => setShowEarn(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [earnTrigger]);

  return (
    <div className="bg-white rounded-xl border border-[#d4c8c8] p-4">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-[#f5f0f0] border border-[#d4c8c8] flex items-center justify-center text-3xl flex-shrink-0">
          {player.avatar || '🧙♂️'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-semibold text-[#4a3a3a] truncate">
            {player.name || '无名冒险者'}
          </div>
          <div className="text-sm text-[#8a7a7a] mt-1">
            部队: 加班007
          </div>
        </div>
        <button
          onClick={onOpenProfile}
          className="px-3 py-1.5 bg-[#d4a0a0] hover:bg-[#c49090] text-white text-sm rounded-lg transition-colors flex-shrink-0"
        >
          修改信息
        </button>
      </div>
      
      <div className="bg-[#f5f0f0] rounded-lg p-3 border border-[#d4c8c8] relative">
        <div className="flex items-center gap-2 text-[#4a3a3a] font-bold relative">
          <span className="text-xl">💰</span>
          <span className="text-xl">{(player.money || 0).toLocaleString()}</span>
          {showEarn && (
            <span className="absolute -top-4 right-0 text-[#8fbc8f] font-bold text-lg animate-float-up">
              +{earnAmount}
            </span>
          )}
        </div>
      </div>
      
      {playerId && (
        <div className="mt-3 pt-3 border-t border-[#d4c8c8] flex items-center justify-between">
          <span className="text-xs text-[#8a7a7a] truncate flex-1 mr-2 font-mono">
            ID: {playerId.substring(0, 8)}...
          </span>
          <CopyIdButton playerId={playerId} />
        </div>
      )}
    </div>
  );
}

export default PlayerInfoCard;
