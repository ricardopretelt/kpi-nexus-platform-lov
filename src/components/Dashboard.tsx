import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import HomePage from './HomePage';
import TopicsPage from './TopicsPage';
import KPIArticlePage from './KPIArticlePage';
import UserManagement from './UserManagement';
import { KPI } from '../types/kpi';
import { api, Topic } from '../services/api';

type Page = 'home' | 'topics' | 'kpi' | 'users';

const Dashboard = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchData();
  }, []);

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
          />
        )}
        {currentPage === 'topics' && selectedTopic && (
          <TopicsPage topic={selectedTopic} kpis={kpis} onKPISelect={handleKPISelect} />
        )}
        {currentPage === 'kpi' && selectedKPI && (
          <KPIArticlePage kpi={selectedKPI} onUpdate={handleKPIUpdate} />
        )}
        {currentPage === 'users' && (
          <UserManagement />
        )}
      </div>
    </div>
  );
};

export default Dashboard;