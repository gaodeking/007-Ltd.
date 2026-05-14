import { useState } from 'react';
import { bugApi } from '../api';

function BugReportModal({ playerId, onClose }) {
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (description.trim().length < 5) {
      setError('请至少输入 5 个字符');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      await bugApi.report(playerId, description);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-[#d4c8c8] max-w-md w-full shadow-lg">
        <div className="p-4 border-b border-[#d4c8c8] flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#4a3a3a]">🐛 上报 Bug</h2>
          <button onClick={onClose} className="text-[#6b5b5b] hover:text-[#4a3a3a] text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-[#4a3a3a] font-bold">感谢反馈！</p>
              <p className="text-sm text-[#6b5b5b] mt-1">我们会尽快处理</p>
            </div>
          ) : (
            <>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请描述你遇到的 Bug（例如：点击 XX 按钮无反应）"
                className="w-full h-32 p-3 border border-[#d4c8c8] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#d4a0a0] text-sm"
                disabled={submitting}
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 bg-white border border-[#d4c8c8] rounded-lg text-[#4a3a3a] hover:bg-gray-50"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting || description.trim().length < 5}
                  className="flex-1 py-2 bg-[#d4a0a0] hover:bg-[#c49090] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-semibold"
                >
                  {submitting ? '提交中...' : '提交'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default BugReportModal;
