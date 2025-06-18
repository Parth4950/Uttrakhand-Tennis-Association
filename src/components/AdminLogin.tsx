
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminDashboard from "./AdminDashboard";
import { apiService } from "@/services/api";

interface AdminLoginProps {
  onBack: () => void;
}

const AdminLogin = ({ onBack }: AdminLoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('AdminLogin: Starting login process...');
      const response = await apiService.login(username, password);
      console.log('AdminLogin: Login response received:', response);
      
      if (response && response.access_token) {
        console.log('AdminLogin: Token received, setting logged in state');
        setIsLoggedIn(true);
        toast({
          title: "Admin Login Successful!",
          description: "Welcome to the admin dashboard.",
        });
      } else {
        console.error('AdminLogin: No access token in response');
        throw new Error('Login failed - no token received');
      }
    } catch (error) {
      console.error('AdminLogin: Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid username or password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('AdminLogin: Handling logout');
    apiService.logout();
    setIsLoggedIn(false);
  };

  useEffect(() => {
    console.log('AdminLogin: Component mounted, checking existing auth...');
    const hasToken = apiService.isAuthenticated();
    console.log('AdminLogin: Has existing token:', hasToken);
    
    if (hasToken) {
      console.log('AdminLogin: Found existing token, setting logged in state');
      setIsLoggedIn(true);
    }
  }, []);

  if (isLoggedIn) {
    console.log('AdminLogin: Rendering AdminDashboard');
    return <AdminDashboard onBack={handleLogout} onHome={onBack} />;
  }

  console.log('AdminLogin: Rendering login form');
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <CardTitle>Admin Login</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Demo credentials: admin / uta2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
