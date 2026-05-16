import { useEffect } from 'react';

// 将样式函数提取到外部
const getRarityStyle = (rarity) => {
  switch (rarity) {
    case 'ssr': return { bg: 'from-[#f59e0b] to-[#d97706]', text: 'text-white', badge: 'bg-[#f59e0b]' };
    case 'sr': return { bg: 'from-[#a855f7] to-[#7e22ce]', text: 'text-white', badge: 'bg-[#a855f7]' };
    case 'r': return { bg: 'from-[#3b82f6] to-[#1d4ed8]', text: 'text-white', badge: 'bg-[#3b82f6]' };
    default: return { bg: 'from-[#f3f4f6] to-[#e5e7eb]', text: 'text-[#6b7280]', badge: 'bg-[#9ca3af]' };
  }
};

// 将 Card 组件提取到外部，防止父组件更新导致重新挂载和动画重置
const Card = ({ item, index }) => {
  const style = getRarityStyle(item.item.rarity);
  return (
    <div className="perspective-1000 w-32 h-40">
      <div 
        className="relative w-full h-full transition-transform duration-700 transform-style-3d animate-flip-reveal"
        style={{ 
          animationDelay: `${index * 0.1}s`, 
          animationFillMode: 'forwards',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Back (Gray) */}
        <div className="absolute inset-0 bg-gray-300 rounded-xl backface-hidden flex items-center justify-center border-2 border-gray-400" style={{ backfaceVisibility: 'hidden' }}>
          <span className="text-4xl text-gray-400 font-bold">?</span>
        </div>
        
        {/* Front (Result) - Initially rotated 180deg */}
        <div 
          className="absolute inset-0 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg rotate-y-180"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
            '--tw-gradient-from': style.bg.includes('#f59e0b') ? '#f59e0b' : 
                                  style.bg.includes('#a855f7') ? '#a855f7' : 
                                  style.bg.includes('#3b82f6') ? '#3b82f6' : '#f3f4f6',
            '--tw-gradient-to': style.bg.includes('#d97706') ? '#d97706' : 
                                style.bg.includes('#7e22ce') ? '#7e22ce' : 
                                style.bg.includes('#1d4ed8') ? '#1d4ed8' : '#e5e7eb',
          }}
        >
          <div className="absolute top-2 right-2 z-10">
            <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${style.badge} shadow-sm`}>
              {item.item.rarity.toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center h-full p-2 text-center relative z-10">
            <span className="text-4xl mb-2 drop-shadow-md">{item.item.emoji}</span>
            <span className={`font-bold text-sm ${style.text} drop-shadow-md leading-tight`}>{item.item.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function GachaResultModal({ results, pullCount, playerMoney, onClose, onPullAgain }) {
  const rarityOrder = { ssr: 4, sr: 3, r: 2, n: 1 };
  const maxRarity = results.reduce((max, item) => 
    rarityOrder[item.item.rarity] > rarityOrder[max.item.rarity] ? item : max
  , results[0]);

  const cost = pullCount === 10 ? 6480 : 720 * pullCount;
  const canAffordAgain = playerMoney >= cost;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#fffbeb] rounded-2xl border-4 border-[#f59e0b]/30 max-w-3xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#fef3c7] p-4 flex justify-between items-center border-b border-[#f59e0b]/20">
          <h2 className="text-2xl font-bold text-[#d97706] flex items-center gap-2">
            ✨ {maxRarity.item.rarity.toUpperCase()}!
          </h2>
          <button onClick={onClose} className="text-[#92400e] hover:text-[#78350f] text-3xl font-bold">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`flex flex-wrap gap-4 justify-center ${pullCount === 1 ? 'py-8' : 'grid grid-cols-5 gap-4'}`}>
            {results.map((item, idx) => (
              <div key={idx} className={pullCount === 1 ? 'flex justify-center' : ''}>
                <Card item={item} index={idx} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#fef3c7] p-4 flex justify-between items-center border-t border-[#f59e0b]/20">
          <div className="text-lg font-bold text-[#b45309]">
            💰 余额：{playerMoney.toLocaleString()}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onPullAgain}
              disabled={!canAffordAgain}
              className={`px-6 py-2 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2 ${
                canAffordAgain 
                  ? 'bg-[#f97316] hover:bg-[#ea580c] text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!canAffordAgain ? '金币不足' : ''}
            >
              🔄 再来一次
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white hover:bg-gray-50 text-[#4a3a3a] border border-[#d4c8c8] rounded-lg font-bold shadow-sm transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GachaResultModal;
