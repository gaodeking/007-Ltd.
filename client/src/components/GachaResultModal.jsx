import { useState, useEffect } from 'react';

function GachaResultModal({ results, pullCount, playerMoney, onClose, onPullAgain }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  const rarityOrder = { ssr: 4, sr: 3, r: 2, n: 1 };
  const maxRarity = results.reduce((max, item) => 
    rarityOrder[item.item.rarity] > rarityOrder[max.item.rarity] ? item : max
  , results[0]);

  const getRarityStyle = (rarity) => {
    switch (rarity) {
      case 'ssr': return { bg: 'from-[#f59e0b] to-[#d97706]', text: 'text-white', badge: 'bg-[#f59e0b]' };
      case 'sr': return { bg: 'from-[#a855f7] to-[#7e22ce]', text: 'text-white', badge: 'bg-[#a855f7]' };
      case 'r': return { bg: 'from-[#3b82f6] to-[#1d4ed8]', text: 'text-white', badge: 'bg-[#3b82f6]' };
      default: return { bg: 'from-[#f3f4f6] to-[#e5e7eb]', text: 'text-[#6b7280]', badge: 'bg-[#9ca3af]' };
    }
  };

  const Card = ({ item, index, isSingle }) => {
    const style = getRarityStyle(item.item.rarity);
    return (
      <div 
        className={`relative rounded-xl overflow-hidden shadow-lg border-2 border-white/20 animate-flip-in ${isSingle ? 'w-48 h-64' : 'w-32 h-40'}`}
        style={{ 
          animationDelay: `${index * 0.1}s`,
          background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
          '--tw-gradient-from': style.bg.includes('#f59e0b') ? '#f59e0b' : 
                                style.bg.includes('#a855f7') ? '#a855f7' : 
                                style.bg.includes('#3b82f6') ? '#3b82f6' : '#f3f4f6',
          '--tw-gradient-to': style.bg.includes('#d97706') ? '#d97706' : 
                              style.bg.includes('#7e22ce') ? '#7e22ce' : 
                              style.bg.includes('#1d4ed8') ? '#1d4ed8' : '#e5e7eb',
        }}
      >
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${style.badge}`}>
            {item.item.rarity.toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center h-full p-2 text-center">
          <span className="text-4xl mb-2 drop-shadow-md">{item.item.emoji}</span>
          <span className={`font-bold text-sm ${style.text} drop-shadow-md`}>{item.item.name}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#fffbeb] rounded-2xl border-4 border-[#f59e0b]/30 max-w-2xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#fef3c7] p-4 flex justify-between items-center border-b border-[#f59e0b]/20">
          <h2 className="text-2xl font-bold text-[#d97706] flex items-center gap-2">
            ✨ {maxRarity.item.rarity.toUpperCase()}!
          </h2>
          <button onClick={onClose} className="text-[#92400e] hover:text-[#78350f] text-3xl font-bold">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`flex flex-wrap gap-4 justify-center ${pullCount === 1 ? 'py-8' : ''}`}>
            {results.map((item, idx) => (
              <Card key={idx} item={item} index={idx} isSingle={pullCount === 1} />
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
              className="px-6 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
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
