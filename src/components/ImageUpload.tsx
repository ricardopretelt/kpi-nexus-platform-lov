import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, onRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ? value : null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only jpg, jpeg, png, gif, and webp files are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      const result = await api.uploadKpiImage(file);
      
      // Create preview URL for local files
      if (result.filePath.startsWith('/uploads/')) {
        const hostname = window.location.hostname;
        let baseUrl = 'http://localhost:3001';
        if (hostname === '18.218.115.23') {
          baseUrl = 'http://18.218.115.23:3001';
        }
        setPreview(`${baseUrl}${result.filePath}`);
      } else {
        setPreview(result.filePath);
      }
      
      onChange(result.filePath);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <Label>Upload Image</Label>
      
      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Choose Image
              </>
            )}
          </Button>
          
          <p className="text-sm text-gray-500 mt-2">
            JPG, PNG, GIF, WebP up to 5MB
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-w-[200px] h-auto rounded-lg border border-gray-200"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Image uploaded successfully</p>
            <p className="text-xs text-gray-500">
              {value?.startsWith('/uploads/') ? 'Local file' : 'External URL'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


