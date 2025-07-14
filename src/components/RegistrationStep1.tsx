import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PlayerData } from "./Registration";

interface RegistrationStep1Props {
  initialData: PlayerData;
  onNext: (data: PlayerData) => void;
  isLoading: boolean;
}

const RegistrationStep1 = ({ initialData, onNext, isLoading }: RegistrationStep1Props) => {
  const [formData, setFormData] = useState<PlayerData>({
    ...initialData,
    feePaid: initialData.feePaid ?? false,
  });
  useEffect(() => {
    if (initialData.id) {
      setFormData(prev => ({ ...prev, id: initialData.id, feePaid: initialData.feePaid ?? false }));
    }
  }, [initialData]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof PlayerData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!formData.whatsapp.trim()) {
      errors.whatsapp = 'WhatsApp number is required';
    } else if (!/^(\+91)?[6-9]\d{9}$/.test(formData.whatsapp.replace(/\s/g, ''))) {
      errors.whatsapp = 'Please enter a valid WhatsApp number';
    }
    
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!formData.emergencyContact.trim()) {
      errors.emergencyContact = 'Emergency contact is required';
    }
    
    if (!formData.playingExperience) {
      errors.playingExperience = 'Playing experience is required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Player Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
            className={`mt-1 ${fieldErrors.name ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.name && <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>}
        </div>
        
        <div>
          <Label htmlFor="whatsapp">WhatsApp Number *</Label>
          <Input
            id="whatsapp"
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => handleInputChange("whatsapp", e.target.value)}
            required
            className={`mt-1 ${fieldErrors.whatsapp ? 'border-red-500' : ''}`}
            placeholder="+91 XXXXXXXXXX"
            disabled={isLoading}
          />
          {fieldErrors.whatsapp && <p className="text-red-500 text-sm mt-1">{fieldErrors.whatsapp}</p>}
        </div>
        
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            required
            className={`mt-1 ${fieldErrors.dateOfBirth ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{fieldErrors.dateOfBirth}</p>}
        </div>
        
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            required
            className={`mt-1 ${fieldErrors.email ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
        </div>

        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            required
            className={`mt-1 ${fieldErrors.city ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.city && <p className="text-red-500 text-sm mt-1">{fieldErrors.city}</p>}
        </div>

        <div>
          <Label htmlFor="emergencyContact">Emergency Contact Number *</Label>
          <Input
            id="emergencyContact"
            type="tel"
            value={formData.emergencyContact}
            onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
            required
            className={`mt-1 ${fieldErrors.emergencyContact ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.emergencyContact && <p className="text-red-500 text-sm mt-1">{fieldErrors.emergencyContact}</p>}
        </div>
      </div>
      
      <div>
        <Label htmlFor="address">Address *</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          required
          className={`mt-1 ${fieldErrors.address ? 'border-red-500' : ''}`}
          rows={3}
          disabled={isLoading}
        />
        {fieldErrors.address && <p className="text-red-500 text-sm mt-1">{fieldErrors.address}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="playingExperience">Playing Experience *</Label>
          <Select
            value={formData.playingExperience}
            onValueChange={(value) => handleInputChange("playingExperience", value)}
            disabled={isLoading}
          >
            <SelectTrigger className={`mt-1 ${fieldErrors.playingExperience ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
              <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
              <SelectItem value="advanced">Advanced (6-10 years)</SelectItem>
              <SelectItem value="professional">Professional (10+ years)</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.playingExperience && <p className="text-red-500 text-sm mt-1">{fieldErrors.playingExperience}</p>}
        </div>

        <div>
          <Label htmlFor="shirtSize">Shirt Size</Label>
          <Select
            value={formData.shirtSize}
            onValueChange={(value) => handleInputChange("shirtSize", value)}
            disabled={isLoading}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select shirt size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="XS">Extra Small (XS)</SelectItem>
              <SelectItem value="S">Small (S)</SelectItem>
              <SelectItem value="M">Medium (M)</SelectItem>
              <SelectItem value="L">Large (L)</SelectItem>
              <SelectItem value="XL">Extra Large (XL)</SelectItem>
              <SelectItem value="XXL">Double XL (XXL)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="shortSize">Short Size</Label>
          <Select
            value={formData.shortSize}
            onValueChange={(value) => handleInputChange("shortSize", value)}
            disabled={isLoading}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select short size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="XS">Extra Small (XS)</SelectItem>
              <SelectItem value="S">Small (S)</SelectItem>
              <SelectItem value="M">Medium (M)</SelectItem>
              <SelectItem value="L">Large (L)</SelectItem>
              <SelectItem value="XL">Extra Large (XL)</SelectItem>
              <SelectItem value="XXL">Double XL (XXL)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="foodPref">Food Preference</Label>
          <Select
            value={formData.foodPref}
            onValueChange={(value) => handleInputChange("foodPref", value)}
            disabled={isLoading}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select food preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vegetarian">Vegetarian</SelectItem>
              <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
              <SelectItem value="vegan">Vegan</SelectItem>
              <SelectItem value="jain">Jain</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="medicalConditions">Medical Conditions (if any)</Label>
          <Textarea
            id="medicalConditions"
            value={formData.medicalConditions}
            onChange={(e) => handleInputChange("medicalConditions", e.target.value)}
            className="mt-1"
            rows={2}
            placeholder="Please mention any medical conditions or allergies"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="stayYorN"
            checked={formData.stayYorN}
            onCheckedChange={(checked) => handleInputChange("stayYorN", checked as boolean)}
            disabled={isLoading}
          />
          <Label htmlFor="stayYorN">I need accommodation during the tournament</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="feePaid"
            checked={formData.feePaid}
            onCheckedChange={(checked) => handleInputChange("feePaid", checked as boolean)}
            disabled={isLoading}
          />
          <Label htmlFor="feePaid">Fee Paid</Label>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-green-600 hover:bg-green-700"
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Next Step"}
      </Button>
    </form>
  );
};

export default RegistrationStep1;