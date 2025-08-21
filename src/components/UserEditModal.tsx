import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    full_name: string;
    email: string;
    is_active?: boolean;
  };
  currentUserId?: string; // Add this to check for self-deactivation
  onSelfDeactivation?: () => void; // Add this callback for self-deactivation
}

export const UserEditModal: React.FC<UserEditModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  currentUserId,
  onSelfDeactivation 
}) => {
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    email: user.email,
    is_active: user.is_active ?? true
  });
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const { updateUser } = useAuth();
  const { toast } = useToast();

  // Check email uniqueness when email changes
  const checkEmailUniqueness = async (email: string): Promise<boolean> => {
    // Skip validation if email unchanged from current user
    if (email === user.email) {
      setEmailError(null);
      return true;
    }
    
    if (!email) return true;
    
    setIsCheckingEmail(true);
    setEmailError(null);
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, excludeUserId: user.id }),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous email error
    setEmailError(null);
    
    // Check email uniqueness before submitting
    const isEmailUnique = await checkEmailUniqueness(formData.email);
    if (!isEmailUnique) {
      return; // Form submission prevented
    }
    
    setLoading(true);

    try {
      const result = await updateUser(user.id, formData);
      
      if (result.success) {
        // Check for self-deactivation
        if (currentUserId && user.id === currentUserId && formData.is_active === false) {
          toast({
            title: "Account Deactivated",
            description: "Your account has been deactivated. You will be redirected to login.",
          });
          
          // Call the callback to handle self-deactivation
          if (onSelfDeactivation) {
            onSelfDeactivation();
          }
        } else {
          toast({
            title: "User Updated",
            description: "User information has been successfully updated."
          });
        }
        onClose();
      } else {
        // Handle backend validation errors
        if (result.error === 'Email already taken') {
          setEmailError('Email already taken');
        } else {
          toast({
            title: "Update Failed",
            description: result.error || "Failed to update user.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "An error occurred while updating the user.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update email input to clear error when typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setFormData({ ...formData, email: newEmail });
    
    // Clear error when user starts typing new email
    if (emailError) {
      setEmailError(null);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      full_name: user.full_name,
      email: user.email,
      is_active: user.is_active ?? true
    });
    setEmailError(null);
    onClose();
  };

  // Helper function to get API base URL (same as in UserManagement)
  const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    
    if (hostname === '13.58.194.74' || hostname.includes('ip-')) {
      return `http://${hostname}:3001`;
    }
    
    return `http://${hostname}:3001`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleEmailChange}
              placeholder="Enter email"
              required
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
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.is_active ? "active" : "inactive"}
              onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isCheckingEmail}>
              {loading ? "Saving..." : isCheckingEmail ? "Checking..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
