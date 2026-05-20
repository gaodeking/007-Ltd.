import { useState, useEffect, useRef } from 'react';
import { playerApi, seatApi, gachaApi, taskApi, announcementApi, activityApi } from './api';
import ErrorBoundary from './components/ErrorBoundary';
import CurrencyBar from './components/CurrencyBar';
import IdleHall from './components/IdleHall';
import ActivityPanel from './components/ActivityPanel';
import ProfileModal from './components/ProfileModal';
import GachaModal from './components/GachaModal';
import TaskPanel from './components/TaskPanel';
import StatusBar from './components/StatusBar';
import ChatSidebar from './components/ChatSidebar';
import PlayerInfoCard from './components/PlayerInfoCard';
import AnnouncementPanel from './components/AnnouncementPanel';
import ArcadePanel from './components/ArcadePanel';
import OnboardingModal from './components/OnboardingModal';
import VersionChecker from './components/VersionChecker';

function App() {
  const [playerId, setPlayerId] = useState(null);
  const [player, setPlayer] = useState(null);
  const [seats, setSeats] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showGacha, setShowGacha] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(0);
  const [earnTrigger, setEarnTrigger] = useState(0);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showDailyLoginModal, setShowDailyLoginModal] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [activityStatus, setActivityStatus] = useState(null);
  const playerRef = useRef(player);
  playerRef.current = player;
  const currentSeatRef = useRef(null);
  const idleRateRef = useRef(1);
  const bonusRef = useRef(1.0);
  const activityStatusRef = useRef(null);

  // Initialize player
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await playerApi.init();
        setPlayerId(res.data.playerId);
        
        // Ensure player has all required fields with defaults
        const playerData = res.data.player || {};
        setPlayer({
          name: playerData.name || '无名冒险者',
          avatar: playerData.avatar || '🧙‍♂️',
          money: playerData.money || 0,
          idleRate: playerData.idleRate || 1,
          bonus: playerData.bonus || 1.0,
          currentSeat: playerData.currentSeat || null,
          seatCooldown: playerData.seatCooldown || 0,
          totalidletime: playerData.totalidletime || playerData.totalIdleTime || 0,
          totalmoneyearned: playerData.totalmoneyearned || playerData.totalMoneyEarned || 0,
          totalgachacount: playerData.totalgachacount || playerData.totalGachaCount || 0,
          lastSave: playerData.lastSave || Math.floor(Date.now() / 1000),
          activityStatus: playerData.activityStatus || null,
        });
        
        setActivityStatus(playerData.activityStatus || null);
        activityStatusRef.current = playerData.activityStatus || null;
        
        console.log(' [DEBUG] Player Data from Server:', res.data.player);
        localStorage.setItem('playerId', res.data.playerId);

        // 处理弹窗逻辑
        if (playerData.showOnboarding) {
          setShowOnboardingModal(true);
        } else if (playerData.showDailyLogin) {
          // 每日登录需要获取公告
          try {
            const annRes = await announcementApi.getLatest();
            setAnnouncement(annRes.data);
          } catch (err) {
            console.error('Failed to load announcement for daily login:', err);
          }
          setShowDailyLoginModal(true);
        }

      } catch (err) {
        console.error('Failed to initialize player:', err);
        setError(err.message || '连接服务器失败，请刷新重试');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Load seats
  useEffect(() => {
    if (!playerId) return;
    const loadSeats = async () => {
      try {
        const res = await seatApi.getAll();
        setSeats(res.data);
        // 同步 currentSeat：从座位数据中找到当前玩家的座位
        const mySeat = res.data.find(s => s.playerId === playerId);
        const newSeatId = mySeat ? mySeat.seatId : null;
        
        // 只在 currentSeat 真正改变时才更新，避免不必要的 re-render
        if (newSeatId !== currentSeatRef.current) {
          currentSeatRef.current = newSeatId;
          setPlayer(prev => ({ ...prev, currentSeat: newSeatId }));
        }
      } catch (err) {
        console.error('Failed to load seats:', err);
      }
    };
    loadSeats();
    const interval = setInterval(loadSeats, 5000);
    return () => clearInterval(interval);
  }, [playerId]);

  // Load tasks
  useEffect(() => {
    if (!playerId) return;
    const loadTasks = async () => {
      try {
        const res = await taskApi.getTasks(playerId);
        setTasks(res.data);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      }
    };
    loadTasks();
  }, [playerId]);

  // Auto-save every 15 seconds (using ref to avoid timer reset)
  useEffect(() => {
    if (!playerId || !playerRef.current) return;
    const saveInterval = setInterval(async () => {
      try {
        const res = await playerApi.save(playerId, playerRef.current);
        // 保存成功后同步后端返回的 money 值，确保前后端一致
        if (res.data.money !== undefined) {
          setPlayer(prev => ({
            ...prev,
            money: res.data.money,
            totalmoneyearned: res.data.totalmoneyearned,
            totalidletime: res.data.totalidletime,
            totalgachacount: res.data.totalgachacount
          }));
        }
      } catch (err) {
        console.warn('Save failed, syncing with server...', err);
        // 保存失败时从后端同步最新值
        try {
          const res = await playerApi.get(playerId);
          setPlayer(prev => ({ ...prev, money: res.data.money }));
        } catch (syncErr) {
          console.error('Sync failed:', syncErr);
        }
      }
    }, 15000);
    return () => clearInterval(saveInterval);
  }, [playerId]);

  // Save on page close (beforeunload) - save player data only, do NOT release seat
  useEffect(() => {
    if (!playerId || !playerRef.current) return;
    const handleBeforeUnload = () => {
      // 仅保存玩家数据，不再释放座位（座位仅在手动点击"起身离开"时释放）
      const saveData = JSON.stringify(playerRef.current);
      navigator.sendBeacon(`/api/player/${playerId}/save`, new Blob([saveData], { type: 'application/json' }));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [playerId]);

  // Heartbeat timer (every 15 seconds, only when seated)
  useEffect(() => {
    if (!playerId || !player?.currentSeat) return;
    const heartbeatInterval = setInterval(async () => {
      try {
        await playerApi.heartbeat(playerId, { activityStatus: activityStatusRef.current });
      } catch (err) {
        console.error('Heartbeat failed:', err);
      }
    }, 30000);
    return () => clearInterval(heartbeatInterval);
  }, [playerId, player?.currentSeat]);

  // 同步 Refs 到最新值
  useEffect(() => {
    currentSeatRef.current = player?.currentSeat;
    idleRateRef.current = player?.idleRate;
    bonusRef.current = player?.bonus;
    activityStatusRef.current = player?.activityStatus;
  }, [player?.currentSeat, player?.idleRate, player?.bonus, player?.activityStatus]);

  // 金币增长定时器（每 5 秒）
  // 使用 Refs 避免 loadSeats 导致的频繁重置
  useEffect(() => {
    if (!player || !currentSeatRef.current) return;
    const earnInterval = setInterval(() => {
      const earningsPerTick = Math.floor(
        (idleRateRef.current || 1) * (bonusRef.current || 1.0) * 5
      );
      setPlayer(prev => ({
        ...prev,
        money: prev.money + earningsPerTick,
        totalmoneyearned: prev.totalmoneyearned + earningsPerTick
      }));
      setEarnings(earningsPerTick);
      setEarnTrigger(prev => prev + 1);
    }, 5000);
    return () => clearInterval(earnInterval);
  }, [player?.currentSeat]);

  // 活动状态管理
  const enterActivity = async (activityId) => {
    try {
      await activityApi.setStatus(playerId, activityId);
      setActivityStatus(activityId);
      activityStatusRef.current = activityId;
    } catch (err) {
      console.error('Failed to enter activity:', err);
    }
  };

  const leaveActivity = async () => {
    try {
      await activityApi.clearStatus(playerId);
      setActivityStatus(null);
      activityStatusRef.current = null;
    } catch (err) {
      console.error('Failed to leave activity:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-2xl text-gray-400">⚜️ 正在进入部队大厅...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-red-400 mb-4">⚜️ 连接失败</div>
          <div className="text-gray-400 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            刷新重试
          </button>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-2xl text-gray-400">⚜️ 正在进入部队大厅...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <VersionChecker playerId={playerId} playerRef={playerRef} />
      <div className="min-h-screen bg-[#f0ebe5] text-[#4a3a3a] flex flex-col" style={{ minWidth: '1200px' }}>
        <CurrencyBar />
        
        {/* 核心操作栏 */}
        <div className="px-4 py-3">
          <div className="flex justify-center gap-4">
            <button
              disabled={!!player.currentSeat}
              className={`flex-1 max-w-[200px] py-3 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2 text-white ${
                player.currentSeat 
                  ? 'bg-[#6aaa6a] cursor-not-allowed opacity-80 ring-2 ring-[#2d5a2d]' 
                  : 'bg-[#8fbc8f] hover:bg-[#7faa7f] cursor-pointer'
              }`}
            >
              <span className="text-xl">{player.currentSeat ? '🚔' : '🛏️'}</span>
              <span>{player.currentSeat ? '坐牢中...' : '入座休息'}</span>
            </button>
            
            <button
              onClick={() => setShowGacha(true)}
              className="flex-1 max-w-[200px] py-3 bg-[#d4a0a0] hover:bg-[#c49090] rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2 text-white"
            >
              <span className="text-xl">🎰</span>
              <span>召唤之门</span>
            </button>
            
            <button
              onClick={() => setShowTasks(true)}
              className="flex-1 max-w-[200px] py-3 bg-[#7b9ec4] hover:bg-[#6b8eb4] rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2 text-white"
            >
              <span className="text-xl">📋</span>
              <span>上班打卡</span>
            </button>
          </div>
        </div>
        
        {/* 主内容区 - Grid 布局 */}
        <div className="flex-1 px-4 pb-4">
          <div className="grid grid-cols-[1fr_2.5fr_1.2fr] gap-4 h-full">
            
            {/* 左侧栏 - 跨服通讯贝 */}
            <div className="row-span-2">
              <ChatSidebar />
            </div>
            
            {/* 中间栏 - 座位网格 */}
            <IdleHall 
              playerId={playerId} 
              player={player} 
              seats={seats} 
              setSeats={setSeats}
              setPlayer={setPlayer}
              playerRef={playerRef}
              activityStatus={activityStatus}
              setActivityStatus={setActivityStatus}
              activityStatusRef={activityStatusRef}
              enterActivity={enterActivity}
              leaveActivity={leaveActivity}
            />
            
            {/* 右侧栏容器 */}
            <div className="row-span-2 flex flex-col gap-4 h-full">
              <div className="flex-[2] min-h-0">
                <PlayerInfoCard 
                  player={player} 
                  earnings={earnings} 
                  earnTrigger={earnTrigger}
                  onOpenProfile={() => setShowProfile(true)}
                  playerId={playerId}
                />
              </div>
              <div className="flex-[4] min-h-0 overflow-hidden">
                <AnnouncementPanel playerId={playerId} />
              </div>
              <div className="flex-[4] min-h-0 overflow-hidden">
                <ArcadePanel 
                  playerId={playerId}
                  player={player}
                  setPlayer={setPlayer}
                  enterActivity={enterActivity}
                  leaveActivity={leaveActivity}
                />
              </div>
            </div>
            
            {/* 中间栏底部 - 光之冒险 */}
            <ActivityPanel />
            
          </div>
        </div>
        
        <StatusBar player={player} />
        
      {showProfile && (
        <ProfileModal 
          player={player} 
          onClose={() => setShowProfile(false)}
          onUpdateName={async (name) => {
            await playerApi.updateName(playerId, name);
            setPlayer({ ...player, name });
          }}
          onUpdateAvatar={async (avatar) => {
            await playerApi.updateAvatar(playerId, avatar);
            setPlayer({ ...player, avatar });
          }}
        />
      )}
        
        {showGacha && (
          <GachaModal 
            playerId={playerId}
            player={player}
            setPlayer={setPlayer}
            onClose={() => setShowGacha(false)}
          />
        )}
        
        {showTasks && (
          <TaskPanel 
            playerId={playerId}
            player={player}
            setPlayer={setPlayer}
            tasks={tasks}
            setTasks={setTasks}
            onClose={() => setShowTasks(false)}
          />
        )}

        {/* 新手引导 / 每日登录弹窗 */}
        {showOnboardingModal && (
          <OnboardingModal 
            type="onboarding"
            player={player}
            onClose={() => {
              setShowOnboardingModal(false);
              // 新手引导结束后，如果还有每日登录待显示，则显示
              if (player?.showDailyLogin) {
                setShowDailyLoginModal(true);
              }
            }}
          />
        )}

        {showDailyLoginModal && (
          <OnboardingModal 
            type="daily"
            player={{ ...player, announcement }}
            onClose={() => setShowDailyLoginModal(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
