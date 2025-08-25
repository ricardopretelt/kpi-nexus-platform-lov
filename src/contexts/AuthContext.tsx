import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { ForcePasswordChangeModal } from '../components/ForcePasswordChangeModal';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'data_specialist' | 'business_specialist' | 'user';
  is_admin?: boolean;
  is_active?: boolean;
  force_password_change?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  logoutAndRedirect: (redirectTo?: string) => void;
  register: (username: string, email: string, password: string, fullName: string, role?: User['role']) => Promise<boolean>;
  users: User[];
  inviteUser: (email: string, name: string, role: User['role']) => Promise<{ success: boolean; error?: string; password?: string }>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  initialized: boolean;
  hasAdminAccess: (user: User | null) => boolean;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  refreshUsers: () => Promise<void>;
  showForcePasswordChange: boolean;
  onUserUpdate: (callback: () => void) => () => void;
  emitUserUpdate: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = (() => {
  console.log('🔍 AuthContext Environment check:');
  console.log('- window.location.hostname:', window?.location?.hostname);
  
  // Auto-detect based on how the frontend is accessed
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('AuthContext using localhost backend');
      return 'http://localhost:3001';
    }
    
    if (hostname === '18.218.115.23') {
      console.log('AuthContext using server backend');
      return 'http://18.218.115.23:3001';
    }
  }
  
  console.log('AuthContext using default localhost');
  return 'http://localhost:3001';
})();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);
  
  // Add this state variable for user update event propagation
  const [userUpdateListeners, setUserUpdateListeners] = useState<(() => void)[]>([]);

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
          .then(setUsers)
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
        console.log('Profile data:', data);
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
      console.log('Login response:', data);

      if (response.ok) {
        console.log('Setting user with data:', data.user);
        
        // Check if user is active before allowing login
        if (data.user.is_active === false) {
          setError('Account is deactivated. Please contact an administrator.');
          return false;
        }
        
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        
        // Check if password change is required
        if (data.user.force_password_change === true) {
          console.log('🔒 Password change required for user');
          setShowForcePasswordChange(true);
        }
        
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
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username, email, password, fullName, role, force_password_change: true
        }),
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

  // New function for logout with redirect capability
  const logoutAndRedirect = (redirectTo: string = '/') => {
    // First perform the logout
    logout();
    
    // Then redirect using window.location for immediate effect
    // This ensures the user is redirected even if React state updates are pending
    window.location.href = redirectTo;
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

  const handleForcePasswordChange = async (newPassword: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { error: 'Not authenticated' };
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        // Password change successful - update user state and close modal
        setUser(prev => prev ? { ...prev, force_password_change: false } : null);
        setShowForcePasswordChange(false);
        return {};
      } else {
        const errorData = await response.json();
        return { error: errorData.error || 'Failed to change password' };
      }
    } catch (err) {
      console.error('Password change error:', err);
      return { error: 'Network error. Please try again.' };
    }
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
          force_password_change: true
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

  const updateUser = async (userId: string, userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        // Refresh users list
        await refreshUsers();
        
        // Emit user update event to notify all components
        emitUserUpdate();
        
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to update user' };
      }
    } catch (err) {
      console.error('Update user error:', err);
      return { success: false, error: 'Network error. Please try again.' };
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
        setUsers(fetchedUsers);
      } catch (err) {
        console.error('Failed to refresh users:', err);
      }
    }
  };

  // User update event propagation functions
  const onUserUpdate = useCallback((callback: () => void) => {
    setUserUpdateListeners(prev => [...prev, callback]);
    
    // Return cleanup function
    return () => {
      setUserUpdateListeners(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const emitUserUpdate = useCallback(() => {
    userUpdateListeners.forEach(callback => callback());
  }, [userUpdateListeners]);

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
      logoutAndRedirect,
      register, 
      users, 
      inviteUser, 
      updateUser,
      loading, 
      error, 
      clearError,
      initialized,
      hasAdminAccess,
      updatePassword,
      refreshUsers,
      showForcePasswordChange,
      onUserUpdate,
      emitUserUpdate
    }}>
      {children}
      
      {/* Force Password Change Modal */}
      {showForcePasswordChange && user && (
        <ForcePasswordChangeModal
          isOpen={showForcePasswordChange}
          onPasswordChange={handleForcePasswordChange}
          userEmail={user.email}
        />
      )}
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