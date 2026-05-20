import { useState } from 'react';
import ScratchModal from './ScratchModal';
import StockModal from './StockModal';

function ArcadePanel({ playerId, player, setPlayer, enterActivity, leaveActivity }) {
  const [showScratch, setShowScratch] = useState(false);
  const [showStock, setShowStock] = useState(false);

  const handleOpenScratch = async () => {
    await enterActivity('arcade');
    setShowScratch(true);
  };

  const handleCloseScratch = async () => {
    setShowScratch(false);
    await leaveActivity();
  };

  const handleOpenStock = async () => {
    if (player.money < 100000) {
      alert('资金不足 10 万金币，无法进入股市');
      return;
    }
    const confirmed = window.confirm('️ 警告：股市有风险，入市需谨慎。所有收益将扣除 2% 手续费。是否进入？');
    if (confirmed) {
      await enterActivity('arcade');
      setShowStock(true);
    }
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
          <span className="text-3xl mb-2">🎫</span>
          <span className="font-semibold text-sm">命运九宫格</span>
        </button>

        {/* Stock Market Button */}
        <button
          onClick={handleOpenStock}
          className="flex flex-col items-center justify-center p-4 bg-[#fef3c7] hover:bg-[#fde68a] border border-[#f59e0b] rounded-lg transition-colors text-[#92400e]"
        >
          <span className="text-3xl mb-2"></span>
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
    </div>
  );
}

export default ArcadePanel;
