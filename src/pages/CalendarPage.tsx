import React from 'react';
import Calendar from '../components/Calendar';
import { LessonService } from '../services/lessonService';
import AuthService from '../services/authService';
import type { Lesson } from '../types';
import './CalendarPage.css';

const CalendarPage: React.FC = () => {
  const authService = AuthService.getInstance();

  const handleEditLesson = async (lesson: Lesson) => {
    const choice = prompt(
      'מה תרצה לערוך?\n' +
      '1 - נושא השיעור\n' +
      '2 - שם הרב\n' +
      'הקלד 1 או 2:', 
      '1'
    );
    
    if (choice === '1') {
      // עריכת נושא השיעור
      const newTitle = prompt('נושא השיעור:', lesson.title);
      if (newTitle && newTitle !== lesson.title) {
        await LessonService.updateLesson(lesson.id, { title: newTitle });
        window.location.reload();
      }
    } else if (choice === '2') {
      // עריכת שם הרב
      if (lesson.description && lesson.description.includes('רב:')) {
        const currentRabbi = lesson.description.split('רב: ')[1];
        const newRabbi = prompt('שם הרב:', currentRabbi);
        if (newRabbi && newRabbi !== currentRabbi) {
          await LessonService.updateLesson(lesson.id, { description: `רב: ${newRabbi}` });
          window.location.reload();
        }
      } else {
        const newRabbi = prompt('שם הרב:', '');
        if (newRabbi) {
          await LessonService.updateLesson(lesson.id, { description: `רב: ${newRabbi}` });
          window.location.reload();
        }
      }
    }
  };

  const handleDeleteLesson = async (id: string) => {
    await LessonService.deleteLesson(id);
    window.location.reload(); // רענון העמוד כדי לראות את השינויים
  };

  const handleDeleteAllLessons = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל השיעורים? פעולה זו אינה הפיכה!')) {
      if (confirm('אישור נוסף: פעולה זו תמחק את כל השיעורים מהמערכת!')) {
        LessonService.deleteAllLessons();
        window.location.reload();
      }
    }
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
        onEditLesson={handleEditLesson}
        onDeleteLesson={handleDeleteLesson}
      />
    </div>
  );
};

export default CalendarPage;
