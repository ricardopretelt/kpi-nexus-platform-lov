
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Signal, Database, TrendingUp } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and info */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Signal className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">TelecomBI</h1>
                <p className="text-gray-600">Documentation Platform</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Centralized KPI Documentation
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Streamline your telecom analytics with comprehensive KPI documentation, 
              version control, and role-based access management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <Database className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Data Management</h3>
              <p className="text-sm text-gray-600">SQL queries and data models</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">KPI Tracking</h3>
              <p className="text-sm text-gray-600">Performance indicators</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <Signal className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Network Metrics</h3>
              <p className="text-sm text-gray-600">Network performance data</p>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the BI Documentation platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@telecom.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
