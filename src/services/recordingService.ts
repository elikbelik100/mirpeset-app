// Recording Service for managing lesson recordings
import GitHubService from './githubService';

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
   * Update recordings.json file in GitHub with localStorage fallback
   */
  private async updateRecordingsFile(recordings: RecordingLink[], commitMessage?: string): Promise<boolean> {
    try {
      // Always save to localStorage as backup
      localStorage.setItem('recordings', JSON.stringify(recordings));
      console.log('📝 Recordings saved locally as backup:', recordings.length, 'recordings');

      // Try to save to GitHub if configured
      if (this.githubService.isConfigured()) {
        try {
          await this.githubService.updateRecordingsFile(recordings, commitMessage);
          console.log('✅ Recordings synchronized to GitHub successfully');
          return true;
        } catch (githubError) {
          console.error('❌ Failed to sync to GitHub, but saved locally:', githubError);
          // Don't throw - we have localStorage backup
          return true;
        }
      } else {
        console.warn('⚠️ GitHub not configured, recordings saved locally only');
        return true;
      }
    } catch (error) {
      console.error('❌ Error saving recordings:', error);
      throw error;
    }
  }

  /**
   * Load all recordings from GitHub with localStorage fallback
   */
  async loadRecordings(): Promise<RecordingLink[]> {
    try {
      // Try to load from GitHub first if configured
      if (this.githubService.isConfigured()) {
        try {
          const githubFile = await this.githubService.getCurrentRecordingsFile();
          const githubRecordings = JSON.parse(githubFile.content) as RecordingLink[];
          
          // Also save to localStorage as cache
          localStorage.setItem('recordings', JSON.stringify(githubRecordings));
          console.log('📚 Loaded recordings from GitHub:', githubRecordings.length, 'recordings');
          
          // Format URLs for better playback
          return githubRecordings.map(recording => ({
            ...recording,
            url: this.formatDriveUrl(recording.url)
          }));
        } catch (githubError) {
          console.warn('⚠️ Failed to load from GitHub, trying localStorage:', githubError);
          // Fall back to localStorage
        }
      }

      // Fallback to localStorage
      const stored = localStorage.getItem('recordings');
      if (!stored) {
        console.log('📁 No recordings found in storage');
        return [];
      }
      
      const recordings = JSON.parse(stored) as RecordingLink[];
      console.log('📚 Loaded recordings from localStorage:', recordings.length, 'recordings');
      
      // Format URLs for better playback
      return recordings.map(recording => ({
        ...recording,
        url: this.formatDriveUrl(recording.url)
      }));
    } catch (error) {
      console.error('❌ Error loading recordings:', error);
      return [];
    }
  }

  /**
   * Add a new recording
   */
  async addRecording(recording: Omit<RecordingLink, 'id' | 'uploadDate'>): Promise<boolean> {
    try {
      const currentRecordings = await this.loadRecordings();
      
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
      const currentRecordings = await this.loadRecordings();
      
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
      const currentRecordings = await this.loadRecordings();
      const recordingToDelete = currentRecordings.find(r => r.id === recordingId);
      
      const updatedRecordings = currentRecordings.filter(recording => recording.id !== recordingId);
      
      await this.updateRecordingsFile(
        updatedRecordings,
        `מחיקת הקלטה: ${recordingToDelete?.title || 'ללא כותרת'}`
      );
      
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