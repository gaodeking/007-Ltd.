import { useState } from 'react';
import ScratchModal from './ScratchModal';

function ArcadePanel({ playerId, player, setPlayer, enterActivity, leaveActivity }) {
  const [showScratch, setShowScratch] = useState(false);

  const handleOpenScratch = async () => {
    await enterActivity('arcade');
    setShowScratch(true);
  };

  const handleCloseScratch = async () => {
    setShowScratch(false);
    await leaveActivity();
  };

  return (
    <div className="bg-white rounded-xl border border-[#d4c8c8] p-4 h-full flex flex-col">
      <h3 className="text-lg font-bold text-[#4a3a3a] mb-3">🎪 金蝶游乐场</h3>
      
      <button
        onClick={handleOpenScratch}
        className="w-full py-3 bg-[#d4a0a0] hover:bg-[#c49090] rounded-lg text-white font-semibold transition-colors"
      >
        🎫 仙人彩
      </button>

      {showScratch && (
        <ScratchModal
          playerId={playerId}
          player={player}
          setPlayer={setPlayer}
          onClose={handleCloseScratch}
        />
      )}
    </div>
  );
}

export default ArcadePanel;
