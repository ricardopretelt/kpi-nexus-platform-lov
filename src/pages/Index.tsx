
import { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginPage from '../components/LoginPage';
import Dashboard from '../components/Dashboard';

const AppContent = () => {
  console.log('AppContent rendering...');
  const { user } = useAuth();
  console.log('User:', user);

  if (!user) {
    console.log('Showing LoginPage');
    return <LoginPage />;
  }

  console.log('Showing Dashboard');
  return <Dashboard />;
};

const Index = () => {
  console.log('Index component rendering...');
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </AuthProvider>
  );
};

export default Index;
