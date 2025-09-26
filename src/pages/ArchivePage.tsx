import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Download, 
  Search, 
  Calendar,
  User,
  Clock,
  MapPin,
  Share2,
  BookOpen,
  Archive as ArchiveIcon,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  ExternalLink
} from 'lucide-react';
import type { Lesson } from '../types';
import { LessonService } from '../services/lessonService';
import AuthService from '../services/authService';
import RecordingService, { type RecordingLink } from '../services/recordingService';
import './ArchivePage.css';

interface ArchivedLesson extends Lesson {
  recordingDuration: string;
  speaker?: string; // תמיכה בשדה speaker במקרה של נתונים ישנים
}

const ArchivePage: React.FC = () => {
  const [archivedLessons, setArchivedLessons] = useState<ArchivedLesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<ArchivedLesson[]>([]);
  const [recordingLinks, setRecordingLinks] = useState<RecordingLink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date'>('date');
  const [isLoading, setIsLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState<RecordingLink | null>(null);
  const [linkForm, setLinkForm] = useState({
    lessonId: '',
    title: '',
    url: '',
    description: '',
  });

  const authService = AuthService.getInstance();
  const recordingService = RecordingService.getInstance();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    loadArchivedLessons();
    loadRecordingLinks();
  }, []);

  useEffect(() => {
    filterLessons();
  }, [archivedLessons, recordingLinks, searchTerm, selectedCategory, selectedTeacher, sortBy]);

  const loadRecordingLinks = async () => {
    try {
      const links = await recordingService.loadRecordings();
      setRecordingLinks(links);
    } catch (error) {
      console.error('Error loading recording links:', error);
      setRecordingLinks([]);
    }
  };

  const loadArchivedLessons = async () => {
    setIsLoading(true);
    try {
      // Get all lessons and auto-update past lessons to completed
      const allLessons = await LessonService.getAllLessons();
      const now = new Date();
      
      // Update past lessons to completed status automatically
      const updatedLessons = await Promise.all(
        allLessons.map(async (lesson) => {
          const lessonDateTime = new Date(lesson.date);
          // Add lesson duration (90 minutes) to get end time
          lessonDateTime.setMinutes(lessonDateTime.getMinutes() + (lesson.duration || 90));
          
          // If lesson end time has passed and it's still scheduled, mark as completed
          if (lessonDateTime < now && lesson.status === 'scheduled') {
            const updatedLesson = { ...lesson, status: 'completed' as const };
            await LessonService.updateLesson(lesson.id, { status: 'completed' });
            return updatedLesson;
          }
          return lesson;
        })
      );
      
      // Filter for completed lessons or lessons with recordings
      const completedLessons = updatedLessons
        .filter(lesson => lesson.status === 'completed' || lesson.recordingUrl)
        .map(lesson => ({
          ...lesson,
          // תיקון שדות חסרים
          id: lesson.id || Math.random().toString(),
          date: typeof lesson.date === 'string' ? new Date(lesson.date) : lesson.date,
          location: lesson.location || 'לא צוין',
          teacher: lesson.teacher || (lesson as any).speaker || 'לא צוין',
          tags: lesson.tags || [],
          // נתונים נוספים לארכיון
          recordingDuration: generateRandomDuration()
        }));

      setArchivedLessons(completedLessons);
    } catch (error) {
      console.error('Error loading archived lessons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomDuration = (): string => {
    const minutes = Math.floor(Math.random() * 60) + 30; // 30-90 minutes
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}:${remainingMinutes.toString().padStart(2, '0')}` : `${minutes}:00`;
  };

  const filterLessons = () => {
    let filtered = [...archivedLessons];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(lesson =>
        lesson.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lesson.teacher || lesson.speaker)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lesson.tags || []).some(tag => tag?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(lesson => lesson.category === selectedCategory);
    }

    // Teacher filter
    if (selectedTeacher !== 'all') {
      filtered = filtered.filter(lesson => (lesson.teacher || lesson.speaker) === selectedTeacher);
    }

    // Sort
    filtered.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    setFilteredLessons(filtered);
  };

  const handleDownload = (lesson: ArchivedLesson) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = lesson.recordingUrl || '#';
    link.download = `${lesson.title}.mp4`;
    link.click();
  };

  const handleShare = (lesson: ArchivedLesson) => {
    if (navigator.share) {
      navigator.share({
        title: lesson.title,
        text: `שיעור מעולה של ${lesson.teacher || lesson.speaker}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('הקישור הועתק ללוח');
    }
  };

  // פונקציות ניהול קישורי הקלטות
  const handleAddLink = (lessonId: string) => {
    // מצא את השיעור לפי ID כדי לשלוף את הכותרת והמרצה
    const lesson = archivedLessons.find(l => l.id === lessonId);
    const autoTitle = lesson ? `הקלטת ${lesson.title} - ${lesson.teacher || lesson.speaker}` : '';
    
    setLinkForm({
      lessonId,
      title: autoTitle,
      url: '',
      description: '',
    });
    setEditingLink(null);
    setShowLinkModal(true);
  };

  const handleEditLink = (link: RecordingLink) => {
    setLinkForm({
      lessonId: link.lessonId,
      title: link.title,
      url: link.url,
      description: link.description || '',
    });
    setEditingLink(link);
    setShowLinkModal(true);
  };

  const handleDeleteLink = async (linkId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הקישור?')) {
      try {
        await recordingService.deleteRecording(linkId);
        await loadRecordingLinks(); // Reload from GitHub
        alert('הקישור נמחק בהצלחה');
      } catch (error) {
        console.error('Error deleting recording:', error);
        alert('שגיאה במחיקת הקישור');
      }
    }
  };

  const handleSaveLink = async () => {
    if (!linkForm.title.trim() || !linkForm.url.trim()) {
      alert('אנא מלא את הכותרת ואת קישור ההקלטה');
      return;
    }

    try {
      if (editingLink) {
        // עריכת קישור קיים
        await recordingService.updateRecording(editingLink.id, {
          title: linkForm.title,
          url: linkForm.url,
          description: linkForm.description,
        });
      } else {
        // הוספת קישור חדש
        await recordingService.addRecording({
          lessonId: linkForm.lessonId,
          title: linkForm.title,
          url: linkForm.url,
          description: linkForm.description,
        });
      }

      await loadRecordingLinks(); // Reload from GitHub
      setShowLinkModal(false);
      setLinkForm({ lessonId: '', title: '', url: '', description: '' });
      setEditingLink(null);
      alert('הקישור נשמר בהצלחה ויהיה זמין לכל המשתמשים');
    } catch (error) {
      console.error('Error saving recording:', error);
      alert('שגיאה בשמירת הקישור');
    }
  };

  const getRecordingLinks = (lessonId: string): RecordingLink[] => {
    return recordingLinks.filter(link => link.lessonId === lessonId);
  };

  const getUniqueCategories = () => {
    const categories = new Set(archivedLessons.map(lesson => lesson.category));
    return Array.from(categories);
  };

  const getUniqueTeachers = () => {
    const teachers = new Set(archivedLessons.map(lesson => lesson.teacher || lesson.speaker));
    return Array.from(teachers);
  };

  if (isLoading) {
    return (
      <div className="archive-page">
        <div className="loading-state">
          <ArchiveIcon size={48} className="spinning" />
          <h2>טוען ארכיון...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="archive-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>ארכיון השיעורים</h1>
            <p>גישה לכל השיעורים המוקלטים והמשאבים</p>
          </div>
          <div className="archive-stats">
            <div className="stat">
              <span className="stat-number">{archivedLessons.length}</span>
              <span className="stat-label">שיעורים</span>
            </div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-and-filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="חיפוש שיעורים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">כל הקטגוריות</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="filter-select"
            >
              <option value="all">כל המרצים</option>
              {getUniqueTeachers().map(teacher => (
                <option key={teacher} value={teacher}>{teacher}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date')}
              className="filter-select"
            >
              <option value="date">מיון לפי תאריך</option>
            </select>
          </div>
        </div>
      </div>

      <div className="lessons-grid">
        {filteredLessons.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>לא נמצאו שיעורים</h3>
            <p>נסה לשנות את הסינון או החיפוש</p>
          </div>
        ) : (
          filteredLessons.map(lesson => (
            <div key={lesson.id} className="archive-lesson-card">
              <div className="lesson-thumbnail">
                {lesson.imageUrl ? (
                  <img src={lesson.imageUrl} alt={lesson.title} />
                ) : (
                  <div className="default-thumbnail">
                    <Play size={32} />
                  </div>
                )}
                <div className="duration-badge">
                  <Clock size={14} />
                  {lesson.recordingDuration}
                </div>
              </div>

              <div className="lesson-content">
                <div className="lesson-header">
                  <h3>{lesson.title}</h3>
                </div>

                <div className="lesson-meta">
                  <div className="meta-item">
                    <User size={16} />
                    {lesson.teacher || lesson.speaker}
                  </div>
                  <div className="meta-item">
                    <Calendar size={16} />
                    {lesson.date.toLocaleDateString('he-IL')}
                  </div>
                  <div className="meta-item">
                    <MapPin size={16} />
                    {lesson.location}
                  </div>
                </div>

                <p className="lesson-description">
                  {lesson.description.length > 100
                    ? `${lesson.description.substring(0, 100)}...`
                    : lesson.description}
                </p>

                <div className="lesson-tags">
                  {lesson.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>

                {/* ניהול הקלטות למנהלים */}
                {isAdmin && (
                  <div className="recording-management">
                    <h4 className="management-title">ניהול הקלטות</h4>
                    <div className="recording-links-admin">
                      {getRecordingLinks(lesson.id).map(recordingLink => (
                        <div key={recordingLink.id} className="recording-item-admin">
                          <div className="recording-info-admin">
                            <ExternalLink size={16} />
                            <span>{recordingLink.title}</span>
                          </div>
                          <div className="recording-actions-admin">
                            <button
                              onClick={() => handleEditLink(recordingLink)}
                              className="action-btn secondary small"
                              title="ערוך קישור"
                            >
                              <Edit3 size={14} />
                              ערוך
                            </button>
                            <button
                              onClick={() => handleDeleteLink(recordingLink.id)}
                              className="action-btn danger small"
                              title="מחק קישור"
                            >
                              <Trash2 size={14} />
                              מחק
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddLink(lesson.id)}
                        className="action-btn secondary full-width"
                      >
                        <Plus size={18} />
                        הוסף קישור הקלטה
                      </button>
                    </div>
                  </div>
                )}

                <div className="lesson-actions">
                  {(() => {
                    const recordingLinksForLesson = getRecordingLinks(lesson.id);
                    return recordingLinksForLesson.length > 0 ? (
                      <div className="recording-section">
                        {recordingLinksForLesson.map(recordingLink => (
                          <div key={recordingLink.id} className="recording-info">
                            <a 
                              href={recordingLink.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="action-btn primary"
                            >
                              <Play size={18} />
                              האזנה להקלטה
                              {recordingLinksForLesson.length > 1 && (
                                <span style={{fontSize: '12px', marginRight: '5px'}}>
                                  ({recordingLink.title})
                                </span>
                              )}
                            </a>
                            {recordingLink.fileSize && (
                              <span className="file-size">{recordingLink.fileSize}</span>
                            )}
                            {isAdmin && (
                              <div className="admin-actions" style={{marginTop: '5px'}}>
                                <button
                                  onClick={() => handleEditLink(recordingLink)}
                                  className="action-btn secondary small"
                                  title="ערוך קישור"
                                >
                                  <Edit3 size={14} />
                                  ערוך
                                </button>
                                <button
                                  onClick={() => handleDeleteLink(recordingLink.id)}
                                  className="action-btn danger small"
                                  title="מחק קישור"
                                >
                                  <Trash2 size={14} />
                                  מחק
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}
                  
                  <div className="download-share-buttons">
                    <button
                      onClick={() => handleDownload(lesson)}
                      className="action-btn secondary"
                    >
                      <Download size={18} />
                      הורדה
                    </button>
                    <button
                      onClick={() => handleShare(lesson)}
                      className="action-btn secondary"
                    >
                      <Share2 size={18} />
                      שיתוף
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* מודל הוספה/עריכה של קישור */}
      {showLinkModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingLink ? 'עריכת קישור הקלטה' : 'הוספת קישור הקלטה'}</h3>
              <button 
                onClick={() => setShowLinkModal(false)}
                className="close-btn"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>כותרת ההקלטה:</label>
                <input
                  type="text"
                  value={linkForm.title}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="הכותרת נוצרת אוטומטית מפרטי השיעור"
                />
                <small style={{color: '#666', fontSize: '12px'}}>
                  הכותרת מתמלאת אוטומטית, אך ניתן לערוך אותها
                </small>
              </div>
              
              <div className="form-group">
                <label>קישור להקלטה:</label>
                <input
                  type="url"
                  value={linkForm.url}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                />
              </div>
              
              <div className="form-group">
                <label>תיאור (אופציונלי):</label>
                <textarea
                  value={linkForm.description}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תיאור קצר של ההקלטה..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowLinkModal(false)}
                className="btn-cancel"
              >
                ביטול
              </button>
              <button 
                onClick={handleSaveLink}
                className="btn-save"
              >
                <Save size={16} />
                {editingLink ? 'עדכן' : 'הוסף'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivePage;
