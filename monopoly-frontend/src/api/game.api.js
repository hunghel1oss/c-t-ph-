import apiClient from './interceptor';
import { API_ENDPOINTS } from '../config/constants';

export const gameAPI = {
  /**
   * Tạo phòng mới
   * @param {Object} data - { duration: number }
   */
  createRoom: async (data) => {
    console.log('📡 [gameAPI] createRoom called');
    console.log('📡 [gameAPI] Data:', data);
    console.log('📡 [gameAPI] Endpoint:', API_ENDPOINTS.GAME.CREATE);
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.GAME.CREATE, data);
      
      console.log('✅ [gameAPI] createRoom success:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [gameAPI] createRoom error:', error);
      console.error('❌ [gameAPI] Error response:', error.response?.data);
      console.error('❌ [gameAPI] Error status:', error.response?.status);
      throw error;
    }
  },

  /**
   * Join phòng
   * @param {Object} data - { roomCode: string }
   */
  joinRoom: async (data) => {
    console.log('📡 [gameAPI] joinRoom called');
    console.log('📡 [gameAPI] Data:', data);
    console.log('📡 [gameAPI] Endpoint:', API_ENDPOINTS.GAME.JOIN);
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.GAME.JOIN, data);
      
      console.log('✅ [gameAPI] joinRoom success:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [gameAPI] joinRoom error:', error);
      console.error('❌ [gameAPI] Error response:', error.response?.data);
      console.error('❌ [gameAPI] Error status:', error.response?.status);
      throw error;
    }
  },

  /**
   * Lấy danh sách phòng
   */
  listRooms: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.GAME.LIST);
      return response.data;
    } catch (error) {
      console.error('❌ List rooms error:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin phòng
   * @param {string} roomCode
   */
  getRoomInfo: async (roomCode) => {
    try {
      const response = await apiClient.get(`/api/games/rooms/${roomCode}`);
      return response.data;
    } catch (error) {
      console.error('❌ Get room info error:', error);
      throw error;
    }
  },

  /**
   * Start game
   * @param {Object} data - { gameId: string }
   */
  startGame: async (data) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.GAME.START, data);
      return response.data;
    } catch (error) {
      console.error('❌ Start game error:', error);
      throw error;
    }
  },

  /**
   * Roll dice
   * @param {Object} data - { gameId: string, playerStateId: string }
   */
  rollDice: async (data) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.GAME.ROLL, data);
      return response.data;
    } catch (error) {
      console.error('❌ Roll dice error:', error);
      throw error;
    }
  },

  /**
   * Process square
   * @param {Object} data - { gameId: string, playerStateId: string }
   */
  processSquare: async (data) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.GAME.PROCESS, data);
      return response.data;
    } catch (error) {
      console.error('❌ Process square error:', error);
      throw error;
    }
  },
};
