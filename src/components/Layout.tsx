import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, Archive, Settings, Upload, Megaphone, Bell, LogOut, LogIn, UserCog } from 'lucide-react';
import './Layout.css';
import AuthService from '../services/authService';
import LoginModal from './LoginModal';
import type { AuthUser } from '../types';

const Layout: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const authService = AuthService.getInstance();
    const isAuth = authService.isLoggedIn();
    const user = authService.getCurrentUser();
    setIsLoggedIn(isAuth);
    setUsername(user?.name || '');
    setUserRole(user?.role || null);
  }, []);

  const handleLogin = (user: AuthUser) => {
    setIsLoggedIn(true);
    setUsername(user.name);
    setUserRole(user.role);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    const authService = AuthService.getInstance();
    authService.logout();
    setIsLoggedIn(false);
    setUsername('');
    setUserRole(null);
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <img src="/אייקון.jpeg" alt="לוגו המרפסת" className="logo-icon" />
            <h1 className="logo">המרפסת</h1>
          </div>
          
          <nav className="nav">
            <NavLink to="/calendar" className="nav-link">
              <Calendar size={16} />
              לוח זמנים
            </NavLink>
            {userRole === 'admin' && (
              <NavLink to="/admin" className="nav-link">
                <UserCog size={16} />
                ניהול שיעורים
              </NavLink>
            )}
            <NavLink to="/posters" className="nav-link">
              <Megaphone size={16} />
              מודעות
            </NavLink>
            <NavLink to="/notifications" className="nav-link">
              <Bell size={16} />
              תזכורות
            </NavLink>
            {userRole === 'admin' && (
              <NavLink to="/import" className="nav-link">
                <Upload size={16} />
                ייבוא מקבצים
              </NavLink>
            )}
            <NavLink to="/archive" className="nav-link">
              <Archive size={16} />
              ארכיון
            </NavLink>
            <NavLink to="/settings" className="nav-link">
              <Settings size={16} />
              הגדרות
            </NavLink>
          </nav>

          <div className="auth-section">
            {isLoggedIn ? (
              <div className="user-info">
                <span className="username">{username}</span>
                <button onClick={handleLogout} className="auth-button">
                  <LogOut size={16} />
                  יציאה
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="auth-button">
                <LogIn size={16} />
                כניסה
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
};

export default Layout;
