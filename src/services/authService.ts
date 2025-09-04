import type { AuthUser } from '../types';

class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private readonly STORAGE_KEY = 'mirpeset_auth_user';
  private readonly USERS_STORAGE_KEY = 'mirpeset_registered_users';

  // Admin credentials
  private readonly adminUsers = [
    { email: 'jeliyahu@gmail.com', password: '123321', name: 'יהודה אליהו' },
    { email: 'hagbibig@gmail.com', password: '123321', name: 'מנהל המערכת' }
  ];

  private constructor() {
    // Load user from localStorage on initialization
    this.loadUserFromStorage();
    this.initializeAdminUsers();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Real login with password validation
  public async login(email: string, password: string): Promise<AuthUser> {
    // Check admin users
    const adminUser = this.adminUsers.find(admin => admin.email === email);
    if (adminUser) {
      if (adminUser.password !== password) {
        throw new Error('סיסמה שגויה');
      }
      
      const user: AuthUser = {
        id: email,
        name: adminUser.name,
        email,
        role: 'admin',
        isAdmin: true,
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

    // Check registered users
    const registeredUsers = this.getRegisteredUsers();
    const user = registeredUsers.find(u => u.email === email);
    
    if (!user) {
      throw new Error('משתמש לא נמצא');
    }
    
    if (user.password !== password) {
      throw new Error('סיסמה שגויה');
    }

    const authUser: AuthUser = {
      id: user.email,
      name: user.name,
      email: user.email,
      role: 'user',
      isAdmin: false,
      avatar: '',
      preferences: {
        notifications: true,
        theme: 'light',
        language: 'he'
      },
      createdAt: user.createdAt
    };

    this.currentUser = authUser;
    this.saveUserToStorage();
    return authUser;
  }

  // Register new user
  public async register(email: string, password: string, name: string): Promise<AuthUser> {
    // Check if user already exists
    const registeredUsers = this.getRegisteredUsers();
    const existingUser = registeredUsers.find(u => u.email === email);
    
    if (existingUser) {
      throw new Error('כתובת אימייל כבר קיימת במערכת');
    }

    // Check if it's an admin email
    const isAdminEmail = this.adminUsers.some(admin => admin.email === email);
    if (isAdminEmail) {
      throw new Error('כתובת אימייל זו שמורה למנהלי המערכת');
    }

    // Create new user
    const newUser = {
      email,
      password,
      name,
      createdAt: new Date()
    };

    registeredUsers.push(newUser);
    this.saveRegisteredUsers(registeredUsers);

    // Return authenticated user
    const authUser: AuthUser = {
      id: email,
      name,
      email,
      role: 'user',
      isAdmin: false,
      avatar: '',
      preferences: {
        notifications: true,
        theme: 'light',
        language: 'he'
      },
      createdAt: newUser.createdAt
    };

    this.currentUser = authUser;
    this.saveUserToStorage();
    return authUser;
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

  private initializeAdminUsers(): void {
    // Ensure admin users are available for login
    // This is just for initialization, passwords are checked in login
  }

  private getRegisteredUsers(): Array<{email: string, password: string, name: string, createdAt: Date}> {
    try {
      const stored = localStorage.getItem(this.USERS_STORAGE_KEY);
      if (stored) {
        const users = JSON.parse(stored);
        // Convert createdAt back to Date objects
        return users.map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading registered users:', error);
      return [];
    }
  }

  private saveRegisteredUsers(users: Array<{email: string, password: string, name: string, createdAt: Date}>): void {
    try {
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving registered users:', error);
    }
  }
}

export default AuthService;
