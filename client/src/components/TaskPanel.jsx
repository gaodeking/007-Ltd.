import { useState } from 'react';
import { taskApi } from '../api';

function TaskPanel({ playerId, tasks, setTasks, onClose }) {
  const [claiming, setClaiming] = useState(null);

  const handleClaim = async (taskId, reward) => {
    setClaiming(taskId);
    try {
      await taskApi.claim(playerId, taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, claimed: 1 } : t));
    } catch (err) {
      console.error('Claim failed:', err);
    } finally {
      setClaiming(null);
    }
  };

  const parseReward = (rewardStr) => {
    try {
      const reward = JSON.parse(rewardStr);
      return Object.entries(reward).map(([key, val]) => {
        const icons = { money: '💰', ticket: '🎫', hair: '💎' };
        return `${icons[key] || key}×${val}`;
      }).join(' ');
    } catch {
      return rewardStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-[#d4c8c8] max-w-md w-full shadow-lg">
        <div className="p-4 border-b border-[#d4c8c8] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#4a3a3a]"> 每日任务</h2>
          <button onClick={onClose} className="text-[#6b5b5b] hover:text-[#4a3a3a] text-2xl">&times;</button>
        </div>
        
        <div className="p-4 space-y-3">
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
                      onClick={() => handleClaim(task.id, task.reward)}
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
    </div>
  );
}

export default TaskPanel;
