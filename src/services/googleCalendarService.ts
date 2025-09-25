// Google Calendar Service for creating calendar links
export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}

class GoogleCalendarService {
  private static instance: GoogleCalendarService;

  private constructor() {}

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  /**
   * Format date for Google Calendar (YYYYMMDDTHHMMSSZ)
   */
  private formatDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /**
   * Create Google Calendar URL for adding an event
   */
  createCalendarUrl(event: CalendarEvent): string {
    const startDate = this.formatDate(event.start);
    const endDate = this.formatDate(event.end);
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startDate}/${endDate}`,
      details: event.description || '',
      location: event.location || '',
      // Add timezone support
      ctz: 'Asia/Jerusalem'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Open Google Calendar to add event
   */
  addToGoogleCalendar(event: CalendarEvent): void {
    const url = this.createCalendarUrl(event);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Create calendar event from lesson data
   */
  createEventFromLesson(lesson: any): CalendarEvent {
    const startDate = new Date(lesson.date);
    
    // If lesson has specific time, use it; otherwise default to common lesson time
    if (lesson.time) {
      const [hours, minutes] = lesson.time.split(':').map(Number);
      startDate.setHours(hours, minutes, 0, 0);
    } else {
      // Default lesson time (example: 20:00)
      startDate.setHours(20, 0, 0, 0);
    }

    // Calculate end time based on duration or default to 90 minutes
    const endDate = new Date(startDate);
    const duration = lesson.duration || 90; // default 90 minutes
    endDate.setMinutes(endDate.getMinutes() + duration);

    return {
      title: lesson.title,
      start: startDate,
      end: endDate,
      location: lesson.location || '',
      description: this.createLessonDescription(lesson)
    };
  }

  /**
   * Create a descriptive text for the lesson
   */
  private createLessonDescription(lesson: any): string {
    let description = `שיעור: ${lesson.title}\n`;
    
    if (lesson.teacher) {
      description += `מרצה: ${lesson.teacher}\n`;
    }
    
    if (lesson.description) {
      description += `תיאור: ${lesson.description}\n`;
    }
    
    if (lesson.category) {
      description += `קטגוריה: ${lesson.category}\n`;
    }
    
    if (lesson.tags && lesson.tags.length > 0) {
      description += `תגיות: ${lesson.tags.join(', ')}\n`;
    }

    return description.trim();
  }

  /**
   * Check if Google Calendar is available
   */
  isGoogleCalendarAvailable(): boolean {
    // Simple check - in a real app you might want to check if user is logged in to Google
    return true;
  }
}

export default GoogleCalendarService;