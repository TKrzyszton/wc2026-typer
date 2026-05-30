export default function RulesPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
        📋 Zasady gry
      </h1>

      {/* Typowanie wyników */}
      <div className="card mb-4">
        <h2 className="font-black text-wc-gold text-lg mb-4">⚽ Typowanie wyników meczów</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3 items-start p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <span className="badge bg-green-500 text-white text-base px-3 py-1 shrink-0">3 pkt</span>
            <div>
              <p className="font-semibold">Dokładny wynik</p>
              <p className="text-white/50 mt-0.5">Trafiasz dokładnie ile bramek strzeliła każda drużyna.</p>
              <p className="text-white/40 text-xs mt-1">Przykład: mecz kończy się 3:1, typujesz 3:1 ✓</p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <span className="badge bg-blue-500 text-white text-base px-3 py-1 shrink-0">2 pkt</span>
            <div>
              <p className="font-semibold">Dobra różnica bramek</p>
              <p className="text-white/50 mt-0.5">Trafiasz zwycięzcę i różnicę bramek, ale nie dokładny wynik.</p>
              <p className="text-white/40 text-xs mt-1">Przykład: mecz 3:1, typujesz 2:0 (różnica 2) ✓</p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <span className="badge bg-yellow-500 text-black text-base px-3 py-1 shrink-0">1 pkt</span>
            <div>
              <p className="font-semibold">Dobry zwycięzca</p>
              <p className="text-white/50 mt-0.5">Trafiasz kto wygrał, ale różnica bramek jest inna.</p>
              <p className="text-white/40 text-xs mt-1">Przykład: mecz 3:1, typujesz 1:0 ✓</p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <span className="badge bg-red-500/70 text-white text-base px-3 py-1 shrink-0">0 pkt</span>
            <div>
              <p className="font-semibold">Pudło</p>
              <p className="text-white/50 mt-0.5">Typujesz wygraną drużyny, a ona przegrywa lub jest remis (albo odwrotnie).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Remisy */}
      <div className="card mb-4">
        <h2 className="font-black text-wc-gold text-lg mb-4">🤝 Mecze zakończone remisem</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3 items-start p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <span className="badge bg-green-500 text-white text-base px-3 py-1 shrink-0">3 pkt</span>
            <div>
              <p className="font-semibold">Dokładny wynik remisowy</p>
              <p className="text-white/40 text-xs mt-1">Przykład: mecz 2:2, typujesz 2:2 ✓</p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <span className="badge bg-blue-500 text-white text-base px-3 py-1 shrink-0">2 pkt</span>
            <div>
              <p className="font-semibold">Remis, pomyłka o 1 gola na stronę</p>
              <p className="text-white/40 text-xs mt-1">Przykład: mecz 2:2, typujesz 1:1 ✓</p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <span className="badge bg-yellow-500 text-black text-base px-3 py-1 shrink-0">1 pkt</span>
            <div>
              <p className="font-semibold">Remis, pomyłka o więcej niż 1 gola</p>
              <p className="text-white/40 text-xs mt-1">Przykład: mecz 2:2, typujesz 0:0 ✓</p>
            </div>
          </div>
        </div>
      </div>

      {/* Faza pucharowa */}
      <div className="card mb-4">
        <h2 className="font-black text-wc-gold text-lg mb-4">🏆 Faza pucharowa</h2>
        <div className="space-y-3 text-sm">
          <p className="text-white/60">
            W fazie pucharowej oceniamy wynik po <span className="text-white font-semibold">120 minutach</span> (regulaminowy czas + dogrywka). Wynik po 90 minutach nie ma znaczenia — liczy się tylko końcowy wynik po ewentualnej dogrywce.
          </p>

          <div className="flex gap-3 items-start p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <span className="badge bg-purple-500 text-white text-base px-3 py-1 shrink-0">5 pkt</span>
            <div>
              <p className="font-semibold">Typ: Rzuty karne 🎯</p>
              <p className="text-white/50 mt-0.5">
                Zamiast typować wynik, możesz zaznaczyć że mecz zakończy się rzutami karnymi.
                Jeśli faktycznie tak się stanie — dostajesz 5 punktów, niezależnie od końcowego wyniku.
              </p>
              <p className="text-white/40 text-xs mt-1">Uwaga: ten typ nie łączy się z typowaniem wyniku — wybierasz jedno albo drugie.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mistrz */}
      <div className="card mb-4">
        <h2 className="font-black text-wc-gold text-lg mb-4">🥇 Typ Mistrza Świata</h2>
        <div className="space-y-2 text-sm">
          <p className="text-white/60">
            Przed turniejem (do 5 minut przed pierwszym meczem) możesz wytypować który kraj zostanie Mistrzem Świata.
          </p>
          <div className="flex gap-3 items-center p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
            <span className="badge bg-yellow-400 text-black text-base px-3 py-1 shrink-0">5 pkt</span>
            <p>Za prawidłowe wytypowanie Mistrza Świata</p>
          </div>
        </div>
      </div>

      {/* Blokady */}
      <div className="card mb-4">
        <h2 className="font-black text-wc-gold text-lg mb-4">🔒 Kiedy nie można już typować?</h2>
        <ul className="space-y-2 text-sm text-white/60">
          <li className="flex gap-2">
            <span className="text-red-400">•</span>
            <span>Typowanie każdego meczu blokuje się <span className="text-white font-semibold">5 minut przed jego rozpoczęciem</span>.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400">•</span>
            <span>Typ Mistrza Świata blokuje się <span className="text-white font-semibold">5 minut przed pierwszym meczem turnieju</span> (11 czerwca, godz. 20:55).</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400">•</span>
            <span>Zablokowanych typów nie można już zmienić.</span>
          </li>
        </ul>
      </div>

      {/* Tabela */}
      <div className="card">
        <h2 className="font-black text-wc-gold text-lg mb-4">📊 Tabela i rozstrzyganie remisów</h2>
        <p className="text-sm text-white/60 mb-3">
          W tabeli gracz z większą liczbą punktów jest wyżej. Przy równej liczbie punktów decyduje kolejno:
        </p>
        <ol className="space-y-1 text-sm text-white/60 list-decimal list-inside">
          <li>Więcej trafionych <span className="text-green-400 font-semibold">dokładnych wyników (3 pkt)</span></li>
          <li>Więcej trafionych <span className="text-blue-400 font-semibold">różnic bramek (2 pkt)</span></li>
          <li>Więcej trafionych <span className="text-yellow-400 font-semibold">zwycięzców (1 pkt)</span></li>
        </ol>
      </div>
    </div>
  );
}
