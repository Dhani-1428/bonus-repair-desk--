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
      const contentType = response.headers.get('content-type') || '';
      let data: any;
      
      // Try to get response text first to see what we're dealing with
      const responseText = await response.text();
      
      if (contentType.includes('application/json') || responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('[API] Failed to parse JSON response:', responseText.substring(0, 200));
          throw new Error('Invalid JSON response from server');
        }
      } else {
        console.error('[API] Non-JSON response:', responseText.substring(0, 200));
        throw new Error('Server returned invalid response format');
      }
      
      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
        console.error('[API] Request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          data: data,
        });
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error: any) {
      // If error already has a message and is a network/timeout error, re-throw as-is
      if (error.message?.startsWith('NETWORK_ERROR:') || error.message?.startsWith('TIMEOUT:')) {
        throw error;
      }
      
      if (error.message) {
        console.error('[API] Request error:', error.message);
        throw error;
      }
      console.error('[API] Unknown error:', error);
      throw new Error('Network error. Please check your connection.');
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = 30000): Promise<Response> {
    try {
      const fetchPromise = fetch(url, options).catch((fetchError: any) => {
        // Wrap fetch errors to provide better context
        console.error('[API] Fetch error:', {
          message: fetchError.message,
          name: fetchError.name,
          url: url,
        });
        
        // Check for network-related errors
        if (fetchError.message?.includes('Network request failed') || 
            fetchError.message?.includes('Failed to fetch') ||
            fetchError.message?.includes('NetworkError') ||
            fetchError.name === 'TypeError' ||
            fetchError.code === 'NETWORK_ERROR') {
          throw new Error(`NETWORK_ERROR:${url}`);
        }
        throw fetchError;
      });
      
      const timeoutPromise = new Promise<Response>((_, reject) =>
        setTimeout(() => {
          reject(new Error(`TIMEOUT:${url}`));
        }, timeout)
      );
      
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error: any) {
      // Re-throw with proper error type
      if (error.message?.startsWith('NETWORK_ERROR:') || error.message?.startsWith('TIMEOUT:')) {
        throw error;
      }
      // Wrap any other errors
      throw new Error(`NETWORK_ERROR:${url}`);
    }
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
      // Handle network errors (fetch failures)
      if (error.message?.startsWith('NETWORK_ERROR:')) {
        const targetUrl = error.message.replace('NETWORK_ERROR:', '');
        console.error('[API] Network connection failed:', targetUrl);
        throw new Error(`Cannot connect to server.\n\nCheck:\n1. Backend is running (npm run dev)\n2. IP is correct: ${this.baseURL.replace('/api', '')}\n3. Same WiFi network\n4. Firewall allows port 3000`);
      }
      
      if (error.message?.startsWith('TIMEOUT:')) {
        const targetUrl = error.message.replace('TIMEOUT:', '');
        console.error('[API] Request timeout:', targetUrl);
        throw new Error(`Connection timeout.\n\nCheck:\n1. Backend is running\n2. IP: ${this.baseURL.replace('/api', '')}\n3. Same WiFi network`);
      }
      
      if (error.message?.includes('Network request failed') || 
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError') ||
          error.name === 'TypeError') {
        console.error('[API] Network error:', error.message);
        throw new Error(`Cannot connect to server.\n\nCheck:\n1. Backend is running (npm run dev)\n2. IP: ${this.baseURL.replace('/api', '')}\n3. Same WiFi network`);
      }
      
      if (error.message?.includes('timed out')) {
        console.error('[API] Request timeout:', url);
        throw new Error(`Connection timeout.\n\nCheck:\n1. Backend is running\n2. IP: ${this.baseURL.replace('/api', '')}\n3. Same WiFi network`);
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string) {
    try {
      console.log('[API] Attempting login to:', `${this.baseURL}/auth/login`);
      console.log('[API] Base URL:', this.baseURL);
      console.log('[API] Email:', email);
      
      // Try the auth/login endpoint first (skip auth headers for login)
      const data = await this.fetchRequest<any>(`${this.baseURL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, true);
      
      console.log('[API] Login response received:', JSON.stringify(data, null, 2));
      
      // Backend returns: { message: "Login successful", user: {...}, token: ... }
      if (data && data.user) {
        console.log('[API] Login successful, user ID:', data.user.id);
        return {
          user: data.user,
          token: data.token || data.accessToken || data.user.id || '',
        };
      }
      
      // If no user in response, something went wrong
      console.error('[API] Invalid response structure:', data);
      throw new Error(data?.error || data?.message || 'Invalid response: user data not found');
    } catch (error: any) {
      console.error('[API] Login error:', error.message);
      console.error('[API] Error details:', {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack?.substring(0, 300),
      });
      
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
            token: data.token || data.accessToken || data.user?.id || '',
          };
        } catch (altError: any) {
          throw new Error(altError.message || 'Login failed');
        }
      }
      
      // Provide more helpful error messages
      if (error.message?.includes('Cannot connect') || 
          error.message?.includes('Network request failed') || 
          error.message?.includes('Failed to fetch')) {
        // Error message already formatted, just re-throw
        throw error;
      }
      
      // If it's an authentication error, provide clearer message
      if (error.message?.includes('Invalid email or password') || 
          error.message?.includes('401') ||
          error.message?.includes('Unauthorized')) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      
      throw error;
    }
  }

  async register(
    name: string,
    email: string,
    password: string,
    shopName?: string,
    contactNumber?: string,
    address?: string,
    companyEmail?: string,
    website?: string
  ) {
    try {
      console.log('[API] Attempting registration to:', `${this.baseURL}/auth/register`);
      console.log('[API] Base URL:', this.baseURL);
      
      const registerData = {
        name,
        email,
        password,
        shopName,
        contactNumber,
        address,
        companyEmail,
        website,
      };
      
      // Try the auth/register endpoint first (skip auth headers for register)
      const data = await this.fetchRequest<any>(`${this.baseURL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(registerData),
      }, true);
      
      console.log('[API] Register response:', data);
      
      // Backend returns: { message: "User registered successfully", user: {...}, token: ... }
      if (data.user) {
        return {
          user: data.user,
          token: data.token || data.accessToken || data.user.id || '',
        };
      }
      
      // If no user in response, something went wrong
      throw new Error('Invalid response: user data not found');
    } catch (error: any) {
      console.error('[API] Register error:', error.message);
      console.error('[API] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200),
      });
      
      // Provide helpful error message for timeout
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        throw new Error(`Connection timeout. Please check:\n\n1. Backend server is running:\n   cd "C:\\Users\\sheet\\Downloads\\saa-s-admin-panel (1)"\n   npm run dev\n\n2. IP address is correct in api.ts:\n   Current: ${this.baseURL}\n   Update if your IP changed\n\n3. Phone and computer are on same WiFi network\n\n4. Firewall is not blocking port 3000`);
      }
      
      // Handle network errors
      if (error.message?.includes('Cannot connect') || 
          error.message?.includes('Network request failed') || 
          error.message?.includes('Failed to fetch')) {
        // Error message already formatted, just re-throw
        throw error;
      }
      
      // If auth/register doesn't exist, try users endpoint
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.log('[API] Trying alternative register endpoint...');
        try {
          const registerData = {
            name,
            email,
            password,
            shopName,
            contactNumber,
            address,
            companyEmail,
            website,
          };
          const data = await this.fetchRequest<any>(`${this.baseURL}/users`, {
            method: 'POST',
            body: JSON.stringify(registerData),
          }, true);
          return {
            user: data.user || data,
            token: data.token || data.accessToken || data.user?.id || '',
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

  async getTicket(ticketId: string, userId?: string) {
    const userIdParam = userId ? `?userId=${userId}` : '';
    return this.fetchRequest<any>(`${this.baseURL}/repairs/${ticketId}${userIdParam}`);
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

  async deleteTicket(ticketId: string, permanent: boolean = false) {
    const url = permanent 
      ? `${this.baseURL}/repairs/${ticketId}?permanent=true`
      : `${this.baseURL}/repairs/${ticketId}`;
    return this.fetchRequest<any>(url, {
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
    try {
      // Try subscriptions endpoint first
      const data = await this.fetchRequest<any>(`${this.baseURL}/subscriptions?userId=${userId}`);
      return data;
    } catch (error) {
      // Fallback to payments endpoint
      return this.fetchRequest<any>(`${this.baseURL}/payments?userId=${userId}`);
    }
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
