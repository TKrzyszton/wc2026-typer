import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BettingPage from './pages/BettingPage';
import StandingsPage from './pages/StandingsPage';
import AdminPage from './pages/AdminPage';
import RulesPage from './pages/RulesPage';
import SetPasswordPage from './pages/SetPasswordPage';
import TodayPage from './pages/TodayPage';
import NotificationsPage from './pages/NotificationsPage';

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.is_admin ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { user } = useAuth();

  if (user?.mustChangePassword) {
    return (
      <Routes>
        <Route path="*" element={<SetPasswordPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login"    element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/typowanie" replace />} />
        <Route path="dzis"      element={<TodayPage />} />
        <Route path="typowanie" element={<BettingPage />} />
        <Route path="tabela"    element={<StandingsPage />} />
        <Route path="zasady"          element={<RulesPage />} />
        <Route path="powiadomienia"   element={<NotificationsPage />} />
        <Route path="admin"           element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>
    </Routes>
  );
}
