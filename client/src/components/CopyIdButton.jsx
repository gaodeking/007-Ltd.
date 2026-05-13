import { useState } from 'react';

function CopyIdButton({ playerId }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(playerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-[#6b5b5b] hover:text-[#4a3a3a] flex items-center gap-1 transition-colors"
    >
      {copied ? (
        <>✅ 已复制</>
      ) : (
        <>📋 复制 ID</>
      )}
    </button>
  );
}

export default CopyIdButton;
