import { useState } from 'react';
import ScratchCardGame from './ScratchCardGame';
import ScratchEarningsModal from './ScratchEarningsModal';

function ArcadePanel({ playerId, player, setPlayer, enterActivity, leaveActivity }) {
  const [showScratch, setShowScratch] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);

  const handleBuy = async () => {
    if (player.money < 500) {
      alert('金币不足！');
      return;
    }
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
      
      <div className="bg-[#f5f0f0] rounded-lg p-3 mb-3 text-sm text-[#6b5b5b]">
        <h4 className="font-bold mb-2">🎫 仙人彩规则</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>花费 500 金币购买一张仙人彩</li>
          <li>刮开 3 个格子，根据花色判定奖项</li>
          <li>🐵🐵 三个相同：一等奖 5000 金币</li>
          <li>🐵🐸 两个相同：二等奖 400 金币</li>
          <li>🐸🐹 三个不同：未中奖</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleBuy}
          disabled={player.money < 500}
          className="flex-1 py-2 bg-[#d4a0a0] hover:bg-[#c49090] disabled:opacity-50 rounded-lg text-white text-sm"
        >
          买一张试试手气 (500 金币)
        </button>
        <button
          onClick={() => setShowEarnings(true)}
          className="px-3 py-2 bg-[#7b9ec4] hover:bg-[#6b8eb4] rounded-lg text-white text-sm"
        >
          查看收益
        </button>
      </div>

      {showScratch && (
        <ScratchCardGame
          playerId={playerId}
          player={player}
          setPlayer={setPlayer}
          onClose={handleCloseScratch}
        />
      )}

      {showEarnings && (
        <ScratchEarningsModal
          onClose={() => setShowEarnings(false)}
        />
      )}
    </div>
  );
}

export default ArcadePanel;
