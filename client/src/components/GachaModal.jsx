import { useState, useEffect } from 'react';
import { gachaApi } from '../api';
import GachaResultModal from './GachaResultModal';

function GachaModal({ playerId, player, setPlayer, onClose }) {
  const [pool, setPool] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState([]);
  const [pullCount, setPullCount] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [pullSession, setPullSession] = useState(0);

  useEffect(() => {
    gachaApi.getPool().then(res => setPool(res.data));
  }, [playerId]);

  const handlePull = async (count) => {
    const cost = count === 10 ? 6480 : 720 * count;
    if (animating || player.money < cost) {
      if (player.money < cost) {
        alert('金币不足！');
      }
      return;
    }
    
    // 原子性：先关闭旧弹窗，确保状态完全重置
    setShowResult(false);
    setAnimating(true);
    setPullCount(count);
    
    try {
      const res = await gachaApi.pull(playerId, count);
      setResults(res.data.results || []);
      setPullSession(s => s + 1);
      setPlayer(prev => ({
        ...prev,
        money: prev.money - cost
      }));
      // 防御性：延迟显示新结果，确保 React 完成旧组件卸载，触发动画重播
      setTimeout(() => setShowResult(true), 50);
      // Refresh pool to update stock and personal counts
      const poolRes = await gachaApi.getPool();
      setPool(poolRes.data);
    } catch (err) {
      console.error('Pull failed:', err);
      const errorMsg = err.response?.data?.error || '抽奖失败，请重试';
      alert(errorMsg);
    } finally {
      setAnimating(false);
    }
  };

  if (!pool) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl border border-[#d4c8c8] max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-lg">
          <div className="p-4 border-b border-[#d4c8c8] flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#4a3a3a]">🎰 召唤之门</h2>
            <button onClick={onClose} className="text-[#6b5b5b] hover:text-[#4a3a3a] text-2xl">&times;</button>
          </div>
          
          <div className="p-6">
            {/* 公告 */}
            <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-3 mb-4">
              <p className="text-sm text-[#b76e79]">📢 中奖者请联系中权兑换奖品</p>
            </div>
            
            {/* 金币显示 */}
            <div className="text-center mb-6">
              <p className="text-[#6b5b5b] mb-1">你的金币</p>
              <span className="text-3xl font-bold text-[#b76e79]">💰 {player.money.toLocaleString()}</span>
            </div>

            {/* 单抽/十连抽按钮 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handlePull(1)}
                disabled={animating || player.money < 720}
                className="py-4 bg-[#d4a0a0] hover:bg-[#c49090] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors text-white"
              >
                <div className="text-2xl mb-1">🎲</div>
                <div>单抽</div>
                <div className="text-sm">720 💰</div>
              </button>
              <button
                onClick={() => handlePull(10)}
                disabled={animating || player.money < 6480}
                className="py-4 bg-[#d4a0a0] hover:bg-[#c49090] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors text-white"
              >
                <div className="text-2xl mb-1">🎲 ×10</div>
                <div>十连抽</div>
                <div className="text-sm">6480 💰 <span className="text-xs bg-[#b76e79] px-1 rounded">9折</span></div>
              </button>
            </div>

            {/* 奖品池列表 */}
            <div className="border-t border-[#d4c8c8] pt-4">
              <h3 className="font-semibold mb-3 text-[#4a3a3a]">🎁 奖品池</h3>
              <div className="space-y-2">
                {pool.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      item.isUnavailable
                        ? 'bg-gray-100 border-gray-200 line-through text-gray-400'
                        : 'bg-[#f5f0f0] border-[#d4c8c8]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white flex-shrink-0 ${
                        item.rarity === 'ssr' ? 'bg-[#f59e0b]' :
                        item.rarity === 'sr' ? 'bg-[#a855f7]' :
                        item.rarity === 'r' ? 'bg-[#3b82f6]' : 'bg-[#9ca3af]'
                      }`}>
                        {item.rarity.toUpperCase()}
                      </span>
                      <span className="truncate">{item.emoji} {item.name}</span>
                    </div>
                    <div className="text-sm flex-shrink-0 ml-2">
                      {item.remaining === '∞' ? '∞' : `剩${item.remaining}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showResult && (
        <GachaResultModal
          key={pullSession}
          results={results}
          pullCount={pullCount}
          playerMoney={player.money}
          onClose={() => setShowResult(false)}
          onPullAgain={() => handlePull(pullCount)}
        />
      )}
    </>
  );
}

export default GachaModal;
