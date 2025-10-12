// monopoly-frontend/src/api/game.api.js

import apiClient from './interceptor';
import { API_ENDPOINTS } from '../config/constants';

export const gameAPI = {
  /**
   * Set ready (chọn linh vật)
   * @param {Object} data - { roomCode, playerStateId, pet, ready }
   */
  setReady: async (data) => {
    console.log('📡 [gameAPI] setReady called');
    console.log('📡 [gameAPI] Data:', data);
    
    try {
      // ✅ FIX: Đảm bảo /api/ games/player/ready (sử dụng proxy)
      const response = await apiClient.post('/api/games/player/ready', data);
      
      console.log('✅ [gameAPI] setReady success:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [gameAPI] setReady error:', error);
      console.error('❌ [gameAPI] Error response:', error.response?.data);
      throw error;
    }
  },

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
    console.log('📡 [gameAPI] listRooms called');
    
    try {
      const response = await apiClient.get(API_ENDPOINTS.GAME.LIST);
      
      console.log('✅ [gameAPI] listRooms success:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [gameAPI] listRooms error:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin phòng
   * @param {string} roomCode
   */
  getRoomInfo: async (roomCode) => {
    console.log('📡 [gameAPI] getRoomInfo called:', roomCode);
    
    try {
      // ✅ FIX LỖI 404: Đảm bảo /api/games/rooms/
      const response = await apiClient.get(`/api/games/rooms/${roomCode}`);
      
      console.log('✅ [gameAPI] getRoomInfo success:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [gameAPI] getRoomInfo error:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin game
   * @param {string} gameId
   */
  getGameInfo: async (gameId) => {
    console.log('📡 [gameAPI] getGameInfo called:', gameId);
    
    try {
      // ✅ FIX: Đảm bảo /api/games/
      const response = await apiClient.get(`/api/games/${gameId}`);
      
      console.log('✅ [gameAPI] getGameInfo success:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [gameAPI] getGameInfo error:', error);
      throw error;
    }
  },

  /**
   * Start game
   * @param {Object} data - { gameId: string }
   */
  startGame: async (data) => {
    console.log('📡 [gameAPI] startGame called');
    console.log('📡 [gameAPI] Data:', data);
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.GAME.START, data);
      
      console.log('✅ [gameAPI] startGame success:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [gameAPI] startGame error:', error);
      throw error;
    }
  },

  /**
   * Roll dice
   * @param {Object} data - { gameId: string, playerStateId: string }
   */
  rollDice: async (data) => {
    console.log('📡 [gameAPI] rollDice called');
    console.log('📡 [gameAPI] Data:', data);
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.GAME.ROLL, data);
      
      console.log('✅ [gameAPI] rollDice success:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [gameAPI] rollDice error:', error);
      throw error;
    }
  },

  /**
   * Process square
   * @param {Object} data - { gameId: string, playerStateId: string }
   */
  processSquare: async (data) => {
    console.log('📡 [gameAPI] processSquare called');
    console.log('📡 [gameAPI] Data:', data);
    
    try {
      const response = await apiClient.post(API_ENDPOINTS.GAME.PROCESS, data);
      
      console.log('✅ [gameAPI] processSquare success:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ [gameAPI] processSquare error:', error);
      throw error;
    }
  },
};