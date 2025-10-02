// Google Analytics Configuration
// Replace GA_MEASUREMENT_ID with your actual Google Analytics Measurement ID

export const GA_CONFIG = {
  // Your Google Analytics Measurement ID
  MEASUREMENT_ID: 'G-N2Q57M4BLG',
  
  // Production vs Development
  IS_PRODUCTION: window.location.hostname !== 'localhost',
  
  // Custom events configuration
  EVENTS: {
    LESSON: {
      VIEW: 'view_lesson',
      CREATE: 'create_lesson',
      EDIT: 'edit_lesson',
      DELETE: 'delete_lesson'
    },
    POSTER: {
      CREATE: 'create_poster',
      DOWNLOAD: 'download_poster'
    },
    CALENDAR: {
      VIEW_MONTH: 'view_calendar_month',
      VIEW_WEEK: 'view_calendar_week',
      VIEW_DAY: 'view_calendar_day',
      ADD_TO_GOOGLE: 'add_to_google_calendar'
    },
    ARCHIVE: {
      PLAY: 'play_recording',
      DOWNLOAD: 'download_recording',
      SEARCH: 'search_archive'
    },
    ADMIN: {
      LOGIN: 'admin_login',
      SYNC: 'admin_sync',
      EXPORT: 'admin_export',
      IMPORT: 'admin_import'
    }
  }
};

export default GA_CONFIG;