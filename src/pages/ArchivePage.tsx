import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Download, 
  Search, 
  Calendar,
  User,
  Clock,
  MapPin,
  Eye,
  Star,
  Share2,
  BookOpen,
  Archive as ArchiveIcon
} from 'lucide-react';
import type { Lesson } from '../types';
import { LessonService } from '../services/lessonService';
import './ArchivePage.css';

interface ArchivedLesson extends Lesson {
  views: number;
  rating: number;
  recordingDuration: string;
  downloadCount: number;
}

const ArchivePage: React.FC = () => {
  const [archivedLessons, setArchivedLessons] = useState<ArchivedLesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<ArchivedLesson[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'rating'>('date');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArchivedLessons();
  }, []);

  useEffect(() => {
    filterLessons();
  }, [archivedLessons, searchTerm, selectedCategory, selectedTeacher, sortBy]);

  const loadArchivedLessons = () => {
    setIsLoading(true);
    try {
      // Get completed lessons and add archive-specific data
      const allLessons = LessonService.getAllLessons();
      const completedLessons = allLessons
        .filter(lesson => lesson.status === 'completed' || lesson.recordingUrl)
        .map(lesson => ({
          ...lesson,
          views: Math.floor(Math.random() * 500) + 10,
          rating: Math.floor(Math.random() * 50) / 10 + 4, // 4.0 - 5.0
          recordingDuration: generateRandomDuration(),
          downloadCount: Math.floor(Math.random() * 100) + 5
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
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(lesson => lesson.category === selectedCategory);
    }

    // Teacher filter
    if (selectedTeacher !== 'all') {
      filtered = filtered.filter(lesson => lesson.teacher === selectedTeacher);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.views - a.views;
        case 'rating':
          return b.rating - a.rating;
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    setFilteredLessons(filtered);
  };

  const handleWatch = (lesson: ArchivedLesson) => {
    // Simulate watching a recording
    if (lesson.recordingUrl) {
      // In real app, this would open the recording
      window.open(lesson.recordingUrl, '_blank');
      
      // Update view count
      setArchivedLessons(prev =>
        prev.map(l => l.id === lesson.id ? { ...l, views: l.views + 1 } : l)
      );
    } else {
      alert('קישור להקלטה לא זמין');
    }
  };

  const handleDownload = (lesson: ArchivedLesson) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = lesson.recordingUrl || '#';
    link.download = `${lesson.title}.mp4`;
    link.click();
    
    // Update download count
    setArchivedLessons(prev =>
      prev.map(l => l.id === lesson.id ? { ...l, downloadCount: l.downloadCount + 1 } : l)
    );
  };

  const handleShare = (lesson: ArchivedLesson) => {
    if (navigator.share) {
      navigator.share({
        title: lesson.title,
        text: `שיעור מעולה של ${lesson.teacher}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('הקישור הועתק ללוח');
    }
  };

  const getUniqueCategories = () => {
    const categories = new Set(archivedLessons.map(lesson => lesson.category));
    return Array.from(categories);
  };

  const getUniqueTeachers = () => {
    const teachers = new Set(archivedLessons.map(lesson => lesson.teacher));
    return Array.from(teachers);
  };

  const formatRating = (rating: number) => {
    return `${rating.toFixed(1)}`;
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
            <div className="stat">
              <span className="stat-number">
                {archivedLessons.reduce((sum, lesson) => sum + lesson.views, 0)}
              </span>
              <span className="stat-label">צפיות</span>
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
              onChange={(e) => setSortBy(e.target.value as 'date' | 'views' | 'rating')}
              className="filter-select"
            >
              <option value="date">מיון לפי תאריך</option>
              <option value="views">מיון לפי צפיות</option>
              <option value="rating">מיון לפי דירוג</option>
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
                  <div className="lesson-rating">
                    <Star size={16} fill="currentColor" />
                    {formatRating(lesson.rating)}
                  </div>
                </div>

                <div className="lesson-meta">
                  <div className="meta-item">
                    <User size={16} />
                    {lesson.teacher}
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

                <div className="lesson-stats">
                  <div className="stat-item">
                    <Eye size={16} />
                    {lesson.views} צפיות
                  </div>
                  <div className="stat-item">
                    <Download size={16} />
                    {lesson.downloadCount} הורדות
                  </div>
                </div>

                <div className="lesson-actions">
                  <button
                    onClick={() => handleWatch(lesson)}
                    className="action-btn primary"
                  >
                    <Play size={18} />
                    צפייה
                  </button>
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
          ))
        )}
      </div>
    </div>
  );
};

export default ArchivePage;
