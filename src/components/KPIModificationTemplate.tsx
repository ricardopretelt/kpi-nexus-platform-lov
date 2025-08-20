import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Code, Image, ArrowLeft } from 'lucide-react';
import { KPI, KPIBlock, KPIVersion } from '../types/kpi';
import { api, Topic } from '../services/api';
import { toast } from 'sonner';

interface KPIModificationTemplateProps {
  kpi: KPI;
  onCancel: () => void;
  onSuccess: (kpi: KPI) => void;
}

const KPIModificationTemplate = ({ kpi, onCancel, onSuccess }: KPIModificationTemplateProps) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: kpi.name,
    definition: kpi.definition,
    sqlQuery: kpi.sqlQuery,
    topics: kpi.topics || [],
    dataSpecialist: kpi.dataSpecialist,
    businessSpecialist: kpi.businessSpecialist,
    changeDescription: ''
  });
  
  const [additionalBlocks, setAdditionalBlocks] = useState<KPIBlock[]>(kpi.additionalBlocks || []);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [topicsData, usersData] = await Promise.all([
          api.getTopics(),
          api.getUsers()
        ]);
        setTopics(topicsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load topics and users');
      } finally {
        setLoadingData(false);
      }
    };
    
    loadData();
  }, []);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTopicToggle = (topicId: number) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topicId)
        ? prev.topics.filter(t => t !== topicId)
        : [...prev.topics, topicId]
    }));
  };

  const addAdditionalBlock = () => {
    const newBlock: KPIBlock = {
      id: `block-${Date.now()}`,
      title: '',
      subtitle: '',
      text: '',
      endContent: 'none'
    };
    setAdditionalBlocks(prev => [...prev, newBlock]);
  };

  const removeAdditionalBlock = (blockId: string) => {
    setAdditionalBlocks(prev => prev.filter(block => block.id !== blockId));
  };

  const updateAdditionalBlock = (blockId: string, field: keyof KPIBlock, value: string) => {
    setAdditionalBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, [field]: value } : block
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.definition.trim() || !formData.sqlQuery.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.topics.length === 0) {
      toast.error('Please select at least one topic');
      return;
    }

    if (!formData.dataSpecialist || !formData.businessSpecialist) {
      toast.error('Please assign both data and business specialists');
      return;
    }

    if (!formData.changeDescription.trim()) {
      toast.error('Please provide a change description');
      return;
    }

    setLoading(true);

    try {
      await api.updateKPI(kpi.id, {
        // Remove name from the update payload since it's now immutable
        definition: formData.definition,
        sqlQuery: formData.sqlQuery,
        topics: formData.topics,
        dataSpecialist: formData.dataSpecialist,
        businessSpecialist: formData.businessSpecialist,
        additionalBlocks: additionalBlocks,
        changeDescription: formData.changeDescription
      });

      // Create client-side version immediately so UI reflects new count without refresh
      const latestVersionNumber =
        Array.isArray(kpi.versions) && kpi.versions.length > 0
          ? Math.max(...kpi.versions.map(v => v.version ?? 0))
          : 0;
      const dsUser = users.find(u => u.full_name === formData.dataSpecialist);
      const bsUser = users.find(u => u.full_name === formData.businessSpecialist);
      const newVersion: KPIVersion = {
        id: `temp-${Date.now()}`,
        version: latestVersionNumber + 1,
        definition: formData.definition,
        sqlQuery: formData.sqlQuery,
        updatedAt: new Date().toISOString(),
        changes: formData.changeDescription,
        dataSpecialist: formData.dataSpecialist,
        businessSpecialist: formData.businessSpecialist,
        topics: formData.topics,
        additionalBlocks: additionalBlocks,
        dataSpecialistId: dsUser?.id,
        businessSpecialistId: bsUser?.id
      };

      const updatedKPI: KPI = {
        ...kpi,
        definition: formData.definition,
        sqlQuery: formData.sqlQuery,
        topics: formData.topics,
        dataSpecialist: formData.dataSpecialist,
        businessSpecialist: formData.businessSpecialist,
        additionalBlocks: additionalBlocks,
        lastUpdated: new Date().toISOString(),
        versions: [...(kpi.versions || []), newVersion]
      };

      onSuccess(updatedKPI);
    } catch (error: any) {
      console.error('Error modifying KPI:', error);
      const msg = error?.message || 'Failed to modify KPI. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to KPI
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modify KPI: {kpi.name}</h1>
          <p className="text-gray-600">
            Update the KPI definition, SQL query, and other properties. A new version will be created.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core KPI details and identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">KPI Name</Label>
              <Input
                id="name"
                value={formData.name}
                disabled
                className="mt-1 bg-gray-50 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-1">
                KPI names cannot be changed once created
              </p>
            </div>
            
            <div>
              <Label htmlFor="definition">Definition *</Label>
              <Textarea
                id="definition"
                value={formData.definition}
                onChange={(e) => handleInputChange('definition', e.target.value)}
                required
                rows={4}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="mr-2 h-4 w-4" />
              SQL Query
            </CardTitle>
            <CardDescription>The SQL query that generates this KPI</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="sqlQuery">SQL Query *</Label>
              <Textarea
                id="sqlQuery"
                value={formData.sqlQuery}
                onChange={(e) => handleInputChange('sqlQuery', e.target.value)}
                required
                rows={8}
                className="font-mono text-sm mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topics</CardTitle>
            <CardDescription>Select relevant topics for this KPI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {topics.map((topic) => (
                <div key={topic.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`topic-${topic.id}`}
                    checked={formData.topics.includes(topic.id)}
                    onChange={() => handleTopicToggle(topic.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor={`topic-${topic.id}`} className="text-sm cursor-pointer">
                    {topic.name}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsible Team</CardTitle>
            <CardDescription>Assign specialists responsible for this KPI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dataSpecialist">Data Specialist *</Label>
              <Select
                value={formData.dataSpecialist}
                onValueChange={(value) => handleInputChange('dataSpecialist', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select data specialist..." />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(user => user.role === 'data_specialist')
                    .map(user => (
                      <SelectItem key={user.id} value={user.full_name}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="businessSpecialist">Business Specialist *</Label>
              <Select
                value={formData.businessSpecialist}
                onValueChange={(value) => handleInputChange('businessSpecialist', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select business specialist..." />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(user => user.role === 'business_specialist')
                    .map(user => (
                      <SelectItem key={user.id} value={user.full_name}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Description</CardTitle>
            <CardDescription>Describe what changes you made and why (required for version tracking)</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="changeDescription">Change Description *</Label>
              <Textarea
                id="changeDescription"
                value={formData.changeDescription}
                onChange={(e) => handleInputChange('changeDescription', e.target.value)}
                placeholder="Describe what changes you made and why..."
                required
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Add Additional Block Button - inside the form */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              onClick={addAdditionalBlock}
              className="w-full"
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Additional Block
            </Button>
          </CardContent>
        </Card>

        {/* Additional Content Blocks - inside the form */}
        {additionalBlocks.map((block, index) => (
          <Card key={block.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium mr-2">Optional</span>
                  Additional Block {index + 1}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeAdditionalBlock(block.id)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Custom content block for additional information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title (optional)</Label>
                <Input
                  value={block.title || ''}
                  onChange={(e) => updateAdditionalBlock(block.id, 'title', e.target.value)}
                  placeholder="Block title..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Subtitle (optional)</Label>
                <Input
                  value={block.subtitle || ''}
                  onChange={(e) => updateAdditionalBlock(block.id, 'subtitle', e.target.value)}
                  placeholder="Block subtitle..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Text (optional)</Label>
                <Textarea
                  value={block.text || ''}
                  onChange={(e) => updateAdditionalBlock(block.id, 'text', e.target.value)}
                  placeholder="Block content..."
                  className="mt-1 min-h-24"
                />
              </div>
              
              <div>
                <Label>End Content</Label>
                <Select
                  value={block.endContent}
                  onValueChange={(value: 'code' | 'image' | 'none') => 
                    updateAdditionalBlock(block.id, 'endContent', value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
                
                {block.endContent === 'code' && (
                  <div className="mt-2">
                    <Label>Code Content</Label>
                    <Textarea
                      value={block.codeContent || ''}
                      onChange={(e) => updateAdditionalBlock(block.id, 'codeContent', e.target.value)}
                      placeholder="Enter code..."
                      className="min-h-24 font-mono text-sm"
                    />
                  </div>
                )}
                
                {block.endContent === 'image' && (
                  <div className="mt-2">
                    <Label>Image URL</Label>
                    <Input
                      value={block.imageUrl || ''}
                      onChange={(e) => updateAdditionalBlock(block.id, 'imageUrl', e.target.value)}
                      placeholder="Enter image URL..."
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Modifying...' : 'Modify KPI'}
            </Button>
            
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
              disabled={loading}
              type="button"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default KPIModificationTemplate;
