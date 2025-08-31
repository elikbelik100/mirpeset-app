import type { Lesson } from '../types';
import GitHubService from './githubService';

const LESSONS_STORAGE_KEY = 'mirpeset-lessons';
const LESSONS_JSON_URL = '/data/lessons.json';

export class LessonService {
  private static githubService = GitHubService.getInstance();
  static async getAllLessons(): Promise<Lesson[]> {
    // Check localStorage first (this is where imported/edited lessons are stored)
    const data = localStorage.getItem(LESSONS_STORAGE_KEY);
    if (data) {
      const lessons = JSON.parse(data);
      return lessons.map((lesson: any) => ({
        ...lesson,
        date: new Date(lesson.date),
        createdAt: new Date(lesson.createdAt),
        updatedAt: new Date(lesson.updatedAt),
      }));
    }

    // If no localStorage data, try to fetch from static JSON file
    try {
      const response = await fetch(LESSONS_JSON_URL);
      if (response.ok) {
        const lessons = await response.json();
        const mappedLessons = lessons.map((lesson: any) => ({
          ...lesson,
          date: new Date(lesson.date),
          createdAt: new Date(lesson.createdAt),
          updatedAt: new Date(lesson.updatedAt),
        }));
        
        // Save to localStorage for future edits
        this.saveLessons(mappedLessons);
        return mappedLessons;
      }
    } catch (error) {
      console.warn('Could not fetch lessons from JSON file');
    }
    
    // Return empty array if both methods fail
    return [];
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

  static async deleteAllLessons(): Promise<void> {
    // מחק מה-LocalStorage
    localStorage.removeItem(LESSONS_STORAGE_KEY);
    
    // מחק גם מה-GitHub אם יש הרשאה
    try {
      const authService = (await import('../services/authService')).default.getInstance();
      if (authService.hasPermission('delete_lesson')) {
        const GitHubService = (await import('../services/githubService')).default;
        const githubService = GitHubService.getInstance();
        await githubService.updateLessonsFile([], 'מחק את כל השיעורים');
      }
    } catch (error) {
      console.log('לא ניתן לעדכן ב-GitHub:', error);
    }
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

  // GitHub Integration Functions
  static async updateLessonAndSync(lesson: Lesson): Promise<boolean> {
    try {
      // Update lesson locally
      await this.updateLesson(lesson.id, lesson);
      
      // Sync to GitHub if configured
      if (this.githubService.isConfigured()) {
        const allLessons = await this.getAllLessons();
        await this.githubService.updateLessonsFile(
          allLessons, 
          `עדכון שיעור: ${lesson.title}`
        );
        return true;
      }
      
      return false; // Updated locally but not synced
    } catch (error) {
      console.error('Error updating lesson and syncing:', error);
      throw error;
    }
  }

  static async createLessonAndSync(lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lesson> {
    try {
      // Create lesson locally
      const newLesson = await this.createLesson(lessonData);
      
      // Sync to GitHub if configured
      if (this.githubService.isConfigured()) {
        const allLessons = await this.getAllLessons();
        await this.githubService.updateLessonsFile(
          allLessons, 
          `הוספת שיעור חדש: ${newLesson.title}`
        );
      }
      
      return newLesson;
    } catch (error) {
      console.error('Error creating lesson and syncing:', error);
      throw error;
    }
  }

  static async deleteLessonAndSync(id: string): Promise<boolean> {
    try {
      // Get lesson title for commit message
      const lesson = await this.getLessonById(id);
      const lessonTitle = lesson?.title || 'שיעור לא ידוע';
      
      // Delete lesson locally
      const deleted = await this.deleteLesson(id);
      
      if (deleted && this.githubService.isConfigured()) {
        const allLessons = await this.getAllLessons();
        await this.githubService.updateLessonsFile(
          allLessons, 
          `מחיקת שיעור: ${lessonTitle}`
        );
      }
      
      return deleted;
    } catch (error) {
      console.error('Error deleting lesson and syncing:', error);
      throw error;
    }
  }

  static async syncAllLessonsToGitHub(commitMessage?: string): Promise<boolean> {
    try {
      if (!this.githubService.isConfigured()) {
        throw new Error('GitHub not configured');
      }
      
      const allLessons = await this.getAllLessons();
      await this.githubService.updateLessonsFile(
        allLessons, 
        commitMessage || `סנכרון כל השיעורים - ${new Date().toLocaleString('he-IL')}`
      );
      
      return true;
    } catch (error) {
      console.error('Error syncing all lessons to GitHub:', error);
      throw error;
    }
  }

  static isGitHubConfigured(): boolean {
    return this.githubService.isConfigured();
  }

  static async testGitHubConnection(): Promise<boolean> {
    return await this.githubService.testConnection();
  }

  static async importLessons(lessonsData: any[]): Promise<void> {
    const lessons = lessonsData.map((lesson: any) => ({
      ...lesson,
      date: new Date(lesson.date),
      createdAt: new Date(lesson.createdAt),
      updatedAt: new Date(lesson.updatedAt),
    }));
    this.saveLessons(lessons);
  }
}
