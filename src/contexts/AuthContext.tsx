
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'data_specialist' | 'business_specialist';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: User[];
  inviteUser: (email: string, name: string, role: User['role']) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@telecom.com', role: 'admin' },
  { id: '2', name: 'John Doe', email: 'john.doe@telecom.com', role: 'data_specialist' },
  { id: '3', name: 'Jane Smith', email: 'jane.smith@telecom.com', role: 'business_specialist' },
  { id: '4', name: 'Emily Clark', email: 'emily.clark@telecom.com', role: 'data_specialist' },
  { id: '5', name: 'Tom Brown', email: 'tom.brown@telecom.com', role: 'business_specialist' },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('Login attempt:', email, password);
    const foundUser = users.find(u => u.email === email);
    if (foundUser && password === 'password123') {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const inviteUser = (email: string, name: string, role: User['role']) => {
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role
    };
    setUsers(prev => [...prev, newUser]);
    console.log('User invited:', newUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, users, inviteUser }}>
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
