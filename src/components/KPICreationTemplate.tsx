import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Code, Image, X, ArrowLeft } from 'lucide-react';
import { KPI, KPIBlock } from '../types/kpi';
import { api, Topic } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface KPICreationTemplateProps {
  onCancel: () => void;
  onSuccess: (kpi: KPI) => void;
}

const KPICreationTemplate = ({ onCancel, onSuccess }: KPICreationTemplateProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    definition: '',
    sqlQuery: '',
    topics: [] as string[],
    status: 'active' as 'active' | 'inactive',
    dataSpecialist: '',
    businessSpecialist: ''
  });
  
  const [additionalBlocks, setAdditionalBlocks] = useState<KPIBlock[]>([
    // Default dashboard preview block (no default text)
    {
      id: 'default-dashboard-preview',
      title: '',
      subtitle: '',
      text: '',
      endContent: 'image' as const,
      imageUrl: ''
    }
  ]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Load topics and users on component mount
  useState(() => {
    const loadData = async () => {
      try {
        const [topicsData, usersData] = await Promise.all([
          api.getTopics(),
          api.getUsers()
        ]);
        setTopics(topicsData);
        setUsers(usersData);
        
        // Pre-fill current user as default responsible user
        if (user) {
          if (user.role === 'data_specialist') {
            setFormData(prev => ({ ...prev, dataSpecialist: user.full_name }));
          } else if (user.role === 'business_specialist') {
            setFormData(prev => ({ ...prev, businessSpecialist: user.full_name }));
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load topics and users');
      } finally {
        setLoadingData(false);
      }
    };
    
    loadData();
  });

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTopicToggle = (topicName: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topicName)
        ? prev.topics.filter(t => t !== topicName)
        : [...prev.topics, topicName]
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

  const getOppositeRoleUsers = () => {
    if (!user) return [];
    
    if (user.role === 'data_specialist') {
      return users.filter(u => u.role === 'business_specialist');
    } else if (user.role === 'business_specialist') {
      return users.filter(u => u.role === 'data_specialist');
    }
    
    return users.filter(u => u.role !== user.role);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('KPI name is required');
      return;
    }
    if (!formData.definition.trim()) {
      toast.error('KPI definition is required');
      return;
    }
    if (!formData.sqlQuery.trim()) {
      toast.error('SQL query is required');
      return;
    }
    if (formData.topics.length === 0) {
      toast.error('At least one topic is required');
      return;
    }
    // Require at least one specialist
    if (!formData.dataSpecialist && !formData.businessSpecialist) {
      toast.error('At least one specialist (data or business) is required');
      return;
    }

    setLoading(true);
    try {
      const kpiData: Omit<KPI, 'id' | 'lastUpdated' | 'versions'> = {
        name: formData.name,
        definition: formData.definition,
        sqlQuery: formData.sqlQuery,
        topics: formData.topics,
        status: formData.status,
        dataSpecialist: formData.dataSpecialist || undefined,
        businessSpecialist: formData.businessSpecialist || undefined,
        additionalBlocks: additionalBlocks.length > 0 ? additionalBlocks : undefined
      };

      console.log('Submitting KPI data:', kpiData); // Debug log

      const result = await api.createKPI(kpiData);
      console.log('API response:', result); // Debug log
      
      // Fetch the complete KPI data using the returned ID
      const fullKPI = await api.getKPI(result.id);
      
      toast.success('KPI created successfully!');
      
      // Pass the complete KPI object to onSuccess
      onSuccess(fullKPI);
    } catch (error) {
      console.error('Failed to create KPI:', error);
      
      // Better error handling
      let errorMessage = 'Failed to create KPI';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onCancel} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New KPI</h1>
            <p className="text-gray-600">Define a new KPI with all required information</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Block 1: KPI Definition (Required) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-2">Required</span>
                KPI Definition
              </CardTitle>
              <CardDescription>
                Basic information about the KPI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">KPI Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter KPI name..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="definition">KPI Definition *</Label>
                <Textarea
                  id="definition"
                  value={formData.definition}
                  onChange={(e) => handleInputChange('definition', e.target.value)}
                  placeholder="Describe what this KPI measures and its business context..."
                  className="mt-1 min-h-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Block 2: SQL Query (Required) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-2">Required</span>
                SQL Query
              </CardTitle>
              <CardDescription>
                Data extraction query for this KPI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.sqlQuery}
                onChange={(e) => handleInputChange('sqlQuery', e.target.value)}
                placeholder="Enter SQL query..."
                className="min-h-40 font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Additional Blocks */}
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

          {/* Add Additional Block Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                variant="outline"
                onClick={addAdditionalBlock}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Additional Block
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* KPI Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>KPI Metadata</CardTitle>
              <CardDescription>
                Configuration and assignment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Topics *</Label>
                <div className="mt-2 space-y-2">
                  {topics.map((topic) => (
                    <div key={topic.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`topic-${topic.id}`}
                        checked={formData.topics.includes(topic.name)}
                        onChange={() => handleTopicToggle(topic.name)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`topic-${topic.id}`} className="text-sm">
                        {topic.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') => 
                    handleInputChange('status', value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Responsibility Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Responsibility Assignment</CardTitle>
              <CardDescription>
                Assign specialists for this KPI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Data Specialist *</Label>
                <Select
                  value={formData.dataSpecialist}
                  onValueChange={(value) => handleInputChange('dataSpecialist', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select data specialist" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.role === 'data_specialist').map((user) => (
                      <SelectItem key={user.id} value={user.full_name}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Business Specialist *</Label>
                <Select
                  value={formData.businessSpecialist}
                  onValueChange={(value) => handleInputChange('businessSpecialist', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select business specialist" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.role === 'business_specialist').map((user) => (
                      <SelectItem key={user.id} value={user.full_name}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating...' : 'Create KPI'}
              </Button>
              
              <Button
                variant="outline"
                onClick={onCancel}
                className="w-full"
                disabled={loading}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KPICreationTemplate;
