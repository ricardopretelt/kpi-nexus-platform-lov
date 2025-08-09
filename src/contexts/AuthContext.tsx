import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { api } from '../services/api';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'data_specialist' | 'business_specialist' | 'user';
  is_admin?: boolean;
  force_password_change?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string, fullName: string, role?: User['role']) => Promise<boolean>;
  users: User[];
  inviteUser: (email: string, name: string, role: User['role']) => Promise<{ success: boolean; error?: string; password?: string }>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  initialized: boolean;
  hasAdminAccess: (user: User | null) => boolean; // New helper function
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = (() => {
  console.log('🔍 AuthContext Environment check:');
  console.log('- import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('- window.location.hostname:', window?.location?.hostname);
  
  // Check environment variable first
  if (import.meta.env.VITE_API_URL) {
    console.log('AuthContext using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  // Check if running locally (localhost or 127.0.0.1)
  if (typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('localhost')
  )) {
    console.log('AuthContext using localhost detection');
    return 'http://localhost:3001';
  }
  // Fallback to server
  console.log('AuthContext using fallback server URL');
  return 'http://18.217.206.5:3001';
})();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Helper function to check if user has admin access
  const hasAdminAccess = (user: User | null): boolean => {
    console.log('=== hasAdminAccess DEBUG ===');
    console.log('User:', user);
    console.log('User is_admin:', user?.is_admin);
    console.log('User is_admin type:', typeof user?.is_admin);
    
    if (!user) return false;
    const is_admin = user.is_admin === true;
    console.log('Final is_admin result:', is_admin);
    return is_admin;
  };

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchProfile(token);
    } else {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (initialized) {
      const token = localStorage.getItem('authToken');
      if (token) {
        api.getUsers()
          .then(setUsers) // Just use the users as they come from server
          .catch(err => {
            console.error('Failed to fetch users:', err);
            setUsers([]);
          });
      }
    }
  }, [initialized]);

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Profile data:', data); // Add debug log
        setUser(data.user);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setInitialized(true);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', data); // Add this debug log

      if (response.ok) {
        console.log('Setting user with data:', data.user); // Add this debug log
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        return true;
      } else {
        setError(data.error || 'Login failed');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, fullName: string, role: User['role'] = 'user'): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, fullName, role }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        return true;
      } else {
        setError(data.error || 'Registration failed');
        return false;
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    setUser(null);
    localStorage.removeItem('authToken');
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const inviteUser = async (email: string, name: string, role: User['role']) => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      setError('You must be logged in to invite users');
      return { success: false, error: 'Not logged in' };
    }

    try {
      const generatedPassword = generatePassword();
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: email.split('@')[0], 
          email, 
          password: generatedPassword, 
          fullName: name, 
          role,
          force_password_change: true // Add this flag
        }),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser.user]);
        console.log('User invited:', newUser.user);
        await api.getUsers().then(setUsers); // Refresh users after successful invite
        return { success: true, password: generatedPassword };
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to invite user');
        return { success: false, error: error.error || 'Failed to invite user' };
      }
    } catch (err) {
      console.error('Invite user error:', err);
      setError('Network error. Please try again.');
      return { success: false, error: 'Network error' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    const token = localStorage.getItem('authToken');
    if (!token || !user) {
      return { error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id,
          newPassword 
        }),
      });

      if (response.ok) {
        // Update user to remove force_password_change flag
        setUser(prev => prev ? { ...prev, force_password_change: false } : null);
        return {};
      } else {
        const error = await response.json();
        return { error: error.message || 'Failed to update password' };
      }
    } catch (err) {
      console.error('Password update error:', err);
      return { error: 'Network error. Please try again.' };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const refreshUsers = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const fetchedUsers = await api.getUsers();
        setUsers(fetchedUsers); // don't overwrite is_admin
      } catch (err) {
        console.error('Failed to refresh users:', err);
      }
    }
  };

  // Show loading while initializing
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register, 
      users, 
      inviteUser, 
      loading, 
      error, 
      clearError,
      initialized,
      hasAdminAccess,
      updatePassword,
      refreshUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};