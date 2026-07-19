import { useState, useEffect } from 'react';

// Zabawna animacja intro: król Adison na tronie pije Jägermeistera,
// trzej pozostali gracze składają pokłony. Raz na sesję, klik pomija.
export default function ThroneSplash() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let timer;
    const show = () => {
      setLeaving(false);
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => dismiss(), 6500);
    };
    show(); // każde wejście / odświeżenie
    // powrót apki z tła (PWA na telefonie, przełączenie karty)
    const onVisible = () => { if (document.visibilityState === 'visible') show(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => setVisible(false), 500);
  };

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0a1628] cursor-pointer transition-opacity duration-500 ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      <style>{`
        @keyframes drink { 0%,55%,100% { transform: rotate(0deg); } 65%,90% { transform: rotate(-65deg); } }
        @keyframes bow { 0%,100% { transform: rotate(0deg); } 40%,70% { transform: rotate(-80deg); } }
        @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes sparkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes glug { 0% { opacity: 0; transform: translateY(0) scale(0.5); } 50% { opacity: 1; } 100% { opacity: 0; transform: translateY(-14px) scale(1.1); } }
        .ts-bottle { animation: drink 3.2s ease-in-out infinite; transform-origin: 100px 96px; }
        .ts-bow1 { animation: bow 2.6s ease-in-out infinite; transform-origin: 200px 172px; }
        .ts-bow2 { animation: bow 2.6s ease-in-out 0.3s infinite; transform-origin: 251px 172px; }
        .ts-bow3 { animation: bow 2.6s ease-in-out 0.6s infinite; transform-origin: 302px 172px; }
        .ts-crown { animation: bob 2s ease-in-out infinite; }
        .ts-spark { animation: sparkle 1.4s ease-in-out infinite; }
        .ts-glug { animation: glug 1.1s ease-out infinite; }
        .ts-glug2 { animation: glug 1.1s ease-out 0.4s infinite; }
      `}</style>

      <div className="flex flex-col items-center gap-4 select-none px-4">
        <svg viewBox="0 0 340 210" className="w-full max-w-md" xmlns="http://www.w3.org/2000/svg">
          {/* Tron */}
          <rect x="62" y="60" width="76" height="110" rx="6" fill="#7c2d12" />
          <rect x="56" y="150" width="88" height="22" rx="4" fill="#9a3412" />
          <rect x="66" y="52" width="10" height="16" rx="3" fill="#d4af37" />
          <rect x="124" y="52" width="10" height="16" rx="3" fill="#d4af37" />
          <circle cx="71" cy="50" r="4" fill="#d4af37" className="ts-spark" />
          <circle cx="129" cy="50" r="4" fill="#d4af37" className="ts-spark" />

          {/* Król Adison */}
          <g stroke="#f5f5f4" strokeWidth="3.5" strokeLinecap="round" fill="none">
            {/* głowa */}
            <circle cx="100" cy="82" r="10" fill="#0a1628" />
            {/* tułów */}
            <path d="M100 92 L100 128" />
            {/* nogi zgięte (siedzi) */}
            <path d="M100 128 L86 140 L86 158" />
            <path d="M100 128 L114 140 L114 158" />
            {/* lewa ręka na podłokietniku */}
            <path d="M100 100 L80 112" />
          </g>
          {/* prawa ręka z butelką — animowana */}
          <g className="ts-bottle">
            <path d="M100 100 L122 96" stroke="#f5f5f4" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <g transform="rotate(-20 126 92)">
              <rect x="122" y="82" width="9" height="20" rx="2" fill="#14532d" />
              <rect x="124.5" y="76" width="4" height="7" fill="#14532d" />
              <rect x="123" y="88" width="7" height="6" fill="#f97316" />
            </g>
          </g>
          {/* bąbelki „glug glug" */}
          <circle cx="132" cy="72" r="2.5" fill="#86efac" className="ts-glug" />
          <circle cx="138" cy="76" r="2" fill="#86efac" className="ts-glug2" />

          {/* Korona */}
          <g className="ts-crown">
            <path d="M90 70 L92 60 L97 67 L100 58 L103 67 L108 60 L110 70 Z" fill="#d4af37" />
          </g>

          {/* Klęczący i kłaniający się poddani */}
          {[
            { x: 200, cls: 'ts-bow1', name: 'Tomcio' },
            { x: 251, cls: 'ts-bow2', name: 'Natka' },
            { x: 302, cls: 'ts-bow3', name: 'Wojtek' },
          ].map(({ x, cls, name }) => (
            <g key={x}>
              {/* nogi klęczą: udo do kolana, podudzie po ziemi do tyłu */}
              <g stroke="#a8a29e" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d={`M${x} 172 L${x - 4} 188 L${x + 12} 188`} />
                <path d={`M${x + 3} 172 L${x + 1} 188 L${x + 16} 188`} />
              </g>
              {/* górna połowa kłania się od bioder, ręce wyciągnięte w górę („nie jesteśmy godni") */}
              <g className={cls}>
                <g stroke="#a8a29e" strokeWidth="3" strokeLinecap="round" fill="none">
                  <path d={`M${x} 172 L${x} 148`} />
                  <path d={`M${x} 152 L${x - 9} 132`} />
                  <path d={`M${x} 152 L${x - 1} 128`} />
                </g>
                <circle cx={x + 4} cy="141" r="8" fill="#0a1628" stroke="#a8a29e" strokeWidth="3" />
              </g>
              <text x={x} y="202" textAnchor="middle" fill="#78716c" fontSize="10" fontFamily="sans-serif">{name}</text>
            </g>
          ))}

          {/* Podpis króla */}
          <text x="100" y="185" textAnchor="middle" fill="#d4af37" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Adison</text>
        </svg>

        <p className="text-wc-gold font-black text-lg text-center">👑 Wasz król pije za wasze typy</p>
        <p className="text-white/30 text-xs">kliknij aby pominąć</p>
      </div>
    </div>
  );
}
