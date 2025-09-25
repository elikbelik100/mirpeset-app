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
   * Get current recordings.json file from GitHub
   */
  private async getCurrentRecordingsFile(): Promise<{ sha: string; content: string }> {
    try {
      const response = await fetch(`${this.githubService['config'].getBaseUrl()}/contents/public/data/recordings.json?ref=${this.githubService['config'].branch}`, {
        headers: this.githubService['getHeaders'](),
      });

      if (!response.ok) {
        if (response.status === 404) {
          // File doesn't exist, return empty
          return { sha: '', content: '[]' };
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        sha: data.sha,
        content: atob(data.content), // Decode base64
      };
    } catch (error) {
      console.error('Error fetching recordings file from GitHub:', error);
      throw error;
    }
  }

  /**
   * Update recordings.json file in GitHub
   */
  private async updateRecordingsFile(recordings: RecordingLink[], commitMessage?: string): Promise<boolean> {
    try {
      // Get current file to get SHA
      const currentFile = await this.getCurrentRecordingsFile();
      
      // Prepare new content
      const newContent = JSON.stringify(recordings, null, 2);
      const encodedContent = btoa(unescape(encodeURIComponent(newContent))); // Encode to base64

      const updateData = {
        message: commitMessage || `עדכון הקלטות - ${new Date().toLocaleString('he-IL')}`,
        content: encodedContent,
        sha: currentFile.sha,
        branch: this.githubService['config'].branch,
      };

      const method = currentFile.sha ? 'PUT' : 'PUT'; // Always PUT for both create and update
      const response = await fetch(`${this.githubService['config'].getBaseUrl()}/contents/public/data/recordings.json`, {
        method,
        headers: this.githubService['getHeaders'](),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
      }

      console.log('✅ Recordings updated successfully in GitHub');
      return true;
    } catch (error) {
      console.error('❌ Error updating recordings in GitHub:', error);
      throw error;
    }
  }

  /**
   * Load all recordings from GitHub
   */
  async loadRecordings(): Promise<RecordingLink[]> {
    try {
      const file = await this.getCurrentRecordingsFile();
      const recordings = JSON.parse(file.content) as RecordingLink[];
      
      // Format URLs for better playback
      return recordings.map(recording => ({
        ...recording,
        url: this.formatDriveUrl(recording.url)
      }));
    } catch (error) {
      console.error('Error loading recordings:', error);
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