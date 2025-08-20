import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, Topic } from '../services/api';
import { toast } from 'sonner';

interface TopicCreationTemplateProps {
  onCancel: () => void;
  onSuccess: (topic: Topic) => void;
}

// Professional icons for telecom/BI settings
const PROFESSIONAL_ICONS = [
  { value: '📊', label: 'Analytics Chart' },
  { value: '📈', label: 'Trending Up' },
  { value: '📉', label: 'Trending Down' },
  { value: '📡', label: 'Network Signal' },
  { value: '🌐', label: 'Global Network' },
  { value: '💻', label: 'Computer' },
  { value: '📱', label: 'Mobile Device' },
  { value: '🔌', label: 'Connection' },
  { value: '⚡', label: 'Performance' },
  { value: '🎯', label: 'Target' },
  { value: '💰', label: 'Revenue' },
  { value: '🔍', label: 'Search' },
  { value: '📋', label: 'Report' },
  { value: '🌍', label: 'Global' },
  { value: '🏢', label: 'Business' },
  { value: '👥', label: 'Team' },
  { value: '🎨', label: 'Custom' }
];

const TopicCreationTemplate = ({ onCancel, onSuccess }: TopicCreationTemplateProps) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📊'
  });
  
  const [showCustomIcon, setShowCustomIcon] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Show custom icon input if user selects "Custom"
    if (field === 'icon' && value === '🎨') {
      setShowCustomIcon(true);
    } else if (field === 'icon') {
      setShowCustomIcon(false);
    }
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
        icon: formData.icon || '📊'
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
              <CardDescription>Choose an icon to represent this topic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="icon" className="text-sm font-medium">
                  Icon Selection
                </Label>
                <Select value={formData.icon} onValueChange={(value) => handleInputChange('icon', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFESSIONAL_ICONS.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{icon.value}</span>
                          <span className="text-sm text-gray-600">{icon.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Custom Icon Input */}
                {showCustomIcon && (
                  <div className="mt-3">
                    <Label htmlFor="customIcon" className="text-sm font-medium text-gray-700">
                      Custom Icon (Emoji or Symbol)
                    </Label>
                    <Input
                      id="customIcon"
                      type="text"
                      value={formData.icon === '🎨' ? '' : formData.icon}
                      onChange={(e) => handleInputChange('icon', e.target.value)}
                      placeholder="Paste your custom icon here..."
                      className="mt-1"
                      maxLength={10}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Copy and paste any emoji or symbol from your keyboard or emoji picker
                    </p>
                  </div>
                )}
                
                <p className="mt-2 text-xs text-gray-500">
                  {showCustomIcon 
                    ? 'Enter your custom icon above'
                    : 'Choose from professional icons or select "Custom" to add your own'
                  }
                </p>
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
