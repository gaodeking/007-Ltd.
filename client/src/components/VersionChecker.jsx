import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { playerApi } from '../api';

function VersionChecker({ playerId, playerRef }) {
  const [showRefresh, setShowRefresh] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [currentVersion, setCurrentVersion] = useState(null);

  const savePlayerData = async () => {
    if (playerId && playerRef?.current) {
      try {
        await playerApi.save(playerId, playerRef.current);
      } catch (err) {
        console.warn('Auto-save before refresh failed:', err);
      }
    }
  };

  const handleRefresh = async () => {
    await savePlayerData();
    window.location.reload();
  };

  useEffect(() => {
    const initVersion = async () => {
      try {
        const res = await axios.get('/api/version');
        setCurrentVersion(res.data.version);
      } catch (err) {
        console.error('Failed to get initial version:', err);
      }
    };
    initVersion();

    const checkInterval = setInterval(async () => {
      try {
        const res = await axios.get('/api/version');
        if (currentVersion && res.data.version !== currentVersion) {
          setShowRefresh(true);
          setCountdown(60);
        }
      } catch (err) {
        console.error('Version check failed:', err);
      }
    }, 30000);

    return () => clearInterval(checkInterval);
  }, [currentVersion]);

  useEffect(() => {
    if (!showRefresh) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRefresh();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showRefresh]);

  if (!showRefresh) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <span> 游戏已更新，{countdown} 秒后自动刷新</span>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-semibold"
        >
          立即刷新
        </button>
      </div>
    </div>
  );
}

export default VersionChecker;
