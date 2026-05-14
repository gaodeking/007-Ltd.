import { useState, useEffect } from 'react';

// 对话内容配置
const onboardingDialogues = [
  "欢迎加入 007 公司，豆芽！我是这里的老板 **蒸馏桃子**。",
  "我们公司是**红玉海最豪华**，福利最好，员工最喜欢的公司。",
  "我们有丰厚的公司奖品，你可以用金币去【召唤之门】试试手气，说不定能抽到 SSR 大奖哦！",
  "你说你没钱？我当然知道你现在是个穷光蛋。看到那些工位了吗？**赶快去工作吧，工作才有金币！**",
  "只要你努力工作，老板我保证让你拿到手软！加油吧，**未来的五绝大慈大悲天阳马剑导！**"
];

const dailyDialogue = "早安，豆芽！新的一天，快打卡上班吧！";

function OnboardingModal({ type, player, onClose }) {
  const [step, setStep] = useState(0);
  const [isLastStep, setIsLastStep] = useState(false);

  // 每日登录模式直接进入最后一步（显示公告）
  useEffect(() => {
    if (type === 'daily') {
      setIsLastStep(true);
    }
  }, [type]);

  const handleNext = () => {
    if (type === 'onboarding') {
      if (step < onboardingDialogues.length - 1) {
        setStep(prev => prev + 1);
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // 渲染气泡内容（支持简单的 Markdown 加粗）
  const renderText = (text) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-[#d97706]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#fffbeb] rounded-2xl border-4 border-[#f59e0b]/30 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 顶部标题栏 */}
        <div className="bg-[#fef3c7] p-4 flex justify-between items-center border-b border-[#f59e0b]/20">
          <h2 className="text-xl font-bold text-[#d97706]">
            {type === 'onboarding' ? '🍑 老板的训话' : '🍑 每日问候'}
          </h2>
          {type === 'daily' && (
            <button onClick={onClose} className="text-[#92400e] hover:text-[#78350f] text-2xl font-bold">&times;</button>
          )}
        </div>

        {/* 内容区域 */}
        <div className="p-6 flex flex-col items-center gap-6 overflow-y-auto">
          
          {/* NPC 图片 */}
          <div className="relative">
            <img 
              src="/peach-box-npc.png" 
              alt="Distilled Peach Box" 
              className="w-40 h-auto drop-shadow-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/160x160/f59e0b/ffffff?text=🍑";
              }}
            />
            {/* 气泡尾巴 */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-[#fef3c7]"></div>
          </div>

          {/* 对话气泡 */}
          <div className="bg-[#fef3c7] border-2 border-[#f59e0b]/30 rounded-xl p-4 w-full relative">
            <div className="text-lg text-[#4a3a3a] leading-relaxed font-medium">
              {type === 'onboarding' ? renderText(onboardingDialogues[step]) : renderText(dailyDialogue)}
            </div>
          </div>

          {/* 每日登录：显示公告 */}
          {type === 'daily' && player?.announcement && (
            <div className="w-full bg-white rounded-xl border border-[#d4c8c8] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-[#d4a0a0] text-white text-xs rounded font-bold">
                  {player.announcement.version}
                </span>
                <span className="text-xs text-[#9ca3af]">
                  {new Date(player.announcement.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
              <p className="text-sm text-[#6b5b5b] whitespace-pre-wrap">{player.announcement.content}</p>
            </div>
          )}

        </div>

        {/* 底部按钮 */}
        <div className="bg-[#fef3c7] p-4 border-t border-[#f59e0b]/20 flex justify-center">
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl font-bold shadow-md transition-colors text-lg flex items-center gap-2"
          >
            {type === 'onboarding' && step < onboardingDialogues.length - 1 ? (
              <>下一步 ➡️</>
            ) : (
              <>开始工作 💪</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
