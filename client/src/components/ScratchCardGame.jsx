import { useState, useEffect } from 'react';
import { scratchApi } from '../api';
import ScratchResultModal from './ScratchResultModal';

function ScratchCardGame({ playerId, player, setPlayer, onClose, onBuyAgain }) {
  const [grid, setGrid] = useState(null);
  const [revealed, setRevealed] = useState(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
        if (count >= 3) {
          handleClaim(ticket);
        }
      } else {
        handleBuy();
      }
    } catch (err) {
      setError('加载失败');
    }
  };

  const handleBuy = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await scratchApi.buy(playerId);
      setGrid(res.data.grid);
      setRevealed(Array(3).fill(null).map(() => Array(3).fill(false)));
      setRevealedCount(0);
      setPlayer(prev => ({ ...prev, money: prev.money - 500 }));
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
    handleBuy();
  };

  const handleLeave = () => {
    setResult(null);
    onClose();
  };

  if (error && !grid) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-[#d4a0a0] text-white rounded-lg">
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full">
          <h3 className="text-lg font-bold mb-4 text-center">🎫 仙人彩</h3>
          
          {loading && !grid && (
            <div className="text-center py-8 text-[#6b5b5b]">加载中...</div>
          )}
          
          {grid && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {grid.map((row, r) =>
                  row.map((emoji, c) => (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleReveal(r, c)}
                      disabled={revealed?.[r]?.[c] || revealedCount >= 3 || loading}
                      className={`aspect-square rounded-lg text-3xl flex items-center justify-center transition-all duration-300 ${
                        revealed?.[r]?.[c]
                          ? 'bg-[#f5f0f0] scale-105'
                          : 'bg-[#e8e0e0] hover:bg-[#d8d0d0] cursor-pointer'
                      }`}
                    >
                      {revealed?.[r]?.[c] ? emoji : '?'}
                    </button>
                  ))
                )}
              </div>
              
              <div className="text-center text-sm text-[#6b5b5b] mb-2">
                已揭开：{revealedCount}/3
              </div>
              
              {error && (
                <div className="text-center text-sm text-red-500 mb-2">{error}</div>
              )}
            </>
          )}
        </div>
      </div>
      
      {result && (
        <ScratchResultModal
          result={result}
          onPlayAgain={handlePlayAgain}
          onLeave={handleLeave}
        />
      )}
    </>
  );
}

export default ScratchCardGame;
