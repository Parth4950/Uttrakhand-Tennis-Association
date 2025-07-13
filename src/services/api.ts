const BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiService {
  private token: string | null = null;
  private requestTimeout = 10000; // 10 seconds

  constructor() {
    // Check for token in localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    console.log('ApiService initialized, token:', this.token ? 'Present' : 'Missing');
    console.log('Token value (first 20 chars):', this.token ? this.token.substring(0, 20) + '...' : 'null');
    console.log('BASE_URL:', BASE_URL); 
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    console.log(`Making request to: ${url}`);
    console.log(`Token present: ${!!this.token}`);
    console.log(`Authorization header: ${headers['Authorization'] ? 'Present' : 'Missing'}`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, clear it
          console.log('401 Unauthorized - clearing token');
          this.logout();
          throw new Error('Authentication failed. Please login again.');
        }
        
        if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to perform this action.');
        }
        
        if (response.status === 404) {
          throw new Error('Resource not found. Please check the URL and try again.');
        }
        
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        let errorMessage = 'API request failed';
        
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          console.log('Could not parse error response as JSON');
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error(`API Error: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please check your connection and try again.');
        }
        throw error;
      }
      
      throw new Error('Network error. Please check your connection and try again.');
    }
  }

  // Auth methods
  async login(username: string, password: string) {
    console.log('Attempting admin login...');
    
    if (!username.trim() || !password.trim()) {
      throw new Error('Username and password are required');
    }
    
    try {
      const response = await this.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      console.log('Login response:', response);
      
      if (response.access_token) {
        this.token = response.access_token;
        localStorage.setItem('auth_token', this.token);
        console.log('Login successful, token stored');
        console.log('Stored token (first 20 chars):', this.token.substring(0, 20) + '...');
        return response;
      } else {
        console.error('No access token in response:', response);
        throw new Error('Invalid login response - no token received');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      // Clear any existing token on login failure
      this.logout();
      throw error;
    }
  }

  // User login method (no JWT required)
  async userLogin(whatsapp: string, dateOfBirth: string) {
    console.log("📬 userLogin() called with:", { whatsapp, dateOfBirth });
    
    if (!whatsapp.trim() || !dateOfBirth.trim()) {
      throw new Error('WhatsApp number and date of birth are required');
    }
    
    const response = await this.request('/api/auth/user-login', {
      method: 'POST',
      body: JSON.stringify({ 
        whatsapp: whatsapp, 
        date_of_birth: dateOfBirth 
      }),
    });
    return response;
  }

  logout() {
    console.log('Logging out - clearing token');
    this.token = null;
    localStorage.removeItem('auth_token');
    console.log('Token cleared from memory and localStorage');
  }

  isAuthenticated() {
    console.log('Checking authentication status...');
    
    // First check instance variable
    if (this.token) {
      console.log('Token found in instance variable');
      return true;
    }
    
    // Check localStorage if instance variable is null
    const localToken = localStorage.getItem('auth_token');
    console.log('Checking localStorage for token:', localToken ? 'Found' : 'Not found');
    
    if (localToken) {
      console.log('Token found in localStorage, restoring to instance');
      this.token = localToken;
      return true;
    }
    
    console.log('No valid token found anywhere');
    return false;
  }

  // Method to get current token for debugging
  getCurrentToken() {
    const currentToken = this.token || localStorage.getItem('auth_token');
    console.log('getCurrentToken called, returning:', currentToken ? 'Present' : 'Missing');
    return currentToken;
  }

  // Method to manually refresh token from localStorage
  refreshTokenFromStorage() {
    console.log('Refreshing token from localStorage...');
    const storedToken = localStorage.getItem('auth_token');
    console.log('Found token in storage:', storedToken ? 'Yes' : 'No');
    
    if (storedToken) {
      this.token = storedToken;
      console.log('Token refreshed from storage successfully');
      console.log('Refreshed token (first 20 chars):', storedToken.substring(0, 20) + '...');
      return true;
    }
    console.log('No token found in localStorage');
    return false;
  }

  // Test authentication with a simple endpoint
  async testAuth() {
    console.log('Testing authentication...');
    console.log('Current token status:', this.token ? 'Present' : 'Missing');
    
    try {
      if (!this.isAuthenticated()) {
        console.log('No authentication token available for testing');
        return false;
      }
      
      console.log('Making test request to /api/admin/registrations');
      // Make a simple authenticated request
      await this.request('/api/admin/registrations');
      console.log('Authentication test successful');
      return true;
    } catch (error) {
      console.error('Authentication test failed:', error);
      return false;
    }
  }

  // Events methods
  async getEvents() {
    return this.request('/api/events');
  }

  async createEvent(eventName: string) {
    if (!eventName.trim()) {
      throw new Error('Event name is required');
    }
    
    return this.request('/api/events', {
      method: 'POST',
      body: JSON.stringify({ event_name: eventName }),
    });
  }

  // Players methods
  async createPlayer(playerData: any) {
    console.log("Sending player payload", playerData);
    
    // Validate required fields
    if (!playerData.name?.trim() || !playerData.whatsapp_number?.trim()) {
      throw new Error('Player name and WhatsApp number are required');
    }
    
    return this.request('/api/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  }

  async getPlayers() {
    return this.request('/api/players');
  }

  async getPlayerDashboard(playerId: number) {
    if (!playerId || playerId <= 0) {
      throw new Error('Valid player ID is required');
    }
    
    return this.request(`/api/players/dashboard/${playerId}`);
  }

  // Partners methods
  async createPartner(partnerData: any) {
    if (!partnerData.event_name?.trim() || !partnerData.user_id) {
      throw new Error('Event name and user ID are required');
    }
    
    return this.request('/api/partners', {
      method: 'POST',
      body: JSON.stringify(partnerData),
    });
  }

 async getAvailablePartners(eventName: string, currentUserId: number) {
  if (!eventName?.trim() || !currentUserId || currentUserId <= 0) {
    throw new Error('Valid event name and user ID are required');
  }
  
  const encodedEvent = encodeURIComponent(eventName); 
  return this.request(`/api/partners/available/${encodedEvent}/${currentUserId}`);
}

  async updatePartnerRelationship(eventName: string, user1Id: number, user2Id: number) {
    if (!eventName?.trim() || !user1Id || !user2Id || user1Id <= 0 || user2Id <= 0) {
      throw new Error('Valid event name and user IDs are required');
    }
    
    return this.request('/api/partners/update-relationship', {
      method: 'POST',
      body: JSON.stringify({
        event_name: eventName,
        user1_id: user1Id,
        user2_id: user2Id,
      }),
    });
  }

  async registerPlayerForEvents(registrationData: {
    player_id: number;
    event1_name?: string;
    partner1_id?: number;
    event2_name?: string;
    partner2_id?: number;
  }) {
    if (!registrationData.player_id || registrationData.player_id <= 0) {
      throw new Error('Valid player ID is required');
    }
    
    return this.request('/api/partners/register-events', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  }

  // New method to update rankings
  async updateRanking(playerId: number, eventName: string, ranking: number) {
    if (!playerId || playerId <= 0) {
      throw new Error('Valid player ID is required');
    }
    
    if (!eventName?.trim()) {
      throw new Error('Event name is required');
    }
    
    if (!ranking || ranking <= 0 || ranking > 1000) {
      throw new Error('Ranking must be a positive number between 1 and 1000');
    }
    
    return this.request('/api/partners/update-ranking', {
      method: 'POST',
      body: JSON.stringify({
        player_id: playerId,
        event_name: eventName,
        ranking: ranking,
      }),
    });
  }

  // Update player info
  async updatePlayer(playerId: number, playerData: any) {
    if (!playerId || playerId <= 0) {
      throw new Error('Valid player ID is required');
    }
    return this.request(`/api/players/${playerId}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
  }

  // Delete all partners for a player (used for edit mode)
  async deleteAllPartnersForPlayer(playerId: number) {
    if (!playerId || playerId <= 0) {
      throw new Error('Valid player ID is required');
    }
    return this.request(`/api/partners/delete-all/${playerId}`, {
      method: 'DELETE',
    });
  }

  // Admin methods
  async getAllRegistrations() {
    console.log('getAllRegistrations called');
    console.log(`Current token: ${this.token ? 'Present' : 'Missing'}`);
    
    if (!this.isAuthenticated()) {
      console.error('Not authenticated - no token available');
      throw new Error('Not authenticated. Please login first.');
    }
    
    try {
      console.log('Making request to /api/admin/registrations');
      const result = await this.request('/api/admin/registrations');
      console.log('getAllRegistrations completed successfully');
      return result;
    } catch (error) {
      console.error('getAllRegistrations failed:', error);
      throw error;
    }
  }

  async getEventStatistics() {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please login first.');
    }
    return this.request('/api/admin/statistics');
  }
}

export const apiService = new ApiService();