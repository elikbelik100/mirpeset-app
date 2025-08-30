import type { Lesson } from '../types';

const LESSONS_STORAGE_KEY = 'mirpeset-lessons';

export class LessonService {
  static getAllLessons(): Lesson[] {
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

  static createLesson(lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Lesson {
    const lessons = this.getAllLessons();
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

  static updateLesson(id: string, updates: Partial<Lesson>): Lesson | null {
    const lessons = this.getAllLessons();
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

  static deleteLesson(id: string): boolean {
    const lessons = this.getAllLessons();
    const filteredLessons = lessons.filter(lesson => lesson.id !== id);
    
    if (filteredLessons.length === lessons.length) return false;
    
    this.saveLessons(filteredLessons);
    return true;
  }

  static deleteAllLessons(): void {
    localStorage.removeItem(LESSONS_STORAGE_KEY);
  }

  static getLessonById(id: string): Lesson | null {
    const lessons = this.getAllLessons();
    return lessons.find(lesson => lesson.id === id) || null;
  }

  static getUpcomingLessons(): Lesson[] {
    const lessons = this.getAllLessons();
    const now = new Date();
    
    return lessons
      .filter(lesson => lesson.date >= now && lesson.status === 'scheduled')
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  static getPastLessons(): Lesson[] {
    const lessons = this.getAllLessons();
    const now = new Date();
    
    return lessons
      .filter(lesson => lesson.date < now || lesson.status === 'completed')
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}
