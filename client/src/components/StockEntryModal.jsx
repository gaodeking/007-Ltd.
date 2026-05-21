import { useState } from 'react';

function StockEntryModal({ player, holdings = [], onEnter, onClose }) {
  const ENTRY_COST = 100000;
  const hasHoldings = holdings.length > 0;
  const hasEnoughMoney = player.money >= ENTRY_COST;
  const canEnter = hasHoldings || hasEnoughMoney;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-[#d4c8c8] max-w-md w-full shadow-lg flex flex-col">
        <div className="p-4 border-b border-[#d4c8c8] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#4a3a3a]">🔮 神秘入口</h2>
          <button onClick={onClose} className="text-[#6b5b5b] hover:text-[#4a3a3a] text-2xl">&times;</button>
        </div>
        
        <div className="p-6 flex flex-col items-center text-center">
          {!canEnter ? (
            <>
              <span className="text-4xl mb-4">💸</span>
              <p className="text-[#4a3a3a] font-semibold mb-2">资金不足</p>
              <p className="text-sm text-[#6b5b5b] mb-4">
                进入股市需要持有至少 <span className="font-bold text-[#b76e79]">{ENTRY_COST.toLocaleString()}</span> 金币。
              </p>
              <p className="text-xs text-[#9ca3af]">当前持有: {player.money.toLocaleString()}</p>
            </>
          ) : hasHoldings ? (
            <>
              <span className="text-4xl mb-4">📈</span>
              <p className="text-[#4a3a3a] font-semibold mb-2">欢迎回来</p>
              <p className="text-sm text-[#6b5b5b] mb-4">
                您持有股票，可随时返回股市继续交易。<br/>
                <span className="text-xs text-[#9ca3af]">注意：盈利超过 10 万金币将触发 5% 阶梯税</span>
              </p>
            </>
          ) : (
            <>
              <span className="text-4xl mb-4">⚠️</span>
              <p className="text-[#4a3a3a] font-semibold mb-2">风险提示</p>
              <p className="text-sm text-[#6b5b5b] mb-4">
                股市有风险，入市需谨慎。<br/>
                单只股票持仓上限 500 股，盈利将扣除阶梯税。
              </p>
            </>
          )}
        </div>

        <div className="p-4 border-t border-[#d4c8c8] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#f5f0f0] hover:bg-[#e5e0e0] border border-[#d4c8c8] rounded-lg text-[#4a3a3a] font-semibold transition-colors"
          >
            {canEnter ? '取消' : '关闭'}
          </button>
          {canEnter && (
            <button
              onClick={onEnter}
              className="px-4 py-2 bg-[#b76e79] hover:bg-[#a75e69] rounded-lg text-white font-semibold transition-colors"
            >
              确认进入
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockEntryModal;
