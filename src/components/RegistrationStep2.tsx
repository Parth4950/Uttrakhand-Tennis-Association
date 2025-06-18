import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventSelection } from "./Registration";
import { apiService } from "../services/api";

interface RegistrationStep2Props {
  onBack: () => void;
  onSubmit: (data: EventSelection) => void;
  initialData: EventSelection;
  isLoading: boolean;
  playerId: number | null;
}

interface AvailablePartner {
  user_id: number;
  player_name: string;
  has_partner: boolean;
}

const RegistrationStep2 = ({ onBack, onSubmit, initialData, isLoading, playerId }: RegistrationStep2Props) => {
  const [formData, setFormData] = useState<EventSelection>(initialData);
  const [events, setEvents] = useState<string[]>([]);
  const [partnersForEvent1, setPartnersForEvent1] = useState<AvailablePartner[]>([]);
  const [partnersForEvent2, setPartnersForEvent2] = useState<AvailablePartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);

  const fetchPartnersForEvent = useCallback(async (eventName: string, setPartners: (partners: AvailablePartner[]) => void) => {
    if (!playerId) return;
    
    setLoadingPartners(true);
    try {
      const data = await apiService.getAvailablePartners(eventName, playerId);
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      setPartners([]);
    } finally {
      setLoadingPartners(false);
    }
  }, [playerId]);

  // Fetch available events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiService.getEvents();
        setEvents(data.map((event: any) => event.event_name));
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    
    fetchEvents();
  }, []);

  // Fetch available partners for event 1
  useEffect(() => {
    if (formData.event1 && playerId) {
      fetchPartnersForEvent(formData.event1, setPartnersForEvent1);
    } else {
      setPartnersForEvent1([]);
    }
  }, [formData.event1, playerId, fetchPartnersForEvent]);

  // Fetch available partners for event 2
  useEffect(() => {
    if (formData.event2 && playerId) {
      fetchPartnersForEvent(formData.event2, setPartnersForEvent2);
    } else {
      setPartnersForEvent2([]);
    }
  }, [formData.event2, playerId, fetchPartnersForEvent]);

  const handleInputChange = (field: keyof EventSelection, value: string) => {
    const actualValue = value === "no-event" ? "" : value;
    setFormData(prev => ({ ...prev, [field]: actualValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one event is selected
    if (!formData.event1 && !formData.event2) {
      alert("Please select at least one event");
      return;
    }
    
    // Validate that if an event is selected, a partner is also selected
    if (formData.event1 && !formData.partner1) {
      alert("Please select a partner for Event 1");
      return;
    }
    
    if (formData.event2 && !formData.partner2) {
      alert("Please select a partner for Event 2");
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Event Selection</h3>
      <p className="text-gray-600 mb-6">You can participate in up to 2 categories</p>
      
      <div className="space-y-8">
        {/* Event 1 */}
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium mb-4">Event 1</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event1">Select Event</Label>
              <Select
                value={formData.event1 || "no-event"}
                onValueChange={(value) => handleInputChange("event1", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-event">No Event Selected</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event} value={event}>
                      {event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="partner1">Select Partner</Label>
              <Select
                value={formData.partner1 || "no-partner"}
                onValueChange={(value) => handleInputChange("partner1", value === "no-partner" ? "" : value)}
                disabled={!formData.event1 || loadingPartners}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingPartners ? "Loading partners..." : "Choose your partner"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-registered">Partner not registered yet</SelectItem>
                  {partnersForEvent1.map((partner) => (
                    <SelectItem 
                      key={partner.user_id} 
                      value={partner.user_id.toString()}
                      disabled={partner.has_partner}
                    >
                      {partner.player_name} {partner.has_partner ? "(Already has partner)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Event 2 */}
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium mb-4">Event 2 (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event2">Select Event</Label>
              <Select
                value={formData.event2 || "no-event"}
                onValueChange={(value) => handleInputChange("event2", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-event">No Event Selected</SelectItem>
                  {events
                    .filter(event => event !== formData.event1)
                    .map((event) => (
                      <SelectItem key={event} value={event}>
                        {event}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="partner2">Select Partner</Label>
              <Select
                value={formData.partner2 || "no-partner"}
                onValueChange={(value) => handleInputChange("partner2", value === "no-partner" ? "" : value)}
                disabled={!formData.event2 || loadingPartners}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingPartners ? "Loading partners..." : "Choose your partner"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-registered">Partner not registered yet</SelectItem>
                  {partnersForEvent2.map((partner) => (
                    <SelectItem 
                      key={partner.user_id} 
                      value={partner.user_id.toString()}
                      disabled={partner.has_partner}
                    >
                      {partner.player_name} {partner.has_partner ? "(Already has partner)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack} 
          className="flex-1"
          disabled={isLoading}
        >
          Back
        </Button>
        <Button 
          type="submit" 
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={isLoading}
        >
          {isLoading ? "Submitting..." : "Submit Registration"}
        </Button>
      </div>
    </form>
  );
};

export default RegistrationStep2;