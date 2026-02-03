import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this to your website's API base URL
const API_BASE_URL = __DEV__ 
  ? 'http://172.20.10.6:3000/api'  // Your computer's IP - phone needs this to connect!
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
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || `Request failed with status ${response.status}`
        );
      }
      
      return data;
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  private async fetchRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    return this.handleRequest<T>(Promise.resolve(response));
  }

  // Authentication
  async login(email: string, password: string) {
    try {
      // Try the auth/login endpoint first
      const data = await this.fetchRequest<any>(`${this.baseURL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // If successful, return the response
      if (data.user) {
        return {
          user: data.user,
          token: data.token || data.accessToken || '',
        };
      }
      
      // Fallback: try register endpoint format
      return {
        user: data,
        token: '',
      };
    } catch (error: any) {
      // If auth/login doesn't exist, try alternative endpoints
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        // Try alternative login endpoint
        const data = await this.fetchRequest<any>(`${this.baseURL}/users/login`, {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        return {
          user: data.user || data,
          token: data.token || data.accessToken || '',
        };
      }
      throw error;
    }
  }

  async register(name: string, email: string, password: string, shopName?: string) {
    try {
      // Try the auth/register endpoint first
      const data = await this.fetchRequest<any>(`${this.baseURL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password, shopName }),
      });
      
      if (data.user) {
        return {
          user: data.user,
          token: data.token || data.accessToken || '',
        };
      }
      
      return {
        user: data,
        token: '',
      };
    } catch (error: any) {
      // If auth/register doesn't exist, try users endpoint
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        const data = await this.fetchRequest<any>(`${this.baseURL}/users`, {
          method: 'POST',
          body: JSON.stringify({ name, email, password, shopName }),
        });
        return {
          user: data.user || data,
          token: data.token || data.accessToken || '',
        };
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
