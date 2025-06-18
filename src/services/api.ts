const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    // Check for token in localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    console.log('ApiService initialized, token:', this.token ? 'Present' : 'Missing');
    console.log('Token value (first 20 chars):', this.token ? this.token.substring(0, 20) + '...' : 'null');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
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

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, clear it
        console.log('401 Unauthorized - clearing token');
        this.logout();
        throw new Error('Authentication failed. Please login again.');
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
  }

  // Auth methods
  async login(username: string, password: string) {
    console.log('Attempting admin login...');
    
    try {
      const response = await this.request('/auth/login', {
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
    const response = await this.request('/auth/user-login', {
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
        throw new Error('No authentication token available');
      }
      
      console.log('Making test request to /admin/registrations');
      // Make a simple authenticated request
      await this.request('/admin/registrations');
      console.log('Authentication test successful');
      return true;
    } catch (error) {
      console.error('Authentication test failed:', error);
      return false;
    }
  }

  // Events methods
  async getEvents() {
    return this.request('/events');
  }

  async createEvent(eventName: string) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify({ event_name: eventName }),
    });
  }

  // Players methods
  async createPlayer(playerData: any) {
    return this.request('/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  }

  async getPlayers() {
    return this.request('/players');
  }

  async getPlayerDashboard(playerId: number) {
    return this.request(`/players/dashboard/${playerId}`);
  }

  // Partners methods
  async createPartner(partnerData: any) {
    return this.request('/partners', {
      method: 'POST',
      body: JSON.stringify(partnerData),
    });
  }

  async getAvailablePartners(eventName: string, currentUserId: number) {
    return this.request(`/partners/available/${eventName}/${currentUserId}`);
  }

  async updatePartnerRelationship(eventName: string, user1Id: number, user2Id: number) {
    return this.request('/partners/update-relationship', {
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
    return this.request('/partners/register-events', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  }

  // New method to update rankings
  async updateRanking(playerId: number, eventName: string, ranking: number) {
    return this.request('/partners/update-ranking', {
      method: 'POST',
      body: JSON.stringify({
        player_id: playerId,
        event_name: eventName,
        ranking: ranking,
      }),
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
      console.log('Making request to /admin/registrations');
      const result = await this.request('/admin/registrations');
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
    return this.request('/admin/statistics');
  }
}

export const apiService = new ApiService();