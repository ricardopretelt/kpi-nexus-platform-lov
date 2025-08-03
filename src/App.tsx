import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import TopicsPage from './components/TopicsPage';
import UserManagement from './components/UserManagement';
import KPIArticlePage from './components/KPIArticlePage';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import './App.css';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './services/api';

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// HomePage Wrapper Component
const HomePageWrapper = () => {
  const navigate = useNavigate();
  
  const { data: kpis = [] } = useQuery({
    queryKey: ['kpis'],
    queryFn: api.getKPIs,
  });
  
  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: api.getTopics,
  });

  const handleTopicSelect = (topicName: string) => {
    navigate('/topics');
  };

  const handleKPISelect = (kpi: any) => {
    navigate(`/kpi/${kpi.id}`);
  };

  return (
    <HomePage 
      kpis={kpis}
      topics={topics}
      onTopicSelect={handleTopicSelect}
      onKPISelect={handleKPISelect}
    />
  );
};

// TopicsPage Wrapper Component
const TopicsPageWrapper = () => {
  const navigate = useNavigate();
  const { topic = 'Customer Retention' } = useParams(); // Default topic
  
  const { data: kpis = [] } = useQuery({
    queryKey: ['kpis'],
    queryFn: api.getKPIs,
  });

  const handleKPISelect = (kpi: any) => {
    navigate(`/kpi/${kpi.id}`);
  };

  return (
    <TopicsPage 
      topic={topic}
      kpis={kpis}
      onKPISelect={handleKPISelect}
    />
  );
};

// KPIArticlePage Wrapper Component
const KPIArticlePageWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: kpis = [] } = useQuery({
    queryKey: ['kpis'],
    queryFn: api.getKPIs,
  });

  const kpi = kpis.find(k => k.id === id);

  const handleUpdate = async (updatedKPI: any) => {
    try {
      await api.updateKPI(updatedKPI.id, updatedKPI);
      // Refetch KPIs to update the cache
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
    } catch (error) {
      console.error('Failed to update KPI:', error);
    }
  };

  if (!kpi) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">KPI not found</p>
      </div>
    );
  }

  return (
    <KPIArticlePage 
      kpi={kpi}
      onUpdate={handleUpdate}
    />
  );
};

// Main App Layout
const AppLayout = () => {
  const { user, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page: 'home' | 'topics' | 'kpi' | 'users') => {
    setCurrentPage(page);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        userRole={user?.role || ''}
      />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<HomePageWrapper />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/topics" element={<TopicsPageWrapper />} />
          <Route path="/kpi/:id" element={<KPIArticlePageWrapper />} />
          {user?.role === 'admin' && (
            <Route path="/users" element={<UserManagement />} />
          )}
        </Routes>
      </div>
    </div>
  );
};

// Main App Component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
