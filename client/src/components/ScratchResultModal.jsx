function ScratchResultModal({ result, onPlayAgain, onLeave }) {
  const tierNames = ['未中奖', '二等奖', '一等奖'];
  const tierColors = ['text-[#6b5b5b]', 'text-[#3b82f6]', 'text-[#f59e0b]'];
  const tierEmojis = ['', '🎉', '🎊'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
        <div className="text-4xl mb-3">{tierEmojis[result.tier]}</div>
        <h3 className={`text-xl font-bold mb-2 ${tierColors[result.tier]}`}>
          {tierNames[result.tier]}
        </h3>
        
        {result.tier > 0 ? (
          <p className="text-2xl font-bold text-[#8fbc8f] mb-2">
            +{result.prize} 金币
          </p>
        ) : (
          <p className="text-lg text-[#6b5b5b] mb-2">
            下次一定！
          </p>
        )}
        
        <p className="text-sm text-[#6b5b5b] mb-6">
          本局净收益：{result.netProfit >= 0 ? '+' : ''}{result.netProfit} 金币
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onLeave}
            className="flex-1 py-2 bg-[#d4a0a0] hover:bg-[#c49090] rounded-lg text-white"
          >
            离开
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-2 bg-[#8fbc8f] hover:bg-[#7faa7f] rounded-lg text-white"
          >
            再刮一张
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScratchResultModal;
