import { useState, useEffect } from 'react';
import { scratchApi } from '../api';

function ScratchEarningsModal({ onClose }) {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const res = await scratchApi.getEarnings();
      setEarnings(res.data.earnings);
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const isPositive = earnings >= 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold mb-4 text-center">📊 仙人彩收益</h3>
        
        {loading ? (
          <div className="text-center py-8 text-[#6b5b5b]">加载中...</div>
        ) : (
          <div className="text-center mb-6">
            <div className={`text-3xl font-bold ${isPositive ? 'text-[#8fbc8f]' : 'text-[#d4a0a0]'}`}>
              {isPositive ? '+' : ''}{earnings} 金币
            </div>
            <p className="text-sm text-[#6b5b5b] mt-2">
              {isPositive ? '🎉 恭喜盈利！' : '💪 继续加油！'}
            </p>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="w-full py-2 bg-[#7b9ec4] hover:bg-[#6b8eb4] rounded-lg text-white"
        >
          关闭
        </button>
      </div>
    </div>
  );
}

export default ScratchEarningsModal;
