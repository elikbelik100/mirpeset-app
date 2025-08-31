import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Save, X, Upload, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { LessonService } from '../services/lessonService';
import AuthService from '../services/authService';
import type { Lesson } from '../types';
import './AdminPage.css';

interface EditingLesson extends Lesson {
  isEditing?: boolean;
}

const AdminPage: React.FC = () => {
  const [lessons, setLessons] = useState<EditingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const authService = AuthService.getInstance();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const lessonsData = await LessonService.getAllLessons();
      setLessons(lessonsData.map(lesson => ({ ...lesson, isEditing: false })));
    } catch (error) {
      showMessage('error', 'שגיאה בטעינת השיעורים');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const startEditing = (id: string) => {
    setLessons(prev => 
      prev.map(lesson => 
        lesson.id === id ? { ...lesson, isEditing: true } : { ...lesson, isEditing: false }
      )
    );
  };

  const cancelEditing = (id: string) => {
    setLessons(prev => 
      prev.map(lesson => 
        lesson.id === id ? { ...lesson, isEditing: false } : lesson
      )
    );
    loadLessons(); // Reload to reset any changes
  };

  const saveLesson = async (lesson: EditingLesson) => {
    try {
      setSyncing(true);
      const isGitHubConfigured = LessonService.isGitHubConfigured();
      
      if (isGitHubConfigured) {
        await LessonService.updateLessonAndSync(lesson);
        showMessage('success', 'השיעור נשמר ויסונכרן לגיטהאב תוך דקות ⚡');
      } else {
        await LessonService.updateLesson(lesson.id, lesson);
        showMessage('info', 'השיעור נשמר מקומית. GitHub לא מוגדר לסנכרון אוטומטי');
      }
      
      setLessons(prev => 
        prev.map(l => 
          l.id === lesson.id ? { ...lesson, isEditing: false } : l
        )
      );
    } catch (error) {
      showMessage('error', 'שגיאה בשמירת השיעור');
    } finally {
      setSyncing(false);
    }
  };

  const deleteLesson = async (id: string, title: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את השיעור "${title}"?`)) {
      return;
    }

    try {
      setSyncing(true);
      const isGitHubConfigured = LessonService.isGitHubConfigured();
      
      if (isGitHubConfigured) {
        await LessonService.deleteLessonAndSync(id);
        showMessage('success', 'השיעור נמחק ויסונכרן לגיטהאב תוך דקות 🗑️');
      } else {
        await LessonService.deleteLesson(id);
        showMessage('info', 'השיעור נמחק מקומית. GitHub לא מוגדר לסנכרון אוטומטי');
      }
      
      setLessons(prev => prev.filter(lesson => lesson.id !== id));
    } catch (error) {
      showMessage('error', 'שגיאה במחיקת השיעור');
    } finally {
      setSyncing(false);
    }
  };

  const syncToGitHub = async () => {
    try {
      setSyncing(true);
      await LessonService.syncAllLessonsToGitHub();
      showMessage('success', 'כל השיעורים סונכרנו לגיטהאב בהצלחה! 🚀');
    } catch (error) {
      showMessage('error', 'שגיאה בסנכרון לגיטהאב');
    } finally {
      setSyncing(false);
    }
  };

  const handleFieldChange = (id: string, field: keyof Lesson, value: any) => {
    setLessons(prev => 
      prev.map(lesson => 
        lesson.id === id ? { ...lesson, [field]: value } : lesson
      )
    );
  };

  const filteredLessons = lessons.filter(lesson =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isGitHubConfigured = LessonService.isGitHubConfigured();

  if (!currentUser?.isAdmin) {
    return (
      <div className="admin-page">
        <div className="access-denied">
          <h2>🚫 אין הרשאה</h2>
          <p>רק מנהלים יכולים לגשת לעמוד זה</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading">
          <RefreshCw className="spin" />
          <p>טוען שיעורים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🎓 ניהול שיעורים</h1>
        <div className="github-status">
          {isGitHubConfigured ? (
            <span className="github-configured">
              <CheckCircle size={16} />
              GitHub מוגדר - סנכרון אוטומטי פעיל
            </span>
          ) : (
            <span className="github-not-configured">
              <AlertCircle size={16} />
              GitHub לא מוגדר - עבודה מקומית בלבד
            </span>
          )}
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="חיפוש שיעורים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="action-buttons">
          {isGitHubConfigured && (
            <button 
              onClick={syncToGitHub}
              disabled={syncing}
              className="btn-sync"
            >
              {syncing ? <RefreshCw className="spin" size={16} /> : <Upload size={16} />}
              סנכרן לגיטהאב
            </button>
          )}

          <button 
            onClick={() => LessonService.downloadLessonsJSON()}
            className="btn-download"
          >
            <Download size={16} />
            הורד JSON
          </button>
        </div>
      </div>

      <div className="lessons-grid">
        {filteredLessons.map(lesson => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            onEdit={startEditing}
            onSave={saveLesson}
            onCancel={cancelEditing}
            onDelete={deleteLesson}
            onFieldChange={handleFieldChange}
            syncing={syncing}
          />
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="no-lessons">
          <p>לא נמצאו שיעורים</p>
        </div>
      )}
    </div>
  );
};

interface LessonCardProps {
  lesson: EditingLesson;
  onEdit: (id: string) => void;
  onSave: (lesson: EditingLesson) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  onFieldChange: (id: string, field: keyof Lesson, value: any) => void;
  syncing: boolean;
}

const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onFieldChange,
  syncing
}) => {
  if (lesson.isEditing) {
    return (
      <div className="lesson-card editing">
        <div className="lesson-edit-form">
          <input
            type="text"
            value={lesson.title}
            onChange={(e) => onFieldChange(lesson.id, 'title', e.target.value)}
            placeholder="כותרת השיעור"
          />
          
          <input
            type="text"
            value={lesson.teacher}
            onChange={(e) => onFieldChange(lesson.id, 'teacher', e.target.value)}
            placeholder="שם הרב"
          />
          
          <input
            type="date"
            value={lesson.date instanceof Date ? lesson.date.toISOString().split('T')[0] : lesson.date}
            onChange={(e) => onFieldChange(lesson.id, 'date', new Date(e.target.value))}
          />
          
          <input
            type="time"
            value={lesson.time}
            onChange={(e) => onFieldChange(lesson.id, 'time', e.target.value)}
          />
          
          <select
            value={lesson.category}
            onChange={(e) => onFieldChange(lesson.id, 'category', e.target.value)}
          >
            <option value="הלכה">הלכה</option>
            <option value="תנ״ך">תנ״ך</option>
            <option value="משנה">משנה</option>
            <option value="גמרא">גמרא</option>
            <option value="מוסר">מוסר</option>
            <option value="קבלה">קבלה</option>
            <option value="אחר">אחר</option>
          </select>
          
          <textarea
            value={lesson.description}
            onChange={(e) => onFieldChange(lesson.id, 'description', e.target.value)}
            placeholder="תיאור השיעור"
            rows={3}
          />
          
          <div className="edit-actions">
            <button 
              onClick={() => onSave(lesson)}
              disabled={syncing}
              className="btn-save"
            >
              {syncing ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
              שמור
            </button>
            <button 
              onClick={() => onCancel(lesson.id)}
              className="btn-cancel"
            >
              <X size={16} />
              ביטול
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-card">
      <div className="lesson-header">
        <h3>{lesson.title}</h3>
        <div className="lesson-actions">
          <button 
            onClick={() => onEdit(lesson.id)}
            className="btn-edit"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(lesson.id, lesson.title)}
            className="btn-delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="lesson-details">
        <p><strong>רב:</strong> {lesson.teacher}</p>
        <p><strong>תאריך:</strong> {new Date(lesson.date).toLocaleDateString('he-IL')}</p>
        <p><strong>שעה:</strong> {lesson.time}</p>
        <p><strong>קטגוריה:</strong> {lesson.category}</p>
        {lesson.description && (
          <p><strong>תיאור:</strong> {lesson.description}</p>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
