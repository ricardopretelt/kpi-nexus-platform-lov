
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { KPI, KPIVersion } from '../types/kpi';
import { Edit, Save, History, User, Clock, Database, Image, X } from 'lucide-react';

interface KPIArticlePageProps {
  kpi: KPI;
  onUpdate: (updatedKPI: KPI) => void;
}

const KPIArticlePage = ({ kpi, onUpdate }: KPIArticlePageProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editDefinition, setEditDefinition] = useState(kpi.definition);
  const [editSqlQuery, setEditSqlQuery] = useState(kpi.sqlQuery);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const canEdit = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'data_specialist' && user.name === kpi.dataSpecialist) return true;
    if (user.role === 'business_specialist' && user.name === kpi.businessSpecialist) return true;
    return false;
  };

  const handleSave = () => {
    const newVersion: KPIVersion = {
      id: `v${kpi.versions.length + 1}`,
      version: kpi.versions.length + 1,
      definition: editDefinition,
      sqlQuery: editSqlQuery,
      updatedBy: user?.name || 'Unknown',
      updatedAt: new Date().toISOString().split('T')[0],
      changes: 'Updated definition and SQL query'
    };

    const updatedKPI: KPI = {
      ...kpi,
      definition: editDefinition,
      sqlQuery: editSqlQuery,
      lastUpdated: new Date().toISOString().split('T')[0],
      versions: [...kpi.versions, newVersion]
    };

    onUpdate(updatedKPI);
    setIsEditing(false);
    console.log('KPI updated:', updatedKPI);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            <span className="text-sm text-gray-600">{kpi.topic}</span>
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
                {kpi.versions.map((version) => (
                  <Card key={version.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Version {version.version}</CardTitle>
                        <div className="text-sm text-gray-600">
                          {formatDate(version.updatedAt)} by {version.updatedBy}
                        </div>
                      </div>
                      <CardDescription>{version.changes}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Definition</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {version.definition}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">SQL Query</h4>
                          <pre className="text-sm text-gray-700 bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto">
                            {version.sqlQuery}
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          {canEdit() && (
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              variant={isEditing ? "default" : "outline"}
              size="sm"
            >
              {isEditing ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
          )}
          
          {isEditing && (
            <Button
              onClick={() => {
                setIsEditing(false);
                setEditDefinition(kpi.definition);
                setEditSqlQuery(kpi.sqlQuery);
              }}
              variant="outline"
              size="sm"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
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
              {isEditing ? (
                <Textarea
                  value={editDefinition}
                  onChange={(e) => setEditDefinition(e.target.value)}
                  className="min-h-32"
                  placeholder="Enter KPI definition..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{kpi.definition}</p>
              )}
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
              {isEditing ? (
                <Textarea
                  value={editSqlQuery}
                  onChange={(e) => setEditSqlQuery(e.target.value)}
                  className="min-h-40 font-mono text-sm"
                  placeholder="Enter SQL query..."
                />
              ) : (
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {kpi.sqlQuery}
                </pre>
              )}
            </CardContent>
          </Card>

          {/* Dashboard Preview */}
          {kpi.dashboardPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="mr-2 h-5 w-5" />
                  Dashboard Preview
                </CardTitle>
                <CardDescription>
                  Visual representation from BI dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-4">
                  <img
                    src={kpi.dashboardPreview}
                    alt="Dashboard Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
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
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Topic</span>
                <Badge variant="outline">{kpi.topic}</Badge>
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
