// Recording Service for managing lesson recordings
import GitHubService from './githubService';
import CacheManager from './cacheManager';

const RECORDINGS_CACHE_KEY = 'recordings-cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface RecordingLink {
  id: string;
  lessonId: string;
  title: string;
  url: string;
  description?: string;
  uploadDate: string;
  fileSize?: string;
}

class RecordingService {
  private static instance: RecordingService;
  private githubService = GitHubService.getInstance();

  private constructor() {}

  static getInstance(): RecordingService {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService();
    }
    return RecordingService.instance;
  }

  /**
   * Convert Google Drive view URL to preview URL for better audio playback
   */
  private formatDriveUrl(url: string): string {
    // Convert from: https://drive.google.com/file/d/ID/view?usp=drive_link
    // To: https://drive.google.com/file/d/ID/preview
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const fileId = match[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return url;
  }



  /**
   * Update recordings.json file in GitHub with cache management
   */
  private async updateRecordingsFile(recordings: RecordingLink[], commitMessage?: string): Promise<boolean> {
    try {
      // Try to save to GitHub if configured
      if (this.githubService.isConfigured()) {
        try {
          await this.githubService.updateRecordingsFile(recordings, commitMessage);
          console.log('✅ Recordings synchronized to GitHub successfully');
          
          // עדכן cache
          CacheManager.set(RECORDINGS_CACHE_KEY, recordings, 'github-sync');
          
          // שמור גם ל-localStorage כגיבוי
          localStorage.setItem('recordings', JSON.stringify(recordings));
          
          return true;
        } catch (githubError) {
          console.error('❌ Failed to sync to GitHub:', githubError);
          // נשמור מקומית בכל מקרה
        }
      } else {
        console.warn('⚠️ GitHub not configured');
      }
      
      // Fallback: שמור מקומית
      CacheManager.set(RECORDINGS_CACHE_KEY, recordings, 'local-save');
      localStorage.setItem('recordings', JSON.stringify(recordings));
      console.log('📝 Recordings saved locally:', recordings.length, 'recordings');
      
      return true;
    } catch (error) {
      console.error('❌ Error saving recordings:', error);
      throw error;
    }
  }

  /**
   * Load all recordings - GitHub First Strategy
   * 1. Try GitHub (Source of Truth)
   * 2. Try Cache (with TTL check)
   * 3. Try localStorage (legacy fallback)
   */
  async loadRecordings(forceRefresh: boolean = false): Promise<RecordingLink[]> {
    console.log('🔍 Loading recordings...', forceRefresh ? '(force refresh)' : '');
    
    // אסטרטגיה 1: נסה לטעון מ-GitHub (Source of Truth)
    if (this.githubService.isConfigured()) {
      try {
        console.log('📡 Attempting to load recordings from GitHub...');
        const githubFile = await this.githubService.getCurrentRecordingsFile();
        const githubRecordings = JSON.parse(githubFile.content) as RecordingLink[];
        
        // שמור ל-cache
        CacheManager.set(RECORDINGS_CACHE_KEY, githubRecordings, githubFile.sha.substring(0, 7));
        
        // שמור גם ל-localStorage כגיבוי
        localStorage.setItem('recordings', JSON.stringify(githubRecordings));
        
        console.log(`✅ Loaded ${githubRecordings.length} recordings from GitHub`);
        
        // Format URLs for better playback
        return githubRecordings.map(recording => ({
          ...recording,
          url: this.formatDriveUrl(recording.url)
        }));
      } catch (githubError) {
        console.warn('⚠️ Failed to load from GitHub:', githubError);
        // נמשיך ל-fallback
      }
    } else {
      console.log('⚠️ GitHub not configured');
    }

    // אסטרטגיה 2: נסה Cache (אם לא force refresh)
    if (!forceRefresh) {
      const cachedRecordings = CacheManager.get<RecordingLink[]>(RECORDINGS_CACHE_KEY, { ttl: CACHE_TTL });
      if (cachedRecordings) {
        console.log(`� Loaded ${cachedRecordings.length} recordings from cache`);
        return cachedRecordings.map(recording => ({
          ...recording,
          url: this.formatDriveUrl(recording.url)
        }));
      }
    }

    // אסטרטגיה 3: Fallback ל-localStorage (legacy)
    const stored = localStorage.getItem('recordings');
    if (stored) {
      try {
        const recordings = JSON.parse(stored) as RecordingLink[];
        console.log(`� Loaded ${recordings.length} recordings from localStorage (legacy)`);
        
        // Format URLs for better playback
        return recordings.map(recording => ({
          ...recording,
          url: this.formatDriveUrl(recording.url)
        }));
      } catch (error) {
        console.error('Failed to parse recordings from localStorage:', error);
      }
    }
    
    console.log('📭 No recordings found in storage');
    return [];
  }

  /**
   * Add a new recording
   */
  async addRecording(recording: Omit<RecordingLink, 'id' | 'uploadDate'>): Promise<boolean> {
    try {
      const currentRecordings = await this.loadRecordings(true); // force refresh מ-GitHub
      
      const newRecording: RecordingLink = {
        ...recording,
        id: crypto.randomUUID(),
        uploadDate: new Date().toISOString().split('T')[0],
        url: this.formatDriveUrl(recording.url)
      };

      const updatedRecordings = [...currentRecordings, newRecording];
      
      await this.updateRecordingsFile(
        updatedRecordings, 
        `הוספת הקלטה חדשה: ${recording.title}`
      );
      
      // נקה cache כדי שכולם יקבלו עדכון
      CacheManager.remove(RECORDINGS_CACHE_KEY);
      
      return true;
    } catch (error) {
      console.error('Error adding recording:', error);
      throw error;
    }
  }

  /**
   * Update an existing recording
   */
  async updateRecording(recordingId: string, updates: Partial<RecordingLink>): Promise<boolean> {
    try {
      const currentRecordings = await this.loadRecordings(true); // force refresh מ-GitHub
      
      const updatedRecordings = currentRecordings.map(recording =>
        recording.id === recordingId
          ? { 
              ...recording, 
              ...updates, 
              url: updates.url ? this.formatDriveUrl(updates.url) : recording.url,
              uploadDate: new Date().toISOString().split('T')[0]
            }
          : recording
      );

      await this.updateRecordingsFile(
        updatedRecordings,
        `עדכון הקלטה: ${updates.title || 'ללא כותרת'}`
      );
      
      // נקה cache כדי שכולם יקבלו עדכון
      CacheManager.remove(RECORDINGS_CACHE_KEY);
      
      return true;
    } catch (error) {
      console.error('Error updating recording:', error);
      throw error;
    }
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<boolean> {
    try {
      const currentRecordings = await this.loadRecordings(true); // force refresh מ-GitHub
      const recordingToDelete = currentRecordings.find(r => r.id === recordingId);
      
      const updatedRecordings = currentRecordings.filter(recording => recording.id !== recordingId);
      
      await this.updateRecordingsFile(
        updatedRecordings,
        `מחיקת הקלטה: ${recordingToDelete?.title || 'ללא כותרת'}`
      );
      
      // נקה cache כדי שכולם יקבלו עדכון
      CacheManager.remove(RECORDINGS_CACHE_KEY);
      
      return true;
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }

  /**
   * Get recordings for a specific lesson
   */
  async getRecordingsForLesson(lessonId: string): Promise<RecordingLink[]> {
    const allRecordings = await this.loadRecordings();
    return allRecordings.filter(recording => recording.lessonId === lessonId);
  }

  /**
   * Get a single recording by ID
   */
  async getRecordingById(recordingId: string): Promise<RecordingLink | null> {
    const allRecordings = await this.loadRecordings();
    return allRecordings.find(recording => recording.id === recordingId) || null;
  }
}

export default RecordingService;