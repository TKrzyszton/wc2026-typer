import { useState, useEffect, useRef } from 'react';
import api from '../api/client';

const HT_DURATION_MS = 15 * 60 * 1000;
const RETRY_MS = 5 * 60 * 1000;

function kickoffMs(match) {
  return new Date(`${match.match_date}T${match.match_time}:00+02:00`).getTime();
}

async function liveCheck(matchId) {
  try {
    const { data } = await api.get(`/matches/${matchId}/live-check`);
    return data;
  } catch {
    return null;
  }
}

export function useLiveTimer(match, enabled) {
  const [minute, setMinute] = useState(null); // number | 'HT' | null

  const r = useRef({
    phase: 'idle',
    p1Start: null,
    htStart: null,
    p2Start: null,
    htAttempts: 0,
    ftAttempts: 0,
    timers: [],
    ticker: null,
  });

  useEffect(() => {
    if (!enabled || match.status === 'finished') return;

    const s = r.current;

    function addTimer(fn, delay) {
      const t = setTimeout(fn, Math.max(0, delay));
      s.timers.push(t);
    }

    function tick() {
      if (s.phase === 'first_half' && s.p1Start) {
        setMinute(Math.min(Math.floor((Date.now() - s.p1Start) / 60000) + 1, 45));
      } else if (s.phase === 'half_time') {
        setMinute('HT');
      } else if (s.phase === 'second_half' && s.p2Start) {
        setMinute(Math.min(45 + Math.floor((Date.now() - s.p2Start) / 60000) + 1, 90));
      }
    }

    function startSecondHalf() {
      s.phase = 'second_half';
      s.p2Start = Date.now();
      tick();

      // Sync +5min
      addTimer(async () => {
        const data = await liveCheck(match.id);
        if (data?.minute > 45) {
          s.p2Start = Date.now() - (data.minute - 46) * 60000;
        }
      }, 5 * 60000);

      // Check FT at ~50min from p2Start
      addTimer(checkFT, 50 * 60000);
    }

    function enterHT() {
      s.phase = 'half_time';
      s.htStart = Date.now();
      setMinute('HT');
      addTimer(startSecondHalf, HT_DURATION_MS);
    }

    async function checkHT() {
      const data = await liveCheck(match.id);
      s.htAttempts++;
      if (!data || data.status === 'half_time' || data.status === 'not_live' || data.status === 'finished') {
        enterHT();
      } else if (s.htAttempts < 2) {
        addTimer(checkHT, RETRY_MS);
      } else {
        enterHT(); // force after 2 retries
      }
    }

    async function checkFT() {
      const data = await liveCheck(match.id);
      s.ftAttempts++;
      if (!data || data.status === 'not_live' || data.status === 'finished') {
        s.phase = 'done';
        setMinute(90);
      } else if (s.ftAttempts < 2) {
        addTimer(checkFT, RETRY_MS);
      } else {
        s.phase = 'done';
        setMinute(90);
      }
    }

    function startFirstHalf(p1Start) {
      s.phase = 'first_half';
      s.p1Start = p1Start;
      tick();

      // Sync +5min od kickoffu
      addTimer(async () => {
        const data = await liveCheck(match.id);
        if (data?.minute >= 1 && data.minute <= 45) {
          s.p1Start = Date.now() - (data.minute - 1) * 60000;
        }
      }, p1Start + 5 * 60000 - Date.now());

      // Check HT at 50min od p1Start
      addTimer(checkHT, p1Start + 50 * 60000 - Date.now());
    }

    const ko = kickoffMs(match);
    const elapsed = Math.floor((Date.now() - ko) / 60000);

    if (elapsed < 0) {
      // Mecz jeszcze nie zaczął się — zaplanuj start
      addTimer(() => startFirstHalf(ko), ko - Date.now());
    } else if (elapsed < 50) {
      // Pierwsza połowa
      startFirstHalf(ko);
    } else if (elapsed < 65) {
      // Okolice przerwy — sprawdź natychmiast
      s.phase = 'first_half';
      s.p1Start = ko;
      checkHT();
    } else if (elapsed < 115) {
      // Druga połowa — mount mid-match
      s.phase = 'second_half';
      s.p2Start = ko + 60 * 60000; // przybliżenie
      liveCheck(match.id).then(data => {
        if (data?.minute > 45) s.p2Start = Date.now() - (data.minute - 46) * 60000;
        tick();
        addTimer(checkFT, s.p2Start + 50 * 60000 - Date.now());
      });
    } else {
      s.phase = 'done';
      setMinute(90);
    }

    s.ticker = setInterval(tick, 30 * 1000);

    return () => {
      s.timers.forEach(clearTimeout);
      s.timers = [];
      if (s.ticker) clearInterval(s.ticker);
      s.phase = 'idle';
      s.p1Start = null;
      s.htStart = null;
      s.p2Start = null;
      s.htAttempts = 0;
      s.ftAttempts = 0;
    };
  }, [match.id, match.status, enabled]);

  return minute;
}
