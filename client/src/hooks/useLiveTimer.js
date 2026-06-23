import { useState, useEffect } from 'react';

export function useLiveTimer(match, enabled) {
  const [minute, setMinute] = useState(null);

  useEffect(() => {
    if (!enabled || match.status === 'finished') {
      setMinute(null);
      return;
    }

    function calc() {
      const phase = match.live_phase;
      const now = Date.now();
      const kickoff = new Date(`${match.match_date}T${match.match_time}:00+02:00`).getTime();

      if (!phase || phase === 'first_half') {
        const base = match.live_minute || 1;
        const baseAt = match.live_minute_at ? Number(match.live_minute_at) : kickoff;
        return Math.min(base + Math.floor((now - baseAt) / 60000), 45);
      }
      if (phase === 'half_time') return 'HT';
      if (phase === 'second_half') {
        const base = match.live_minute || 46;
        const baseAt = match.live_minute_at
          ? Number(match.live_minute_at)
          : (match.live_phase_since ? Number(match.live_phase_since) : now);
        return Math.min(base + Math.floor((now - baseAt) / 60000), 90);
      }
      return null;
    }

    setMinute(calc());
    const t = setInterval(() => setMinute(calc()), 30000);
    return () => clearInterval(t);
  }, [
    match.id, match.status, match.live_phase,
    match.live_minute, match.live_minute_at,
    match.live_phase_since, enabled,
  ]);

  return minute;
}
