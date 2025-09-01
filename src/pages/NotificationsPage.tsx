import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, Clock, Calendar } from 'lucide-react';
import type { Lesson } from '../types';
import { LessonService } from '../services/lessonService';
// import { NotificationService } from '../services/notificationService';
// import AuthService from '../services/authService';
import './NotificationsPage.css';

interface ScheduledNotification {
  id: string;
  lessonId: string;
  lessonTitle: string;
  lessonDate: Date;
  reminderTime: number; // דקות לפני השיעור
  scheduledFor: Date;
  enabled: boolean;
}

const NotificationsPage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [globalSettings, setGlobalSettings] = useState({
    enabled: true,
    sound: true,
    defaultReminders: [15, 60] // דקות לפני
  });
  const [showSettings, setShowSettings] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default'>('default');

  // const authService = AuthService.getInstance();

  useEffect(() => {
    loadData();
    checkNotificationPermission();
  }, []);

  const loadData = async () => {
    const allLessons = await LessonService.getAllLessons();
    setLessons(allLessons);
    generateNotificationsList(allLessons);
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  };

  // Removed unused function requestPermission

  const generateNotificationsList = (lessonsList: Lesson[]) => {
    const scheduledNotifications: ScheduledNotification[] = [];
    
    lessonsList.forEach(lesson => {
      if (lesson.notifications.enabled && lesson.date > new Date()) {
        lesson.notifications.reminderTimes.forEach(reminderTime => {
          const scheduledFor = new Date(lesson.date.getTime() - (reminderTime * 60 * 1000));
          scheduledNotifications.push({
            id: `${lesson.id}-${reminderTime}`,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonDate: lesson.date,
            reminderTime,
            scheduledFor,
            enabled: lesson.notifications.enabled
          });
        });
      }
    });

    // מיון לפי זמן התזכורת
    scheduledNotifications.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
    setNotifications(scheduledNotifications);
  };

  const toggleLessonNotifications = async (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) {
      const updatedNotifications = {
        ...lesson.notifications,
        enabled: !lesson.notifications.enabled
      };
      
      const updatedLesson = {
        ...lesson,
        notifications: updatedNotifications
      };
      await LessonService.updateLessonAndSync(updatedLesson);
      loadData(); // רענון הנתונים
    }
  };

  // Removed unused function updateReminderTimes

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('בדיקת תזכורת', {
        body: 'זוהי הודעת בדיקה עבור מערכת התזכורות',
        icon: '/אייקון.jpeg'
      });
    } else {
      alert('בדיקת תזכורת - זוהי הודעת בדיקה עבור מערכת התזכורות');
    }
  };

  const enableAllNotifications = async () => {
    for (const lesson of lessons) {
      if (lesson.date > new Date()) {
        const updatedLesson = {
          ...lesson,
          notifications: {
            enabled: true,
            reminderTimes: globalSettings.defaultReminders
          }
        };
        await LessonService.updateLessonAndSync(updatedLesson);
      }
    }
    loadData();
  };

  const disableAllNotifications = async () => {
    for (const lesson of lessons) {
      const updatedLesson = {
        ...lesson,
        notifications: {
          ...lesson.notifications,
          enabled: false
        }
      };
      await LessonService.updateLessonAndSync(updatedLesson);
    }
    loadData();
  };

  const getTimeUntilNotification = (scheduledFor: Date): string => {
    const now = new Date();
    const diff = scheduledFor.getTime() - now.getTime();
    
    if (diff < 0) return 'עבר';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `בעוד ${days} ימים`;
    if (hours > 0) return `בעוד ${hours} שעות`;
    if (minutes > 0) return `בעוד ${minutes} דקות`;
    return 'עכשיו';
  };

  const upcomingNotifications = notifications.filter(n => n.scheduledFor > new Date() && n.enabled);
  const upcomingLessons = lessons.filter(l => l.date > new Date()).sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div className="header-content">
          <h1>ניהול תזכורות</h1>
          <div className="header-actions">
            <button onClick={testNotification} className="btn-test">
              <Bell size={16} />
              בדיקת התראה
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="btn-settings">
              <Settings size={16} />
              הגדרות
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <h3>הגדרות כלליות</h3>
          
          {permissionStatus !== 'granted' && (
            <div className="permission-notice">
              ⚠️ כדי שתזכורות יעבדו, יש לאשר הרשאות התראות בדפדפן. 
              לחץ על אייקון המנעול ליד כתובת האתר ואפשר התראות.
            </div>
          )}
          
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={globalSettings.enabled}
                  onChange={(e) => setGlobalSettings({...globalSettings, enabled: e.target.checked})}
                />
                הפעל תזכורות גלובלית
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={globalSettings.sound}
                  onChange={(e) => setGlobalSettings({...globalSettings, sound: e.target.checked})}
                />
                הפעל צלילי התראה
              </label>
            </div>
            <div className="setting-item">
              <label>זמני תזכורת ברירת מחדל (דקות):</label>
              <input
                type="text"
                value={globalSettings.defaultReminders.join(', ')}
                onChange={(e) => {
                  const times = e.target.value.split(',').map(t => parseInt(t.trim())).filter(Boolean);
                  setGlobalSettings({...globalSettings, defaultReminders: times});
                }}
                placeholder="15, 60"
              />
            </div>
            <div className="setting-actions">
              <button onClick={enableAllNotifications} className="btn-secondary">
                הפעל הכל
              </button>
              <button onClick={disableAllNotifications} className="btn-danger">
                בטל הכל
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="content-grid">
        <div className="notifications-section">
          <h2>
            <Clock size={20} />
            תזכורות קרובות ({upcomingNotifications.length})
          </h2>
          
          {upcomingNotifications.length === 0 ? (
            <div className="empty-state">
              <BellOff size={48} />
              <h3>אין תזכורות קרובות</h3>
              <p>כל התזכורות מבוטלות או שאין שיעורים קרובים</p>
            </div>
          ) : (
            <div className="notifications-list">
              {upcomingNotifications.slice(0, 10).map(notification => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-info">
                    <h4>{notification.lessonTitle}</h4>
                    <p>תזכורת {notification.reminderTime} דקות לפני השיעור</p>
                    <span className="notification-time">
                      {getTimeUntilNotification(notification.scheduledFor)}
                    </span>
                  </div>
                  <div className="notification-status">
                    <Bell size={16} className="enabled" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lessons-section">
          <h2>
            <Calendar size={20} />
            הגדרות תזכורות לשיעורים
          </h2>

          {upcomingLessons.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>אין שיעורים קרובים</h3>
              <p>הוסף שיעורים כדי להגדיר תזכורות</p>
            </div>
          ) : (
            <div className="lessons-list">
              {upcomingLessons.map(lesson => (
                <div key={lesson.id} className="lesson-notification-item">
                  <div className="lesson-info">
                    <h4>{lesson.title}</h4>
                    <p>{lesson.date.toLocaleDateString('he-IL')} בשעה {lesson.time}</p>
                    <span className="lesson-teacher">{lesson.teacher}</span>
                  </div>
                  
                  <div className="notification-controls">
                    <button
                      onClick={() => toggleLessonNotifications(lesson.id)}
                      className={`toggle-btn ${lesson.notifications.enabled ? 'enabled' : 'disabled'}`}
                    >
                      {lesson.notifications.enabled ? (
                        <>
                          <Bell size={16} />
                          מופעל
                        </>
                      ) : (
                        <>
                          <BellOff size={16} />
                          מבוטל
                        </>
                      )}
                    </button>
                    
                    {lesson.notifications.enabled && (
                      <div className="reminder-times">
                        <span>תזכורות:</span>
                        {lesson.notifications.reminderTimes.map((time, index) => (
                          <span key={index} className="reminder-tag">
                            {time} דק'
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
