import { useState } from 'react';
import { seatApi, playerApi } from '../api';
import NPCPeachBox from './NPCPeachBox';

const HEAVY_ACTIVITY_NAMES = {
  scratch: '命运九宫格',
  arcade: '金蝶游乐场',
};

// VIP Seat Configuration
const VIP_SEAT_ID = 1;
const VIP_PLAYER_NAMES = ['正版TZHZ'];

function IdleHall({ playerId, player, seats, setSeats, setPlayer, playerRef, activityStatus, setActivityStatus, activityStatusRef, enterActivity, leaveActivity }) {
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
      
      try {
        await playerApi.save(playerId, playerRef.current);
      } catch (saveErr) {
        console.warn('Failed to save on leave:', saveErr);
      }
      
      setMessage('✅ 已离开座位');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || '离开失败';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const getSeatStatus = (seat) => {
    if (!seat.playerId) return 'empty';
    
    const now = Math.floor(Date.now() / 1000);
    const isOffline = !seat.lastHeartbeat || seat.lastHeartbeat < now - 120;
    
    if (isOffline) return 'offline';
    if (seat.activityStatus) return 'slacking';
    return 'online';
  };

  const getSeatEmoji = (seat, status) => {
    const isVipSeat = seat.seatId === VIP_SEAT_ID;
    const isVipPlayer = VIP_PLAYER_NAMES.includes(player.name);

    if (isVipSeat && !isVipPlayer && status === 'empty') {
      return '🔒';
    }
    if (status === 'empty') return '🛏️';
    if (status === 'offline') return seat.playerAvatar || '🧙‍♂️';
    if (seat.playerId === playerId) return player.avatar || '🧙‍♂️';
    return seat.playerAvatar || '⚔️';
  };

  const getSeatName = (seat, status) => {
    const isVipSeat = seat.seatId === VIP_SEAT_ID;
    if (isVipSeat) return 'BOSS座';
    
    if (status === 'empty') return '空置工位';
    if (status === 'offline') return (seat.playerName || '冒险者').substring(0, 6);
    if (seat.playerId === playerId) return player.name?.substring(0, 6) || '我';
    return (seat.playerName || '冒险者').substring(0, 6);
  };

  const getSeatClass = (seat, status) => {
    const isVipSeat = seat.seatId === VIP_SEAT_ID;
    const isVipPlayer = VIP_PLAYER_NAMES.includes(player.name);

    // VIP Seat Logic
    if (isVipSeat) {
      if (!isVipPlayer) {
        // Non-VIP player view: Locked
        return 'ring-2 ring-[#d4c8c8] bg-[#f5f0f0] cursor-not-allowed grayscale opacity-60';
      }
      // VIP player view
      if (status === 'online' || status === 'slacking') {
         return seat.playerId === playerId 
          ? 'ring-2 ring-[#f59e0b] bg-[#fffbeb] shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
          : 'ring-2 ring-[#f59e0b] bg-[#fffbeb] cursor-not-allowed';
      }
      return 'ring-2 ring-[#f59e0b] bg-[#fffbeb] hover:bg-[#fef3c7] cursor-pointer shadow-sm';
    }

    // Normal Seat Logic
    switch (status) {
      case 'online':
        return seat.playerId === playerId 
          ? 'ring-2 ring-[#8fbc8f] bg-[#f5faf5]' 
          : 'bg-[#f5faf5] cursor-not-allowed';
      case 'offline':
        return 'grayscale opacity-50 bg-[#e8e0e0] cursor-not-allowed';
      case 'slacking':
        return seat.playerId === playerId 
          ? 'ring-2 ring-[#f59e0b] bg-[#fef3c7]' 
          : 'bg-[#fef3c7] cursor-not-allowed';
      default:
        return 'bg-white hover:bg-[#faf5f5] cursor-pointer shadow-sm border border-[#e8e0e0]';
    }
  };

  const getSeatTooltip = (seat, status) => {
    const isVipSeat = seat.seatId === VIP_SEAT_ID;
    const isVipPlayer = VIP_PLAYER_NAMES.includes(player.name);

    if (isVipSeat && !isVipPlayer) {
      return 'BOSS专属座位 (无权入座)';
    }
    if (isVipSeat) {
      return 'BOSS专属座位';
    }

    switch (status) {
      case 'online':
        return `${seat.playerName || '冒险者'} - 在岗`;
      case 'offline':
        return '该员工未到岗';
      case 'slacking':
        const activityName = HEAVY_ACTIVITY_NAMES[seat.activityStatus] || seat.activityStatus;
        return `上班摸鱼中 - 正在${activityName}`;
      default:
        return `空床位 (${seat.position})`;
    }
  };

  const getSeatBadge = (status) => {
    if (status === 'slacking') return '🐟';
    if (status === 'offline') return '💤';
    return null;
  };

  const cooldownRemaining = Math.max(0, (player.seatCooldown || 0) - Math.floor(Date.now() / 1000));
  const cooldownMinutes = Math.floor(cooldownRemaining / 60);
  const cooldownSeconds = cooldownRemaining % 60;

  return (
    <div className="w-full px-4 py-6 idle-hall">
      <div className="bg-white rounded-xl border border-[#d4c8c8] p-6 shadow-sm h-full flex flex-col relative">
        <h2 className="text-xl font-bold mb-4 text-center text-[#4a3a3a]">007公司工位</h2>
        
        <NPCPeachBox />
        
        <div className="grid grid-cols-5 gap-4 max-w-md mx-auto mb-4">
          {seats.map((seat) => {
            const status = getSeatStatus(seat);
            return (
              <button
                key={seat.seatId}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative ${getSeatClass(seat, status)}`}
                onClick={() => !seat.playerId && handleSit(seat.seatId)}
                disabled={!!seat.playerId || loading}
                title={getSeatTooltip(seat, status)}
              >
                <span className={`text-2xl ${status === 'offline' ? 'grayscale' : ''}`}>{getSeatEmoji(seat, status)}</span>
                <span className={`text-xs mt-1 ${seat.playerId === playerId ? 'text-[#b76e79] font-medium' : 'text-[#6b5b5b]'}`}>{getSeatName(seat, status)}</span>
                {getSeatBadge(status) && (
                  <span className="absolute -top-1 -right-1 text-sm">{getSeatBadge(status)}</span>
                )}
              </button>
            );
          })}
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
      </div>
    </div>
  );
}

export default IdleHall;
