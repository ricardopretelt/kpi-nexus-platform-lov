import React, { useState, useEffect } from 'react';
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
import { AdditionalBlocks } from './AdditionalBlocks';

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
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedEndContent, setSelectedEndContent] = useState<'none' | 'text' | 'image'>('none');
  const [endContentData, setEndContentData] = useState<any>({ text: '', images: [] });

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
        // ✅ Use endContentData instead of additionalBlocks
        additionalBlocks: selectedEndContent !== 'none' ? endContentData : undefined,
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
            status: 'pending',
            // ✅ Use endContentData instead of additionalBlocks
            additionalBlocks: selectedEndContent !== 'none' ? endContentData : undefined
          }
        ],
        status: 'pending',
        // ✅ Use endContentData instead of additionalBlocks
        additionalBlocks: selectedEndContent !== 'none' ? endContentData : undefined
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

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* End Content Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Content
            </label>
            <select
              value={selectedEndContent}
              onChange={(e) => setSelectedEndContent(e.target.value as 'none' | 'text' | 'image')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="none">None</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
            </select>
          </div>

          {/* Conditional Additional Blocks - BEFORE the submit button */}
          {selectedEndContent === 'image' && (
            <div className="mt-4">
              <AdditionalBlocks
                value={endContentData}
                onChange={setEndContentData}
                type="image"
              />
            </div>
          )}

          {selectedEndContent === 'text' && (
            <div className="mt-4">
              <AdditionalBlocks
                value={endContentData}
                onChange={setEndContentData}
                type="text"
              />
            </div>
          )}

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
