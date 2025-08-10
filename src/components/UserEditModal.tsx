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
  const { updateUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update user.",
          variant: "destructive"
        });
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

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      full_name: user.full_name,
      email: user.email,
      is_active: user.is_active ?? true
    });
    onClose();
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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email"
              required
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
