// GitHub API Service for automatic lesson updates
import { GitHubConfig } from '../config/github';

interface GitHubFileResponse {
  sha: string;
  content: string;
}

interface GitHubUpdateRequest {
  message: string;
  content: string;
  sha: string;
  branch?: string;
}

class GitHubService {
  private static instance: GitHubService;
  private config = GitHubConfig;

  private constructor() {
    // Configuration is handled by GitHubConfig
  }

  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  private getHeaders() {
    return this.config.getHeaders();
  }

  /**
   * Get current lessons.json file from GitHub
   */
  async getCurrentLessonsFile(): Promise<GitHubFileResponse> {
    try {
      // Add timestamp to bypass cache
      const timestamp = new Date().getTime();
      const response = await fetch(`${this.config.getBaseUrl()}/contents/public/data/lessons.json?ref=${this.config.branch}&t=${timestamp}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Proper UTF-8 decoding for Hebrew text
      const base64Content = data.content;
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoder = new TextDecoder('utf-8');
      const decodedContent = decoder.decode(bytes);
      
      return {
        sha: data.sha,
        content: decodedContent,
      };
    } catch (error) {
      console.error('Error fetching lessons file from GitHub:', error);
      throw error;
    }
  }

  /**
   * Update lessons.json file in GitHub
   */
  async updateLessonsFile(lessons: any[], commitMessage?: string): Promise<boolean> {
    try {
      // Get current file to get SHA
      const currentFile = await this.getCurrentLessonsFile();
      
      // Prepare new content
      const newContent = JSON.stringify(lessons, null, 2);
      // Proper UTF-8 encoding for Hebrew text
      const encoder = new TextEncoder();
      const utf8Bytes = encoder.encode(newContent);
      const encodedContent = btoa(String.fromCharCode(...utf8Bytes)); // Encode to base64

      const updateData: GitHubUpdateRequest = {
        message: commitMessage || `Update lessons - ${new Date().toLocaleString('he-IL')}`,
        content: encodedContent,
        sha: currentFile.sha,
        branch: this.config.branch,
      };

      const response = await fetch(`${this.config.getBaseUrl()}/contents/public/data/lessons.json`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
      }

      console.log('✅ Lessons updated successfully in GitHub');
      return true;
    } catch (error) {
      console.error('❌ Error updating lessons in GitHub:', error);
      throw error;
    }
  }

  /**
   * Test GitHub connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.getBaseUrl()}`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current recordings.json file from GitHub
   */
  async getCurrentRecordingsFile(): Promise<GitHubFileResponse> {
    try {
      // Add timestamp to bypass cache
      const timestamp = new Date().getTime();
      const response = await fetch(`${this.config.getBaseUrl()}/contents/public/data/recordings.json?ref=${this.config.branch}&t=${timestamp}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Proper UTF-8 decoding for Hebrew text
      const base64Content = data.content;
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoder = new TextDecoder('utf-8');
      const decodedContent = decoder.decode(bytes);
      
      return {
        sha: data.sha,
        content: decodedContent,
      };
    } catch (error) {
      console.error('Error fetching recordings file from GitHub:', error);
      throw error;
    }
  }

  /**
   * Update recordings.json file in GitHub
   */
  async updateRecordingsFile(recordings: any[], commitMessage?: string): Promise<boolean> {
    try {
      // Get current file to get SHA
      const currentFile = await this.getCurrentRecordingsFile();
      
      // Prepare new content
      const newContent = JSON.stringify(recordings, null, 2);
      // Proper UTF-8 encoding for Hebrew text
      const encoder = new TextEncoder();
      const utf8Bytes = encoder.encode(newContent);
      const encodedContent = btoa(String.fromCharCode(...utf8Bytes)); // Encode to base64

      const updateData: GitHubUpdateRequest = {
        message: commitMessage || `Update recordings - ${new Date().toLocaleString('he-IL')}`,
        content: encodedContent,
        sha: currentFile.sha,
        branch: this.config.branch,
      };

      const response = await fetch(`${this.config.getBaseUrl()}/contents/public/data/recordings.json`, {
        method: 'PUT',
        headers: this.getHeaders(),
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
   * Check if GitHub token is configured
   */
  isConfigured(): boolean {
    return this.config.isConfigured();
  }
}

export default GitHubService;
