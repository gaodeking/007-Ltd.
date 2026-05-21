import { useState } from 'react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function StockCard({ stock, holding, onBuy, onSell }) {
  const [quantity, setQuantity] = useState('');
  
  const isUp = stock.current_price >= stock.center_price;
  const changePercent = ((stock.current_price - stock.center_price) / stock.center_price * 100).toFixed(1);
  const colorClass = isUp ? 'text-red-500' : 'text-green-500';
  const arrow = isUp ? '▲' : '▼';
  
  // Calculate Profit/Loss
  const holdingValue = holding.quantity * stock.current_price;
  const costValue = holding.quantity * holding.avg_cost;
  const profit = holdingValue - costValue;
  const profitPercent = holding.avg_cost > 0 ? (profit / costValue) * 100 : 0;
  const isProfit = profit >= 0;

  // Position Limit Check
  const MAX_HOLDING = 500;
  const remainingCapacity = MAX_HOLDING - holding.quantity;
  const isAtCeiling = stock.current_price >= Math.floor(stock.center_price * 2.0);

  // Prepare chart data
  const chartData = stock.history.map(h => ({
    time: new Date(h.timestamp * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    price: h.price
  }));

  const maxBuy = Math.floor(stock.current_price > 0 ? 100000 / stock.current_price : 0); // Placeholder logic, actual max buy depends on player money which is passed via parent or context, but for simplicity we use a large number or calculate in parent. 
  // Actually, let's just use the input for quantity.
  
  const handleBuyClick = () => {
    const qty = parseInt(quantity);
    if (qty > 0) {
      if (qty > remainingCapacity) {
        alert(`单只股票持仓上限 ${MAX_HOLDING} 股，还可买入 ${remainingCapacity} 股`);
        return;
      }
      if (isAtCeiling) {
        alert('股价已触顶，请等待回落后再买入');
        return;
      }
      onBuy(stock.id, qty);
      setQuantity('');
    }
  };

  const handleSellClick = () => {
    const qty = parseInt(quantity);
    if (qty > 0 && qty <= holding.quantity) {
      onSell(stock.id, qty);
      setQuantity('');
    }
  };

  const setPercent = (pct) => {
    if (pct === 100) {
      // For buy, we can't easily calc max here without player money prop, so we just set a high number or rely on user input.
      // For sell, 100% of holding.
      if (holding.quantity > 0) setQuantity(holding.quantity.toString());
    } else {
      // Approximate for buy based on center price? No, better to just let user type or use fixed amounts.
      // Let's implement 10%, 50%, 100% for SELL only for now, or simple increments.
      // To keep it simple: 10%, 50%, 100% of holding for sell.
      if (holding.quantity > 0) {
        setQuantity(Math.floor(holding.quantity * pct / 100).toString());
      }
    }
  };

  return (
    <div className={`border rounded-lg p-4 flex flex-col ${stock.is_circuit_breaker ? 'border-red-400 bg-red-50' : 'border-[#d4c8c8] bg-[#f5f0f0]'}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-[#4a3a3a]">{stock.name}</h3>
          <span className="text-xs text-[#6b5b5b] font-mono">{stock.id}</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-[#4a3a3a]">{stock.current_price.toLocaleString()}</div>
          <div className={`text-sm font-semibold ${colorClass}`}>
            {arrow} {changePercent}%
          </div>
        </div>
      </div>

      {/* K-Line Chart */}
      <div className="h-24 w-full mb-3 bg-white rounded border border-[#e8e0e0] p-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <XAxis dataKey="time" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip 
              contentStyle={{ fontSize: '12px', padding: '4px' }}
              formatter={(value) => [value, '价格']}
              labelFormatter={() => ''}
            />
            <ReferenceLine y={stock.center_price} stroke="#9ca3af" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="price" stroke={isUp ? '#ef4444' : '#22c55e'} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Holding Info */}
      <div className="text-xs text-[#6b5b5b] mb-3 space-y-1">
        <div className="flex justify-between">
          <span>持有:</span>
          <span className="font-medium text-[#4a3a3a]">{holding.quantity} / {MAX_HOLDING} 股</span>
        </div>
        {holding.quantity > 0 && (
          <>
            <div className="flex justify-between">
              <span>成本:</span>
              <span>{holding.avg_cost}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>盈亏:</span>
              <span className={isProfit ? 'text-red-500' : 'text-green-500'}>
                {isProfit ? '+' : ''}{profit.toLocaleString()} ({isProfit ? '+' : ''}{profitPercent.toFixed(1)}%)
              </span>
            </div>
          </>
        )}
        {stock.is_circuit_breaker && (
          <div className="text-red-500 font-bold text-center mt-1">⚠️ 熔断中，暂停买入</div>
        )}
        {isAtCeiling && !stock.is_circuit_breaker && (
          <div className="text-orange-500 font-bold text-center mt-1">🚫 股价触顶，暂停买入</div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-auto space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="数量"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="flex-1 px-2 py-1 border border-[#d4c8c8] rounded text-sm focus:outline-none focus:border-[#b76e79]"
            disabled={stock.is_circuit_breaker}
          />
          <button
            onClick={() => setPercent(100)}
            className="px-2 py-1 bg-[#e5e0e0] hover:bg-[#d4c8c8] rounded text-xs text-[#4a3a3a]"
          >
            全仓
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBuyClick}
            disabled={stock.is_circuit_breaker || isAtCeiling || !quantity}
            className="flex-1 py-2 bg-[#8fbc8f] hover:bg-[#7faa7f] disabled:opacity-50 disabled:cursor-not-allowed rounded text-white text-sm font-semibold"
          >
            买入
          </button>
          <button
            onClick={handleSellClick}
            disabled={!quantity || holding.quantity === 0}
            className="flex-1 py-2 bg-[#d4a0a0] hover:bg-[#c49090] disabled:opacity-50 disabled:cursor-not-allowed rounded text-white text-sm font-semibold"
          >
            卖出
          </button>
        </div>
      </div>
    </div>
  );
}

export default StockCard;
