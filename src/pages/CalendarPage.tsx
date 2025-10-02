import React, { useEffect } from 'react';
import Calendar from '../components/Calendar';
import { LessonService } from '../services/lessonService';
import AuthService from '../services/authService';
import googleAnalytics from '../services/googleAnalyticsService';
import './CalendarPage.css';

const CalendarPage: React.FC = () => {
  const authService = AuthService.getInstance();

  useEffect(() => {
    // Track calendar page view
    googleAnalytics.trackPageView('calendar', 'לוח שנה');
  }, []);

  const handleDeleteLesson = async (id: string) => {
    await LessonService.deleteLessonAndSync(id);
    window.location.reload(); // רענון העמוד כדי לראות את השינויים
  };

  const handleDeleteAllLessons = async () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל השיעורים?')) {
      if (confirm('אישור נוסף: פעולה זו תמחק את כל השיעורים מהמערכת!')) {
        try {
          await LessonService.deleteAllLessons();
          console.log('All lessons deleted successfully');
          // רענון הדף כדי לראות את השינויים
          window.location.reload();
        } catch (error) {
          console.error('Error deleting lessons:', error);
          alert('שגיאה במחיקת השיעורים');
        }
      }
    }
  };

  const handleCreateLesson = (date: Date) => {
    // נווט לדף ניהול השיעורים עם התאריך הנבחר
    const dateParam = date.toISOString().split('T')[0];
    window.location.href = `/admin?date=${dateParam}`;
  };

  return (
    <div className="page-container">
      {authService.hasPermission('create_lesson') && (
        <div className="calendar-header-actions">
          <button 
            className="delete-all-btn"
            onClick={handleDeleteAllLessons}
            style={{ 
              background: '#dc2626', 
              color: 'white', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            מחק את כל השיעורים
          </button>
        </div>
      )}
      <Calendar 
        onDeleteLesson={handleDeleteLesson}
        onCreateLesson={handleCreateLesson}
      />
    </div>
  );
};

export default CalendarPage;
