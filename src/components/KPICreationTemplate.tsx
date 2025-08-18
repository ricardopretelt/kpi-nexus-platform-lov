import { useState, useEffect } from 'react';
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
    topics: [] as number[], // Changed from string[] to number[]
    dataSpecialist: '',
    businessSpecialist: '',
    changeDescription: '' // New field for change description
  });
  
  const [additionalBlocks, setAdditionalBlocks] = useState<KPIBlock[]>([]); // Start with empty array instead of default block
  const [topics, setTopics] = useState<Topic[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Load topics and users on component mount
  useEffect(() => {
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
  }, [user]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTopicToggle = (topicId: number) => { // Changed from topicName: string
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

  const getOppositeRoleUsers = () => {
    if (!user) return [];
    
    if (user.role === 'data_specialist') {
      return users.filter(u => u.role === 'business_specialist');
    } else if (user.role === 'business_specialist') {
      return users.filter(u => u.role === 'data_specialist');
    }
    
    return users.filter(u => u.role !== user.role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.definition || !formData.sqlQuery || formData.topics.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!formData.dataSpecialist && !formData.businessSpecialist) {
      toast.error('Please select at least one specialist');
      return;
    }
    
    setLoading(true);
    
    try {
      const kpiData = {
        name: formData.name,
        definition: formData.definition,
        sqlQuery: formData.sqlQuery,
        topics: formData.topics,
        dataSpecialist: formData.dataSpecialist,
        businessSpecialist: formData.businessSpecialist,
        additionalBlocks: additionalBlocks,
        changeDescription: formData.changeDescription || 'Initial version created'
      };
      
      const result = await api.createKPI(kpiData);
      
      toast.success('KPI created successfully!');

      // Resolve selected specialists to IDs for immediate display/permissions
      const dsUser = users.find(u => u.full_name === formData.dataSpecialist);
      const bsUser = users.find(u => u.full_name === formData.businessSpecialist);

      // Create a KPI object with an initial version that includes specialist names and IDs
      const newKPI: KPI = {
        id: result.id,
        name: formData.name,
        definition: formData.definition,
        sqlQuery: formData.sqlQuery,
        topics: formData.topics,
        dataSpecialist: formData.dataSpecialist,
        businessSpecialist: formData.businessSpecialist,
        lastUpdated: new Date().toISOString(),
        versions: [
          {
            id: `v1`,
            version: 1,
            definition: formData.definition,
            sqlQuery: formData.sqlQuery,
            updatedAt: new Date().toISOString(),
            changes: formData.changeDescription || 'Initial version created',
            dataSpecialist: formData.dataSpecialist,
            businessSpecialist: formData.businessSpecialist,
            dataSpecialistId: dsUser?.id,
            businessSpecialistId: bsUser?.id,
            topics: formData.topics,
            status: 'pending', // Will be set by backend based on approval requirements
            additionalBlocks: additionalBlocks.length > 0 ? additionalBlocks : undefined
          }
        ],
        status: 'pending', // Will be set by backend based on approval requirements
        additionalBlocks: additionalBlocks.length > 0 ? additionalBlocks : undefined // Only include if there are actual blocks
      };
      
      onSuccess(newKPI);
    } catch (error) {
      console.error('Error creating KPI:', error);
      toast.error('Failed to create KPI');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onCancel}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New KPI</h1>
          <p className="mt-2 text-gray-600">Define a new Key Performance Indicator for your organization</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                  placeholder="e.g., Customer Churn Rate"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="definition">Definition *</Label>
                <Textarea
                  id="definition"
                  value={formData.definition}
                  onChange={(e) => handleInputChange('definition', e.target.value)}
                  placeholder="Describe what this KPI measures and why it's important..."
                  rows={4}
                  required
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
                required
              />
            </CardContent>
          </Card>

          {/* Block 3: Topics (Required) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-2">Required</span>
                Topics
              </CardTitle>
              <CardDescription>
                Select relevant topics for this KPI
              </CardDescription>
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
                    <Label htmlFor={`topic-${topic.id}`} className="text-sm">
                      {topic.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Block 4: Responsibility Assignment (Required) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-2">Required</span>
                Responsibility Assignment
              </CardTitle>
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

          {/* Block 5: Additional Configuration (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium mr-2">Optional</span>
                Additional Configuration
              </CardTitle>
              <CardDescription>
                Additional settings and content blocks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Change Description</Label>
                <Textarea
                  value={formData.changeDescription}
                  onChange={(e) => handleInputChange('changeDescription', e.target.value)}
                  placeholder="Describe the purpose of this KPI creation..."
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional: Describe why this KPI is being created
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Block 6: Add Additional Block Button - INSIDE THE FORM */}
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

          {/* Block 7: Additional Content Blocks - INSIDE THE FORM */}
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

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                type="submit"
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
        </form>
      </div>
    </div>
  );
};

export default KPICreationTemplate;
