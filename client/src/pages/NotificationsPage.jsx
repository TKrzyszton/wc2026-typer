import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    api.get('/notifications/settings').then(r => {
      setSavedEmail(r.data.email || null);
      setNotifyEnabled(!!r.data.notify_email);
      setEmail(r.data.email || '');
    }).catch(() => {});
  }, [user]);

  const activate = async () => {
    if (!email || !email.includes('@')) { setMsg('Podaj poprawny adres email.'); return; }
    setSaving(true); setMsg('');
    try {
      await api.post('/notifications/settings', { email, notify_email: true });
      setSavedEmail(email);
      setNotifyEnabled(true);
      setMsg('');
    } catch (e) { setMsg(e.response?.data?.error || 'Błąd zapisu'); }
    finally { setSaving(false); }
  };

  const saveEdit = async () => {
    if (!editValue || !editValue.includes('@')) { setMsg('Podaj poprawny adres email.'); return; }
    setSaving(true); setMsg('');
    try {
      await api.post('/notifications/settings', { email: editValue, notify_email: true });
      setSavedEmail(editValue);
      setEmail(editValue);
      setEditing(false);
      setMsg('');
    } catch (e) { setMsg(e.response?.data?.error || 'Błąd zapisu'); }
    finally { setSaving(false); }
  };

  const disable = async () => {
    setSaving(true); setMsg('');
    try {
      await api.post('/notifications/settings', { email: savedEmail, notify_email: false });
      setNotifyEnabled(false);
    } catch (e) { setMsg(e.response?.data?.error || 'Błąd'); }
    finally { setSaving(false); }
  };

  const enable = async () => {
    setSaving(true); setMsg('');
    try {
      await api.post('/notifications/settings', { email: savedEmail, notify_email: true });
      setNotifyEnabled(true);
    } catch (e) { setMsg(e.response?.data?.error || 'Błąd'); }
    finally { setSaving(false); }
  };

  if (!user) {
    return (
      <div className="text-center py-16 text-white/40">
        Zaloguj się, aby zarządzać powiadomieniami.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-black mb-6 flex items-center gap-2">
        🔔 Powiadomienia
      </h1>

      <div className="card mb-4">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-bold text-base flex items-center gap-2">
            ✉️ Przypomnienia o meczach
          </h2>
          {savedEmail && notifyEnabled && (
            <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 rounded-full px-2.5 py-0.5 font-semibold">
              aktywne
            </span>
          )}
          {savedEmail && !notifyEnabled && (
            <span className="text-xs bg-white/6 text-white/35 rounded-full px-2.5 py-0.5 font-semibold">
              wyłączone
            </span>
          )}
        </div>
        <p className="text-sm text-white/40 mb-4 leading-relaxed">
          Wyślemy maila godzinę przed meczem, jeśli nie masz jeszcze swojego typu.
        </p>

        {!savedEmail && (
          <div className="space-y-3">
            <input
              type="email"
              className="input"
              placeholder="twój@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setMsg(''); }}
            />
            <button
              className="btn-primary w-full"
              onClick={activate}
              disabled={saving || !email}
            >
              {saving ? '…' : 'Włącz powiadomienia'}
            </button>
          </div>
        )}

        {savedEmail && !editing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 py-2.5">
              <span className="text-white/40 text-sm flex-1 truncate">{savedEmail}</span>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 text-sm px-3 py-2 rounded-lg font-semibold bg-white/6 text-white/50 border border-white/10 hover:bg-white/10 transition-colors"
                onClick={() => { setEditValue(savedEmail); setEditing(true); setMsg(''); }}
              >
                Zmień email
              </button>
              {notifyEnabled ? (
                <button
                  className="flex-1 text-sm px-3 py-2 rounded-lg font-semibold bg-red-900/30 text-red-400 border border-red-500/20 hover:bg-red-900/50 transition-colors"
                  onClick={disable}
                  disabled={saving}
                >
                  {saving ? '…' : 'Wyłącz'}
                </button>
              ) : (
                <button
                  className="flex-1 text-sm px-3 py-2 rounded-lg font-semibold bg-green-900/30 text-green-400 border border-green-500/20 hover:bg-green-900/50 transition-colors"
                  onClick={enable}
                  disabled={saving}
                >
                  {saving ? '…' : 'Włącz ponownie'}
                </button>
              )}
            </div>
          </div>
        )}

        {savedEmail && editing && (
          <div className="space-y-3">
            <input
              type="email"
              className="input"
              value={editValue}
              onChange={e => { setEditValue(e.target.value); setMsg(''); }}
              autoFocus
            />
            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={saveEdit} disabled={saving}>
                {saving ? '…' : 'Zapisz'}
              </button>
              <button
                className="flex-1 text-sm px-3 py-2 rounded-lg font-semibold bg-white/6 text-white/50 border border-white/10 hover:bg-white/10 transition-colors"
                onClick={() => { setEditing(false); setMsg(''); }}
              >
                Anuluj
              </button>
            </div>
          </div>
        )}

        {msg && <p className="text-sm text-red-400 mt-2">{msg}</p>}
      </div>

      <div className="flex items-start gap-2 px-1">
        <span className="text-white/25 text-sm mt-0.5">ℹ️</span>
        <p className="text-xs text-white/30 leading-relaxed">
          Powiadomienia dotyczą tylko meczów nieobstawionych. Jeśli masz zapisany typ — maila nie dostaniesz.
        </p>
      </div>
    </div>
  );
}
