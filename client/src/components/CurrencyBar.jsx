function CurrencyBar({ player }) {
  return (
    <div className="bg-white border-b border-[#d4c8c8] px-4 py-3 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="text-lg font-bold text-[#b76e79]">⚜️ 加班007 部队大厅</div>
        <div className="flex items-center gap-1 text-[#4a3a3a] font-semibold">
          <span className="text-xl">💰</span>
          <span>{(player.money || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default CurrencyBar;
