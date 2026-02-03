import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this to your website's API base URL
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.0.11:3000/api'  // Your computer's IP - phone needs this to connect!
  : 'https://your-website.com/api'; // Replace with your production URL

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async getHeaders() {
    const token = await AsyncStorage.getItem('token');
    const user = await AsyncStorage.getItem('user');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      // Some APIs might need user ID in headers
      ...(user && { 'X-User-Id': user ? JSON.parse(user).id : '' }),
    };
  }

  private async handleRequest<T>(
    request: Promise<Response>
  ): Promise<T> {
    try {
      const response = await request;
      
      // Check if response has content
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          const text = await response.text();
          console.error('[API] Failed to parse JSON response:', text);
          throw new Error('Invalid response from server');
        }
      } else {
        const text = await response.text();
        console.error('[API] Non-JSON response:', text);
        throw new Error('Server returned invalid response format');
      }
      
      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
        console.error('[API] Request failed:', errorMessage, data);
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error: any) {
      if (error.message) {
        console.error('[API] Request error:', error.message);
        throw error;
      }
      console.error('[API] Unknown error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = 30000): Promise<Response> {
    return Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) =>
        setTimeout(() => {
          const error = new Error(`Network request timed out after ${timeout/1000} seconds.\n\nPlease ensure:\n1. Backend server is running (run: npm run start-backend)\n2. Server is accessible at: ${url}\n3. Phone and computer are on same WiFi network`);
          reject(error);
        }, timeout)
      ),
    ]);
  }

  private async fetchRequest<T>(
    url: string,
    options: RequestInit = {},
    skipAuth: boolean = false
  ): Promise<T> {
    let headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (!skipAuth) {
      const authHeaders = await this.getHeaders();
      headers = { ...headers, ...authHeaders };
    }
    
    try {
      const response = await this.fetchWithTimeout(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      }, 30000); // 30 second timeout
      return this.handleRequest<T>(Promise.resolve(response));
    } catch (error: any) {
      if (error.message?.includes('timed out')) {
        console.error('[API] Request timeout:', url);
        throw new Error(`Connection timeout. Please check:\n1. Backend server is running (npm run dev)\n2. IP address is correct: ${this.baseURL}\n3. Phone and computer are on same WiFi`);
      }
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string) {
    try {
      console.log('[API] Attempting login to:', `${this.baseURL}/auth/login`);
      
      // Try the auth/login endpoint first (skip auth headers for login)
      const data = await this.fetchRequest<any>(`${this.baseURL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, true);
      
      console.log('[API] Login response:', data);
      
      // Backend returns: { message: "Login successful", user: {...} }
      if (data.user) {
        return {
          user: data.user,
          token: data.token || data.accessToken || '',
        };
      }
      
      // If no user in response, something went wrong
      throw new Error('Invalid response: user data not found');
    } catch (error: any) {
      console.error('[API] Login error:', error.message);
      
      // If auth/login doesn't exist, try alternative endpoints
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.log('[API] Trying alternative login endpoint...');
        try {
          const data = await this.fetchRequest<any>(`${this.baseURL}/users/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          }, true);
          return {
            user: data.user || data,
            token: data.token || data.accessToken || '',
          };
        } catch (altError: any) {
          throw new Error(altError.message || 'Login failed');
        }
      }
      throw error;
    }
  }

  async register(name: string, email: string, password: string, shopName?: string) {
    try {
      console.log('[API] Attempting registration to:', `${this.baseURL}/auth/register`);
      console.log('[API] Base URL:', this.baseURL);
      
      // Try the auth/register endpoint first (skip auth headers for register)
      const data = await this.fetchRequest<any>(`${this.baseURL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password, shopName }),
      }, true);
      
      console.log('[API] Register response:', data);
      
      // Backend returns: { message: "User registered successfully", user: {...} }
      if (data.user) {
        return {
          user: data.user,
          token: data.token || data.accessToken || '',
        };
      }
      
      // If no user in response, something went wrong
      throw new Error('Invalid response: user data not found');
    } catch (error: any) {
      console.error('[API] Register error:', error.message);
      
      // Provide helpful error message for timeout
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        throw new Error(`Connection timeout. Please check:\n\n1. Backend server is running:\n   cd "C:\\Users\\sheet\\Downloads\\saa-s-admin-panel (1)"\n   npm run dev\n\n2. IP address is correct in api.ts:\n   Current: ${this.baseURL}\n   Update if your IP changed\n\n3. Phone and computer are on same WiFi network\n\n4. Firewall is not blocking port 3000`);
      }
      
      // If auth/register doesn't exist, try users endpoint
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.log('[API] Trying alternative register endpoint...');
        try {
          const data = await this.fetchRequest<any>(`${this.baseURL}/users`, {
            method: 'POST',
            body: JSON.stringify({ name, email, password, shopName }),
          }, true);
          return {
            user: data.user || data,
            token: data.token || data.accessToken || '',
          };
        } catch (altError: any) {
          throw new Error(altError.message || 'Registration failed');
        }
      }
      throw error;
    }
  }

  // Users
  async getUser(userId: string) {
    return this.fetchRequest<any>(`${this.baseURL}/users?id=${userId}`);
  }

  async updateUser(userId: string, userData: any) {
    return this.fetchRequest<any>(`${this.baseURL}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Repair Tickets
  async getTickets(userId: string, deleted?: boolean) {
    const deletedParam = deleted ? '&deleted=true' : '';
    return this.fetchRequest<any>(`${this.baseURL}/repairs?userId=${userId}${deletedParam}`);
  }

  async getTicket(ticketId: string) {
    return this.fetchRequest<any>(`${this.baseURL}/repairs/${ticketId}`);
  }

  async createTicket(ticketData: any) {
    return this.fetchRequest<any>(`${this.baseURL}/repairs/create`, {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  }

  async updateTicket(ticketId: string, ticketData: any) {
    return this.fetchRequest<any>(`${this.baseURL}/repairs/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(ticketData),
    });
  }

  async deleteTicket(ticketId: string) {
    return this.fetchRequest<any>(`${this.baseURL}/repairs/${ticketId}`, {
      method: 'DELETE',
    });
  }

  // Team Members
  async getTeamMembers(userId: string) {
    return this.fetchRequest<any>(`${this.baseURL}/team-members?userId=${userId}`);
  }

  async createTeamMember(memberData: any) {
    return this.fetchRequest<any>(`${this.baseURL}/team-members`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async updateTeamMember(memberId: string, memberData: any) {
    return this.fetchRequest<any>(`${this.baseURL}/team-members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });
  }

  async deleteTeamMember(memberId: string) {
    return this.fetchRequest<any>(`${this.baseURL}/team-members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Payments/Subscriptions
  async getSubscriptions(userId: string) {
    return this.fetchRequest<any>(`${this.baseURL}/payments?userId=${userId}`);
  }

  async createPayment(paymentData: any) {
    return this.fetchRequest<any>(`${this.baseURL}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Analytics
  async getAnalytics(userId: string) {
    return this.fetchRequest<any>(`${this.baseURL}/analytics?userId=${userId}`);
  }
}

export const apiService = new ApiService();
