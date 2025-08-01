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
  gender: string;
}

interface AvailablePartner {
  user_id: number;
  player_name: string;
  has_partner: boolean;
}

interface Event {
  event_name: string;
}

// Add a helper to determine gender filter for an event
function getGenderFilter(eventName: string): string | undefined {
  if (eventName === "Women's Singles" || eventName === "Women's Doubles") return "female";
  if (eventName === "Men's Singles" || eventName === "Men's Doubles") return "male";
  if (eventName === "Mixed Doubles") return undefined; // both
  return undefined;
}

// Gender-based event filtering helper
function getEventsForGender(events: string[], gender: string): string[] {
  if (gender === "male") {
    return events.filter(e => ["Men's Singles", "Men's Doubles", "Mixed Doubles"].includes(e));
  } else if (gender === "female") {
    return events.filter(e => ["Women's Singles", "Women's Doubles", "Mixed Doubles"].includes(e));
  }
  return events;
}

// Helper to check if event is singles
function isSinglesEvent(eventName: string): boolean {
  return eventName === "Men's Singles" || eventName === "Women's Singles";
}

const RegistrationStep2 = ({ onBack, onSubmit, initialData, isLoading, playerId, gender }: RegistrationStep2Props) => {
  const [formData, setFormData] = useState<EventSelection>(initialData);
  const [events, setEvents] = useState<string[]>([]);
  const [partnersForEvent1, setPartnersForEvent1] = useState<AvailablePartner[]>([]);
  const [partnersForEvent2, setPartnersForEvent2] = useState<AvailablePartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);

  const fetchPartnersForEvent = useCallback(async (eventName: string, setPartners: (partners: AvailablePartner[]) => void) => {
    if (!playerId) return;
    
    setLoadingPartners(true);
    try {
      // Determine gender filter for this event
      const genderFilter = getGenderFilter(eventName);
      const data = await apiService.getAvailablePartners(eventName, playerId, genderFilter);
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
        const data: Event[] = await apiService.getEvents();
        setEvents(data.map((event) => event.event_name));
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    
    fetchEvents();
  }, []);

  // Fetch available partners for event 1
  useEffect(() => {
    if (formData.event1 && playerId) {
      fetchPartnersForEvent(formData.event1, (partners) => {
        // If editing and a partner is set, ensure they are in the list
        if (initialData.partner1 && initialData.partner1 !== "not-registered" && !partners.some(p => String(p.user_id) === initialData.partner1)) {
          partners = [
            ...partners,
            {
              user_id: parseInt(initialData.partner1),
              player_name: "(Current Partner)",
              has_partner: false
            }
          ];
        }
        setPartnersForEvent1(partners);
      });
    } else {
      setPartnersForEvent1([]);
    }
  }, [formData.event1, playerId, fetchPartnersForEvent, initialData.partner1]);

  // Fetch available partners for event 2
  useEffect(() => {
    if (formData.event2 && playerId) {
      fetchPartnersForEvent(formData.event2, (partners) => {
        if (initialData.partner2 && initialData.partner2 !== "not-registered" && !partners.some(p => String(p.user_id) === initialData.partner2)) {
          partners = [
            ...partners,
            {
              user_id: parseInt(initialData.partner2),
              player_name: "(Current Partner)",
              has_partner: false
            }
          ];
        }
        setPartnersForEvent2(partners);
      });
    } else {
      setPartnersForEvent2([]);
    }
  }, [formData.event2, playerId, fetchPartnersForEvent, initialData.partner2]);

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
    
    // Singles event: partner should be empty or 'no partner', skip partner validation
    if (formData.event1 && !isSinglesEvent(formData.event1) && !formData.partner1) {
      alert("Please select a partner for Event 1");
      return;
    }
    
    if (formData.event2 && !isSinglesEvent(formData.event2) && !formData.partner2) {
      alert("Please select a partner for Event 2");
      return;
    }
    
    // If singles, set partner to empty string
    const submitData = {
      ...formData,
      partner1: isSinglesEvent(formData.event1) ? "" : formData.partner1,
      partner2: isSinglesEvent(formData.event2) ? "" : formData.partner2,
    };
    onSubmit(submitData);
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
                  {getEventsForGender(events, gender).map((event) => (
                    <SelectItem key={event} value={event}>
                      {event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="partner1">Select Partner</Label>
              {isSinglesEvent(formData.event1) ? (
                <Select value="no-partner" disabled>
                  <SelectTrigger className="mt-1">
                    <SelectValue>No partner</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-partner">No partner</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
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
              )}
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
                  {getEventsForGender(events, gender)
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
              {isSinglesEvent(formData.event2) ? (
                <Select value="no-partner" disabled>
                  <SelectTrigger className="mt-1">
                    <SelectValue>No partner</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-partner">No partner</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
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
              )}
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