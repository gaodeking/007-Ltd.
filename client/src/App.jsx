import { useState, useEffect } from 'react';
import { playerApi, seatApi, gachaApi, taskApi } from './api';
import ErrorBoundary from './components/ErrorBoundary';
import CurrencyBar from './components/CurrencyBar';
import AdventurerBar from './components/AdventurerBar';
import IdleHall from './components/IdleHall';
import ActivityPanel from './components/ActivityPanel';
import ProfileModal from './components/ProfileModal';
import GachaModal from './components/GachaModal';
import TaskPanel from './components/TaskPanel';
import StatusBar from './components/StatusBar';

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
          money: playerData.money || 0,
          ticket: playerData.ticket || 0,
          hair: playerData.hair || 0,
          idleRate: playerData.idleRate || 10,
          bonus: playerData.bonus || 1.0,
          currentSeat: playerData.currentSeat || null,
          seatCooldown: playerData.seatCooldown || 0,
          totalIdleTime: playerData.totalIdleTime || 0,
          totalMoneyEarned: playerData.totalMoneyEarned || 0,
          totalGachaCount: playerData.totalGachaCount || 0,
          lastSave: playerData.lastSave || Math.floor(Date.now() / 1000),
        });
        localStorage.setItem('playerId', res.data.playerId);
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

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!playerId || !player) return;
    const saveInterval = setInterval(async () => {
      try {
        await playerApi.save(playerId, player);
      } catch (err) {
        console.error('Failed to save:', err);
      }
    }, 30000);
    return () => clearInterval(saveInterval);
  }, [playerId, player]);

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
      <div className="min-h-screen bg-[#f0ebe5] text-[#4a3a3a]">
        <CurrencyBar player={player} />
        <AdventurerBar player={player} onOpenProfile={() => setShowProfile(true)} />
        
        {/* 核心操作栏 */}
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-center gap-4">
            <button
              disabled={!!player.currentSeat}
              className={`flex-1 max-w-[200px] py-3 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2 text-white ${
                player.currentSeat 
                  ? 'bg-[#6aaa6a] cursor-not-allowed opacity-80' 
                  : 'bg-[#8fbc8f] hover:bg-[#7faa7f] cursor-pointer'
              }`}
            >
              <span className="text-xl">{player.currentSeat ? '🛌' : '🛏️'}</span>
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
              <span>每日任务</span>
            </button>
          </div>
        </div>
        
        <IdleHall 
          playerId={playerId} 
          player={player} 
          seats={seats} 
          setSeats={setSeats}
          setPlayer={setPlayer}
        />
        <ActivityPanel />
        <StatusBar player={player} />
        
        {showProfile && (
          <ProfileModal 
            player={player} 
            onClose={() => setShowProfile(false)}
            onUpdateName={async (name) => {
              await playerApi.updateName(playerId, name);
              setPlayer({ ...player, name });
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
            tasks={tasks}
            setTasks={setTasks}
            onClose={() => setShowTasks(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
