import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPI } from '../types/kpi';
import { Topic } from '../services/api';
import { Clock, TrendingUp, Users, Database, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { NotificationButton } from './NotificationButton';

interface HomePageProps {
  kpis: KPI[];
  topics: Topic[];
  onTopicSelect: (topic: string) => void;
  onKPISelect: (kpi: KPI) => void;
  onAddKPI: () => void;
}

const HomePage = ({ kpis, topics, onTopicSelect, onKPISelect, onAddKPI }: HomePageProps) => {
  const recentlyUpdatedKPIs = kpis
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 3);

  const getTopicStats = () => {
    return topics.map(topic => ({
      ...topic,
      count: kpis.filter(kpi => kpi.topics && kpi.topics.includes(topic.id)).length
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get topic names from IDs
  const getTopicNames = (topicIds: number[]): string[] => {
    return topicIds.map(id => {
      const topic = topics.find(t => t.id === id);
      return topic ? topic.name : `Unknown Topic ${id}`;
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Add KPI Button */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">BI Documentation Dashboard</h1>
          <p className="text-gray-600">
            Welcome to the Telecom BI Documentation platform. Manage KPIs, track performance metrics, and maintain technical documentation.
          </p>
        </div>
        
        {/* Add KPI Button - Top Right (opposite side of sidebar) */}
        <div className="flex items-center space-x-2">
          <NotificationButton onReviewKPI={(kpiId) => {
            const kpi = kpis.find(k => k.id === String(kpiId));
            if (kpi) onKPISelect(kpi);
          }} />
          <Button onClick={onAddKPI} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add KPI
          </Button>
        </div>
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
            <CardTitle>Topics</CardTitle>
            <CardDescription>
              Browse KPIs organized by business domains
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getTopicStats().map((topic) => (
              <div
                key={topic.name}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onTopicSelect(topic.id.toString())}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-lg"
                  >
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
                    <p className="text-sm text-gray-600">
                      {kpi.topics && kpi.topics.length > 0 ? getTopicNames(kpi.topics).join(', ') : 'No topics'}
                    </p>
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