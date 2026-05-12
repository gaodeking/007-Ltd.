function CurrencyBar({ player }) {
  return (
    <div className="bg-white border-b border-[#e8e0e0] px-4 py-3 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="text-lg font-bold text-[#b76e79]">⚜️ 加班007 部队大厅</div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1">💰 {(player.money || 0).toLocaleString()}</span>
          <span className="flex items-center gap-1">🎫 {player.ticket || 0}</span>
          <span className="flex items-center gap-1">💎 {player.hair || 0}</span>
        </div>
      </div>
    </div>
  );
}

export default CurrencyBar;
