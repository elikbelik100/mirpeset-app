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
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const authService = AuthService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let user;
      if (isRegistering) {
        if (!name.trim()) {
          throw new Error('יש להזין שם מלא');
        }
        user = await authService.register(email, password, name);
      } else {
        user = await authService.login(email, password);
      }
      
      onLogin(user);
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה. נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setIsRegistering(false);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <LogIn size={24} />
          <h2>{isRegistering ? 'הרשמה למערכת' : 'התחברות למערכת'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="name">שם מלא</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="הכנס שם מלא"
                required
              />
            </div>
          )}

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

          <div className="login-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              ביטול
            </button>
            <button type="submit" disabled={isLoading} className="btn-login">
              {isLoading ? (isRegistering ? 'נרשם...' : 'מתחבר...') : (isRegistering ? 'הירשם' : 'התחבר')}
            </button>
          </div>

          <div className="toggle-mode">
            <button type="button" onClick={toggleMode} className="toggle-btn">
              {isRegistering ? 'יש לך כבר חשבון? התחבר' : 'אין לך חשבון? הירשם'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
