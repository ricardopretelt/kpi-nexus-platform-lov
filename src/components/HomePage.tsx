import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPI } from '../types/kpi';
import { Topic } from '../services/api';
import { Clock, TrendingUp, Users, Database } from 'lucide-react';

interface HomePageProps {
  kpis: KPI[];
  topics: Topic[];
  onTopicSelect: (topic: string) => void;
  onKPISelect: (kpi: KPI) => void;
}

const HomePage = ({ kpis, topics, onTopicSelect, onKPISelect }: HomePageProps) => {
  const recentlyUpdatedKPIs = kpis
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 3);

  const getTopicStats = () => {
    return topics.map(topic => ({
      ...topic,
      count: kpis.filter(kpi => kpi.topic === topic.name).length
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">BI Documentation Dashboard</h1>
        <p className="text-gray-600">
          Welcome to the Telecom BI Documentation platform. Manage KPIs, track performance metrics, and maintain technical documentation.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total KPIs</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.length}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active KPIs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpis.filter(kpi => kpi.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Topics</p>
                <p className="text-2xl font-bold text-gray-900">{topics.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Updates</p>
                <p className="text-2xl font-bold text-gray-900">{recentlyUpdatedKPIs.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Topics & Categories</CardTitle>
            <CardDescription>
              Browse KPIs organized by business domains
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getTopicStats().map((topic) => (
              <div
                key={topic.name}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onTopicSelect(topic.name)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${topic.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                    {topic.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{topic.name}</h3>
                    <p className="text-sm text-gray-600">{topic.description}</p>
                  </div>
                </div>
                <Badge variant="secondary">{topic.count} KPIs</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recently Updated KPIs */}
        <Card>
          <CardHeader>
            <CardTitle>Recently Updated KPIs</CardTitle>
            <CardDescription>
              Latest updates to KPI documentation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentlyUpdatedKPIs.map((kpi) => (
              <div
                key={kpi.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onKPISelect(kpi)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-gray-900">{kpi.name}</h3>
                    <p className="text-sm text-gray-600">{kpi.topic}</p>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Updated {formatDate(kpi.lastUpdated)}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    variant={kpi.status === 'active' ? 'default' : 'secondary'}
                  >
                    {kpi.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;