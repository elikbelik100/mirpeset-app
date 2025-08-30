import React, { useState, useEffect } from 'react';
import { Plus, Download, Eye, Edit3, Trash2, Palette, Type, Image as ImageIcon } from 'lucide-react';
import type { PosterTemplate, GeneratedPoster, Lesson } from '../types';
import AuthService from '../services/authService';
import { LessonService } from '../services/lessonService';
import { PosterService } from '../services/posterService';
import './PostersPage.css';

const PostersPage: React.FC = () => {
  const [templates, setTemplates] = useState<PosterTemplate[]>([]);
  const [posters, setPosters] = useState<GeneratedPoster[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PosterTemplate | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [posterData, setPosterData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const authService = AuthService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTemplates(PosterService.getTemplates());
    setPosters(PosterService.getGeneratedPosters());
    setLessons(LessonService.getAllLessons());
  };

  const handleCreatePoster = () => {
    if (!authService.hasPermission('create_poster')) {
      alert('אין לך הרשאה ליצור מודעות');
      return;
    }
    setShowEditor(true);
  };

  const handleSelectTemplate = (template: PosterTemplate) => {
    setSelectedTemplate(template);
    // Initialize poster data with default values
    const initialData: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialData[variable.name] = variable.defaultValue;
    });
    setPosterData(initialData);
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    if (selectedTemplate) {
      // Auto-fill poster data from lesson
      const autoFillData: Record<string, string> = {};
      selectedTemplate.variables.forEach(variable => {
        switch (variable.name) {
          case 'title':
            autoFillData[variable.name] = lesson.title;
            break;
          case 'teacher':
            autoFillData[variable.name] = lesson.teacher;
            break;
          case 'date':
            autoFillData[variable.name] = lesson.date.toLocaleDateString('he-IL');
            break;
          case 'time':
            autoFillData[variable.name] = lesson.time;
            break;
          case 'location':
            autoFillData[variable.name] = lesson.location;
            break;
          case 'description':
            autoFillData[variable.name] = lesson.description;
            break;
          default:
            autoFillData[variable.name] = variable.defaultValue;
        }
      });
      setPosterData(autoFillData);
    }
  };

  const handleDataChange = (variableName: string, value: string) => {
    setPosterData(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const generatePoster = async () => {
    if (!selectedTemplate || !selectedLesson) return;

    setIsGenerating(true);
    try {
      const poster = await PosterService.createPoster(
        selectedLesson.id,
        selectedTemplate.id,
        posterData
      );
      setPosters(prev => [poster, ...prev]);
      setShowEditor(false);
      resetEditor();
    } catch (error) {
      console.error('Error generating poster:', error);
      alert('שגיאה ביצירת המודעה');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetEditor = () => {
    setSelectedTemplate(null);
    setSelectedLesson(null);
    setPosterData({});
  };

  const deletePoster = (posterId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המודעה?')) {
      PosterService.deletePoster(posterId);
      setPosters(prev => prev.filter(p => p.id !== posterId));
    }
  };

  const downloadPoster = (poster: GeneratedPoster) => {
    // In a real app, this would download the actual image
    const link = document.createElement('a');
    link.href = poster.imageUrl;
    link.download = `poster-${poster.id}.png`;
    link.click();
  };

  if (!authService.hasPermission('create_poster')) {
    return (
      <div className="posters-page">
        <div className="access-denied">
          <h2>גישה מוגבלת</h2>
          <p>רק מנהלי המערכת יכולים לגשת לחלק זה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="posters-page">
      <div className="page-header">
        <div className="header-content">
          <h1>מודעות</h1>
          {authService.hasPermission('create_poster') && (
            <button onClick={handleCreatePoster} className="btn-primary">
              <Plus size={20} />
              יצירת מודעה חדשה
            </button>
          )}
        </div>
      </div>

      {showEditor && (
        <div className="poster-editor">
          <div className="editor-header">
            <h2>יצירת מודעה חדשה</h2>
            <button 
              onClick={() => setShowEditor(false)} 
              className="btn-close"
            >
              ✕
            </button>
          </div>

          <div className="editor-steps">
            <div className="step">
              <h3>
                <Palette size={20} />
                שלב 1: בחירת תבנית
              </h3>
              <div className="templates-grid">
                {templates.map(template => (
                  <div 
                    key={template.id}
                    className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="template-preview">
                      <img src={template.preview} alt={template.name} />
                    </div>
                    <div className="template-info">
                      <h4>{template.name}</h4>
                      <span className="template-category">{template.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedTemplate && (
              <div className="step">
                <h3>
                  <Type size={20} />
                  שלב 2: בחירת שיעור
                </h3>
                <div className="lessons-list">
                  {lessons.map(lesson => (
                    <div 
                      key={lesson.id}
                      className={`lesson-card ${selectedLesson?.id === lesson.id ? 'selected' : ''}`}
                      onClick={() => handleSelectLesson(lesson)}
                    >
                      <div className="lesson-info">
                        <h4>{lesson.title}</h4>
                        <p>{lesson.teacher} • {lesson.date.toLocaleDateString('he-IL')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTemplate && selectedLesson && (
              <div className="step">
                <h3>
                  <Edit3 size={20} />
                  שלב 3: עריכת תוכן
                </h3>
                <div className="poster-form">
                  {selectedTemplate.variables.map(variable => (
                    <div key={variable.name} className="form-group">
                      <label>{variable.label}</label>
                      {variable.type === 'text' && (
                        <input
                          type="text"
                          value={posterData[variable.name] || ''}
                          onChange={(e) => handleDataChange(variable.name, e.target.value)}
                          placeholder={variable.placeholder}
                        />
                      )}
                      {variable.type === 'color' && (
                        <input
                          type="color"
                          value={posterData[variable.name] || variable.defaultValue}
                          onChange={(e) => handleDataChange(variable.name, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="editor-actions">
                  <button 
                    onClick={resetEditor} 
                    className="btn-secondary"
                  >
                    ביטול
                  </button>
                  <button 
                    onClick={generatePoster} 
                    className="btn-primary"
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'יוצר מודעה...' : 'יצירת מודעה'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="posters-grid">
        <h2>מודעות שנוצרו</h2>
        {posters.length === 0 ? (
          <div className="empty-state">
            <ImageIcon size={48} />
            <h3>אין מודעות</h3>
            <p>צור את המודעה הראשונה שלך</p>
          </div>
        ) : (
          <div className="grid">
            {posters.map(poster => (
              <div key={poster.id} className="poster-card">
                <div className="poster-image">
                  <img src={poster.imageUrl} alt="מודעה" />
                </div>
                <div className="poster-actions">
                  <button 
                    onClick={() => downloadPoster(poster)}
                    className="btn-icon"
                    title="הורדה"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    className="btn-icon"
                    title="תצוגה מקדימה"
                  >
                    <Eye size={16} />
                  </button>
                  {authService.hasPermission('create_poster') && (
                    <button 
                      onClick={() => deletePoster(poster.id)}
                      className="btn-icon delete"
                      title="מחיקה"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostersPage;
