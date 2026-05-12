import { useState, useEffect } from 'react';
import { gachaApi } from '../api';

function GachaModal({ playerId, player, setPlayer, onClose }) {
  const [pool, setPool] = useState(null);
  const [result, setResult] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    gachaApi.getPool().then(res => setPool(res.data));
    gachaApi.getInventory(playerId).then(res => setInventory(res.data));
  }, [playerId]);

  const handlePull = async () => {
    if (animating || player.money < 100) return;
    
    setAnimating(true);
    setResult(null);
    
    try {
      const res = await gachaApi.pull(playerId);
      setResult(res.data);
      setPlayer(prev => ({
        ...prev,
        money: prev.money - 100,
        hair: res.data.isDuplicate ? prev.hair + (res.data.conversion?.hair || 0) : prev.hair,
        bonus: res.data.isDuplicate ? prev.bonus : prev.bonus + (res.data.item.bonus || 0)
      }));
      const invRes = await gachaApi.getInventory(playerId);
      setInventory(invRes.data);
    } catch (err) {
      console.error('Pull failed:', err);
    } finally {
      setAnimating(false);
    }
  };

  if (!pool) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-[#d4c8c8] max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-lg">
        <div className="p-4 border-b border-[#d4c8c8] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#4a3a3a]"> 召唤之门</h2>
          <button onClick={onClose} className="text-[#6b5b5b] hover:text-[#4a3a3a] text-2xl">&times;</button>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">⚗️</div>
            <p className="text-[#6b5b5b]">消耗 100 💰 进行召唤</p>
            <p className="text-sm text-[#6b5b5b] mt-1">当前金币: {player.money}</p>
          </div>

          <button
            onClick={handlePull}
            disabled={animating || player.money < 100}
            className="w-full py-3 bg-[#d4a0a0] hover:bg-[#c49090] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors mb-6 text-white"
          >
            {animating ? '召唤中...' : '召唤一次 (100💰)'}
          </button>

          {result && (
            <div className="text-center mb-6 p-4 rounded-lg" style={{ backgroundColor: result.color + '20', border: `2px solid ${result.color}` }}>
              <div className="text-5xl mb-2">{result.item.emoji}</div>
              <div className="font-semibold" style={{ color: result.color }}>{result.item.name}</div>
              <div className="text-sm text-[#6b5b5b]">{result.item.description}</div>
              {result.isDuplicate && (
                <div className="text-sm text-[#b76e79] mt-2">重复获得 → 转化为 💎×{result.conversion.hair}</div>
              )}
            </div>
          )}

          <div className="border-t border-[#d4c8c8] pt-4">
            <h3 className="font-semibold mb-3 text-[#4a3a3a]">📦 已获得物品</h3>
            {inventory.length === 0 ? (
              <p className="text-sm text-[#6b5b5b]">暂无物品</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {inventory.map((item) => (
                  <div key={item.id} className="bg-[#f5f0f0] rounded p-2 text-center text-sm border border-[#d4c8c8]">
                    <div className="text-[#4a3a3a]">{item.displayName}</div>
                    <div className="text-[#6b5b5b]">×{item.quantity}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GachaModal;
