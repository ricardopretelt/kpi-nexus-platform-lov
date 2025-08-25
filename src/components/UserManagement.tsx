
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Mail, Shield, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useToast } from '../hooks/use-toast';
import { ActionSelectionModal } from './ActionSelectionModal';
import { UserEditModal } from './UserEditModal';

// Smart API URL detection
const getApiBaseUrl = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Auto-detect environment
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // If running on localhost (development)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // If running on server (production)
  if (hostname === '18.218.115.23' || hostname.includes('ip-')) {
    return `http://${hostname}:3001`;
  }
  
  // Fallback to current hostname
  return `http://${hostname}:3001`;
};

const API_BASE_URL = getApiBaseUrl();

const UserManagement = () => {
  const { users, inviteUser, refreshUsers, user: currentUser, logoutAndRedirect, onUserUpdate } = useAuth();
  const [updatingAdmin, setUpdatingAdmin] = useState<string | null>(null);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<{
    userId: string;
    currentStatus: boolean;
    userName: string;
  } | null>(null);

  // Add debugging
  console.log('UserManagement - users:', users);
  console.log('UserManagement - users length:', users.length);
  console.log('UserManagement - first user:', users[0]);
  
  // Add specific debugging for admin calculation
  console.log('UserManagement - users with is_admin:', users.filter(u => u.is_admin === true));
  console.log('UserManagement - users with role admin:', users.filter(u => u.role === 'admin'));
  console.log('UserManagement - all users is_admin values:', users.map(u => ({ email: u.email, is_admin: u.is_admin, role: u.role })));

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'business_specialist' as 'admin' | 'data_specialist' | 'business_specialist'
  });

  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Add this function
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInviteForm(prev => ({ ...prev, email: e.target.value }));
    // Clear email error when user types
    if (emailError) {
      setEmailError(null);
    }
  };

  // Add effect to listen to user updates
  useEffect(() => {
    const cleanup = onUserUpdate(() => {
      console.log('User update detected, refreshing users...');
      refreshUsers().then(() => {
        console.log('Users refreshed via onUserUpdate');
      }).catch(err => {
        console.error('Failed to refresh via onUserUpdate:', err);
      });
    });
    
    return cleanup;
  }, [onUserUpdate]); // Remove refreshUsers from dependencies

  // Add effect to refresh users when component mounts
  useEffect(() => {
    console.log('UserManagement - Component mounted, refreshing users...');
    refreshUsers().then(() => {
      console.log('UserManagement - Users refreshed');
    }).catch(err => {
      console.error('UserManagement - Failed to refresh users:', err);
    });
  }, []);

  // Add debugging for users state changes
  useEffect(() => {
    console.log('=== Users state changed ===');
    console.log('Users:', users);
    console.log('Users with is_active values:', users.map(u => ({ 
      email: u.email, 
      is_active: u.is_active,
      id: u.id 
    })));
  }, [users]);

  // Add email uniqueness check function
  const checkEmailUniqueness = async (email: string): Promise<boolean> => {
    if (!email) return true;
    
    setIsCheckingEmail(true);
    setEmailError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.available) {
          return true;
        } else {
          setEmailError('Email already taken');
          return false;
        }
      } else {
        // If endpoint doesn't exist, we'll handle it in the backend validation
        return true;
      }
    } catch (error) {
      // If check fails, we'll rely on backend validation
      return true;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleInvite = async () => {
    if (inviteForm.email && inviteForm.name && inviteForm.role) {
      // Clear previous email error
      setEmailError(null);
      
      // Check email uniqueness before submitting
      const isEmailUnique = await checkEmailUniqueness(inviteForm.email);
      if (!isEmailUnique) {
        return; // Form submission prevented
      }
      
      const result = await inviteUser(inviteForm.email, inviteForm.name, inviteForm.role);
      if (result.success) {
        setGeneratedPassword(result.password);
        // Clear form and errors
        setInviteForm({ email: '', name: '', role: 'business_specialist' });
        setEmailError(null);
      } else {
        // Handle backend validation errors
        if (result.error === 'Email already taken') {
          setEmailError('Email already taken');
        } else {
          console.error('Failed to invite user:', result.error);
        }
      }
    }
  };

  // New confirmation dialog handler for admin toggle
  const handleAdminToggleClick = (userId: string, currentAdminStatus: boolean, userName: string) => {
    console.log('Admin toggle clicked:', { userId, currentAdminStatus, userName });
    setPendingToggle({
      userId,
      currentStatus: currentAdminStatus,
      userName
    });
    setShowConfirmDialog(true);
  };

  // Handle confirmation dialog actions
  const handleConfirmToggle = async () => {
    if (!pendingToggle) return;
    
    const { userId, currentStatus } = pendingToggle;
    console.log('Confirming toggle:', { userId, currentStatus });
    
    setShowConfirmDialog(false);
    setPendingToggle(null);
    
    // Check if current user is demoting themselves
    const isSelfDemotion = userId === currentUser?.id && currentStatus === true;
    console.log('Is self demotion:', isSelfDemotion);
    
    await handleAdminToggle(userId, currentStatus, isSelfDemotion);
  };

  const handleCancelToggle = () => {
    console.log('Cancelling toggle');
    setShowConfirmDialog(false);
    setPendingToggle(null);
  };

  const handleAdminToggle = async (userId: string, currentAdminStatus: boolean, isSelfDemotion: boolean = false) => {
    console.log('Executing admin toggle:', { userId, currentAdminStatus, isSelfDemotion });
    setUpdatingAdmin(userId);
    
    try {
      const newAdminStatus = !currentAdminStatus;
      console.log('Sending request to change is_admin from', currentAdminStatus, 'to', newAdminStatus);
      
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/admin`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_admin: newAdminStatus }),
      });

      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to update admin status: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      console.log('API response data:', responseData);

      // Refresh the users list after successful update
      console.log('Refreshing users list...');
      await refreshUsers();
      console.log('Users list refreshed');

      // Handle self-demotion redirect
      if (isSelfDemotion) {
        console.log('User demoted themselves, logging out and redirecting...');
        // Use the new logoutAndRedirect function to redirect to home page
        logoutAndRedirect('/');
      }
    } catch (error) {
      console.error('Failed to toggle admin status:', error);
      // You might want to add a toast notification here
    } finally {
      setUpdatingAdmin(null);
    }
  };

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

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge 
        variant="outline" 
        className={isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
      >
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const roleStats = {
    admin: users.filter(u => u.is_admin === true).length,
    data_specialist: users.filter(u => u.role === 'data_specialist').length,
    business_specialist: users.filter(u => u.role === 'business_specialist').length,
  };

  const { toast } = useToast();
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleModify = () => {
    setShowActionModal(false);
    setShowEditModal(true);
  };

  const handleEditClose = async () => {
    console.log('=== handleEditClose called ===');
    console.log('Current users before refresh:', users);
    
    setShowEditModal(false);
    setSelectedUser(null);
    
    // Force refresh users list with multiple attempts
    console.log('Modal closed, refreshing users...');
    
    // First attempt - immediate refresh
    try {
      console.log('Attempting immediate refresh...');
      await refreshUsers();
      console.log('Users refreshed after modal close');
      console.log('Users after refresh:', users);
    } catch (error) {
      console.error('Failed to refresh users after modal close:', error);
    }
    
    // Second attempt - delayed refresh to ensure backend has processed the update
    setTimeout(async () => {
      console.log('Delayed refresh attempt...');
      try {
        await refreshUsers();
        console.log('Delayed refresh completed');
        console.log('Users after delayed refresh:', users);
      } catch (error) {
        console.error('Delayed refresh failed:', error);
      }
    }, 1000); // Increased delay to 1 second
  };

  const handleActionModalClose = () => {
    setShowActionModal(false);
    setSelectedUser(null);
  };

  const handleSelfDeactivation = () => {
    // User has deactivated themselves, redirect to login
    logoutAndRedirect('/'); // Changed from '/login' to '/' since login might be handled differently
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                {generatedPassword 
                  ? "User created successfully."
                  : "Create a new user account"}
              </DialogDescription>
            </DialogHeader>
            {generatedPassword ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-md">
                  <p className="font-mono text-sm break-all">{generatedPassword}</p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => {
                    setGeneratedPassword(null);
                    setInviteForm({ email: '', name: '', role: 'business_specialist' });
                    setShowInviteDialog(false);
                  }}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Existing form fields */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@telecom.com"
                    value={inviteForm.email}
                    onChange={handleEmailChange}
                    className={emailError ? "border-red-500" : ""}
                  />
                  {emailError && (
                    <p className="text-sm text-red-600">{emailError}</p>
                  )}
                  {isCheckingEmail && (
                    <p className="text-sm text-gray-500">Checking email availability...</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={inviteForm.role} 
                    onValueChange={(value: any) => setInviteForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data_specialist">Data Specialist</SelectItem>
                      <SelectItem value="business_specialist">Business Specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={isCheckingEmail}>
                    {isCheckingEmail ? "Checking..." : "Create User"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 border rounded-lg bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="p-6 border rounded-lg bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">{roleStats.admin}</p>
            </div>
            <Shield className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="p-6 border rounded-lg bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Specialists</p>
              <p className="text-2xl font-bold text-gray-900">{roleStats.data_specialist}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="p-6 border rounded-lg bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Business Specialists</p>
              <p className="text-2xl font-bold text-gray-900">{roleStats.business_specialist}</p>
            </div>
            <Shield className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg bg-white">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
          <p className="text-sm text-gray-600">Manage user accounts and their roles</p>
        </div>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Admin Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.is_admin === true}
                        disabled={updatingAdmin === user.id}
                        onCheckedChange={() => handleAdminToggleClick(user.id, user.is_admin === true, user.full_name)}
                      />
                      {updatingAdmin === user.id && (
                        <span className="w-4 h-4 border-2 border-t-transparent border-blue-600 rounded-full animate-spin" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.is_active ?? true)}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditClick(user)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Admin Toggle Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Admin Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of {pendingToggle?.userName}?
              {pendingToggle && pendingToggle.userId === currentUser?.id && pendingToggle.currentStatus === true && (
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠️ Warning: You are removing your own admin access. You will be redirected to the home page and lose access to user management.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelToggle}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggle}>Accept</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Edit Modal */}
      {selectedUser && (
        <UserEditModal
          isOpen={showEditModal}
          onClose={handleEditClose}
          user={selectedUser}
          currentUserId={currentUser?.id}
          onSelfDeactivation={handleSelfDeactivation}
        />
      )}
    </div>
  );
};

export default UserManagement;
