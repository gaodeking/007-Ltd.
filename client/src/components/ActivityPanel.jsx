function ActivityPanel() {
  const activities = [
    { id: 'dragon', emoji: '🐉', name: '歼灭战', desc: '讨伐巨龙', status: '即将开放' },
    { id: 'supply', emoji: '📦', name: '部队补给', desc: '物资筹集', status: '即将开放' },
    { id: 'toilet', emoji: '🚽', name: '厕所歼殛战', desc: '???', status: '即将开放' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <h2 className="text-lg font-bold mb-3 text-[#4a3a3a]">✨ 光之冒险</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="min-w-[140px] bg-white rounded-xl border border-[#d4c8c8] p-4 flex flex-col items-center hover:border-[#d4a0a0] transition-colors cursor-not-allowed opacity-60 shadow-sm"
          >
            <span className="text-4xl mb-2">{activity.emoji}</span>
            <span className="font-semibold text-[#4a3a3a]">{activity.name}</span>
            <span className="text-sm text-[#6b5b5b]">{activity.desc}</span>
            <span className="text-xs text-[#d4a0a0] mt-2">{activity.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityPanel;
