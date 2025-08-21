import React from 'react';
// ... other imports

interface KPIDisplayProps {
  kpi: {
    additionalBlocks?: {
      images?: string[];
      text?: string;
    };
    // ... other KPI properties
  };
}

export const KPIDisplay: React.FC<KPIDisplayProps> = ({ kpi }) => {
  // ✅ Add the function here, at the top of your component
  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('/uploads/')) {
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      if (hostname === 'localhost') {
        // Development: localhost:3001
        return `http://localhost:3001${imagePath}`;
      } else if (hostname === '18.217.206.5') {
        // Production: same IP, port 3001
        return `http://18.217.206.5:3001${imagePath}`;
      } else {
        // Fallback: same server
        return imagePath;
      }
    }
    return imagePath;
  };

  // ... rest of your component code

  return (
    <div>
      {/* ... existing KPI display code ... */}
      
      {/* ✅ Use kpi.additionalBlocks instead of just additionalBlocks */}
      {kpi.additionalBlocks?.images?.map((imagePath: string, index: number) => (
        <img
          key={index}
          src={getImageUrl(imagePath)}
          alt={`Additional image ${index + 1}`}
          className="w-full h-32 object-cover rounded-lg"
        />
      ))}
    </div>
  );
};
