import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Moon, 
  Sun, 
  Smartphone,
  Monitor,
  Save,
  RefreshCw,
  Download,
  Trash2,
  Shield
} from 'lucide-react';
import type { AuthUser } from '../types';
import AuthService from '../services/authService';
import { NotificationService } from '../services/notificationService';
import './SettingsPage.css';

interface UserSettings {
  notifications: {
    enabled: boolean;
    reminderTimes: number[];
    browserNotifications: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    language: 'he' | 'en';
    fontSize: 'small' | 'medium' | 'large';
  };
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
  };
}

const SettingsPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      enabled: true,
      reminderTimes: [30, 60, 120],
      browserNotifications: false
    },
    appearance: {
      theme: 'light',
      language: 'he',
      fontSize: 'medium'
    },
    privacy: {
      dataCollection: false,
      analytics: false
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const authService = AuthService.getInstance();

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('mirpeset-settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('mirpeset-settings', JSON.stringify(settings));
      
      // Apply theme changes
      if (settings.appearance.theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
      }

      // Request notification permission if enabled
      if (settings.notifications.browserNotifications) {
        await NotificationService.requestPermission();
      }

      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setIsSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      notifications: {
        enabled: true,
        reminderTimes: [30, 60, 120],
        browserNotifications: false
      },
      appearance: {
        theme: 'light',
        language: 'he',
        fontSize: 'medium'
      },
      privacy: {
        dataCollection: false,
        analytics: false
      }
    });
    setShowConfirmReset(false);
  };

  const exportData = () => {
    const data = {
      settings,
      lessons: JSON.parse(localStorage.getItem('mirpeset-lessons') || '[]'),
      posters: JSON.parse(localStorage.getItem('mirpeset-posters') || '[]'),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mirpeset-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו בלתי הפיכה!')) {
      localStorage.removeItem('mirpeset-lessons');
      localStorage.removeItem('mirpeset-posters');
      localStorage.removeItem('mirpeset-settings');
      localStorage.removeItem('mirpeset_auth_user');
      window.location.reload();
    }
  };

  const updateNotificationSettings = (key: keyof UserSettings['notifications'], value: any) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const updateAppearanceSettings = (key: keyof UserSettings['appearance'], value: any) => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [key]: value
      }
    }));
  };

  const updatePrivacySettings = (key: keyof UserSettings['privacy'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const toggleReminderTime = (minutes: number) => {
    const current = settings.notifications.reminderTimes;
    const updated = current.includes(minutes)
      ? current.filter(t => t !== minutes)
      : [...current, minutes].sort((a, b) => a - b);
    
    updateNotificationSettings('reminderTimes', updated);
  };

  if (!currentUser) {
    return (
      <div className="settings-page">
        <div className="login-required">
          <Shield size={48} />
          <h2>נדרש להתחבר</h2>
          <p>יש להתחבר כדי לגשת להגדרות</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>הגדרות</h1>
        <button 
          onClick={saveSettings} 
          className="save-btn"
          disabled={isSaving}
        >
          {isSaving ? <RefreshCw size={20} className="spinning" /> : <Save size={20} />}
          {isSaving ? 'שומר...' : 'שמירה'}
        </button>
      </div>

      <div className="settings-sections">
        {/* Profile Section */}
        <section className="settings-section">
          <div className="section-header">
            <User size={24} />
            <h2>פרופיל משתמש</h2>
          </div>
          <div className="profile-info">
            <div className="user-avatar-large">
              <User size={32} />
            </div>
            <div className="user-details">
              <h3>{currentUser.name}</h3>
              <p>{currentUser.email}</p>
              <span className="user-role-badge">
                {currentUser.role === 'admin' ? 'מנהל מערכת' : 'משתמש'}
              </span>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="settings-section">
          <div className="section-header">
            <Bell size={24} />
            <h2>התראות ותזכורות</h2>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>התראות כלליות</h3>
              <p>קבלת התראות על שיעורים ועדכונים</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.notifications.enabled}
                onChange={(e) => updateNotificationSettings('enabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>התראות דפדפן</h3>
              <p>קבלת התראות ישירות בדפדפן</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.notifications.browserNotifications}
                onChange={(e) => updateNotificationSettings('browserNotifications', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>זמני תזכורת (דקות לפני השיעור)</h3>
              <p>בחר מתי לקבל תזכורות על שיעורים</p>
            </div>
            <div className="reminder-times">
              {[15, 30, 60, 120, 240].map(minutes => (
                <button
                  key={minutes}
                  className={`reminder-btn ${settings.notifications.reminderTimes.includes(minutes) ? 'active' : ''}`}
                  onClick={() => toggleReminderTime(minutes)}
                >
                  {minutes < 60 ? `${minutes} דק'` : `${minutes / 60} שעות`}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="settings-section">
          <div className="section-header">
            <Monitor size={24} />
            <h2>מראה וממשק</h2>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>ערכת נושא</h3>
              <p>בחר בין מצב בהיר, כהה או אוטומטי</p>
            </div>
            <div className="theme-options">
              <button
                className={`theme-btn ${settings.appearance.theme === 'light' ? 'active' : ''}`}
                onClick={() => updateAppearanceSettings('theme', 'light')}
              >
                <Sun size={20} />
                בהיר
              </button>
              <button
                className={`theme-btn ${settings.appearance.theme === 'dark' ? 'active' : ''}`}
                onClick={() => updateAppearanceSettings('theme', 'dark')}
              >
                <Moon size={20} />
                כהה
              </button>
              <button
                className={`theme-btn ${settings.appearance.theme === 'auto' ? 'active' : ''}`}
                onClick={() => updateAppearanceSettings('theme', 'auto')}
              >
                <Smartphone size={20} />
                אוטומטי
              </button>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>שפה</h3>
              <p>שפת הממשק</p>
            </div>
            <select
              value={settings.appearance.language}
              onChange={(e) => updateAppearanceSettings('language', e.target.value)}
              className="language-select"
            >
              <option value="he">עברית</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>גודל גופן</h3>
              <p>התאם את גודל הטקסט לנוחותך</p>
            </div>
            <div className="font-size-options">
              {[
                { value: 'small', label: 'קטן' },
                { value: 'medium', label: 'בינוני' },
                { value: 'large', label: 'גדול' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`font-btn ${settings.appearance.fontSize === option.value ? 'active' : ''}`}
                  onClick={() => updateAppearanceSettings('fontSize', option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="settings-section">
          <div className="section-header">
            <Shield size={24} />
            <h2>פרטיות ונתונים</h2>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>איסוף נתונים</h3>
              <p>אפשר איסוף נתונים לשיפור השירות</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.privacy.dataCollection}
                onChange={(e) => updatePrivacySettings('dataCollection', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>אנליטיקס</h3>
              <p>שליחת נתוני שימוש אנונימיים</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.privacy.analytics}
                onChange={(e) => updatePrivacySettings('analytics', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="settings-section">
          <div className="section-header">
            <Download size={24} />
            <h2>ניהול נתונים</h2>
          </div>

          <div className="data-actions">
            <button onClick={exportData} className="export-btn">
              <Download size={20} />
              יצוא נתונים
            </button>
            
            <button 
              onClick={() => setShowConfirmReset(true)} 
              className="reset-btn"
            >
              <RefreshCw size={20} />
              איפוס הגדרות
            </button>
            
            <button onClick={clearAllData} className="danger-btn">
              <Trash2 size={20} />
              מחיקת כל הנתונים
            </button>
          </div>
        </section>
      </div>

      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>איפוס הגדרות</h3>
            <p>האם אתה בטוח שברצונך לאפס את כל ההגדרות לברירת המחדל?</p>
            <div className="modal-actions">
              <button 
                onClick={() => setShowConfirmReset(false)}
                className="btn-cancel"
              >
                ביטול
              </button>
              <button 
                onClick={resetSettings}
                className="btn-confirm"
              >
                איפוס
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
