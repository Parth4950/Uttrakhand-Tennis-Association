
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserDashboard from "./UserDashboard";
import { apiService } from "../services/api";

interface UserLoginProps {
  onBack: () => void;
}

const UserLogin = ({ onBack }: UserLoginProps) => {
  console.log("🚀 UserLogin component mounted");

  const [whatsapp, setWhatsapp] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!whatsapp.trim()) {
      errors.whatsapp = 'WhatsApp number is required';
    } else if (!/^(\+91)?[6-9]\d{9}$/.test(whatsapp.replace(/\s/g, ''))) {

      errors.whatsapp = 'Please enter a valid WhatsApp number';
    }
    
    if (!dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'whatsapp') {
      setWhatsapp(value);
    } else if (field === 'dateOfBirth') {
      setDateOfBirth(value);
    }
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🧠 handleLogin called", { whatsapp, dateOfBirth });

    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the new user login endpoint
      console.log("📞 Calling apiService.userLogin()"); 
      const response = await apiService.userLogin(whatsapp, dateOfBirth);
      
      if (response.success) {
        setLoggedInUser(response.user);
        toast({
          title: "Login Successful!",
          description: `Welcome back, ${response.user.player.name}!`,
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid WhatsApp number or date of birth. Please check your credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = "Unable to connect to the server. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('WhatsApp number is already registered')) {
          errorMessage = "This WhatsApp number is registered with a different date of birth. Please check your date of birth or contact support.";
        } else if (error.message.includes('No registration found')) {
          errorMessage = "No registration found with these credentials. Please register first or check your information.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loggedInUser) {
    return (
      <UserDashboard
        user={loggedInUser}
        onBack={() => setLoggedInUser(null)}
        onHome={onBack}
      />
    );
  }

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
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6" />
              <CardTitle>Player Login</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                required
                className={`mt-1 ${fieldErrors.whatsapp ? 'border-red-500' : ''}`}
                placeholder="+91 XXXXXXXXXX"
                disabled={isLoading}
              />
              {fieldErrors.whatsapp && <p className="text-red-500 text-sm mt-1">{fieldErrors.whatsapp}</p>}
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                required
                className={`mt-1 ${fieldErrors.dateOfBirth ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {fieldErrors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{fieldErrors.dateOfBirth}</p>}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Use the WhatsApp number and date of birth you registered with</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserLogin;
