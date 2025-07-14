import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import RegistrationStep1 from "./RegistrationStep1";
import RegistrationStep2 from "./RegistrationStep2";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "../services/api";

export interface PlayerData {
  id?: number;
  name: string;
  whatsapp: string;
  dateOfBirth: string;
  email: string;
  address: string;
  emergencyContact: string;
  playingExperience: string;
  medicalConditions: string;
  city: string;
  shirtSize: string;
  shortSize: string;
  foodPref: string;
  stayYorN: boolean;
  feePaid?: boolean;
}

interface DbPlayer {
  id: number;
  name: string;
  whatsapp_number: string;
  date_of_birth: string;
  email: string;
  address: string;
  emergency_contact: string;
  playing_experience: string;
  medical_conditions: string;
  city: string;
  shirt_size: string;
  short_size: string;
  food_pref: string;
  stay_yor_n: boolean;
  fee_paid?: boolean;
  created_at?: string;
}

function mapUserToPlayerData(user: DbPlayer): PlayerData {
  return {
    id: user.id,
    name: user.name,
    whatsapp: user.whatsapp_number,
    dateOfBirth: user.date_of_birth,
    email: user.email,
    address: user.address,
    emergencyContact: user.emergency_contact,
    playingExperience: user.playing_experience,
    medicalConditions: user.medical_conditions,
    city: user.city,
    shirtSize: user.shirt_size,
    shortSize: user.short_size,
    foodPref: user.food_pref,
    stayYorN: user.stay_yor_n,
    feePaid: user.fee_paid ?? false,
  };
}

interface RegistrationProps {
  onBack: () => void;
  initialData?: PlayerData;
}

export interface EventSelection {
  event1: string;
  partner1: string;
  event2: string;
  partner2: string;
}

const Registration = ({ onBack, initialData }: RegistrationProps) => {
  const editMode = !!initialData;
  type PlayerDataWithEvents = PlayerData & { events?: { event_name: string; partner_id?: number }[] };
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [playerId, setPlayerId] = useState<number | null>(initialData?.id || null);
  const [playerData, setPlayerData] = useState<PlayerData>(
    initialData || {
      name: "",
      whatsapp: "",
      dateOfBirth: "",
      email: "",
      address: "",
      emergencyContact: "",
      playingExperience: "",
      medicalConditions: "",
      city: "",
      shirtSize: "",
      shortSize: "",
      foodPref: "",
      stayYorN: false,
      feePaid: false,
    }
  );
  // Pre-fill eventData if initialData has event info
  const [eventData, setEventData] = useState<EventSelection>(() => {
    if (editMode && (initialData as PlayerDataWithEvents).events) {
      const events = (initialData as PlayerDataWithEvents).events;
      return {
        event1: events[0]?.event_name || "",
        partner1: events[0]?.partner_id ? String(events[0].partner_id) : "",
        event2: events[1]?.event_name || "",
        partner2: events[1]?.partner_id ? String(events[1].partner_id) : "",
      };
    }
    return {
      event1: "",
      partner1: "",
      event2: "",
      partner2: "",
    };
  });
  const { toast } = useToast();

  const handleStep1Complete = async (data: PlayerData) => {
    setIsLoading(true);
    try {
      const playerPayload = {
        id: playerId, // Use existing ID if editing
        name: data.name,
        whatsapp_number: data.whatsapp.trim(), // Trim whitespace
        date_of_birth: data.dateOfBirth,
        email: data.email,
        city: data.city,
        shirt_size: data.shirtSize,
        short_size: data.shortSize,
        food_pref: data.foodPref,
        stay_y_or_n: data.stayYorN,
        fee_paid: data.feePaid ?? false,
        address: data.address,
        emergency_contact: data.emergencyContact,
        playing_experience: data.playingExperience,
        medical_conditions: data.medicalConditions
      };
      console.log("[DEBUG] Sending player payload", playerPayload);

      let response;
      if (editMode && playerId) {
        // Use PUT for update
        response = await apiService.updatePlayer(playerId, playerPayload);
      } else {
        // Use POST for create
        response = await apiService.createPlayer(playerPayload);
      }
      setPlayerData(data);
      setPlayerId(response.id || playerId);
      setCurrentStep(2);
      toast({
        title: "Player Information Saved",
        description: "Now select your events and partners.",
      });
    } catch (error) {
      console.error('Error creating/updating player:', error);
      let errorMessage = "Failed to save player information. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('already registered with this WhatsApp number and date of birth')) {
          errorMessage = "A player with this WhatsApp number and date of birth is already registered. Please check your information or contact support if you believe this is an error.";
        } else if (error.message.includes('already registered with this WhatsApp number')) {
          errorMessage = "This WhatsApp number is already registered with a different date of birth. Please verify your information or use a different WhatsApp number.";
        } else if (error.message.includes('WhatsApp number already registered')) {
          errorMessage = "This WhatsApp number is already registered. If you are editing, please make sure you are not changing it to another player's number.";
        } else {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Registration Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationComplete = async (data: EventSelection) => {
    if (!playerId) {
      toast({
        title: "Error",
        description: "Player ID not found. Please start registration again.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      // Remove all previous event registrations for this player if editing
      if (editMode) {
        await apiService.deleteAllPartnersForPlayer(playerId);
      }
      const partnersToCreate = [];
      if (data.event1) {
        partnersToCreate.push({
          event_name: data.event1,
          user_id: playerId,
          partner_id: data.partner1 === "not-registered" ? null : parseInt(data.partner1) || null,
        });
      }
      if (data.event2) {
        partnersToCreate.push({
          event_name: data.event2,
          user_id: playerId,
          partner_id: data.partner2 === "not-registered" ? null : parseInt(data.partner2) || null,
        });
      }
      for (const partner of partnersToCreate) {
        await apiService.createPartner(partner);
        if (partner.partner_id) {
          await apiService.updatePartnerRelationship(
            partner.event_name,
            playerId,
            partner.partner_id
          );
        }
      }
      setEventData(data);
      toast({
        title: editMode ? "Registration Updated!" : "Registration Successful!",
        description: editMode ? "Your registration has been updated successfully." : "Your tournament registration has been completed successfully.",
      });
      onBack();
    } catch (error) {
      console.error('Error completing registration:', error);
      toast({
        title: "Registration Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-white hover:bg-white/20"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <div>
                <CardTitle className="text-2xl">Tournament Registration</CardTitle>
                <p className="opacity-90">Step {currentStep} of 2</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {currentStep === 1 ? (
              <RegistrationStep1
                initialData={playerData}
                onNext={handleStep1Complete}
                isLoading={isLoading}
              />
            ) : (
              <RegistrationStep2
                onBack={() => setCurrentStep(1)}
                onSubmit={handleRegistrationComplete}
                initialData={eventData}
                isLoading={isLoading}
                playerId={playerId}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Registration;