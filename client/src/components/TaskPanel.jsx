import { useState, useEffect } from 'react';
import { taskApi } from '../api';

function TaskPanel({ playerId, player, setPlayer, tasks, setTasks, onClose }) {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'achievements'
  const [clockIn, setClockIn] = useState({ count: 0, daysInMonth: 30, clockedInToday: false });
  const [achievements, setAchievements] = useState([]);
  const [claiming, setClaiming] = useState(null);
  const [clockingIn, setClockingIn] = useState(false);

  useEffect(() => {
    if (activeTab === 'daily') {
      loadClockIn();
      loadTasks();
    } else {
      loadAchievements();
    }
  }, [activeTab, playerId]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const loadTasks = async () => {
    if (!playerId) return;
    try {
      const res = await taskApi.getTasks(playerId);
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const loadClockIn = async () => {
    try {
      const res = await taskApi.getClockIn(playerId);
      setClockIn(res.data);
    } catch (err) {
      console.error('Failed to load clock-in:', err);
    }
  };

  const loadAchievements = async () => {
    try {
      await taskApi.checkAchievements(playerId);
      const res = await taskApi.getAchievements(playerId);
      setAchievements(res.data);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    }
  };

  const handleClockIn = async () => {
    setClockingIn(true);
    try {
      const res = await taskApi.clockIn(playerId);
      setClockIn({ ...res.data, clockedInToday: true });
      // Update local player state to reflect gold gain immediately
      setPlayer(prev => ({ ...prev, money: prev.money + 50 }));
    } catch (err) {
      const errorMsg = err.response?.data?.error || '打卡失败，请重试';
      alert(errorMsg);
      console.error('Clock-in failed:', err);
    } finally {
      setClockingIn(false);
    }
  };

  const handleClaimTask = async (taskId) => {
    setClaiming(taskId);
    try {
      await taskApi.claim(playerId, taskId);
      // Refresh task list to get latest state from server
      await loadTasks();
    } catch (err) {
      const errorMsg = err.response?.data?.error || '领取失败，请重试';
      alert(errorMsg);
    } finally {
      setClaiming(null);
    }
  };

  const handleClaimAchievement = async (id) => {
    setClaiming(id);
    try {
      await taskApi.claimAchievement(playerId, id);
      setAchievements(prev => prev.map(a => a.id === id ? { ...a, claimed: true } : a));
    } catch (err) {
      console.error('Claim achievement failed:', err);
    } finally {
      setClaiming(null);
    }
  };

  const parseReward = (rewardStr) => {
    try {
      const reward = JSON.parse(rewardStr);
      return Object.entries(reward).map(([key, val]) => {
        const icons = { money: '💰' };
        return `${icons[key] || key}×${val}`;
      }).join(' ');
    } catch {
      return rewardStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-xl border border-[#d4c8c8] max-w-md w-full shadow-lg flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-[#d4c8c8] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#4a3a3a]">📋 上班打卡</h2>
          <button onClick={onClose} className="text-[#6b5b5b] hover:text-[#4a3a3a] text-2xl">&times;</button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-[#d4c8c8]">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'daily' ? 'text-[#d4a0a0] border-b-2 border-[#d4a0a0]' : 'text-[#6b5b5b] hover:text-[#4a3a3a]'}`}
          >
            每日任务
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'achievements' ? 'text-[#d4a0a0] border-b-2 border-[#d4a0a0]' : 'text-[#6b5b5b] hover:text-[#4a3a3a]'}`}
          >
            成就
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'daily' ? (
            <div className="space-y-4">
              {/* Clock In Section */}
              <div className="bg-[#f5f0f0] rounded-lg p-4 border border-[#d4c8c8] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#4a3a3a]">📅 本月打卡</div>
                  <div className="text-sm text-[#6b5b5b]">{clockIn.count} / {clockIn.daysInMonth} 天</div>
                </div>
                {clockIn.clockedInToday ? (
                  <span className="px-3 py-1 bg-[#8fbc8f] text-white rounded text-sm">今日已打卡</span>
                ) : (
                  <button
                    onClick={handleClockIn}
                    disabled={clockingIn}
                    className="px-3 py-1 bg-[#d4a0a0] hover:bg-[#c49090] text-white rounded text-sm disabled:opacity-50"
                  >
                    {clockingIn ? '打卡中...' : '打卡 (+50 金币)'}
                  </button>
                )}
              </div>

              {/* Daily Tasks List */}
              <div className="space-y-3">
                {tasks.map((task) => {
                  const progress = Math.min(task.progress, task.target);
                  const completed = progress >= task.target;
                  const claimed = task.claimed;
                  
                  return (
                    <div key={task.id} className="bg-[#f5f0f0] rounded-lg p-4 border border-[#d4c8c8]">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-[#4a3a3a]">{task.description}</span>
                        <span className="text-sm text-[#6b5b5b]">{parseReward(task.reward)}</span>
                      </div>
                      <div className="w-full bg-[#d4c8c8] rounded-full h-2 mb-2">
                        <div 
                          className="bg-[#d4a0a0] h-2 rounded-full transition-all"
                          style={{ width: `${(progress / task.target) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#6b5b5b]">{progress}/{task.target}</span>
                        {claimed ? (
                          <span className="text-[#8fbc8f]">已领取</span>
                        ) : completed ? (
                          <button
                            onClick={() => handleClaimTask(task.id)}
                            disabled={claiming === task.id}
                            className="px-3 py-1 bg-[#d4a0a0] hover:bg-[#c49090] rounded text-sm disabled:opacity-50 text-white"
                          >
                            领取
                          </button>
                        ) : (
                          <span className="text-[#6b5b5b]">未完成</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Achievements List */
            <div className="space-y-3">
              {achievements.map((a) => {
                const progress = Math.min(a.currentValue, a.condition_value);
                const percent = (progress / a.condition_value) * 100;
                
                return (
                  <div key={a.id} className={`rounded-lg p-4 border transition-all ${a.claimed ? 'bg-[#f5f5f5] border-[#e0e0e0] opacity-70' : a.isUnlocked ? 'bg-[#fef3c7] border-[#f59e0b]' : 'bg-[#f5f0f0] border-[#d4c8c8]'}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{a.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[#4a3a3a]">{a.name}</span>
                          <span className="text-xs text-[#6b5b5b]">💰 {a.reward_money}</span>
                        </div>
                        <div className="text-xs text-[#6b5b5b] mb-2">{a.description}</div>
                        
                        <div className="w-full bg-[#d4c8c8] rounded-full h-1.5 mb-2">
                          <div 
                            className={`h-1.5 rounded-full transition-all ${a.isUnlocked ? 'bg-[#f59e0b]' : 'bg-[#d4a0a0]'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#6b5b5b]">{progress}/{a.condition_value}</span>
                          {a.claimed ? (
                            <span className="text-[#8fbc8f] font-medium">已领取</span>
                          ) : a.isUnlocked ? (
                            <button
                              onClick={() => handleClaimAchievement(a.id)}
                              disabled={claiming === a.id}
                              className="px-2 py-0.5 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded text-xs disabled:opacity-50"
                            >
                              {claiming === a.id ? '领取中...' : '领取'}
                            </button>
                          ) : (
                            <span className="text-[#6b5b5b]">未解锁</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskPanel;
