function ScratchCardGame({ grid, revealed, revealedCount, loading, onReveal }) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {grid.map((row, r) =>
          row.map((emoji, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => onReveal(r, c)}
              disabled={revealed?.[r]?.[c] || revealedCount >= 3 || loading}
              className={`aspect-square rounded-lg text-3xl flex items-center justify-center transition-all duration-300 ${
                revealed?.[r]?.[c]
                  ? 'bg-[#f5f0f0] scale-105'
                  : 'bg-[#e8e0e0] hover:bg-[#d8d0d0] cursor-pointer'
              }`}
            >
              {revealed?.[r]?.[c] ? emoji : '?'}
            </button>
          ))
        )}
      </div>
      
      <div className="text-center text-sm text-[#6b5b5b]">
        已揭开：{revealedCount}/3
      </div>
    </div>
  );
}

export default ScratchCardGame;
