import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPI } from '../types/kpi';
import { Topic } from '../services/api';

interface TopicsOverviewPageProps {
  kpis: KPI[];
  topics: Topic[];
  onTopicSelect: (topic: string) => void;
}

const TopicsOverviewPage = ({ kpis, topics, onTopicSelect }: TopicsOverviewPageProps) => {
  const getTopicStats = () => {
    return topics.map(topic => ({
      ...topic,
      count: kpis.filter(kpi => kpi.topics && kpi.topics.includes(topic.id)).length
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Topics & Categories</h1>
        <p className="text-gray-600">
          Browse KPIs organized by business domains and categories
        </p>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getTopicStats().map((topic) => (
          <Card 
            key={topic.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onTopicSelect(topic.id.toString())}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${topic.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                  {topic.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{topic.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {topic.count} KPI{topic.count !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {topic.description || 'No description available'}
              </p>
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="text-xs">
                  {topic.count} KPIs
                </Badge>
                <div className="text-xs text-gray-500">
                  Click to view
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {topics.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500">
              <p className="text-lg font-medium mb-2">No topics available</p>
              <p className="text-sm">Topics will appear here once they are created.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TopicsOverviewPage;
