// src/services/gameService.js
// Unified game service - combines socket operations and REST API calls

import { gameClient } from './gameClient'
import { api } from './api'

/**
 * Game Service - Central hub for all game-related operations
 * Combines socket-based real-time operations with REST API calls
 */
export const gameService = {
  // ===========================================
  // SOCKET OPERATIONS (Real-time)
  // ===========================================
  
  // Room Management
  createRoom: gameClient.createRoom,
  joinRoom: gameClient.joinRoom,
  leaveRoom: gameClient.leaveRoom,
  getRoomInfo: gameClient.getRoomInfo,
  
  // Game Actions
  startGame: gameClient.startGame,
  rollDice: gameClient.rollDice,
  buyProperty: gameClient.buyProperty,
  payRent: gameClient.payRent,
  endTurn: gameClient.endTurn,
  
  // Player Actions
  movePlayer: gameClient.movePlayer,
  updatePlayerMoney: gameClient.updatePlayerMoney,
  
  // Game State
  getGameState: gameClient.getGameState,
  
  // ===========================================
  // REST API OPERATIONS (HTTP)
  // ===========================================
  
  // User Management
  createUser: api.createUser,
  getUser: api.getUser,
  updateUser: api.updateUser,
  
  // Game History & Stats
  getGameHistory: api.getGameHistory,
  getPlayerStats: api.getPlayerStats,
  
  // Room Management (HTTP)
  getRooms: api.getRooms,
  getRoomDetails: api.getRoomDetails,
  
  // ===========================================
  // UTILITY METHODS
  // ===========================================
  
  /**
   * Check if socket is connected
   */
  isConnected: () => {
    return gameClient.isConnected ? gameClient.isConnected() : false
  },
  
  /**
   * Get connection status
   */
  getConnectionStatus: () => {
    return {
      socket: gameClient.isConnected ? gameClient.isConnected() : false,
      api: true // API is always available (assuming network is ok)
    }
  },
  
  /**
   * Initialize game service
   * @param {Object} config - Configuration object
   */
  initialize: (config = {}) => {
    // Initialize socket client if needed
    if (gameClient.initialize) {
      gameClient.initialize(config.socket)
    }
    
    // Initialize API client if needed
    if (api.initialize) {
      api.initialize(config.api)
    }
  },
  
  /**
   * Cleanup resources
   */
  cleanup: () => {
    if (gameClient.cleanup) {
      gameClient.cleanup()
    }
    
    if (api.cleanup) {
      api.cleanup()
    }
  }
}

// ===========================================
// CONVENIENCE METHODS
// ===========================================

/**
 * Quick game flow methods
 */
export const gameFlow = {
  /**
   * Complete player turn sequence
   */
  completeTurn: async (playerId) => {
    try {
      const rollResult = await gameService.rollDice(playerId)
      if (!rollResult.ok) return rollResult
      
      // Move player
      const moveResult = await gameService.movePlayer(playerId, rollResult.newPosition)
      if (!moveResult.ok) return moveResult
      
      // End turn
      return await gameService.endTurn(playerId)
    } catch (error) {
      return { ok: false, reason: error.message }
    }
  },
  
  /**
   * Quick room setup
   */
  setupRoom: async (roomName, maxPlayers = 4) => {
    try {
      const createResult = await gameService.createRoom({ name: roomName, maxPlayers })
      if (!createResult.ok) return createResult
      
      return await gameService.getRoomInfo(createResult.roomId)
    } catch (error) {
      return { ok: false, reason: error.message }
    }
  }
}

// ===========================================
// EXPORTS
// ===========================================

// Default export
export default gameService

// Named exports for specific use cases
export const {
  // Socket operations
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  rollDice,
  buyProperty,
  endTurn,
  getGameState,
  
  // API operations
  createUser,
  getUser,
  getGameHistory,
  
  // Utilities
  isConnected,
  getConnectionStatus
} = gameService
