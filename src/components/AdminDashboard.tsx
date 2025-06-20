
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Shield, Trophy, Save, LogOut, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

interface AdminDashboardProps {
  onBack: () => void;
  onHome: () => void;
}

interface Registration {
  player_id: number;
  player_name: string;
  whatsapp_number: string;
  email: string;
  city: string;
  event_name: string;
  partner_id: number | null;
  partner_name: string | null;
  ranking: number | null;
}

const AdminDashboard = ({ onBack, onHome }: AdminDashboardProps) => {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [rankings, setRankings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const events = [
    "Men's Singles",
    "Women's Singles", 
    "Men's Doubles",
    "Women's Doubles",
    "Mixed Doubles"
  ];

  useEffect(() => {
    console.log('AdminDashboard mounted');
    loadAllRegistrations();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      const filtered = registrations.filter(reg => reg.event_name === selectedEvent);
      setFilteredRegistrations(filtered);
      
      // Load existing rankings for this event
      const eventRankings: { [key: string]: string } = {};
      filtered.forEach(reg => {
        if (reg.ranking) {
          eventRankings[`${reg.player_id}-${reg.event_name}`] = reg.ranking.toString();
        }
      });
      setRankings(eventRankings);
    } else {
      setFilteredRegistrations([]);
    }
  }, [selectedEvent, registrations]);

  const loadAllRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading registrations...');
      
      const data = await apiService.getAllRegistrations();
      console.log('API response received:', data);
      
      if (Array.isArray(data)) {
        setRegistrations(data);
        console.log(`Successfully loaded ${data.length} registrations`);
        
        if (data.length === 0) {
          toast({
            title: "No Data Found",
            description: "No registrations found in the database.",
            variant: "default",
          });
        } else {
          toast({
            title: "Data Loaded",
            description: `Successfully loaded ${data.length} registrations.`,
          });
        }
      } else {
        console.error('Expected array but got:', typeof data, data);
        setError('Invalid data format received from server');
        toast({
          title: "Data Format Error",
          description: "Received invalid data format from server",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error loading registrations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Error Loading Data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  function handleRankingChange(playerId: number, eventName: string, ranking: string) {
    const key = `${playerId}-${eventName}`;
    setRankings(prev => ({
      ...prev,
      [key]: ranking,
    }));
  }

  async function saveRankings() {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      const updates = Object.entries(rankings).map(([key, ranking]) => {
        const [playerId] = key.split('-');
        return {
          player_id: parseInt(playerId),
          event_name: selectedEvent,
          ranking: parseInt(ranking) || null
        };
      });

      // Save rankings using the backend API
      for (const update of updates) {
        if (update.ranking !== null) {
          await apiService.updateRanking(update.player_id, update.event_name, update.ranking);
        }
      }

      toast({
        title: "Rankings Saved!",
        description: `Rankings for ${selectedEvent} have been saved successfully.`,
      });

      // Reload data to show updated rankings
      await loadAllRegistrations();
    } catch (error) {
      console.error('Error saving rankings:', error);
      toast({
        title: "Error",
        description: "Failed to save rankings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    console.log('Logout button clicked');
    apiService.logout();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    onBack();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-6xl">
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
                  <Shield className="h-6 w-6" />
                  <CardTitle>Admin Dashboard</CardTitle>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white hover:bg-white/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onHome}
                >
                  Home
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-green-600" />
                  Tournament Management
                </h3>
                
                <div className="w-full max-w-md">
                  <label className="block text-sm font-medium mb-2">Select Event</label>
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an event to manage" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event} value={event}>
                          {event}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading && (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
                  <p className="text-gray-500">Loading registrations...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 font-medium">Error Loading Data</p>
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                    <div className="flex justify-center space-x-3 mt-3">
                      <Button 
                        onClick={loadAllRegistrations} 
                        variant="outline"
                        disabled={loading}
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!loading && !error && selectedEvent && filteredRegistrations.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">
                      Teams in {selectedEvent} ({filteredRegistrations.length} players)
                    </h4>
                    <Button
                      onClick={saveRankings}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Rankings
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">S.No</TableHead>
                          <TableHead>Player Name</TableHead>
                          <TableHead>Partner</TableHead>
                          <TableHead>WhatsApp</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead className="w-32">Ranking</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRegistrations.map((registration, index) => (
                          <TableRow key={`${registration.player_id}-${registration.event_name}`}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{registration.player_name}</TableCell>
                            <TableCell>{registration.partner_name || 'No partner assigned'}</TableCell>
                            <TableCell>{registration.whatsapp_number}</TableCell>
                            <TableCell>{registration.city}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                placeholder="Rank"
                                value={rankings[`${registration.player_id}-${registration.event_name}`] || ""}
                                onChange={(e) => handleRankingChange(registration.player_id, registration.event_name, e.target.value)}
                                className="w-20"
                                min="1"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {!loading && !error && selectedEvent && filteredRegistrations.length === 0 && registrations.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No players registered for {selectedEvent} yet.</p>
                </div>
              )}

              {!loading && !error && !selectedEvent && registrations.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an event to view and manage player rankings.</p>
                  <p className="text-sm mt-2">Total registrations: {registrations.length}</p>
                </div>
              )}

              {!loading && !error && registrations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No player registrations found in the database.</p>
                  <p className="text-sm mt-2">Make sure players have registered for events.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;