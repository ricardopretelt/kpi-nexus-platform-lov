import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import HomePage from './HomePage';
import TopicsPage from './TopicsPage';
import KPIArticlePage from './KPIArticlePage';
import KPICreationTemplate from './KPICreationTemplate';
import UserManagement from './UserManagement';
import KPIModificationTemplate from './KPIModificationTemplate';
import { KPI } from '../types/kpi';
import { api, Topic } from '../services/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import TopicsOverviewPage from './TopicsOverviewPage';

type Page = 'home' | 'topics' | 'kpi' | 'users' | 'create-kpi' | 'modify-kpi';

const Dashboard = () => {
  const { user, hasAdminAccess, onUserUpdate } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiToModify, setKpiToModify] = useState<KPI | null>(null);

  // Function to fetch KPI and topic data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [kpisData, topicsData] = await Promise.all([
        api.getKPIs(),
        api.getTopics()
      ]);
      setKpis(kpisData);
      setTopics(topicsData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Announce pending approvals and quick-navigate
  useEffect(() => {
    let lastCount = 0;
    let cancelled = false;

    const announce = async () => {
      try {
        const items = await api.getPendingApprovals();
        if (cancelled) return;
        if (items.length > 0 && items.length !== lastCount) {
          lastCount = items.length;
          const first = items[0];
          toast(`You have ${items.length} pending approval${items.length > 1 ? 's' : ''}`, {
            action: {
              label: 'Open',
              onClick: async () => {
                try {
                  const kpi = await api.getKPI(String(first.kpi_id));
                  setSelectedKPI(kpi);
                  setCurrentPage('kpi');
                } catch {}
              }
            }
          });
        }
      } catch {}
    };

    announce();
    const id = setInterval(announce, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Poll for KPI updates when viewing a KPI to show real-time changes
  useEffect(() => {
    if (currentPage !== 'kpi' || !selectedKPI) return;
    
    let cancelled = false;
    
    const pollForUpdates = async () => {
      try {
        if (cancelled) return;
        console.log('🔍 Polling for KPI updates...', selectedKPI.id);
        const refreshed = await api.getKPI(String(selectedKPI.id));
        if (!cancelled) {
          console.log('📊 Current status:', selectedKPI.status, 'New status:', refreshed.status);
          // Force a re-render by creating a new object reference
          const updatedKPI = { ...refreshed };
          setSelectedKPI(updatedKPI);
          setKpis(prev => prev.map(kpi => kpi.id === refreshed.id ? updatedKPI : kpi));
          console.log('✅ KPI updated via polling');
        }
      } catch (error) {
        console.error('Failed to poll for KPI updates:', error);
      }
    };

    // Poll immediately and then every 2 seconds
    pollForUpdates();
    const interval = setInterval(pollForUpdates, 2000);
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentPage, selectedKPI?.id]);

  // Add user update listener to refresh KPI data when users are updated
  useEffect(() => {
    const cleanup = onUserUpdate(() => {
      console.log('User updated, refreshing KPI data...');
      fetchData();
    });
    
    return cleanup;
  }, [onUserUpdate]);

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setCurrentPage('topics');
  };

  const handleKPISelect = (kpi: KPI) => {
    setSelectedKPI(kpi);
    setCurrentPage('kpi');
  };

  const handleKPIUpdate = (updatedKPI: KPI) => {
    setKpis(prev => prev.map(kpi => kpi.id === updatedKPI.id ? updatedKPI : kpi));
    setSelectedKPI(updatedKPI);
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    if (page === 'home') {
      setSelectedTopic('');
      setSelectedKPI(null);
    }
  };

  const handleAddKPI = () => {
    setCurrentPage('create-kpi');
  };

  const handleKPICreationSuccess = (newKPI: KPI) => {
    // Add the new KPI to the list
    setKpis(prev => [newKPI, ...prev]);
    
    // Show success message and redirect to home
    toast.success('KPI created successfully!');
    setCurrentPage('home');
  };

  const handleKPICreationCancel = () => {
    setCurrentPage('home');
  };

  const handleNavigateToModify = (kpi: KPI) => {
    setKpiToModify(kpi);
    setCurrentPage('modify-kpi');
  };

  const handleKPIModificationSuccess = (updatedKPI: KPI) => {
    // Update the KPI in the list
    setKpis(prev => prev.map(kpi => kpi.id === updatedKPI.id ? updatedKPI : kpi));
    
    // Show success message and redirect back to KPI page
    toast.success('KPI modified successfully!');
    setSelectedKPI(updatedKPI);
    setCurrentPage('kpi');
    setKpiToModify(null);
  };

  const handleKPIModificationCancel = () => {
    setCurrentPage('kpi');
    setKpiToModify(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={handleNavigate}
        userRole={user?.role || 'user'}
      />
      <div className="flex-1 overflow-auto">
        {currentPage === 'home' && (
          <HomePage 
            kpis={kpis} 
            topics={topics}
            onTopicSelect={handleTopicSelect} 
            onKPISelect={handleKPISelect}
            onAddKPI={handleAddKPI}
          />
        )}
        {currentPage === 'topics' && !selectedTopic && (
          <TopicsOverviewPage 
            kpis={kpis} 
            topics={topics}
            onTopicSelect={handleTopicSelect}
          />
        )}
        {currentPage === 'topics' && selectedTopic && (
          <TopicsPage topic={selectedTopic} kpis={kpis} onKPISelect={handleKPISelect} />
        )}
        {currentPage === 'kpi' && selectedKPI && (
          <KPIArticlePage 
            kpi={selectedKPI} 
            onUpdate={handleKPIUpdate}
            onNavigateToModify={handleNavigateToModify}
          />
        )}
        {currentPage === 'create-kpi' && (
          <KPICreationTemplate 
            onCancel={handleKPICreationCancel}
            onSuccess={handleKPICreationSuccess}
          />
        )}
        {currentPage === 'modify-kpi' && kpiToModify && (
          <KPIModificationTemplate 
            kpi={kpiToModify}
            onCancel={handleKPIModificationCancel}
            onSuccess={handleKPIModificationSuccess}
          />
        )}
        {currentPage === 'users' && hasAdminAccess(user) && (
          <UserManagement />
        )}
      </div>
    </div>
  );
};

export default Dashboard;