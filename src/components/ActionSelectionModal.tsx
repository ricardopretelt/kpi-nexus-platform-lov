import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';

interface ActionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModify: () => void;
  userName: string;
}

export const ActionSelectionModal: React.FC<ActionSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onModify, 
  userName 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Please choose action for user</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            What would you like to do with <strong>{userName}</strong>?
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onModify}>
            Modify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
