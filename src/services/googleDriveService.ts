export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  downloadUrl?: string;
}

export class GoogleDriveService {
  private static isConnected = false;
  private static accessToken: string | null = null;

  // Simulated connection for demo purposes
  static async connect(): Promise<boolean> {
    // In a real implementation, this would use Google OAuth2
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = true;
        this.accessToken = 'demo-access-token';
        localStorage.setItem('gdrive-connected', 'true');
        resolve(true);
      }, 1000);
    });
  }

  static disconnect(): void {
    this.isConnected = false;
    this.accessToken = null;
    localStorage.removeItem('gdrive-connected');
  }

  static isGoogleDriveConnected(): boolean {
    return this.isConnected || localStorage.getItem('gdrive-connected') === 'true';
  }

  // Simulated file upload
  static async uploadRecording(file: File, lessonId: string): Promise<DriveFile> {
    if (!this.isConnected) {
      throw new Error('Google Drive not connected');
    }

    // Simulate upload progress
    return new Promise((resolve) => {
      setTimeout(() => {
        const driveFile: DriveFile = {
          id: crypto.randomUUID(),
          name: `${lessonId}-recording.mp4`,
          mimeType: 'video/mp4',
          size: file.size,
          createdTime: new Date().toISOString(),
          modifiedTime: new Date().toISOString(),
          webViewLink: `https://drive.google.com/file/d/${crypto.randomUUID()}/view`,
          downloadUrl: URL.createObjectURL(file),
        };
        resolve(driveFile);
      }, 2000);
    });
  }

  // Simulated file listing
  static async getRecordings(): Promise<DriveFile[]> {
    if (!this.isConnected) {
      throw new Error('Google Drive not connected');
    }

    // Return demo recordings
    return [
      {
        id: '1',
        name: 'lesson-1-recording.mp4',
        mimeType: 'video/mp4',
        size: 104857600, // 100MB
        createdTime: '2025-08-01T10:00:00Z',
        modifiedTime: '2025-08-01T10:00:00Z',
        webViewLink: 'https://drive.google.com/file/d/demo1/view',
      },
      {
        id: '2',
        name: 'lesson-2-recording.mp4',
        mimeType: 'video/mp4',
        size: 157286400, // 150MB
        createdTime: '2025-08-05T14:30:00Z',
        modifiedTime: '2025-08-05T14:30:00Z',
        webViewLink: 'https://drive.google.com/file/d/demo2/view',
      },
    ];
  }

  static async deleteRecording(fileId: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Google Drive not connected');
    }

    // Simulate deletion
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 500);
    });
  }

  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
