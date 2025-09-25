import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  MapPin,
  Plus,
  Filter,
  Trash2,
  Calendar as CalendarIcon
} from 'lucide-react';
import type { Lesson } from '../types';
import { LessonService } from '../services/lessonService';
import AuthService from '../services/authService';
import HebrewDateService from '../services/hebrewDateService';
import GoogleCalendarService from '../services/googleCalendarService';
import './Calendar.css';

type ViewType = 'month' | 'week' | 'day';

interface CalendarProps {
  onLessonClick?: (lesson: Lesson) => void;
  onCreateLesson?: (date: Date) => void;
  onDeleteLesson?: (id: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ 
  onLessonClick, 
  onCreateLesson, 
  onDeleteLesson 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const authService = AuthService.getInstance();
  const googleCalendarService = GoogleCalendarService.getInstance();

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    const allLessons = await LessonService.getAllLessons();
    setLessons(allLessons);
  };

  const filteredLessons = lessons.filter(lesson => {
    if (filterCategory === 'all') return true;
    return lesson.category === filterCategory;
  });

  const getUniqueCategories = () => {
    const categories = new Set(lessons.map(lesson => lesson.category));
    return Array.from(categories);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewType) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddToGoogleCalendar = (lesson: Lesson, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // מנע מהאירוע להתפשט לרכיב האב
    }
    
    try {
      const calendarEvent = googleCalendarService.createEventFromLesson(lesson);
      googleCalendarService.addToGoogleCalendar(calendarEvent);
    } catch (error) {
      console.error('Error adding to Google Calendar:', error);
      alert('שגיאה בהוספה ל-Google Calendar');
    }
  };

  const formatTitle = () => {
    const months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    // Hebrew month for current date
    const h = HebrewDateService.getHebrewDateParts(currentDate);

    switch (viewType) {
      case 'month': {
        // Use Hebrew month of first day of current Gregorian month for title
        const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const hFirst = HebrewDateService.getHebrewDateParts(first);
        return `${hFirst.monthName} / ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      }
      case 'week':
        const weekStart = getWeekStart(currentDate);
        const weekEnd = getWeekEnd(currentDate);
        const hStart = HebrewDateService.getHebrewDateParts(weekStart);
        const hEnd = HebrewDateService.getHebrewDateParts(weekEnd);
        return `${weekStart.getDate()}-${weekEnd.getDate()} ${months[weekStart.getMonth()]} (${hStart.day}–${hEnd.day} ${hStart.monthName}) ${weekStart.getFullYear()}`;
      case 'day':
        return `${currentDate.getDate()} ${months[currentDate.getMonth()]} / ${h.short} ${currentDate.getFullYear()}`;
    }
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    return start;
  };

  const getWeekEnd = (date: Date) => {
    const end = getWeekStart(date);
    end.setDate(end.getDate() + 6);
    return end;
  };

  const getLessonsForDate = (date: Date) => {
    const list = filteredLessons.filter(lesson => {
      const lessonDate = new Date(lesson.date);
      return lessonDate.toDateString() === date.toDateString();
    });
    // מיון לפי שעה
    return list.sort((a,b)=> a.time.localeCompare(b.time));
  };

  const hasConflict = (date: Date, time: string) => {
    const sameTime = filteredLessons.filter(l => {
      const d = new Date(l.date);
      return d.toDateString() === date.toDateString() && l.time === time;
    });
    return sameTime.length > 1;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // תמיד עבור לתצוגת יום כשלוחצים על תאריך
    setViewType('day');
    setCurrentDate(date);
    
    // גלול לשיעור הראשון של היום
    setTimeout(() => {
      const dayLessons = getLessonsForDate(date).sort((a, b) => 
        a.time.localeCompare(b.time)
      );
      
      if (dayLessons.length > 0) {
        const firstLesson = dayLessons[0];
        const firstLessonHour = parseInt(firstLesson.time.split(':')[0]);
        const hourElement = document.querySelector(`.day-hour:nth-child(${firstLessonHour + 1})`);
        
        if (hourElement) {
          hourElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }
    }, 100); // קצת עיכוב כדי שהדום יתעדכן
  };

  const handleCreateLesson = (date: Date) => {
    if (authService.hasPermission('create_lesson') && onCreateLesson) {
      onCreateLesson(date);
    }
  };

  const renderMonthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = getWeekStart(monthStart);
    const endDate = getWeekEnd(monthEnd);

    const days = [];
    let currentDay = new Date(startDate);

    while (currentDay <= endDate) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    const weekDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

    return (
      <div className="calendar-month">
        <div className="calendar-header">
          {weekDays.map((day, index) => (
            <div key={index} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-grid">
          {days.map((day, index) => {
            const dayLessons = getLessonsForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === day.toDateString();

            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <div className="day-number">{day.getDate()}<span className="h-day">{HebrewDateService.getHebrewDateParts(day).dayHebrew}</span></div>
                <div className="day-lessons">
          {dayLessons.slice(0, 3).map((lesson, lessonIndex) => (
                    <div
                      key={lessonIndex}
            className={`lesson-indicator ${hasConflict(day, lesson.time) ? 'conflict' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // עבור לתצוגת יום ואז פתח את השיעור
                        handleDateClick(day);
                        onLessonClick?.(lesson);
                      }}
            title={`${lesson.time} - ${lesson.title}${hasConflict(day, lesson.time) ? ' (התנגשות בזמנים)' : ''}`}
                    >
                      <span className="lesson-time">{lesson.time.substring(0, 5)}</span>
                      <span className="lesson-title">{lesson.title}</span>
                    </div>
                  ))}
                  {dayLessons.length > 3 && (
                    <div className="more-lessons">
                      +{dayLessons.length - 3} נוספים
                    </div>
                  )}
                </div>
                {authService.hasPermission('create_lesson') && (
                  <button
                    className="add-lesson-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateLesson(day);
                    }}
                    title="הוסף שיעור"
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = getWeekStart(currentDate);
    const weekDays: Date[] = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(day);
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const weekDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    return (
      <div className="calendar-week">
        <div className="week-header">
          <div className="time-column"></div>
          {weekDays.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={index} className={`week-day-header ${isToday ? 'today' : ''}`}>
                <div className="day-name">{weekDayNames[index]}</div>
                <div className="day-date">{day.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div className="week-grid">
          {hours.map(hour => (
            <div key={hour} className="hour-row">
              <div className="time-slot">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((day, dayIndex) => {
                const dayLessons = getLessonsForDate(day).filter(lesson => {
                  const lessonHour = parseInt(lesson.time.split(':')[0]);
                  return lessonHour === hour;
                });

                return (
                  <div key={dayIndex} className="week-time-slot">
          {dayLessons.map((lesson, lessonIndex) => (
                      <div
                        key={lessonIndex}
            className={`week-lesson ${hasConflict(day, lesson.time) ? 'conflict' : ''}`}
                        onClick={() => {
                          handleDateClick(day);
                          onLessonClick?.(lesson);
                        }}
                      >
                        <div className="lesson-info">
                          <strong>{lesson.title}</strong>
                          <div className="lesson-details">
                            <span><Clock size={12} /> {lesson.time}</span>
                            {lesson.description && lesson.description.includes('רב:') && (
                              <span>{lesson.description.split('רב: ')[1]}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayLessons = getLessonsForDate(currentDate).sort((a, b) => 
      a.time.localeCompare(b.time)
    );
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="calendar-day-view">
        <div className="day-header">
          <h2>{formatTitle()}</h2>
          <div className="day-stats">
            <span>{dayLessons.length} שיעורים</span>
          </div>
        </div>
        <div className="day-schedule">
          {hours.map(hour => {
            const hourLessons = dayLessons.filter(lesson => {
              const lessonHour = parseInt(lesson.time.split(':')[0]);
              return lessonHour === hour;
            });

            return (
              <div key={hour} className="day-hour">
                <div className="hour-label">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="hour-content">
                  {hourLessons.map((lesson, index) => (
                    <div
                      key={index}
                      className={`day-lesson ${hasConflict(currentDate, lesson.time) ? 'conflict' : ''}`}
                    >
                      <div className="lesson-header">
                        <div className="lesson-titles">
                          <h4 onClick={() => onLessonClick?.(lesson)}>{lesson.title}</h4>
                          {(lesson.teacher || (lesson.description && lesson.description.includes('רב:'))) && (
                            <h4 className="lesson-rabbi" onClick={() => onLessonClick?.(lesson)}>
                              {lesson.teacher || lesson.description.split('רב: ')[1]}
                            </h4>
                          )}
                        </div>
                        <div className="lesson-actions">
                          <button
                            className="lesson-action-btn google-calendar"
                            onClick={(e) => handleAddToGoogleCalendar(lesson, e)}
                            title="הוסף ל-Google Calendar"
                          >
                            <CalendarIcon size={14} />
                          </button>
                          {authService.hasPermission('create_lesson') && (
                            <button
                              className="lesson-action-btn delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`האם אתה בטוח שברצונך למחוק את השיעור "${lesson.title}"?`)) {
                                  onDeleteLesson?.(lesson.id);
                                }
                              }}
                              title="מחק שיעור"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="lesson-details">
                        <div><Clock size={14} /> {lesson.time}</div>
                        {lesson.location && (
                          <div><MapPin size={14} /> {lesson.location}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {hourLessons.length === 0 && (
                    <div className="empty-hour">
                      {authService.hasPermission('create_lesson') && (
                        <button
                          className="add-lesson-empty"
                          onClick={() => {
                            const lessonDate = new Date(currentDate);
                            lessonDate.setHours(hour, 0, 0, 0);
                            handleCreateLesson(lessonDate);
                          }}
                        >
                          <Plus size={16} />
                          הוסף שיעור
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button onClick={() => navigateDate('prev')} className="nav-btn">
            <ChevronRight size={20} />
          </button>
          <h2 className="calendar-title">{formatTitle()}</h2>
          <button onClick={() => navigateDate('next')} className="nav-btn">
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="calendar-controls">
          <button onClick={goToToday} className="today-btn">
            היום
          </button>
          
          <div className="view-buttons">
            {(['month', 'week', 'day'] as ViewType[]).map(view => (
              <button
                key={view}
                onClick={() => setViewType(view)}
                className={`view-btn ${viewType === view ? 'active' : ''}`}
              >
                {view === 'month' ? 'חודש' : view === 'week' ? 'שבוע' : 'יום'}
              </button>
            ))}
          </div>

          <div className="calendar-filter">
            <Filter size={16} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">כל הקטגוריות</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="calendar-content">
        {viewType === 'month' && renderMonthView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'day' && renderDayView()}
      </div>
    </div>
  );
};

export default Calendar;
