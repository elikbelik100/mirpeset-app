import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import LessonCard from '../components/LessonCard';
import type { Lesson } from '../types';
import { LessonService } from '../services/lessonService';
import { NotificationService } from '../services/notificationService';
import AuthService from '../services/authService';
import './LessonsPage.css';

const LessonsPage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const authService = AuthService.getInstance();

  useEffect(() => {
    loadLessons();
    NotificationService.requestPermission();
  }, []);

  const loadLessons = async () => {
    const allLessons = await LessonService.getAllLessons();
    setLessons(allLessons);
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const now = new Date();
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'upcoming' && lesson.date >= now && lesson.status === 'scheduled') ||
                         (filterStatus === 'past' && (lesson.date < now || lesson.status === 'completed'));
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateLesson = () => {
    setEditingLesson(null);
    setShowCreateForm(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setShowCreateForm(true);
  };

  const handleDeleteLesson = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את השיעור?')) {
      await LessonService.deleteLessonAndSync(id);
      loadLessons();
    }
  };

  const handleSaveLesson = async (lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingLesson) {
      await LessonService.updateLessonAndSync({
        ...editingLesson,
        ...lessonData,
        updatedAt: new Date()
      });
    } else {
      const newLesson = await LessonService.createLessonAndSync(lessonData);
      if (newLesson.notifications.enabled) {
        NotificationService.scheduleNotification(newLesson);
      }
    }
    
    loadLessons();
    setShowCreateForm(false);
    setEditingLesson(null);
  };

  const handlePlayRecording = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="lessons-page">
      <div className="page-header">
        <div className="header-content">
          <h1>ניהול שיעורים</h1>
          {authService.hasPermission('create_lesson') && (
            <button onClick={handleCreateLesson} className="create-btn">
              <Plus size={20} />
              שיעור חדש
            </button>
          )}
        </div>

        <div className="filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="חיפוש שיעורים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <Filter size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">כל השיעורים</option>
              <option value="upcoming">שיעורים קרובים</option>
              <option value="past">שיעורים שהסתיימו</option>
            </select>
          </div>
        </div>
      </div>

      <div className="lessons-grid">
        {filteredLessons.length === 0 ? (
          <div className="empty-state">
            <p>לא נמצאו שיעורים</p>
            <button onClick={handleCreateLesson} className="empty-action">
              צור שיעור ראשון
            </button>
          </div>
        ) : (
          filteredLessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onEdit={handleEditLesson}
              onDelete={handleDeleteLesson}
              onPlayRecording={handlePlayRecording}
            />
          ))
        )}
      </div>

      {showCreateForm && (
        <LessonForm
          lesson={editingLesson}
          onSave={handleSaveLesson}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingLesson(null);
          }}
        />
      )}
    </div>
  );
};

// Lesson Form Component
interface LessonFormProps {
  lesson: Lesson | null;
  onSave: (lesson: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const LessonForm: React.FC<LessonFormProps> = ({ lesson, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    date: lesson?.date ? lesson.date.toISOString().split('T')[0] : '',
    time: lesson?.time || '20:00',
    teacher: lesson?.teacher || '',
    category: lesson?.category || 'כולל יום שישי',
    status: lesson?.status || 'scheduled' as const,
    maxParticipants: lesson?.maxParticipants || 0,
    currentParticipants: lesson?.currentParticipants || 0,
    recordingUrl: lesson?.recordingUrl || '',
    imageUrl: lesson?.imageUrl || '',
    tags: lesson?.tags?.join(', ') || '',
    notificationsEnabled: lesson?.notifications?.enabled ?? true,
    reminderTimes: lesson?.notifications?.reminderTimes?.join(', ') || '15, 60',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lessonData = {
      title: formData.title,
      description: formData.description,
      date: new Date(formData.date),
      time: formData.time,
      duration: 90, // קבוע - 90 דקות
      teacher: formData.teacher,
      location: 'המרפסת', // קבוע - תמיד במרפסת
      category: formData.category,
      status: formData.status,
      maxParticipants: formData.maxParticipants || undefined,
      currentParticipants: formData.currentParticipants,
      recordingUrl: formData.recordingUrl || undefined,
      imageUrl: formData.imageUrl || undefined,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      notifications: {
        enabled: formData.notificationsEnabled,
        reminderTimes: formData.reminderTimes.split(',').map(time => parseInt(time.trim())).filter(Boolean),
      },
    };

    onSave(lessonData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{lesson ? 'עריכת שיעור' : 'שיעור חדש'}</h2>
          <button onClick={onCancel} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="lesson-form">
          <div className="form-grid">
            <div className="form-group">
              <label>שם השיעור</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>מורה</label>
              <input
                type="text"
                value={formData.teacher}
                onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>תאריך</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>שעה</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>תיאור</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>תגיות (מופרדות בפסיק)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder="תורה, קבלה, פילוסופיה"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.notificationsEnabled}
                onChange={(e) => setFormData({...formData, notificationsEnabled: e.target.checked})}
              />
              הפעל תזכורות
            </label>
          </div>

          {formData.notificationsEnabled && (
            <div className="form-group">
              <label>זמני תזכורת (דקות לפני השיעור)</label>
              <input
                type="text"
                value={formData.reminderTimes}
                onChange={(e) => setFormData({...formData, reminderTimes: e.target.value})}
                placeholder="15, 60"
              />
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              ביטול
            </button>
            <button type="submit" className="save-btn">
              שמירה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonsPage;
