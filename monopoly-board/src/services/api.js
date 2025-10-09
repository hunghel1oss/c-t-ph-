// src/services/api.js
const axios = require('axios')

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const api = {
  // ===========================================
  // ROOM MANAGEMENT
  // ===========================================
  
  /**
   * Get all available rooms
   */
  getRooms: async () => {
    try {
      const response = await apiClient.get('/rooms');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      // Return mock data for development
      return [
        {
          _id: 'room1',
          name: 'Game Room 1',
          players: [],
          maxPlayers: 4,
          status: 'waiting'
        },
        {
          _id: 'room2', 
          name: 'Game Room 2',
          players: [{id: 'player1'}],
          maxPlayers: 4,
          status: 'waiting'
        }
      ];
    }
  },

  /**
   * Get room details
   */
  getRoomDetails: async (roomId) => {
    try {
      return await apiClient.get(`/rooms/${roomId}`);
    } catch (error) {
      console.error('Error fetching room details:', error);
      throw error;
    }
  },

  // ===========================================
  // USER MANAGEMENT  
  // ===========================================
  
  /**
   * Create new user
   */
  createUser: async (userData) => {
    try {
      return await apiClient.post('/users', userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  getUser: async (userId) => {
    try {
      return await apiClient.get(`/users/${userId}`);
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  /**
   * Update user
   */
  updateUser: async (userId, userData) => {
    try {
      return await apiClient.put(`/users/${userId}`, userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // ===========================================
  // GAME HISTORY & STATS
  // ===========================================
  
  /**
   * Get game history
   */
  getGameHistory: async (userId) => {
    try {
      return await apiClient.get(`/games/history/${userId}`);
    } catch (error) {
      console.error('Error fetching game history:', error);
      return [];
    }
  },

  /**
   * Get player statistics
   */
  getPlayerStats: async (userId) => {
    try {
      return await apiClient.get(`/players/stats/${userId}`);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return {};
    }
  },

  // ===========================================
  // UTILITY METHODS
  // ===========================================
  
  /**
   * Initialize API client
   */
  initialize: (config = {}) => {
    if (config.baseURL) {
      apiClient.defaults.baseURL = config.baseURL;
    }
    if (config.timeout) {
      apiClient.defaults.timeout = config.timeout;
    }
  },

  /**
   * Cleanup resources
   */
  cleanup: () => {
    // Cancel any pending requests if needed
    // This is a placeholder for cleanup logic
  }
};

export default api;
