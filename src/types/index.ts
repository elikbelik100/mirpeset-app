export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: 'he' | 'en';
  };
  createdAt: Date;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  duration: number; // in minutes
  teacher: string;
  location: string;
  category: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  maxParticipants?: number;
  currentParticipants: number;
  recordingUrl?: string;
  imageUrl?: string;
  tags: string[];
  notifications: {
    enabled: boolean;
    reminderTimes: number[]; // minutes before lesson
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PosterTemplate {
  id: string;
  name: string;
  preview: string;
  template: string; // HTML template
  variables: PosterVariable[];
  category: 'classic' | 'modern' | 'artistic' | 'minimal';
}

export interface PosterVariable {
  name: string;
  type: 'text' | 'image' | 'date' | 'color';
  defaultValue: string;
  label: string;
  placeholder?: string;
}

export interface GeneratedPoster {
  id: string;
  lessonId: string;
  templateId: string;
  imageUrl: string;
  htmlContent: string;
  createdAt: Date;
}

// זמנים הלכתיים / אירועי זמן יומיים
export interface Zman {
  id: string;
  date: Date; // היום אליו הזמן שייך
  time: string; // HH:MM
  label: string; // התיאור המקורי (לדוגמה: הדלקת נרות)
  type: string; // סוג נורמליזציה (candle_lighting, sunset וכו')
  createdAt: Date;
}

export interface AppSettings {
  notifications: {
    enabled: boolean;
    defaultReminderTimes: number[];
  };
  googleDrive: {
    connected: boolean;
    folderId?: string;
  };
  ui: {
    theme: 'light' | 'dark';
    language: 'he' | 'en';
    rtl: boolean;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: 'he' | 'en';
  };
  createdAt: Date;
}
