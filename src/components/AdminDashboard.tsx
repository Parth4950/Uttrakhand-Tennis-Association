
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Shield, Trophy, Save, LogOut, RefreshCw, AlertCircle, Copy } from "lucide-react";
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

// Helper to check if event is doubles
const isDoublesEvent = (event: string) => ["Men's Doubles", "Women's Doubles", "Mixed Doubles"].includes(event);

const AdminDashboard = ({ onBack, onHome }: AdminDashboardProps) => {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [rankings, setRankings] = useState<{ [key: string]: string }>({});
  const [teamRankings, setTeamRankings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [savingRankings, setSavingRankings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  const events = [
    "Men's Singles",
    "Women's Singles", 
    "Men's Doubles",
    "Women's Doubles",
    "Mixed Doubles"
  ];

  // Memoized load function to prevent unnecessary re-renders
  const loadAllRegistrations = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    console.log('AdminDashboard mounted');
    loadAllRegistrations();
  }, [loadAllRegistrations]);

  useEffect(() => {
    if (selectedEvent && isDoublesEvent(selectedEvent)) {
      // Group by team (player1 + player2)
      const teams: { [key: string]: Registration[] } = {};
      registrations.filter(reg => reg.event_name === selectedEvent).forEach(reg => {
        const teamKey = [reg.player_id, reg.partner_id].sort().join('-');
        if (!teams[teamKey]) teams[teamKey] = [];
        teams[teamKey].push(reg);
      });
      setFilteredRegistrations(Object.values(teams).map(teamRegs => teamRegs[0]));
      // Load existing team rankings
      const eventTeamRankings: { [key: string]: string } = {};
      Object.entries(teams).forEach(([teamKey, regs]) => {
        const ranking = regs[0].ranking;
        if (ranking) eventTeamRankings[teamKey] = ranking.toString();
      });
      setTeamRankings(eventTeamRankings);
      setHasUnsavedChanges(false);
    } else if (selectedEvent) {
      // Singles logic (unchanged)
      const filtered = registrations.filter(reg => reg.event_name === selectedEvent);
      setFilteredRegistrations(filtered);
      const eventRankings: { [key: string]: string } = {};
      filtered.forEach(reg => {
        if (reg.ranking) {
          eventRankings[`${reg.player_id}-${reg.event_name}`] = reg.ranking.toString();
        }
      });
      setRankings(eventRankings);
      setHasUnsavedChanges(false);
    } else {
      setFilteredRegistrations([]);
      setRankings({});
      setTeamRankings({});
      setHasUnsavedChanges(false);
    }
  }, [selectedEvent, registrations]);

  // Validate ranking input
  const validateRanking = (value: string): boolean => {
    if (value === "") return true; // Allow empty values
    const num = parseInt(value);
    return !isNaN(num) && num > 0 && num <= 1000; // Reasonable range
  };

  function handleRankingChange(playerId: number, eventName: string, ranking: string) {
    // Validate input
    if (ranking !== "" && !validateRanking(ranking)) {
      toast({
        title: "Invalid Ranking",
        description: "Please enter a valid number between 1 and 1000",
        variant: "destructive",
      });
      return;
    }

    // Only update the specific event that was changed
    setRankings(prev => {
      const updated = { ...prev };
      const key = `${playerId}-${eventName}`;
      updated[key] = ranking;
      return updated;
    });
    setHasUnsavedChanges(true);
  }

  function handleCopyRankingToAllEvents(playerId: number, eventName: string) {
    // Get the ranking for the current event
    const key = `${playerId}-${eventName}`;
    const ranking = rankings[key];
    if (!ranking) {
      toast({
        title: "No Ranking Entered",
        description: "Please enter a ranking to copy.",
        variant: "destructive",
      });
      return;
    }
    // Copy this ranking to all events for this player in the filtered list
    setRankings(prev => {
      const updated = { ...prev };
      filteredRegistrations.forEach(reg => {
        if (reg.player_id === playerId) {
          updated[`${playerId}-${reg.event_name}`] = ranking;
        }
      });
      return updated;
    });
    setHasUnsavedChanges(true);
    toast({
      title: "Ranking Copied",
      description: "Ranking copied to all events for this player.",
    });
  }

  function handleTeamRankingChange(playerId: number, partnerId: number | null, ranking: string) {
    if (ranking !== "" && !validateRanking(ranking)) {
      toast({
        title: "Invalid Ranking",
        description: "Please enter a valid number between 1 and 1000",
        variant: "destructive",
      });
      return;
    }
    const teamKey = [playerId, partnerId].sort().join('-');
    setTeamRankings(prev => ({ ...prev, [teamKey]: ranking }));
    setHasUnsavedChanges(true);
  }

  async function saveRankings() {
    if (!hasUnsavedChanges) {
      toast({
        title: "No Changes",
        description: "No ranking changes to save.",
      });
      return;
    }

    try {
      setSavingRankings(true);
      // Only update rankings for player-event pairs that are visible in the UI (filteredRegistrations)
      const validKeys = filteredRegistrations.map(reg => `${reg.player_id}-${reg.event_name}`);
      const updates = Object.entries(rankings)
        .filter(([key, ranking]) => validKeys.includes(key) && ranking !== "")
        .map(([key, ranking]) => {
          const [playerId, eventName] = key.split('-');
          return {
            player_id: parseInt(playerId),
            event_name: eventName,
            ranking: parseInt(ranking)
          };
        });

      if (updates.length === 0) {
        toast({
          title: "No Rankings to Save",
          description: "No valid rankings found to save.",
        });
        return;
      }

      // Process updates sequentially to avoid race conditions
      const successfulUpdates = [];
      const failedUpdates = [];

      for (const update of updates) {
        try {
          await apiService.updateRanking(update.player_id, update.event_name, update.ranking);
          successfulUpdates.push(update);
        } catch (error) {
          console.error(`Failed to update ranking for player ${update.player_id} in event ${update.event_name}:`, error);
          failedUpdates.push({
            ...update,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Show results
      if (successfulUpdates.length > 0) {
        toast({
          title: "Rankings Partially Saved",
          description: `Successfully saved ${successfulUpdates.length} ranking(s).${failedUpdates.length > 0 ? ` ${failedUpdates.length} failed.` : ''}`,
        });
      }

      if (failedUpdates.length > 0) {
        const errorMessage = failedUpdates.map(f => 
          `Player ${f.player_id} in ${f.event_name}: ${f.error}`
        ).join(', ');
        
        toast({
          title: "Some Rankings Failed to Save",
          description: errorMessage,
          variant: "destructive",
        });
      }

      setHasUnsavedChanges(false);
      await loadAllRegistrations();
    } catch (error) {
      console.error('Error saving rankings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save rankings';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSavingRankings(false);
    }
  }

  async function saveTeamRankings() {
    if (!hasUnsavedChanges) {
      toast({
        title: "No Changes",
        description: "No ranking changes to save.",
      });
      return;
    }
    try {
      setSavingRankings(true);
      // Only update rankings for visible teams
      const validTeams = filteredRegistrations.map(reg => [reg.player_id, reg.partner_id].sort().join('-'));
      const updates = Object.entries(teamRankings)
        .filter(([teamKey, ranking]) => validTeams.includes(teamKey) && ranking !== "")
        .map(([teamKey, ranking]) => {
          const [playerId, partnerId] = teamKey.split('-');
          return {
            player_id: parseInt(playerId),
            partner_id: parseInt(partnerId),
            event_name: selectedEvent,
            ranking: parseInt(ranking)
          };
        });
      if (updates.length === 0) {
        toast({
          title: "No Rankings to Save",
          description: "No valid rankings found to save.",
        });
        return;
      }
      const successfulUpdates = [];
      const failedUpdates = [];
      for (const update of updates) {
        try {
          // Update ranking for both player and partner (if present)
          await apiService.updateRanking(update.player_id, update.event_name, update.ranking);
          successfulUpdates.push({ ...update, player_id: update.player_id });
          if (update.partner_id) {
            await apiService.updateRanking(update.partner_id, update.event_name, update.ranking);
            successfulUpdates.push({ ...update, player_id: update.partner_id });
          }
        } catch (error) {
          failedUpdates.push({ ...update, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      if (successfulUpdates.length > 0) {
        toast({
          title: "Rankings Partially Saved",
          description: `Successfully saved ${successfulUpdates.length} ranking(s).${failedUpdates.length > 0 ? ` ${failedUpdates.length} failed.` : ''}`,
        });
      }
      if (failedUpdates.length > 0) {
        const errorMessage = failedUpdates.map(f => `Team ${f.player_id} & ${f.partner_id}: ${f.error}`).join(', ');
        toast({
          title: "Some Rankings Failed to Save",
          description: errorMessage,
          variant: "destructive",
        });
      }
      setHasUnsavedChanges(false);
      await loadAllRegistrations();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save rankings',
        variant: "destructive",
      });
    } finally {
      setSavingRankings(false);
    }
  }

  function handleLogout() {
    if (hasUnsavedChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to logout?")) {
        return;
      }
    }
    
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
                  disabled={savingRankings}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center space-x-2">
                  <Shield className="h-6 w-6" />
                  <CardTitle>Admin Dashboard</CardTitle>
                  {hasUnsavedChanges && (
                    <div className="flex items-center space-x-1 text-yellow-200">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs">Unsaved changes</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white hover:bg-white/20"
                  disabled={savingRankings}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onHome}
                  disabled={savingRankings}
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
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <p className="text-red-600 font-medium">Error Loading Data</p>
                    </div>
                    <p className="text-red-500 text-sm">{error}</p>
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

              {!loading && !error && selectedEvent && isDoublesEvent(selectedEvent) && filteredRegistrations.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">
                      Teams in {selectedEvent}
                    </h4>
                    <Button
                      onClick={saveTeamRankings}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={loading || savingRankings || !hasUnsavedChanges}
                    >
                      {savingRankings ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Submit Rankings
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">S.No</TableHead>
                          <TableHead>Player 1</TableHead>
                          <TableHead>Player 2</TableHead>
                          <TableHead className="w-32">Ranking</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRegistrations.map((registration, index) => {
                          const teamKey = [registration.player_id, registration.partner_id].sort().join('-');
                          return (
                            <TableRow key={teamKey}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">{registration.player_name}</TableCell>
                              <TableCell>{registration.partner_name || 'No partner assigned'}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  placeholder="Rank"
                                  value={teamRankings[teamKey] || ""}
                                  onChange={(e) => handleTeamRankingChange(registration.player_id, registration.partner_id, e.target.value)}
                                  className="w-20"
                                  min="1"
                                  max="1000"
                                  disabled={savingRankings}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
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