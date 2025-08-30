import React, { useState } from 'react';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import type { AuthUser } from '../types';
import AuthService from '../services/authService';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const authService = AuthService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await authService.login(email, password);
      onLogin(user);
      onClose();
      setEmail('');
      setPassword('');
    } catch (err) {
      setError('שגיאה בהתחברות. נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@mirpeset.com');
    setPassword('admin123');
  };

  const fillUserCredentials = () => {
    setEmail('user@mirpeset.com');
    setPassword('user123');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <LogIn size={24} />
          <h2>התחברות למערכת</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">כתובת אימייל</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="הכנס כתובת אימייל"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הכנס סיסמה"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="demo-credentials">
            <p>לדמו:</p>
            <div className="demo-buttons">
              <button type="button" onClick={fillAdminCredentials} className="demo-btn">
                מנהל
              </button>
              <button type="button" onClick={fillUserCredentials} className="demo-btn">
                משתמש
              </button>
            </div>
          </div>

          <div className="login-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              ביטול
            </button>
            <button type="submit" disabled={isLoading} className="btn-login">
              {isLoading ? 'מתחבר...' : 'התחבר'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
