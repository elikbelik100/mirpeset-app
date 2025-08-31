// GitHub API Service for automatic lesson updates
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
  private token: string;
  private owner: string;
  private repo: string;
  private branch: string;
  private baseUrl: string;

  private constructor() {
    this.token = import.meta.env.VITE_GITHUB_TOKEN || '';
    this.owner = import.meta.env.VITE_GITHUB_OWNER || '';
    this.repo = import.meta.env.VITE_GITHUB_REPO || '';
    this.branch = import.meta.env.VITE_GITHUB_BRANCH || 'master';
    this.baseUrl = `https://api.github.com/repos/${this.owner}/${this.repo}`;
  }

  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get current lessons.json file from GitHub
   */
  async getCurrentLessonsFile(): Promise<GitHubFileResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/contents/public/data/lessons.json?ref=${this.branch}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        sha: data.sha,
        content: atob(data.content), // Decode base64
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
      const encodedContent = btoa(unescape(encodeURIComponent(newContent))); // Encode to base64

      const updateData: GitHubUpdateRequest = {
        message: commitMessage || `Update lessons - ${new Date().toLocaleString('he-IL')}`,
        content: encodedContent,
        sha: currentFile.sha,
        branch: this.branch,
      };

      const response = await fetch(`${this.baseUrl}/contents/public/data/lessons.json`, {
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
      const response = await fetch(`${this.baseUrl}`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return false;
    }
  }

  /**
   * Check if GitHub token is configured
   */
  isConfigured(): boolean {
    return !!(this.token && this.owner && this.repo);
  }
}

export default GitHubService;
