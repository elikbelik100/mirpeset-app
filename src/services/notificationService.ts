import type { Lesson } from '../types';

export class NotificationService {
  private static hasPermission = false;

  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }

    return false;
  }

  static scheduleNotification(lesson: Lesson): void {
    if (!this.hasPermission || !lesson.notifications.enabled) {
      return;
    }

    lesson.notifications.reminderTimes.forEach(minutesBefore => {
      const notificationTime = new Date(lesson.date.getTime() - minutesBefore * 60 * 1000);
      const now = new Date();

      if (notificationTime > now) {
        const timeout = notificationTime.getTime() - now.getTime();
        
        setTimeout(() => {
          this.showNotification(lesson, minutesBefore);
        }, timeout);
      }
    });
  }

  static showNotification(lesson: Lesson, minutesBefore: number): void {
    if (!this.hasPermission) return;

    const title = minutesBefore > 0 
      ? `תזכורת: ${lesson.title}`
      : `${lesson.title} מתחיל עכשיו!`;

    const body = minutesBefore > 0
      ? `השיעור מתחיל בעוד ${minutesBefore} דקות`
      : `המיקום: ${lesson.location}`;

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `lesson-${lesson.id}-${minutesBefore}`,
      requireInteraction: minutesBefore === 0,
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 10 seconds for reminders, 30 seconds for immediate notifications
    setTimeout(() => {
      notification.close();
    }, minutesBefore === 0 ? 30000 : 10000);
  }

  static cancelAllNotifications(): void {
    // Note: Cannot cancel scheduled timeouts, but this would be implemented
    // with a proper scheduling system in production
    console.log('Notifications cancelled');
  }

  static testNotification(): void {
    if (this.hasPermission) {
      const notification = new Notification('המרפסת - בדיקה', {
        body: 'התזכורות פועלות כמו שצריך!',
        icon: '/favicon.ico',
      });

      setTimeout(() => notification.close(), 3000);
    }
  }
}
