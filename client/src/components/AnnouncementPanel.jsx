import { useState, useEffect } from 'react';
import { announcementApi } from '../api';
import BugReportModal from './BugReportModal';

function AnnouncementPanel({ playerId }) {
  const [showBugModal, setShowBugModal] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await announcementApi.getLatest();
        setAnnouncement(res.data);
      } catch (err) {
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-[#d4c8c8] p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
          <h3 className="text-lg font-bold text-[#4a3a3a]">📢 公告</h3>
          <button
            onClick={() => setShowBugModal(true)}
            className="px-3 py-1 text-sm bg-[#f5f0f0] hover:bg-[#e5e0e0] border border-[#d4c8c8] rounded-lg text-[#4a3a3a] font-semibold transition-colors flex items-center gap-1"
          >
            🐛 上报 Bug
          </button>
        </div>
        
        <div className="text-sm text-[#6b5b5b] bg-[#f5f0f0] rounded-lg p-3 flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <span className="text-[#9ca3af]">加载中...</span>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : !announcement ? (
            <span className="text-[#9ca3af]">暂无公告</span>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#d4a0a0] text-white text-xs rounded font-bold">
                  {announcement.version}
                </span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{announcement.content}</p>
              <div className="text-xs text-[#9ca3af] text-right">
                 {formatTime(announcement.created_at)}
              </div>
            </div>
          )}
        </div>
      </div>

      {showBugModal && (
        <BugReportModal
          playerId={playerId}
          onClose={() => setShowBugModal(false)}
        />
      )}
    </>
  );
}

export default AnnouncementPanel;
