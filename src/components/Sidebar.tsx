import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Home, FolderOpen, FileText, Users, LogOut, Signal } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'topics' | 'kpi' | 'users') => void;
  userRole: string;
}

const Sidebar = ({ currentPage, onNavigate, userRole }: SidebarProps) => {
  const { user, logout, hasAdminAccess } = useAuth();

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, available: true },
    { id: 'topics', label: 'Topics', icon: FolderOpen, available: true },
    { id: 'users', label: 'User Management', icon: Users, available: hasAdminAccess(user) },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'data_specialist': return 'bg-blue-100 text-blue-800';
      case 'business_specialist': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'data_specialist': return 'Data Specialist';
      case 'business_specialist': return 'Business Specialist';
      default: return 'User';
    }
  };

  const getUserDisplayRole = (user: any) => {
    if (user?.email === 'john.doe@company.com') {
      return 'Data Specialist (Admin)';
    }
    return getRoleLabel(user?.role || '');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Signal className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">TelecomBI</h1>
            <p className="text-sm text-gray-600">Documentation</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-2">
          <p className="font-medium text-gray-900">{user?.fullName}</p>
          <p className="text-sm text-gray-600">{user?.email}</p>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user?.role || '')}`}>
            {getUserDisplayRole(user)}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          if (!item.available) return null;
          
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => onNavigate(item.id as any)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:bg-gray-100"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;