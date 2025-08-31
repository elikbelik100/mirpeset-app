import type { Lesson } from '../types';

const LESSONS_STORAGE_KEY = 'mirpeset-lessons';
const LESSONS_JSON_URL = '/data/lessons.json';

export class LessonService {
  static async getAllLessons(): Promise<Lesson[]> {
    try {
      // Try to fetch from static JSON file first
      const response = await fetch(LESSONS_JSON_URL);
      if (response.ok) {
        const lessons = await response.json();
        return lessons.map((lesson: any) => ({
          ...lesson,
          date: new Date(lesson.date),
          createdAt: new Date(lesson.createdAt),
          updatedAt: new Date(lesson.updatedAt),
        }));
      }
    } catch (error) {
      console.warn('Could not fetch lessons from JSON file, falling back to localStorage');
    }
    
    // Fallback to localStorage
    const data = localStorage.getItem(LESSONS_STORAGE_KEY);
    if (!data) return [];
    
    const lessons = JSON.parse(data);
    return lessons.map((lesson: any) => ({
      ...lesson,
      date: new Date(lesson.date),
      createdAt: new Date(lesson.createdAt),
      updatedAt: new Date(lesson.updatedAt),
    }));
  }

  static saveLessons(lessons: Lesson[]): void {
    localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(lessons));
  }

  static async createLesson(lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lesson> {
    const lessons = await this.getAllLessons();
    const newLesson: Lesson = {
      ...lessonData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    lessons.push(newLesson);
    this.saveLessons(lessons);
    return newLesson;
  }

  static async updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson | null> {
    const lessons = await this.getAllLessons();
    const index = lessons.findIndex(lesson => lesson.id === id);
    
    if (index === -1) return null;
    
    const updatedLesson = {
      ...lessons[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };
    
    lessons[index] = updatedLesson;
    this.saveLessons(lessons);
    return updatedLesson;
  }

  static async deleteLesson(id: string): Promise<boolean> {
    const lessons = await this.getAllLessons();
    const filteredLessons = lessons.filter(lesson => lesson.id !== id);
    
    if (filteredLessons.length === lessons.length) return false;
    
    this.saveLessons(filteredLessons);
    return true;
  }

  static deleteAllLessons(): void {
    localStorage.removeItem(LESSONS_STORAGE_KEY);
  }

  static async getLessonById(id: string): Promise<Lesson | null> {
    const lessons = await this.getAllLessons();
    return lessons.find(lesson => lesson.id === id) || null;
  }

  static async getUpcomingLessons(): Promise<Lesson[]> {
    const lessons = await this.getAllLessons();
    const now = new Date();
    
    return lessons
      .filter(lesson => lesson.date >= now && lesson.status === 'scheduled')
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  static async getPastLessons(): Promise<Lesson[]> {
    const lessons = await this.getAllLessons();
    const now = new Date();
    
    return lessons
      .filter(lesson => lesson.date < now || lesson.status === 'completed')
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Export lessons as JSON for download
  static async exportLessonsAsJSON(): Promise<string> {
    const lessons = await this.getAllLessons();
    return JSON.stringify(lessons, null, 2);
  }

  // Download lessons as JSON file
  static async downloadLessonsJSON(): Promise<void> {
    const jsonData = await this.exportLessonsAsJSON();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lessons-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
