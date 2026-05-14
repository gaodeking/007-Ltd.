import { useState } from 'react';
import BugReportModal from './BugReportModal';

function AnnouncementPanel({ playerId }) {
  const [showBugModal, setShowBugModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl border border-[#d4c8c8] p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-[#4a3a3a]">📢 公告</h3>
          <button
            onClick={() => setShowBugModal(true)}
            className="px-3 py-1 text-sm bg-[#f5f0f0] hover:bg-[#e5e0e0] border border-[#d4c8c8] rounded-lg text-[#4a3a3a] font-semibold transition-colors flex items-center gap-1"
          >
            🐛 上报 Bug
          </button>
        </div>
        <div className="text-sm text-[#6b5b5b] bg-[#f5f0f0] rounded-lg p-3">
          这是一个公告
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
