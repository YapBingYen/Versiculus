import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface UserStats {
  games_played: number;
  games_won: number;
  current_streak: number;
  max_streak: number;
  guess_distribution: Record<string, number>;
}

const DEFAULT_STATS: UserStats = {
  games_played: 0,
  games_won: 0,
  current_streak: 0,
  max_streak: 0,
  guess_distribution: {}
};

export function useStats() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) {
      // Local fallback if not logged in
      const localStats = localStorage.getItem('versiculus_local_stats');
      if (localStats) {
        try {
          setStats(JSON.parse(localStats));
        } catch (e) {}
      }
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`https://versiculus.onrender.com/api/stats/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  const updateStats = useCallback(async (isWin: boolean, attempts: number) => {
    if (!user) {
      // Update local storage stats for guests
      setStats(prev => {
        const newStats = { ...prev };
        newStats.games_played += 1;
        if (isWin) {
          newStats.games_won += 1;
          newStats.current_streak += 1;
          newStats.max_streak = Math.max(newStats.max_streak, newStats.current_streak);
          newStats.guess_distribution[attempts] = (newStats.guess_distribution[attempts] || 0) + 1;
        } else {
          newStats.current_streak = 0;
        }
        localStorage.setItem('versiculus_local_stats', JSON.stringify(newStats));
        return newStats;
      });
      return;
    }

    try {
      const res = await fetch(`https://versiculus.onrender.com/api/stats/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isWin, attempts })
      });
      if (res.ok) {
        await fetchStats(); // Refresh stats from server after update
      }
    } catch (err) {
      console.error('Failed to update stats:', err);
    }
  }, [user, token, fetchStats]);

  return {
    stats,
    isLoading,
    fetchStats,
    updateStats
  };
}