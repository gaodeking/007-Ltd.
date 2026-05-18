import { useState } from 'react';

const AVATARS = [
  { emoji: '‍♂️', name: '法师' },
  { emoji: '🧝', name: '精灵' },
  { emoji: '', name: '吸血鬼' },
  { emoji: '🧟', name: '僵尸' },
  { emoji: '🧜', name: '人鱼' },
  { emoji: '', name: '仙子' },
  { emoji: '🧖', name: '蒸汽浴' },
  { emoji: '🧗', name: '攀岩' },
  { emoji: '🤹', name: '杂耍' },
  { emoji: '🧘', name: '瑜伽' },
  { emoji: '🐉', name: '巨龙' },
  { emoji: '', name: '狐狸' },
  { emoji: '🐱', name: '猫咪' },
  { emoji: '🐶', name: '狗狗' },
  { emoji: '', name: '狮子' },
];

function ProfileModal({ player, onClose, onUpdateName, onUpdateAvatar }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player.name);

  const handleSave = async () => {
    if (name.trim() && name.trim().length <= 6) {
      await onUpdateName(name.trim());
      setEditing(false);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}小时${m}分钟`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-[#d4c8c8] max-w-md w-full max-h-[80vh] overflow-y-auto shadow-lg">
        <div className="p-4 border-b border-[#d4c8c8] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#4a3a3a]"> 冒险者档案</h2>
          <button onClick={onClose} className="text-[#6b5b5b] hover:text-[#4a3a3a] text-2xl">&times;</button>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">{player.avatar || '‍♂️'}</div>
            {editing ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#f5f0f0] border border-[#d4c8c8] rounded px-3 py-1 text-center text-[#4a3a3a]"
                  maxLength={6}
                />
                <button onClick={handleSave} className="text-[#b76e79]">保存</button>
                <button onClick={() => { setEditing(false); setName(player.name); }} className="text-[#6b5b5b]">取消</button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-semibold text-[#4a3a3a]">{player.name}</span>
                <button onClick={() => setEditing(true)} className="text-sm text-[#b76e79]">改名</button>
              </div>
            )}
            <div className="text-sm text-[#6b5b5b] mt-1">部队: 加班007</div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-[#4a3a3a] text-center"> 选择头像</h3>
            <div className="grid grid-cols-5 gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a.emoji}
                  onClick={() => onUpdateAvatar(a.emoji)}
                  title={a.name}
                  className={`aspect-square rounded-lg flex items-center justify-center text-3xl transition-all hover:scale-110 ${
                    player.avatar === a.emoji
                      ? 'ring-2 ring-[#b76e79] bg-[#f5e8e8]'
                      : 'bg-[#f5f0f0] hover:bg-[#faf5f5]'
                  }`}
                >
                  {a.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#f5f0f0] rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-[#4a3a3a]"> 冒险者信息</h3>
              <div className="space-y-1 text-sm text-[#6b5b5b]">
                <div>等级: 1</div>
                <div>总挂机时长: {formatTime(player.totalIdleTime)}</div>
                <div>累计金币: {player.totalMoneyEarned.toLocaleString()}</div>
                <div>抽奖次数: {player.totalgachacount || player.totalGachaCount || 0}</div>
                <div>成就: 0/50</div>
              </div>
            </div>

            <div className="bg-[#f5f0f0] rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-[#4a3a3a]">🏅 称号</h3>
              <div className="text-sm text-[#6b5b5b]">[无] (完成成就解锁)</div>
            </div>

            <div className="bg-[#f5f0f0] rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-[#4a3a3a]">️ 战斗记录</h3>
              <div className="text-sm text-[#6b5b5b]">(待解锁)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
