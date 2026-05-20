import { useState, useEffect } from 'react';
import { stockApi } from '../api';
import StockCard from './StockCard';

function StockModal({ playerId, player, setPlayer, onClose }) {
  const [stocks, setStocks] = useState([]);
  const [holdings, setHoldings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const res = await stockApi.getStocks();
      setStocks(res.data.stocks);
      
      // Transform holdings array to map for easy lookup
      const holdingsMap = {};
      res.data.holdings.forEach(h => {
        holdingsMap[h.stock_id] = h;
      });
      setHoldings(holdingsMap);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load stocks:', err);
      setError('加载失败: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBuy = async (stockId, quantity) => {
    try {
      await stockApi.buy(playerId, stockId, quantity);
      // Refresh data after buy
      await fetchData();
      // Update local player money (approximate, will sync on auto-save)
      const stock = stocks.find(s => s.id === stockId);
      if (stock) {
        setPlayer(prev => ({
          ...prev,
          money: prev.money - (stock.current_price * quantity)
        }));
      }
    } catch (err) {
      alert(err.response?.data?.error || '买入失败');
    }
  };

  const handleSell = async (stockId, quantity) => {
    try {
      const res = await stockApi.sell(playerId, stockId, quantity);
      // Refresh data after sell
      await fetchData();
      // Update local player money
      setPlayer(prev => ({
        ...prev,
        money: prev.money + res.data.netProceeds
      }));
    } catch (err) {
      alert(err.response?.data?.error || '卖出失败');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-[#d4c8c8] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-4 border-b border-[#d4c8c8] flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-[#4a3a3a]"> 艾欧泽亚证券交易所</h2>
          <button onClick={onClose} className="text-[#6b5b5b] hover:text-[#4a3a3a] text-2xl">&times;</button>
        </div>

        {/* Asset Info Bar */}
        <div className="px-4 py-3 bg-[#f5f0f0] border-b border-[#d4c8c8] flex justify-around text-sm flex-shrink-0">
          <div>
            <span className="text-[#6b5b5b]">持有金币:</span>
            <span className="ml-2 font-bold text-[#b76e79]">{player.money.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[#6b5b5b]">持仓市值:</span>
            <span className="ml-2 font-bold text-[#4a3a3a]">
              {stocks.reduce((sum, s) => sum + ((holdings[s.id]?.quantity || 0) * s.current_price), 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Stock Grid */}
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-10 text-[#6b5b5b]">加载中...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stocks.map(stock => (
                <StockCard
                  key={stock.id}
                  stock={stock}
                  holding={holdings[stock.id] || { quantity: 0, avg_cost: 0 }}
                  onBuy={handleBuy}
                  onSell={handleSell}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockModal;
