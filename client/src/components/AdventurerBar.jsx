function AdventurerBar({ player, onOpenProfile }) {
  return (
    <div className="bg-gradient-to-r from-[#faf5f5] to-[#f5f0f0] border-b border-[#d4c8c8] px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{player.avatar || '🧙‍♂️'}</span>
          <div>
            <span className="text-lg font-semibold">{player.name || '无名冒险者'}</span>
            <span className="text-sm text-[#8a7a7a] ml-2">部队: 加班007</span>
          </div>
        </div>
        <button
          onClick={onOpenProfile}
          className="px-4 py-2 bg-[#d4a0a0] hover:bg-[#c49090] text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        >
          📜 冒险者档案
        </button>
      </div>
    </div>
  );
}

export default AdventurerBar;
