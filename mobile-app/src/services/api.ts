import axios from 'axios';
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
    request: Promise<any>
  ): Promise<T> {
    try {
      const response = await request;
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          error.response.data?.error || error.response.data?.message || 'Request failed'
        );
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error(error.message || 'An unexpected error occurred');
      }
    }
  }

  // Authentication
  async login(email: string, password: string) {
    try {
      // Try the auth/login endpoint first
      const response = await axios.post(`${this.baseURL}/auth/login`, { email, password });
      
      // If successful, return the response
      if (response.data.user) {
        return {
          user: response.data.user,
          token: response.data.token || response.data.accessToken || '',
        };
      }
      
      // Fallback: try register endpoint format
      return {
        user: response.data,
        token: '',
      };
    } catch (error: any) {
      // If auth/login doesn't exist, try alternative endpoints
      if (error.response?.status === 404) {
        // Try alternative login endpoint
        return this.handleRequest(
          axios.post(`${this.baseURL}/users/login`, { email, password })
        );
      }
      throw error;
    }
  }

  async register(name: string, email: string, password: string, shopName?: string) {
    try {
      // Try the auth/register endpoint first
      const response = await axios.post(`${this.baseURL}/auth/register`, {
        name,
        email,
        password,
        shopName,
      });
      
      if (response.data.user) {
        return {
          user: response.data.user,
          token: response.data.token || response.data.accessToken || '',
        };
      }
      
      return {
        user: response.data,
        token: '',
      };
    } catch (error: any) {
      // If auth/register doesn't exist, try users endpoint
      if (error.response?.status === 404) {
        return this.handleRequest(
          axios.post(`${this.baseURL}/users`, { name, email, password, shopName })
        );
      }
      throw error;
    }
  }

  // Users
  async getUser(userId: string) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.get(`${this.baseURL}/users?id=${userId}`, { headers })
    );
  }

  async updateUser(userId: string, userData: any) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.put(`${this.baseURL}/users/${userId}`, userData, { headers })
    );
  }

  // Repair Tickets
  async getTickets(userId: string, deleted?: boolean) {
    const headers = await this.getHeaders();
    const deletedParam = deleted ? '&deleted=true' : '';
    return this.handleRequest(
      axios.get(`${this.baseURL}/repairs?userId=${userId}${deletedParam}`, { headers })
    );
  }

  async getTicket(ticketId: string) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.get(`${this.baseURL}/repairs/${ticketId}`, { headers })
    );
  }

  async createTicket(ticketData: any) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.post(`${this.baseURL}/repairs/create`, ticketData, { headers })
    );
  }

  async updateTicket(ticketId: string, ticketData: any) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.put(`${this.baseURL}/repairs/${ticketId}`, ticketData, { headers })
    );
  }

  async deleteTicket(ticketId: string) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.delete(`${this.baseURL}/repairs/${ticketId}`, { headers })
    );
  }

  // Team Members
  async getTeamMembers(userId: string) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.get(`${this.baseURL}/team?userId=${userId}`, { headers })
    );
  }

  async createTeamMember(memberData: any) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.post(`${this.baseURL}/team`, memberData, { headers })
    );
  }

  async updateTeamMember(memberId: string, memberData: any) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.put(`${this.baseURL}/team/${memberId}`, memberData, { headers })
    );
  }

  async deleteTeamMember(memberId: string) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.delete(`${this.baseURL}/team/${memberId}`, { headers })
    );
  }

  // Payments/Subscriptions
  async getSubscriptions(userId: string) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.get(`${this.baseURL}/payments?userId=${userId}`, { headers })
    );
  }

  async createPayment(paymentData: any) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.post(`${this.baseURL}/payments`, paymentData, { headers })
    );
  }

  // Analytics
  async getAnalytics(userId: string) {
    const headers = await this.getHeaders();
    return this.handleRequest(
      axios.get(`${this.baseURL}/analytics?userId=${userId}`, { headers })
    );
  }
}

export const apiService = new ApiService();
