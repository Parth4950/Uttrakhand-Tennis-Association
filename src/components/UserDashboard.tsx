import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, User, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Registration from "./Registration";
import { PlayerData } from "./Registration";

interface UserData {
  id: number;
  name: string;
  whatsapp_number: string;
  date_of_birth: string;
  email: string;
  city: string;
  shirt_size: string;
  short_size: string;
  food_pref: string;
  stay_y_or_n: boolean;
  created_at: string;
}

interface EventData {
  event_name: string;
  partner_id: number | null;
  partner_name: string;
  ranking: number | null;
}

interface UserDashboardProps {
  user: {
    player: UserData;
    events: EventData[];
  } | UserData;
  onBack: () => void;
  onHome: () => void;
}

function mapUserToPlayerData(user: UserData): PlayerData {
  return {
    id: user.id,
    name: user.name || "",
    whatsapp: user.whatsapp_number || "",
    dateOfBirth: user.date_of_birth || "",
    email: user.email || "",
    address: "", // This field doesn't exist in DB, will be empty
    emergencyContact: "", // This field doesn't exist in DB, will be empty
    playingExperience: "", // This field doesn't exist in DB, will be empty
    medicalConditions: "", // This field doesn't exist in DB, will be empty
    city: user.city || "",
    shirtSize: user.shirt_size || "",
    shortSize: user.short_size || "",
    foodPref: user.food_pref || "",
    stayYorN: user.stay_y_or_n ?? false,
  };
}

const UserDashboard = ({ user, onBack, onHome }: UserDashboardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditComplete = () => {
    setIsEditing(false);
    // Refresh user data could be implemented here
  };

  if (isEditing) {
    const player = 'player' in user ? user.player : user;
    return <Registration initialData={mapUserToPlayerData(player)} onBack={handleEditComplete} />;
  }

  // Extract player data from the user object
  const player = 'player' in user ? user.player : user;
  const events = 'events' in user ? user.events : [];

  // Format date without time
  const formatDateOnly = (dateString: string) => {
    if (!dateString) return 'Not provided';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center space-x-2">
                  <User className="h-6 w-6" />
                  <CardTitle>Player Dashboard</CardTitle>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Registration
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Player Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-600" />
                  Player Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <Label className="font-medium">Name:</Label>
                    <p className="text-gray-700">{player.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">WhatsApp:</Label>
                    <p className="text-gray-700">{player.whatsapp_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Email:</Label>
                    <p className="text-gray-700">{player.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Date of Birth:</Label>
                    <p className="text-gray-700">{formatDateOnly(player.date_of_birth)}</p>
                  </div>
                  <div>
                    <Label className="font-medium">City:</Label>
                    <p className="text-gray-700">{player.city || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Shirt Size:</Label>
                    <p className="text-gray-700">{player.shirt_size || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Short Size:</Label>
                    <p className="text-gray-700">{player.short_size || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Food Preference:</Label>
                    <p className="text-gray-700">{player.food_pref || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Registration Date:</Label>
                    <p className="text-gray-700">
                      {player.created_at ? formatDateOnly(player.created_at) : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tournament Registration */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-green-600" />
                  Tournament Registration
                </h3>
                <div className="space-y-4">
                  {events.length > 0 ? (
                    events.map((event: EventData, index: number) => (
                      <Card key={index} className={`${index % 2 === 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className={`text-lg ${index % 2 === 0 ? 'text-green-800' : 'text-blue-800'}`}>
                            {event.event_name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">
                            Partner: {event.partner_name || 'No partner assigned'}
                          </p>
                          {event.ranking && (
                            <p className="text-sm text-gray-600">
                              Ranking: {event.ranking}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No events registered yet</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <Button onClick={onHome} variant="outline" className="w-full">
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface LabelProps {
  className?: string;
  children: React.ReactNode;
}

const Label = ({ className, children, ...props }: LabelProps) => (
  <span className={`text-sm font-medium ${className || ""}`} {...props}>
    {children}
  </span>
);

export default UserDashboard;