import React, { useState } from 'react';
import { api } from '../services/api';

interface AdditionalBlocksProps {
  value: any;
  onChange: (value: any) => void;
  type?: 'text' | 'image'; // ✅ Add type prop
}

export const AdditionalBlocks: React.FC<AdditionalBlocksProps> = ({ value, onChange, type = 'text' }) => {
  const [uploading, setUploading] = useState(false);

  // ✅ Get API base URL dynamically
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001';
      }
      if (hostname === '18.217.206.5') {
        return 'http://18.217.206.5:3001';
      }
    }
    return 'http://localhost:3001';
  };

  // Add this at the top of the component to debug
  console.log('🔍 Available localStorage keys:', Object.keys(localStorage));
  console.log('🔍 authToken:', localStorage.getItem('authToken'));
  console.log('🔍 token:', localStorage.getItem('token'));

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('🖼️ File selected:', file.name, file.size); // ✅ Debug log
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const apiUrl = `${getApiBaseUrl()}/api/upload/image`;
      console.log(' Uploading to:', apiUrl); // ✅ Debug log
      
      // ✅ Fix: Use 'authToken' instead of 'token' to match the API service
      const token = localStorage.getItem('authToken');
      console.log('🔑 Token found:', !!token, 'Length:', token?.length);
      
      // token header
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      console.log(' Response status:', response.status); // ✅ Debug log
      const result = await response.json();
      console.log('📄 Response data:', result); // ✅ Debug log

      if (result.success) {
        const currentBlocks = value || {};
        const currentImages = currentBlocks.images || [];
        
        const newValue = {
          ...currentBlocks,
          images: [...currentImages, result.imageUrl]
        };
        
        console.log('🔄 Calling onChange with:', newValue); // ✅ Debug log
        onChange(newValue);
      } else {
        console.error('❌ Upload failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const currentBlocks = value || {};
    const currentImages = currentBlocks.images || [];
    const newImages = currentImages.filter((_: any, i: number) => i !== index);
    
    onChange({
      ...currentBlocks,
      images: newImages
    });
  };

  // ✅ Only show content based on type
  if (type === 'image') {
    return (
      <div className="space-y-4">
        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Images
          </label>
          
          {/* File Upload Input */}
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload an image</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              {uploading && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-sm text-gray-500">Uploading...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Display Uploaded Images */}
        {value?.images && value.images.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Images ({value.images.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {value.images.map((imageUrl: string, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Uploaded image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ✅ Default: text only
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Text
        </label>
        <textarea
          value={value?.text || ''}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="Enter any additional information about this KPI..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          rows={4}
        />
      </div>
    </div>
  );
};
