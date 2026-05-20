import { useState } from 'react';
import ScratchModal from './ScratchModal';
import StockModal from './StockModal';
import StockEntryModal from './StockEntryModal';

function ArcadePanel({ playerId, player, setPlayer, enterActivity, leaveActivity }) {
  const [showScratch, setShowScratch] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);

  const handleOpenScratch = async () => {
    await enterActivity('arcade');
    setShowScratch(true);
  };

  const handleCloseScratch = async () => {
    setShowScratch(false);
    await leaveActivity();
  };

  const handleOpenStockClick = () => {
    setShowEntryModal(true);
  };

  const handleConfirmEnterStock = async () => {
    setShowEntryModal(false);
    await enterActivity('arcade');
    setShowStock(true);
  };

  const handleCloseStock = async () => {
    setShowStock(false);
    await leaveActivity();
  };

  return (
    <div className="bg-white rounded-xl border border-[#d4c8c8] p-4 h-full flex flex-col">
      <h3 className="text-lg font-bold text-[#4a3a3a] mb-3 flex-shrink-0">🎪 金蝶游乐场</h3>
      
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        {/* Scratch Card Button */}
        <button
          onClick={handleOpenScratch}
          className="flex flex-col items-center justify-center p-4 bg-[#f5f0f0] hover:bg-[#e5e0e0] border border-[#d4c8c8] rounded-lg transition-colors text-[#4a3a3a]"
        >
          <span className="text-3xl mb-2"></span>
          <span className="font-semibold text-sm">命运九宫格</span>
        </button>

        {/* Stock Market Button */}
        <button
          onClick={handleOpenStockClick}
          className="flex flex-col items-center justify-center p-4 bg-[#fef3c7] hover:bg-[#fde68a] border border-[#f59e0b] rounded-lg transition-colors text-[#92400e]"
        >
          <span className="text-3xl mb-2">🔮</span>
          <span className="font-semibold text-sm">神秘入口</span>
        </button>
      </div>

      {showScratch && (
        <ScratchModal
          playerId={playerId}
          player={player}
          setPlayer={setPlayer}
          onClose={handleCloseScratch}
        />
      )}

      {showStock && (
        <StockModal
          playerId={playerId}
          player={player}
          setPlayer={setPlayer}
          onClose={handleCloseStock}
        />
      )}

      {showEntryModal && (
        <StockEntryModal
          player={player}
          onEnter={handleConfirmEnterStock}
          onClose={() => setShowEntryModal(false)}
        />
      )}
    </div>
  );
}

export default ArcadePanel;
