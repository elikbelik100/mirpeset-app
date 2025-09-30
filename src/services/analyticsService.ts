// שירות אנליטיקס פשוט ומקומי - ללא איסוף פרטים אישיים
export interface AnalyticsData {
  totalVisits: number;
  uniqueDays: string[]; // רשימת תאריכים של ביקורים
  pageViews: Record<string, number>; // מונה ביקורים לכל דף
  firstVisit: string; // תאריך הביקור הראשון
  lastVisit: string; // תאריך הביקור האחרון
}

class AnalyticsService {
  private readonly STORAGE_KEY = 'mirpeset-analytics';
  
  // רישום ביקור באפליקציה
  recordVisit(pageName: string = 'home') {
    const data = this.getAnalyticsData();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const now = new Date().toISOString();
    
    // עדכון מונה ביקורים כללי
    data.totalVisits += 1;
    
    // עדכון ביקור ליום הנוכחי
    if (!data.uniqueDays.includes(today)) {
      data.uniqueDays.push(today);
    }
    
    // עדכון מונה דפים
    data.pageViews[pageName] = (data.pageViews[pageName] || 0) + 1;
    
    // עדכון תאריכים
    if (!data.firstVisit) {
      data.firstVisit = now;
    }
    data.lastVisit = now;
    
    this.saveAnalyticsData(data);
  }
  
  // קבלת נתוני אנליטיקס
  getAnalyticsData(): AnalyticsData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Error reading analytics data:', error);
    }
    
    // נתונים ברירת מחדל
    return {
      totalVisits: 0,
      uniqueDays: [],
      pageViews: {},
      firstVisit: '',
      lastVisit: ''
    };
  }
  
  // שמירת נתונים
  private saveAnalyticsData(data: AnalyticsData) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving analytics data:', error);
    }
  }
  
  // קבלת סטטיסטיקות מעוצבות
  getFormattedStats() {
    const data = this.getAnalyticsData();
    const daysSinceFirst = data.firstVisit ? 
      Math.ceil((Date.now() - new Date(data.firstVisit).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      totalVisits: data.totalVisits,
      uniqueDays: data.uniqueDays.length,
      daysSinceFirst,
      averageVisitsPerDay: daysSinceFirst > 0 ? (data.totalVisits / daysSinceFirst).toFixed(1) : '0',
      mostPopularPage: this.getMostPopularPage(data.pageViews),
      firstVisit: data.firstVisit ? new Date(data.firstVisit).toLocaleDateString('he-IL') : '',
      lastVisit: data.lastVisit ? new Date(data.lastVisit).toLocaleDateString('he-IL') : '',
      pageViews: data.pageViews
    };
  }
  
  private getMostPopularPage(pageViews: Record<string, number>): string {
    let maxPage = '';
    let maxViews = 0;
    
    for (const [page, views] of Object.entries(pageViews)) {
      if (views > maxViews) {
        maxViews = views;
        maxPage = page;
      }
    }
    
    return maxPage || 'אין נתונים';
  }
  
  // ניקוי נתונים (אם צריך)
  clearAnalytics() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;