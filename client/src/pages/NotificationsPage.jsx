import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const VAPID_KEY_CACHE = { key: null };

async function getVapidKey() {
  if (VAPID_KEY_CACHE.key) return VAPID_KEY_CACHE.key;
  const r = await api.get('/notifications/vapid-public-key');
  VAPID_KEY_CACHE.key = r.data.key;
  return VAPID_KEY_CACHE.key;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

function detectOS() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function IOSInstructions() {
  return (
    <div className="space-y-2 text-sm text-white/50 leading-relaxed">
      <p className="font-semibold text-white/70 text-sm">Jak włączyć powiadomienia na iPhone:</p>
      <ol className="space-y-1.5 list-none">
        <li className="flex gap-2"><span className="text-wc-gold font-bold shrink-0">1.</span>Otwórz tę stronę w Safari (nie Chrome ani innej przeglądarce)</li>
        <li className="flex gap-2"><span className="text-wc-gold font-bold shrink-0">2.</span>Dotknij ikony <span className="text-white/70">Udostępnij</span> na dole ekranu <span className="text-white/40">(kwadrat ze strzałką)</span></li>
        <li className="flex gap-2"><span className="text-wc-gold font-bold shrink-0">3.</span>Wybierz <span className="text-white/70">„Dodaj do ekranu głównego"</span></li>
        <li className="flex gap-2"><span className="text-wc-gold font-bold shrink-0">4.</span>Otwórz apkę z ekranu głównego i wróć tutaj</li>
        <li className="flex gap-2"><span className="text-wc-gold font-bold shrink-0">5.</span>Kliknij „Włącz powiadomienia push" poniżej</li>
      </ol>
      <p className="text-xs text-white/25 mt-2">Wymaga iOS 16.4 lub nowszego</p>
    </div>
  );
}

function AndroidInstructions() {
  return (
    <div className="space-y-2 text-sm text-white/50 leading-relaxed">
      <p className="font-semibold text-white/70 text-sm">Jak włączyć powiadomienia na Android:</p>
      <ol className="space-y-1.5 list-none">
        <li className="flex gap-2"><span className="text-wc-gold font-bold shrink-0">1.</span>Kliknij „Włącz powiadomienia push" poniżej</li>
        <li className="flex gap-2"><span className="text-wc-gold font-bold shrink-0">2.</span>W okienku przeglądarki wybierz <span className="text-white/70">„Zezwól"</span></li>
        <li className="flex gap-2"><span className="text-wc-gold font-bold shrink-0">3.</span>Gotowe!</li>
      </ol>
    </div>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [pushStatus, setPushStatus] = useState('unknown'); // unknown | unsupported | denied | subscribed | unsubscribed
  const [pushSaving, setPushSaving] = useState(false);
  const [pushMsg, setPushMsg] = useState('');

  const os = detectOS();
  const standalone = isInStandaloneMode();

  useEffect(() => {
    if (!user) return;
    api.get('/notifications/settings').then(r => {
      setSavedEmail(r.data.email || null);
      setNotifyEnabled(!!r.data.notify_email);
      setEmail(r.data.email || '');
    }).catch(() => {});

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported');
      return;
    }
    const perm = Notification.permission;
    if (perm === 'denied') { setPushStatus('denied'); return; }
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setPushStatus(sub ? 'subscribed' : 'unsubscribed');
      });
    });
  }, [user]);

  const registerSW = async () => {
    if (!('serviceWorker' in navigator)) return null;
    const existing = await navigator.serviceWorker.getRegistrations();
    for (const r of existing) await r.unregister();
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return reg;
  };

  const subscribePush = async () => {
    setPushSaving(true); setPushMsg('');
    try {
      const vapidKey = await getVapidKey();
      if (!vapidKey) { setPushMsg('Brak klucza VAPID.'); setPushSaving(false); return; }
      setPushMsg('Rejestruję service worker…');
      const reg = await registerSW();
      if (!reg) { setPushMsg('Błąd rejestracji SW.'); setPushSaving(false); return; }
      setPushMsg('Proszę o zgodę…');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setPushStatus('denied'); setPushMsg('Powiadomienia zablokowane — zmień w ustawieniach telefonu.'); setPushSaving(false); return; }
      setPushMsg('Tworzę subskrypcję…');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      setPushMsg('Zapisuję…');
      await api.post('/notifications/push-subscribe', { subscription: sub.toJSON() });
      setPushStatus('subscribed');
      setPushMsg('');
    } catch (e) {
      setPushMsg('Błąd: ' + (e.message || String(e)));
    } finally { setPushSaving(false); }
  };

  const unsubscribePush = async () => {
    setPushSaving(true); setPushMsg('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await api.delete('/notifications/push-subscribe');
      setPushStatus('unsubscribed');
    } catch (e) {
      setPushMsg('Błąd: ' + e.message);
    } finally { setPushSaving(false); }
  };

  const activate = async () => {
    if (!email || !email.includes('@')) { setMsg('Podaj poprawny adres email.'); return; }
    setSaving(true); setMsg('');
    try {
      await api.post('/notifications/settings', { email, notify_email: true });
      setSavedEmail(email); setNotifyEnabled(true);
    } catch (e) { setMsg(e.response?.data?.error || 'Błąd zapisu'); }
    finally { setSaving(false); }
  };

  const saveEdit = async () => {
    if (!editValue || !editValue.includes('@')) { setMsg('Podaj poprawny adres email.'); return; }
    setSaving(true); setMsg('');
    try {
      await api.post('/notifications/settings', { email: editValue, notify_email: true });
      setSavedEmail(editValue); setEmail(editValue); setEditing(false);
    } catch (e) { setMsg(e.response?.data?.error || 'Błąd zapisu'); }
    finally { setSaving(false); }
  };

  const disable = async () => {
    setSaving(true);
    try { await api.post('/notifications/settings', { email: savedEmail, notify_email: false }); setNotifyEnabled(false); }
    catch (e) { setMsg(e.response?.data?.error || 'Błąd'); }
    finally { setSaving(false); }
  };

  const enable = async () => {
    setSaving(true);
    try { await api.post('/notifications/settings', { email: savedEmail, notify_email: true }); setNotifyEnabled(true); }
    catch (e) { setMsg(e.response?.data?.error || 'Błąd'); }
    finally { setSaving(false); }
  };

  if (!user) return (
    <div className="text-center py-16 text-white/40">Zaloguj się, aby zarządzać powiadomieniami.</div>
  );

  const iosNeedsStandalone = os === 'ios' && !standalone;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-black mb-6 flex items-center gap-2">🔔 Alerty</h1>

      {/* Push notifications */}
      <div className="card mb-4">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-bold text-base flex items-center gap-2">📲 Powiadomienia push</h2>
          {pushStatus === 'subscribed' && (
            <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 rounded-full px-2.5 py-0.5 font-semibold">aktywne</span>
          )}
        </div>
        <p className="text-sm text-white/40 mb-4 leading-relaxed">
          Powiadomienie na ekranie blokady godzinę przed meczem, jeśli nie masz jeszcze typu.
        </p>

        {pushStatus === 'unsupported' && (
          <div className="text-sm text-white/40 bg-white/4 border border-white/8 rounded-lg px-3 py-2.5">
            Twoja przeglądarka nie obsługuje powiadomień push.
          </div>
        )}

        {pushStatus === 'denied' && (
          <div className="text-sm text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2.5">
            Powiadomienia zablokowane. Odblokuj je w Ustawieniach telefonu → Safari/Chrome → Powiadomienia.
          </div>
        )}

        {(pushStatus === 'unsubscribed' || pushStatus === 'unknown') && (
          <div className="space-y-4">
            {os === 'ios' && <IOSInstructions />}
            {os === 'android' && <AndroidInstructions />}
            {os === 'other' && <AndroidInstructions />}

            {iosNeedsStandalone ? (
              <div className="bg-wc-gold/10 border border-wc-gold/20 rounded-lg px-3 py-2.5 text-sm text-wc-gold">
                ⚠️ Najpierw dodaj apkę do ekranu głównego (krok 1-4 powyżej), potem wróć tutaj.
              </div>
            ) : (
              <button className="btn-primary w-full" onClick={subscribePush} disabled={pushSaving}>
                {pushSaving ? '…' : '🔔 Włącz powiadomienia push'}
              </button>
            )}
          </div>
        )}

        {pushStatus === 'subscribed' && (
          <button
            className="w-full text-sm px-3 py-2 rounded-lg font-semibold bg-red-900/30 text-red-400 border border-red-500/20 hover:bg-red-900/50 transition-colors"
            onClick={unsubscribePush} disabled={pushSaving}
          >
            {pushSaving ? '…' : 'Wyłącz powiadomienia push'}
          </button>
        )}

        {pushMsg && <p className="text-sm text-red-400 mt-2">{pushMsg}</p>}
      </div>

      {/* Email notifications */}
      <div className="card mb-4">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-bold text-base flex items-center gap-2">✉️ Przypomnienia email</h2>
          {savedEmail && notifyEnabled && (
            <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 rounded-full px-2.5 py-0.5 font-semibold">aktywne</span>
          )}
          {savedEmail && !notifyEnabled && (
            <span className="text-xs bg-white/6 text-white/35 rounded-full px-2.5 py-0.5 font-semibold">wyłączone</span>
          )}
        </div>
        <p className="text-sm text-white/40 mb-4 leading-relaxed">
          Mail godzinę przed meczem, jeśli nie masz jeszcze swojego typu.
        </p>

        {!savedEmail && (
          <div className="space-y-3">
            <input type="email" className="input" placeholder="twój@email.com" value={email}
              onChange={e => { setEmail(e.target.value); setMsg(''); }} />
            <button className="btn-primary w-full" onClick={activate} disabled={saving || !email}>
              {saving ? '…' : 'Włącz przypomnienia email'}
            </button>
          </div>
        )}

        {savedEmail && !editing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 py-2.5">
              <span className="text-white/40 text-sm flex-1 truncate">{savedEmail}</span>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 text-sm px-3 py-2 rounded-lg font-semibold bg-white/6 text-white/50 border border-white/10 hover:bg-white/10 transition-colors"
                onClick={() => { setEditValue(savedEmail); setEditing(true); setMsg(''); }}>
                Zmień email
              </button>
              {notifyEnabled ? (
                <button className="flex-1 text-sm px-3 py-2 rounded-lg font-semibold bg-red-900/30 text-red-400 border border-red-500/20 hover:bg-red-900/50 transition-colors"
                  onClick={disable} disabled={saving}>{saving ? '…' : 'Wyłącz'}</button>
              ) : (
                <button className="flex-1 text-sm px-3 py-2 rounded-lg font-semibold bg-green-900/30 text-green-400 border border-green-500/20 hover:bg-green-900/50 transition-colors"
                  onClick={enable} disabled={saving}>{saving ? '…' : 'Włącz ponownie'}</button>
              )}
            </div>
          </div>
        )}

        {savedEmail && editing && (
          <div className="space-y-3">
            <input type="email" className="input" value={editValue} autoFocus
              onChange={e => { setEditValue(e.target.value); setMsg(''); }} />
            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={saveEdit} disabled={saving}>{saving ? '…' : 'Zapisz'}</button>
              <button className="flex-1 text-sm px-3 py-2 rounded-lg font-semibold bg-white/6 text-white/50 border border-white/10 hover:bg-white/10 transition-colors"
                onClick={() => { setEditing(false); setMsg(''); }}>Anuluj</button>
            </div>
          </div>
        )}

        {msg && <p className="text-sm text-red-400 mt-2">{msg}</p>}
      </div>

      <div className="flex items-start gap-2 px-1">
        <span className="text-white/25 text-sm mt-0.5">ℹ️</span>
        <p className="text-xs text-white/30 leading-relaxed">
          Powiadomienia dotyczą tylko meczów nieobstawionych. Jeśli masz zapisany typ — nie dostaniesz przypomnienia.
        </p>
      </div>
    </div>
  );
}
