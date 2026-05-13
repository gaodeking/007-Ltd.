import { useState, useEffect, useCallback } from 'react';
import peachBoxNpc from '../assets/peach-box-npc.png';
import { PEACH_BOX_DIALOGUES } from '../data/npcDialogues';

function NPCPeachBox() {
  const [currentBubble, setCurrentBubble] = useState(null);

  const showRandomBubble = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * PEACH_BOX_DIALOGUES.length);
    setCurrentBubble(PEACH_BOX_DIALOGUES[randomIndex]);
    
    setTimeout(() => setCurrentBubble(null), 6000);
    
    const nextDelay = 10000 + Math.random() * 10000;
    setTimeout(showRandomBubble, nextDelay);
  }, []);

  useEffect(() => {
    const initialDelay = setTimeout(showRandomBubble, 5000);
    return () => clearTimeout(initialDelay);
  }, [showRandomBubble]);

  return (
    <div className="absolute top-4 right-4 z-10">
      {currentBubble && (
        <div className="absolute right-full top-0 mr-3 animate-fade-in-out">
          <div className="bg-white border-2 border-[#4a3a3a] rounded-lg px-3 py-2 max-w-[280px] shadow-sm relative">
            <p className="text-sm text-[#4a3a3a] leading-snug">{currentBubble}</p>
            <div className="absolute -right-2 top-3 w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-[#4a3a3a] border-b-[6px] border-b-transparent"></div>
            <div className="absolute -right-[5px] top-[14px] w-0 h-0 border-t-[5px] border-t-transparent border-l-[6px] border-l-white border-b-[5px] border-b-transparent"></div>
          </div>
        </div>
      )}
      
      <img 
        src={peachBoxNpc} 
        alt="蒸馏桃子盒子" 
        className="w-[120px] h-auto drop-shadow-sm"
      />
      <p className="text-xs text-[#4a3a3a] text-center mt-1 font-medium whitespace-nowrap">
        蒸馏桃子盒子
      </p>
    </div>
  );
}

export default NPCPeachBox;
