
import { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginPage from '../components/LoginPage';
import Dashboard from '../components/Dashboard';

const AppContent = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return <Dashboard />;
};

const Index = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </AuthProvider>
  );
};

export default Index;
