// GitHub configuration for lesson synchronization
export const GitHubConfig = {
  // These values are safe to store in Git (not sensitive)
  owner: 'elikbelik100',
  repo: 'mirpeset-app', 
  branch: 'master',
  
  // Token comes from environment variable (not stored in Git)
  token: import.meta.env.VITE_GITHUB_TOKEN || '',
  
  // Check if GitHub integration is properly configured
  isConfigured(): boolean {
    return Boolean(this.token && this.owner && this.repo);
  },
  
  // Get base URL for GitHub API
  getBaseUrl(): string {
    return `https://api.github.com/repos/${this.owner}/${this.repo}`;
  },
  
  // Get headers for GitHub API requests
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }
};
