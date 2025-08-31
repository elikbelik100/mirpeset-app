import type { AuthUser } from '../types';

class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private readonly STORAGE_KEY = 'mirpeset_auth_user';

  private constructor() {
    // Load user from localStorage on initialization
    this.loadUserFromStorage();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Mock login for demo purposes
  public async login(email: string, _password: string): Promise<AuthUser> {
    // In real app, this would call an API
    const adminEmails = ['admin@mirpeset.com', 'jeliyahu@gmail.com', 'hagbibig@gmail.com'];
    const isAdmin = adminEmails.includes(email);
    
    const user: AuthUser = {
      id: '1',
      name: isAdmin ? 'מנהל המערכת' : 'משתמש רגיל',
      email,
      role: isAdmin ? 'admin' : 'user',
      isAdmin: isAdmin,
      avatar: '',
      preferences: {
        notifications: true,
        theme: 'light',
        language: 'he'
      },
      createdAt: new Date()
    };

    this.currentUser = user;
    this.saveUserToStorage();
    return user;
  }

  public logout(): void {
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  public isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  public hasPermission(_action: 'create_lesson' | 'edit_lesson' | 'delete_lesson' | 'create_poster' | 'send_notifications'): boolean {
    if (!this.currentUser) return false;
    
    // Only admin has these permissions
    return this.currentUser.role === 'admin';
  }

  private loadUserFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    }
  }

  private saveUserToStorage(): void {
    try {
      if (this.currentUser) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));
      }
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }
}

export default AuthService;
