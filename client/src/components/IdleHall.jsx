import { useState } from 'react';
import { seatApi } from '../api';

function IdleHall({ playerId, player, seats, setSeats, setPlayer }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSit = async (seatId) => {
    if (loading) return;
    setLoading(true);
    setMessage('');
    
    try {
      await seatApi.sit(seatId, playerId);
      const res = await seatApi.getAll();
      setSeats(res.data);
      setPlayer(prev => ({ ...prev, currentSeat: seatId }));
      setMessage('✅ 成功入座！');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || '入座失败';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (loading) return;
    setLoading(true);
    setMessage('');
    
    try {
      await seatApi.leave(playerId);
      const res = await seatApi.getAll();
      setSeats(res.data);
      setPlayer(prev => ({ ...prev, currentSeat: null }));
      setMessage('✅ 已离开座位');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || '离开失败';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const getSeatEmoji = (seat) => {
    if (seat.playerId === playerId) return player.avatar || '🧙‍♂️';
    if (seat.playerId) return seat.playerAvatar || '⚔️';
    return '🛏️';
  };

  const getSeatName = (seat) => {
    if (seat.playerId === playerId) return player.name?.substring(0, 6) || '我';
    if (seat.playerId) return (seat.playerName || '冒险者').substring(0, 6);
    return seat.seatId.toString();
  };

  const getSeatClass = (seat) => {
    if (seat.playerId === playerId) return 'ring-2 ring-[#d4a0a0] bg-[#f5e8e8]';
    if (seat.playerId) return 'bg-[#f5f0f0] cursor-not-allowed opacity-70';
    return 'bg-white hover:bg-[#faf5f5] cursor-pointer shadow-sm border border-[#e8e0e0]';
  };

  const cooldownRemaining = Math.max(0, (player.seatCooldown || 0) - Math.floor(Date.now() / 1000));
  const cooldownMinutes = Math.floor(cooldownRemaining / 60);
  const cooldownSeconds = cooldownRemaining % 60;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 idle-hall">
      <div className="bg-white rounded-xl border border-[#d4c8c8] p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-center text-[#4a3a3a]"> 冒险者休息处</h2>
        
        <div className="grid grid-cols-5 gap-4 max-w-md mx-auto mb-4">
          {seats.map((seat) => (
            <button
              key={seat.seatId}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${getSeatClass(seat)}`}
              onClick={() => !seat.playerId && handleSit(seat.seatId)}
              disabled={!!seat.playerId || loading}
              title={seat.playerId ? `冒险者: ${seat.playerName}` : `空床位 (${seat.position})`}
            >
              <span className="text-2xl">{getSeatEmoji(seat)}</span>
              <span className={`text-xs mt-1 ${seat.playerId === playerId ? 'text-[#b76e79] font-medium' : 'text-[#6b5b5b]'}`}>{getSeatName(seat)}</span>
            </button>
          ))}
        </div>

        {message && (
          <div className="text-center mb-3 text-sm text-[#4a3a3a]">{message}</div>
        )}

        <div className="flex justify-center gap-3">
          {player.currentSeat && (
            <button
              onClick={handleLeave}
              disabled={loading || cooldownRemaining > 0}
              className="px-4 py-2 bg-[#d4a0a0] hover:bg-[#c49090] disabled:opacity-50 rounded-lg transition-colors text-white"
            >
              起身离开
            </button>
          )}
          {cooldownRemaining > 0 && (
            <span className="text-[#6b5b5b] flex items-center">
              ⏱️ 冷却: {cooldownMinutes}:{cooldownSeconds.toString().padStart(2, '0')}
            </span>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-[#6b5b5b]">
          <span className="mr-4">🧙 = 你</span>
          <span className="mr-4">⚔️ = 其他冒险者</span>
          <span>🛏️ = 空床位</span>
        </div>
      </div>
    </div>
  );
}

export default IdleHall;
