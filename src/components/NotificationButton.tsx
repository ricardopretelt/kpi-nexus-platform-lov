import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Eye, Clock } from 'lucide-react';
import { api } from '../services/api';

interface PendingApproval {
  kpi_version_id: number;
  kpi_id: number;
  version_number: number;
  kpi_name: string;
}

interface NotificationButtonProps {
  onReviewKPI: (kpiId: number) => void;
}

export const NotificationButton = ({ onReviewKPI }: NotificationButtonProps) => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const approvals = await api.getPendingApprovals();
      setPendingApprovals(approvals);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingApprovals, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReviewKPI = (kpiId: number) => {
    onReviewKPI(kpiId);
    setShowNotifications(false);
  };

  if (pendingApprovals.length === 0) {
    return null;
  }

  return (
    <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {pendingApprovals.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Pending Reviews</span>
            <Badge variant="secondary">{pendingApprovals.length}</Badge>
          </DialogTitle>
          <DialogDescription>
            KPIs waiting for your approval
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {pendingApprovals.map((approval) => (
            <Card key={approval.kpi_version_id} className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{approval.kpi_name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <Badge variant="outline">
                        Version {approval.version_number}
                      </Badge>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => handleReviewKPI(approval.kpi_id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
