
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
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

const UserManagement = () => {
  const { users, inviteUser, refreshUsers } = useAuth();
  const [updatingAdmin, setUpdatingAdmin] = useState<string | null>(null);

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

  // Add effect to refresh users when component mounts
  useEffect(() => {
    console.log('UserManagement - Component mounted, refreshing users...');
    refreshUsers().then(() => {
      console.log('UserManagement - Users refreshed');
    }).catch(err => {
      console.error('UserManagement - Failed to refresh users:', err);
    });
  }, []);

  const handleInvite = async () => {
    if (inviteForm.email && inviteForm.name && inviteForm.role) {
      const result = await inviteUser(inviteForm.email, inviteForm.name, inviteForm.role);
      if (result.success) {
        setGeneratedPassword(result.password);
      } else {
        // Handle error
        console.error('Failed to invite user:', result.error);
      }
    }
  };

  const handleAdminToggle = async (userId: string, currentAdminStatus: boolean) => {
    setUpdatingAdmin(userId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/admin`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_admin: !currentAdminStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update admin status');
      }

      // Refresh the users list after successful update
      await refreshUsers();
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

  const roleStats = {
    admin: users.filter(u => u.is_admin === true).length,
    data_specialist: users.filter(u => u.role === 'data_specialist').length,
    business_specialist: users.filter(u => u.role === 'business_specialist').length,
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
                  ? "User created successfully. Copy the password below:"
                  : "Create a new user account"}
              </DialogDescription>
            </DialogHeader>
            {generatedPassword ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-md">
                  <p className="font-mono text-sm break-all">{generatedPassword}</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                    // Optional: Add a toast or visual feedback that password was copied
                  }}>
                    Copy Password
                  </Button>
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
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  />
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
                  <Button onClick={handleInvite}>
                    Create User
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{roleStats.admin}</p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Specialists</p>
                <p className="text-2xl font-bold text-gray-900">{roleStats.data_specialist}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Business Specialists</p>
                <p className="text-2xl font-bold text-gray-900">{roleStats.business_specialist}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user accounts and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.is_admin === true}
                        disabled={updatingAdmin === user.id}
                        onCheckedChange={() => handleAdminToggle(user.id, user.is_admin === true)}
                      />
                      {updatingAdmin === user.id && (
                        <span className="w-4 h-4 border-2 border-t-transparent border-blue-600 rounded-full animate-spin" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Shield className="mr-2 h-5 w-5 text-red-600" />
              Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Manage user accounts</li>
              <li>• Full platform access</li>
              <li>• Grant/revoke permissions</li>
              <li>• System administration</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Shield className="mr-2 h-5 w-5 text-blue-600" />
              Data Specialist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Access technical documentation</li>
              <li>• Edit KPI definitions</li>
              <li>• Manage SQL queries</li>
              <li>• Maintain data models</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Shield className="mr-2 h-5 w-5 text-green-600" />
              Business Specialist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Access business KPIs</li>
              <li>• Approve KPI changes</li>
              <li>• Review documentation</li>
              <li>• Business validation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
