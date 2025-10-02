// Google Analytics Service for המרפסת App
// This service provides easy methods to track user interactions

import { GA_CONFIG } from '../config/analytics';

interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

class GoogleAnalyticsService {
  private isEnabled: boolean = false;
  
  constructor() {
    // Check if Google Analytics is loaded and we're in production
    this.isEnabled = typeof window !== 'undefined' && 
                    'gtag' in window && 
                    GA_CONFIG.IS_PRODUCTION &&
                    GA_CONFIG.MEASUREMENT_ID !== 'GA_MEASUREMENT_ID';
    
    if (this.isEnabled) {
      console.log('🔍 Google Analytics initialized');
    } else {
      console.log('📊 Google Analytics disabled (development mode or not configured)');
    }
  }
  
  // Track page views
  trackPageView(pageName: string, pageTitle?: string) {
    if (!this.isEnabled) return;
    
    try {
      (window as any).gtag('config', GA_CONFIG.MEASUREMENT_ID, {
        page_title: pageTitle || pageName,
        page_location: window.location.href
      });
    } catch (error) {
      console.warn('GA tracking error:', error);
    }
  }
  
  // Track custom events
  trackEvent(event: GAEvent) {
    if (!this.isEnabled) return;
    
    try {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value
      });
    } catch (error) {
      console.warn('GA event tracking error:', error);
    }
  }
  
  // Track lesson interactions
  trackLessonEvent(action: 'view' | 'create' | 'edit' | 'delete', lessonTitle?: string) {
    this.trackEvent({
      action: action,
      category: 'lesson',
      label: lessonTitle
    });
  }
  
  // Track poster creation
  trackPosterCreated(templateType?: string) {
    this.trackEvent({
      action: 'create_poster',
      category: 'poster',
      label: templateType
    });
  }
  
  // Track calendar interactions
  trackCalendarEvent(action: 'view_month' | 'view_week' | 'view_day' | 'add_to_google') {
    this.trackEvent({
      action: action,
      category: 'calendar'
    });
  }
  
  // Track archive usage
  trackArchiveEvent(action: 'play' | 'download' | 'search') {
    this.trackEvent({
      action: action,
      category: 'archive'
    });
  }
  
  // Track admin actions
  trackAdminEvent(action: 'login' | 'sync' | 'export' | 'import') {
    this.trackEvent({
      action: action,
      category: 'admin'
    });
  }
}

// Create singleton instance
export const googleAnalytics = new GoogleAnalyticsService();
export default googleAnalytics;