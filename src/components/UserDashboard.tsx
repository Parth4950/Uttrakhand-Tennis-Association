import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, User, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Registration from "./Registration";
import { PlayerData } from "./Registration";
import React from "react";

interface EventData {
  event_name: string;
  partner_id?: number;
  partner_name?: string;
  ranking?: number;
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
  stay_y_or_n: boolean;
  created_at?: string;
  fee_paid?: boolean; // Added fee_paid field
  // ... any other fields
}

interface UserDashboardProps {
  user: {
    player: DbPlayer;
    events: EventData[];
  } | (DbPlayer & { events?: EventData[] });
  onBack: () => void;
  onHome: () => void;
}

function mapUserToPlayerData(user: unknown): PlayerData {
  // At this point, user is always a DbPlayer
  const dbUser = user as DbPlayer;
  return {
    id: dbUser.id,
    name: dbUser.name,
    whatsapp: dbUser.whatsapp_number,
    dateOfBirth: dbUser.date_of_birth,
    email: dbUser.email,
    address: dbUser.address,
    emergencyContact: dbUser.emergency_contact,
    playingExperience: dbUser.playing_experience,
    medicalConditions: dbUser.medical_conditions,
    city: dbUser.city,
    shirtSize: dbUser.shirt_size,
    shortSize: dbUser.short_size,
    foodPref: dbUser.food_pref,
    stayYorN: dbUser.stay_y_or_n,
  };
}

// Type guard to check if user has a player property
function hasPlayerProp(user: unknown): user is { player: DbPlayer; events: EventData[] } {
  return (
    typeof user === 'object' &&
    user !== null &&
    'player' in user &&
    typeof (user as { player?: unknown }).player === 'object' &&
    (user as { player?: unknown }).player !== undefined
  );
}

const UserDashboard = ({ user, onBack, onHome }: UserDashboardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditComplete = () => {
    setIsEditing(false);
    // Refresh user data could be implemented here
  };

  // Always use the DB player object for display
  const player: DbPlayer = hasPlayerProp(user) ? user.player : user;
  const events: EventData[] = hasPlayerProp(user) ? user.events : user.events || [];

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

  if (isEditing) {
    // For editing, map to PlayerData (camelCase)
    return <Registration initialData={mapUserToPlayerData(player)} onBack={handleEditComplete} />;
  }

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
                    <Label className="font-medium">Address:</Label>
                    <p className="text-gray-700">{player.address || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Emergency Contact:</Label>
                    <p className="text-gray-700">{player.emergency_contact || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Playing Experience:</Label>
                    <p className="text-gray-700">{player.playing_experience || 'Not provided'}</p>
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
                    <Label className="font-medium">Fee Paid:</Label>
                    {player.fee_paid ? (
                      <Badge className="bg-green-500 text-white">Paid</Badge>
                    ) : (
                      <Badge className="bg-red-500 text-white">Not Paid</Badge>
                    )}
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

const Label = ({ className, children, ...props }: React.PropsWithChildren<{ className?: string }>) => (
  <span className={`text-sm font-medium ${className || ""}`} {...props}>
    {children}
  </span>
);

export default UserDashboard;