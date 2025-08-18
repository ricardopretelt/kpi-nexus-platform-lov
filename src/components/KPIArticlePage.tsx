
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { KPI } from '../types/kpi';
import { Edit, History, User, Database, Image } from 'lucide-react';
import { Topic } from '../services/api';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface KPIArticlePageProps {
  kpi: KPI;
  onUpdate: (updatedKPI: KPI) => void;
  onNavigateToModify?: (kpi: KPI) => void; // New prop for navigation
}

const KPIArticlePage = ({ kpi, onUpdate, onNavigateToModify }: KPIArticlePageProps) => {
  const { user } = useAuth();
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [latestApprovals, setLatestApprovals] = useState<Array<{ user_id: number; status: string }>>([]);

  // Load topics on component mount
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const topicsData = await api.getTopics();
        setTopics(topicsData);
      } catch (error) {
        console.error('Failed to load topics:', error);
      }
    };
    loadTopics();
  }, []);

  // Helper function to get topic names from IDs
  const getTopicNames = (topicIds: number[]): string[] => {
    return topicIds.map(id => {
      const topic = topics.find(t => t.id === id);
      return topic ? topic.name : `Unknown Topic ${id}`;
    });
  };

  const latestVersion = (kpi.versions || []).reduce((acc: any, v: any) => {
    if (!acc) return v;
    return (v.version ?? 0) > (acc.version ?? 0) ? v : acc;
  }, null);

  useEffect(() => {
    const loadApprovals = async () => {
      try {
        if (latestVersion?.id && latestVersion?.status === 'pending') {
          const approvals = await api.getApprovals(String(latestVersion.id));
          setLatestApprovals(approvals);
        } else {
          setLatestApprovals([]);
        }
      } catch (e) {
        console.error('Failed to load approvals', e);
      }
    };
    loadApprovals();
  }, [kpi.id, latestVersion?.id, latestVersion?.status]);

  const userHasPendingApproval =
    !!(user && latestVersion?.status === 'pending' &&
      latestApprovals.some(a => String(a.user_id) === String(user.id) && a.status === 'pending'));

  const handleApprove = async () => {
    if (!latestVersion?.id) return;
    try {
      await api.approveKpiVersion(String(latestVersion.id));
      // Immediately refresh to show updated status
      const refreshed = await api.getKPI(String(kpi.id));
      onUpdate(refreshed);
      // Also refresh approvals list
      if (latestVersion?.id) {
        const approvals = await api.getApprovals(String(latestVersion.id));
        setLatestApprovals(approvals);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async () => {
    if (!latestVersion?.id) return;
    try {
      await api.rejectKpiVersion(String(latestVersion.id));
      // Immediately refresh to show updated status
      const refreshed = await api.getKPI(String(kpi.id));
      onUpdate(refreshed);
      // Also refresh approvals list
      if (latestVersion?.id) {
        const approvals = await api.getApprovals(String(latestVersion.id));
        setLatestApprovals(approvals);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const canEdit = () => {
    if (!user) return false;
    const userId = String(user.id).trim();
    if (!userId) return false;

    // Collect all assigned specialist IDs from KPI versions (camelCase and snake_case)
    const assignedIds = new Set<string>();
    (kpi.versions || []).forEach((v) => {
      const ds = (v as any).dataSpecialistId ?? (v as any).data_specialist_id;
      const bs = (v as any).businessSpecialistId ?? (v as any).business_specialist_id;
      if (ds !== undefined && ds !== null && String(ds).trim() !== '') assignedIds.add(String(ds).trim());
      if (bs !== undefined && bs !== null && String(bs).trim() !== '') assignedIds.add(String(bs).trim());
    });

    const match = assignedIds.has(userId);

    console.log('canEdit check (ID-based):', {
      userId,
      assignedIds: Array.from(assignedIds),
      match
    });

    return match;
  };

  const handleModifyKPI = () => {
    if (onNavigateToModify) {
      onNavigateToModify(kpi);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to format specialist names for display
  const formatSpecialists = (dataSpecialist?: string, businessSpecialist?: string) => {
    if (dataSpecialist && businessSpecialist) {
      return `${dataSpecialist} and ${businessSpecialist}`;
    } else if (dataSpecialist) {
      return dataSpecialist;
    } else if (businessSpecialist) {
      return businessSpecialist;
    } else {
      return 'System';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{kpi.name}</h1>
          <div className="flex items-center space-x-4">
            <Badge variant={kpi.status === 'active' ? 'default' : 'secondary'}>
              {kpi.status}
            </Badge>
            {latestVersion?.status === 'pending' && (
              <Badge variant="secondary">Pending Approval (v{latestVersion.version})</Badge>
            )}
            <span className="text-sm text-gray-600">
              {kpi.topics && kpi.topics.length > 0 ? getTopicNames(kpi.topics).join(', ') : 'No topics'}
            </span>
            <span className="text-sm text-gray-600">
              Last updated: {formatDate(kpi.lastUpdated)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="mr-2 h-4 w-4" />
                Version History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Version History - {kpi.name}</DialogTitle>
                <DialogDescription>
                  View all previous versions of this KPI
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {[...kpi.versions].sort((a, b) => (b.version ?? 0) - (a.version ?? 0)).map((version) => (
                  <Card key={version.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Version {version.version}</CardTitle>
                        <div className="text-sm text-gray-600">
                          {formatDate(version.updatedAt)} by {formatSpecialists(version.dataSpecialist, version.businessSpecialist)}
                        </div>
                      </div>
                      <CardDescription className="break-words">{version.changes}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Definition</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg break-words whitespace-pre-wrap">
                            {version.definition}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">SQL Query</h4>
                          <pre className="text-sm text-gray-700 bg-gray-900 text-green-400 p-3 rounded-lg break-words whitespace-pre-wrap overflow-x-auto">
                            {version.sqlQuery}
                          </pre>
                        </div>
                        {Array.isArray((version as any).additionalBlocks) && (version as any).additionalBlocks.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium">Additional Blocks</h4>
                            {(version as any).additionalBlocks.map((block: any, idx: number) => (
                              <div key={block.id || `v-${version.id}-block-${idx}`} className="border rounded-lg p-3 space-y-2">
                                <div className="font-medium">
                                  {block.title || `Additional Information ${idx + 1}`}
                                </div>
                                {block.subtitle && (
                                  <div className="text-sm text-gray-600">{block.subtitle}</div>
                                )}
                                {block.text && (
                                  <p className="text-sm text-gray-700 leading-relaxed">{block.text}</p>
                                )}
                                {block.endContent === 'code' && block.codeContent && (
                                  <pre className="bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto text-sm">
                                    {block.codeContent}
                                  </pre>
                                )}
                                {block.endContent === 'image' && block.imageUrl && (
                                  <div className="bg-gray-100 rounded-lg p-3">
                                    <img
                                      src={block.imageUrl}
                                      alt="Additional content"
                                      className="w-full h-48 object-cover rounded-lg"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                    <div className="hidden text-center text-gray-500 py-6">
                                      <Image className="mx-auto h-10 w-10 mb-2 text-gray-400" />
                                      <p>Image preview not available</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Approval actions */}
          {userHasPendingApproval && (
            <>
              <Button
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                Approve Version
              </Button>
              <Button
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                Reject Version
              </Button>
            </>
          )}

          {/* Add Modify KPI Button - Same styling as Add KPI button */}
          {canEdit() && (
            <Button
              onClick={() => handleModifyKPI()}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Edit className="mr-2 h-4 w-4" />
              Modify KPI
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Definition */}
          <Card>
            <CardHeader>
              <CardTitle>KPI Definition</CardTitle>
              <CardDescription>
                Business definition and context for this KPI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{kpi.definition}</p>
            </CardContent>
          </Card>

          {/* SQL Query */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                SQL Query
              </CardTitle>
              <CardDescription>
                Data extraction query for this KPI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {kpi.sqlQuery}
              </pre>
            </CardContent>
          </Card>

          {/* Additional Blocks */}
          {kpi.additionalBlocks && kpi.additionalBlocks.length > 0 && (
            <div className="space-y-4">
              {kpi.additionalBlocks.map((block, index) => (
                <Card key={block.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      {block.endContent === 'image' && (
                        <Image className="mr-2 h-5 w-5" />
                      )}
                      {block.title || `Additional Information ${index + 1}`}
                    </CardTitle>
                    {block.subtitle && (
                      <CardDescription>{block.subtitle}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {block.text && (
                      <p className="text-gray-700 leading-relaxed">{block.text}</p>
                    )}
                    
                    {block.endContent === 'code' && block.codeContent && (
                      <div>
                        <h4 className="font-medium mb-2">Code</h4>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                          {block.codeContent}
                        </pre>
                      </div>
                    )}
                    
                    {block.endContent === 'image' && block.imageUrl && (
                      <div>
                        <h4 className="font-medium mb-2">Image</h4>
                        <div className="bg-gray-100 rounded-lg p-4">
                          <img
                            src={block.imageUrl}
                            alt="Additional content"
                            className="w-full h-48 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden text-center text-gray-500 py-8">
                            <Image className="mx-auto h-12 w-12 mb-2 text-gray-400" />
                            <p>Image preview not available</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Responsible People */}
          <Card>
            <CardHeader>
              <CardTitle>Responsible Team</CardTitle>
              <CardDescription>
                Assigned specialists for this KPI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Data Specialist</p>
                  <p className="text-sm text-gray-600">{kpi.dataSpecialist}</p>
                  <p className="text-xs text-gray-500">Technical maintenance</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Business Specialist</p>
                  <p className="text-sm text-gray-600">{kpi.businessSpecialist}</p>
                  <p className="text-xs text-gray-500">Business validation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>
                KPI information and statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-600">Topics</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {kpi.topics && kpi.topics.length > 0 ? (
                    getTopicNames(kpi.topics).map((topicName, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topicName}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-400">
                      No topics assigned
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant={kpi.status === 'active' ? 'default' : 'secondary'}>
                  {kpi.status}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Versions</span>
                <span className="text-sm font-medium">{kpi.versions.length}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium">{formatDate(kpi.lastUpdated)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KPIArticlePage;
