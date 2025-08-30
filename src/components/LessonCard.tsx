import React from 'react';
import { Calendar, Clock, Edit, Trash2, Play } from 'lucide-react';
import type { Lesson } from '../types';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import './LessonCard.css';

interface LessonCardProps {
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onDelete: (id: string) => void;
  onPlayRecording?: (url: string) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ 
  lesson, 
  onEdit, 
  onDelete, 
  onPlayRecording 
}) => {
  const isUpcoming = lesson.date > new Date() && lesson.status === 'scheduled';
  const isPast = lesson.date < new Date() || lesson.status === 'completed';
  
  const handlePlayRecording = () => {
    if (lesson.recordingUrl && onPlayRecording) {
      onPlayRecording(lesson.recordingUrl);
    }
  };

  return (
    <div className={`lesson-card ${lesson.status}`}>
      <div className="lesson-card-header">
        <div className="lesson-status">
          {isUpcoming && <span className="status-badge upcoming">קרוב</span>}
          {isPast && <span className="status-badge past">הסתיים</span>}
          {lesson.status === 'cancelled' && <span className="status-badge cancelled">בוטל</span>}
        </div>
        <div className="lesson-actions">
          <button onClick={() => onEdit(lesson)} className="action-btn edit">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete(lesson.id)} className="action-btn delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="lesson-content">
        <h3 className="lesson-title">{lesson.title}</h3>
        
        <div className="lesson-details">
          <div className="detail-item">
            <Calendar size={16} />
            <span>{format(lesson.date, 'EEEE, d MMMM yyyy', { locale: he })}</span>
          </div>
          
          <div className="detail-item">
            <Clock size={16} />
            <span>{lesson.time}</span>
          </div>
        </div>

        {lesson.description && (
          <p className="lesson-description">{lesson.description}</p>
        )}

        {lesson.tags.length > 0 && (
          <div className="lesson-tags">
            {lesson.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {lesson.recordingUrl && (
          <div className="lesson-recording">
            <button onClick={handlePlayRecording} className="recording-btn">
              <Play size={16} />
              צפה בהקלטה
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonCard;
