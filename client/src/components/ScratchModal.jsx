import { useState, useEffect } from 'react';
import { scratchApi } from '../api';
import ScratchCardGame from './ScratchCardGame';
import ScratchResultModal from './ScratchResultModal';
import ScratchEarningsModal from './ScratchEarningsModal';

function ScratchModal({ playerId, player, setPlayer, onClose }) {
  const [phase, setPhase] = useState('intro'); // intro, playing, result
  const [showEarnings, setShowEarnings] = useState(false);
  const [grid, setGrid] = useState(null);
  const [revealed, setRevealed] = useState(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadCurrentTicket();
  }, []);

  const loadCurrentTicket = async () => {
    try {
      const res = await scratchApi.getCurrent();
      if (res.data.ticket) {
        const ticket = res.data.ticket;
        setGrid(ticket.grid);
        setRevealed(ticket.revealed);
        const count = ticket.revealed.flat().filter(Boolean).length;
        setRevealedCount(count);
        setPhase('playing');
        if (count >= 3) {
          handleClaim(ticket);
        }
      }
    } catch (err) {
      console.error('Failed to load current ticket:', err);
    }
  };

  const handleBuy = async () => {
    if (player.money < 500) {
      setError('金币不足！');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await scratchApi.buy(playerId);
      setGrid(res.data.grid);
      setRevealed(Array(3).fill(null).map(() => Array(3).fill(false)));
      setRevealedCount(0);
      setPlayer(prev => ({ ...prev, money: prev.money - 500 }));
      setPhase('playing');
    } catch (err) {
      setError(err.response?.data?.error || '购买失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async (row, col) => {
    if (!grid || revealed[row][col] || revealedCount >= 3 || loading) return;
    
    setLoading(true);
    try {
      const res = await scratchApi.reveal(playerId, row, col);
      const newRevealed = res.data.revealed;
      setRevealed(newRevealed);
      setRevealedCount(prev => prev + 1);
      
      if (revealedCount + 1 === 3) {
        setTimeout(() => handleClaim({ grid, revealed: newRevealed }), 400);
      }
    } catch (err) {
      setError('揭开失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (ticket) => {
    setLoading(true);
    try {
      const res = await scratchApi.claim(playerId);
      setResult({
        tier: res.data.tier,
        prize: res.data.prize,
        netProfit: res.data.netProfit,
        newEarnings: res.data.newEarnings,
      });
      setPlayer(prev => ({
        ...prev,
        money: prev.money + res.data.prize,
      }));
      setPhase('result');
    } catch (err) {
      setError('结算失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAgain = () => {
    setResult(null);
    setGrid(null);
    setRevealed(null);
    setRevealedCount(0);
    setPhase('intro');
    handleBuy();
  };

  const handleLeave = () => {
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#4a3a3a]">🎫 仙人彩</h3>
          <button
            onClick={onClose}
            className="text-[#6b5b5b] hover:text-[#4a3a3a] text-xl"
          >
            ✕
          </button>
        </div>

        {phase === 'intro' && (
          <>
            <div className="bg-[#f5f0f0] rounded-lg p-3 mb-4 text-sm text-[#6b5b5b]">
              <h4 className="font-bold mb-2"> 玩法规则</h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>花费 500 金币购买一张仙人彩</li>
                <li>刮开 3 个格子，根据花色判定奖项</li>
                <li>🐱🐱🐱 三个相同：一等奖 5000 金币</li>
                <li>🐱🐸 两个相同：二等奖 400 金币</li>
                <li>🐸🐹 三个不同：未中奖</li>
              </ul>
            </div>

            {error && (
              <div className="text-center text-sm text-red-500 mb-3">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBuy}
                disabled={player.money < 500 || loading}
                className="flex-1 py-2 bg-[#d4a0a0] hover:bg-[#c49090] disabled:opacity-50 rounded-lg text-white text-sm"
              >
                {loading ? '购买中...' : '买一张试试手气 (500 金币)'}
              </button>
              <button
                onClick={() => setShowEarnings(true)}
                className="px-4 py-2 bg-[#7b9ec4] hover:bg-[#6b8eb4] rounded-lg text-white text-sm"
              >
                查看收益
              </button>
            </div>
          </>
        )}

        {phase === 'playing' && grid && (
          <ScratchCardGame
            grid={grid}
            revealed={revealed}
            revealedCount={revealedCount}
            loading={loading}
            onReveal={handleReveal}
          />
        )}

        {phase === 'result' && result && (
          <ScratchResultModal
            result={result}
            onPlayAgain={handlePlayAgain}
            onLeave={handleLeave}
          />
        )}

        {showEarnings && (
          <ScratchEarningsModal
            onClose={() => setShowEarnings(false)}
          />
        )}
      </div>
    </div>
  );
}

export default ScratchModal;
