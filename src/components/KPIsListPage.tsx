import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { KPI } from '../types/kpi';
import { useState } from 'react';
import { Search, Clock, User, BarChart3 } from 'lucide-react';
import { Topic } from '../services/api';

interface KPIsListPageProps {
  kpis: KPI[];
  topics: Topic[];
  onKPISelect: (kpi: KPI) => void;
}

const KPIsListPage = ({ kpis, topics, onKPISelect }: KPIsListPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredKPIs = kpis.filter(kpi => 
    kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kpi.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (kpi.topics && kpi.topics.some(topicId => {
      const topic = topics.find(t => t.id === topicId);
      return topic && topic.name.toLowerCase().includes(searchTerm.toLowerCase());
    }))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTopicNames = (topicIds: number[]) => {
    return topicIds
      .map(id => topics.find(t => t.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All KPIs</h1>
            <p className="text-gray-600">
              {filteredKPIs.length} KPI{filteredKPIs.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search KPIs by name, definition, or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* KPI List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredKPIs.map((kpi) => (
          <Card key={kpi.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onKPISelect(kpi)}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{kpi.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {kpi.definition}
                  </CardDescription>
                </div>
                <Badge variant={kpi.status === 'active' ? 'default' : 'secondary'}>
                  {kpi.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Data Specialist</p>
                    <p className="text-gray-600">{kpi.dataSpecialist}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">Business Specialist</p>
                    <p className="text-gray-600">{kpi.businessSpecialist}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p className="text-gray-600">{formatDate(kpi.lastUpdated)}</p>
                  </div>
                </div>
              </div>
              
              {/* Topics */}
              {kpi.topics && kpi.topics.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Topics:</span>
                    <span className="text-sm text-gray-600">{getTopicNames(kpi.topics)}</span>
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {kpi.versions.length} version{kpi.versions.length !== 1 ? 's' : ''} available
                  </span>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredKPIs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No KPIs found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default KPIsListPage;
