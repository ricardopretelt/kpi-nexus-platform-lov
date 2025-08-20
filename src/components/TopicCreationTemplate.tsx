import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api, Topic } from '../services/api';
import { toast } from 'sonner';

interface TopicCreationTemplateProps {
  onCancel: () => void;
  onSuccess: (topic: Topic) => void;
}

const TopicCreationTemplate = ({ onCancel, onSuccess }: TopicCreationTemplateProps) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📊',
    color: '#3B82F6'
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Topic name is required');
      return;
    }

    setLoading(true);
    
    try {
      const newTopic = await api.createTopic({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        icon: formData.icon || '📊',
        color: formData.color || '#3B82F6'
      });
      
      toast.success('Topic created successfully!');
      onSuccess(newTopic);
    } catch (error) {
      console.error('Failed to create topic:', error);
      toast.error('Failed to create topic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Topic</h1>
          <p className="mt-2 text-gray-600">
            Add a new business domain or category to organize your KPIs
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core topic details and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Topic Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Sales Performance, Customer Analytics"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what this topic covers and its purpose..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Visual Customization */}
          <Card>
            <CardHeader>
              <CardTitle>Visual Customization</CardTitle>
              <CardDescription>Customize how this topic appears in the interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon" className="text-sm font-medium">
                    Icon (Emoji)
                  </Label>
                  <Input
                    id="icon"
                    type="text"
                    value={formData.icon}
                    onChange={(e) => handleInputChange('icon', e.target.value)}
                    placeholder="📊"
                    className="mt-1"
                    maxLength={10}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use emojis or text symbols to represent this topic
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="color" className="text-sm font-medium">
                    Color
                  </Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className="w-16 h-10 p-1 border border-gray-300 rounded"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose a color that represents this topic
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Creating...' : 'Create Topic'}
              </Button>
              
              <Button
                type="button"
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

export default TopicCreationTemplate;
