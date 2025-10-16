import type { Lesson } from '../types';
import GitHubService from './githubService';
import CacheManager from './cacheManager';

const LESSONS_STORAGE_KEY = 'mirpeset-lessons';
const LESSONS_CACHE_KEY = 'mirpeset-lessons-cache';
const LESSONS_JSON_URL = '/data/lessons.json';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class LessonService {
  private static githubService = GitHubService.getInstance();
  
  /**
   * טעינת שיעורים - לוגיקה חדשה:
   * 1. נסה GitHub (Source of Truth)
   * 2. אם נכשל, נסה Cache (עם בדיקת TTL)
   * 3. אם Cache פג תוקף, נסה Static JSON
   * 4. אם הכל נכשל, החזר מערך ריק
   */
  static async getAllLessons(forceRefresh: boolean = false): Promise<Lesson[]> {
    console.log('🔍 Loading lessons...', forceRefresh ? '(force refresh)' : '');
    
    // בדוק אם המשתמש מחק את כל השיעורים
    if (localStorage.getItem('mirpeset-lessons-deleted') === 'true') {
      console.log('📭 Lessons deleted flag set');
      return [];
    }

    // אסטרטגיה 1: נסה לטעון מ-GitHub (Source of Truth)
    if (this.githubService.isConfigured()) {
      try {
        console.log('📡 Attempting to load from GitHub...');
        const githubFile = await this.githubService.getCurrentLessonsFile();
        const githubLessons = JSON.parse(githubFile.content);
        const mappedLessons = this.mapLessons(githubLessons);
        
        // שמור ל-cache עם timestamp
        CacheManager.set(LESSONS_CACHE_KEY, mappedLessons, githubFile.sha.substring(0, 7));
        console.log(`✅ Loaded ${mappedLessons.length} lessons from GitHub`);
        
        return mappedLessons;
      } catch (error) {
        console.warn('⚠️ Failed to load from GitHub:', error);
        // נמשיך ל-fallback
      }
    } else {
      console.log('⚠️ GitHub not configured');
    }

    // אסטרטגיה 2: נסה Cache (אם לא force refresh)
    if (!forceRefresh) {
      const cachedLessons = CacheManager.get<any[]>(LESSONS_CACHE_KEY, { ttl: CACHE_TTL });
      if (cachedLessons) {
        const mappedLessons = this.mapLessons(cachedLessons);
        console.log(`📦 Loaded ${mappedLessons.length} lessons from cache`);
        return mappedLessons;
      }
    }

    // אסטרטגיה 3: נסה Static JSON (fallback לישן)
    try {
      console.log('📄 Attempting to load from static JSON...');
      const response = await fetch(`${LESSONS_JSON_URL}?t=${Date.now()}`); // cache bust
      if (response.ok) {
        const lessons = await response.json();
        const mappedLessons = this.mapLessons(lessons);
        
        // שמור ל-cache
        CacheManager.set(LESSONS_CACHE_KEY, mappedLessons, 'static-json');
        console.log(`✅ Loaded ${mappedLessons.length} lessons from static JSON`);
        
        return mappedLessons;
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch lessons from JSON file:', error);
    }
    
    // אסטרטגיה 4: אם הכל נכשל, החזר מערך ריק
    console.log('❌ All strategies failed, returning empty array');
    return [];
  }

  /**
   * המרת lessons ל-objects עם Dates
   */
  private static mapLessons(lessons: any[]): Lesson[] {
    return lessons.map((lesson: any) => ({
      ...lesson,
      date: new Date(lesson.date),
      createdAt: new Date(lesson.createdAt),
      updatedAt: new Date(lesson.updatedAt),
    }));
  }

  static saveLessons(lessons: Lesson[]): void {
    // כשמייבאים שיעורים חדשים, נקה את הפלג "נמחק"
    localStorage.removeItem('mirpeset-lessons-deleted');
    
    // שמור גם ל-cache החדש
    CacheManager.set(LESSONS_CACHE_KEY, lessons, 'local-save');
    
    // שמור גם למפתח הישן לתאימות לאחור (ייתכן שקוד אחר משתמש בזה)
    localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(lessons));
    console.log(`💾 Saved ${lessons.length} lessons to cache and localStorage`);
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
    
    // נקה cache כדי לאלץ refresh בטעינה הבאה
    CacheManager.remove(LESSONS_CACHE_KEY);
    
    return updatedLesson;
  }

  static async deleteLesson(id: string): Promise<boolean> {
    const lessons = await this.getAllLessons();
    const filteredLessons = lessons.filter(lesson => lesson.id !== id);
    
    if (filteredLessons.length === lessons.length) return false;
    
    this.saveLessons(filteredLessons);
    
    // נקה cache כדי לאלץ refresh בטעינה הבאה
    CacheManager.remove(LESSONS_CACHE_KEY);
    
    return true;
  }

  static async deleteAllLessons(): Promise<void> {
    try {
      // מחיקה מ-LocalStorage ושמירת פלג "נמחק"
      localStorage.removeItem(LESSONS_STORAGE_KEY);
      localStorage.setItem('mirpeset-lessons-deleted', 'true');
      
      // נקה גם את ה-cache החדש
      CacheManager.remove(LESSONS_CACHE_KEY);
      
      console.log('Lessons deleted from LocalStorage');
      
      // נסיון לסנכרן ל-GitHub (לא חובה)
      try {
        const authService = (await import('../services/authService')).default.getInstance();
        if (authService.hasPermission('delete_lesson')) {
          const GitHubService = (await import('../services/githubService')).default;
          const githubService = GitHubService.getInstance();
          await githubService.updateLessonsFile([], 'מחק את כל השיעורים');
          console.log('Lessons deleted from GitHub successfully');
        }
      } catch (error) {
        console.warn('Failed to delete from GitHub, but local deletion succeeded:', error);
      }
    } catch (error) {
      // אם כל השאר נכשל, לפחות נמחק מ-LocalStorage
      localStorage.removeItem(LESSONS_STORAGE_KEY);
      localStorage.setItem('mirpeset-lessons-deleted', 'true');
      CacheManager.remove(LESSONS_CACHE_KEY);
      console.error('Error in deleteAllLessons:', error);
    }
  }

  static clearLocalStorage(): void {
    localStorage.removeItem(LESSONS_STORAGE_KEY);
    CacheManager.remove(LESSONS_CACHE_KEY);
    console.log('Local storage cleared');
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
      // Sync to GitHub if configured
      if (this.githubService.isConfigured()) {
        // טען את כל השיעורים מ-GitHub
        const allLessons = await this.getAllLessons(true);
        
        // מצא ועדכן את השיעור ברשימה
        const index = allLessons.findIndex(l => l.id === lesson.id);
        if (index === -1) {
          throw new Error(`Lesson with id ${lesson.id} not found`);
        }
        
        allLessons[index] = {
          ...lesson,
          updatedAt: new Date(),
        };
        
        // שמור את הרשימה המעודכנת ל-GitHub
        await this.githubService.updateLessonsFile(
          allLessons, 
          `עדכון שיעור: ${lesson.title}`
        );
        
        // עכשיו שמור גם מקומית
        this.saveLessons(allLessons);
        
        // נקה cache כדי שכולם יקבלו עדכון בטעינה הבאה
        CacheManager.remove(LESSONS_CACHE_KEY);
        
        console.log('✅ Lesson updated and synced to GitHub');
        return true;
      } else {
        // אם GitHub לא מוגדר, עדכן מקומית בלבד
        await this.updateLesson(lesson.id, lesson);
        console.log('⚠️ Lesson updated locally only (GitHub not configured)');
        return false; // Updated locally but not synced
      }
    } catch (error) {
      console.error('Error updating lesson and syncing:', error);
      throw error;
    }
  }

  static async createLessonAndSync(lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lesson> {
    try {
      // Sync to GitHub if configured
      if (this.githubService.isConfigured()) {
        // טען את כל השיעורים הקיימים מ-GitHub
        const existingLessons = await this.getAllLessons(true);
        
        // צור את השיעור החדש
        const newLesson: Lesson = {
          ...lessonData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // הוסף את השיעור החדש לרשימה
        const allLessons = [...existingLessons, newLesson];
        
        // שמור את הרשימה המלאה ל-GitHub
        await this.githubService.updateLessonsFile(
          allLessons, 
          `הוספת שיעור חדש: ${newLesson.title}`
        );
        
        // עכשיו שמור גם מקומית
        this.saveLessons(allLessons);
        
        // נקה cache כדי שכולם יקבלו עדכון בטעינה הבאה
        CacheManager.remove(LESSONS_CACHE_KEY);
        
        console.log('✅ Lesson created and synced to GitHub');
        return newLesson;
      } else {
        // אם GitHub לא מוגדר, צור מקומית בלבד
        const newLesson = await this.createLesson(lessonData);
        console.log('⚠️ Lesson created locally only (GitHub not configured)');
        return newLesson;
      }
    } catch (error) {
      console.error('Error creating lesson and syncing:', error);
      throw error;
    }
  }

  static async deleteLessonAndSync(id: string): Promise<boolean> {
    try {
      // Sync to GitHub if configured
      if (this.githubService.isConfigured()) {
        // טען את כל השיעורים מ-GitHub
        const allLessons = await this.getAllLessons(true);
        
        // מצא את השיעור למחיקה
        const lesson = allLessons.find(l => l.id === id);
        const lessonTitle = lesson?.title || 'שיעור לא ידוע';
        
        // סנן את השיעור מהרשימה
        const updatedLessons = allLessons.filter(l => l.id !== id);
        
        if (updatedLessons.length === allLessons.length) {
          // השיעור לא נמצא
          return false;
        }
        
        // שמור את הרשימה המעודכנת ל-GitHub
        await this.githubService.updateLessonsFile(
          updatedLessons, 
          `מחיקת שיעור: ${lessonTitle}`
        );
        
        // עכשיו שמור גם מקומית
        this.saveLessons(updatedLessons);
        
        // נקה cache כדי שכולם יקבלו עדכון בטעינה הבאה
        CacheManager.remove(LESSONS_CACHE_KEY);
        
        console.log('✅ Lesson deleted and synced to GitHub');
        return true;
      } else {
        // אם GitHub לא מוגדר, מחק מקומית בלבד
        const deleted = await this.deleteLesson(id);
        console.log('⚠️ Lesson deleted locally only (GitHub not configured)');
        return deleted;
      }
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
