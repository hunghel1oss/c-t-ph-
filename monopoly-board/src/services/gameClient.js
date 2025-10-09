// src/services/gameClient.js
const { io } = require('socket.io-client')

let socket = null;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const gameClient = {
  // ===========================================
  // CONNECTION MANAGEMENT
  // ===========================================
  
  /**
   * Initialize socket connection
   */
  initialize: (config = {}) => {
    if (socket) {
      socket.disconnect();
    }

    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...config
    });

    // Connection event listeners
    socket.on('connect', () => {
      console.log('🟢 Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected');
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    return socket;
  },

  /**
   * Check if socket is connected
   */
  isConnected: () => {
    return socket && socket.connected;
  },

  /**
   * Cleanup socket connection
   */
  cleanup: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // ===========================================
  // ROOM OPERATIONS
  // ===========================================
  
  /**
   * Create a new room
   */
  createRoom: async (roomData) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, reason: 'Socket not connected' });
        return;
      }

      socket.emit('createRoom', roomData, (response) => {
        resolve(response);
      });
    });
  },

  /**
   * Join a room
   */
  joinRoom: async (roomId) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, reason: 'Socket not connected' });
        return;
      }

      socket.emit('joinRoom', { roomId }, (response) => {
        resolve(response);
      });
    });
  },

  /**
   * Leave a room
   */
  leaveRoom: async (roomId) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, reason: 'Socket not connected' });
        return;
      }

      socket.emit('leaveRoom', { roomId }, (response) => {
        resolve(response);
      });
    });
  },

  /**
   * Get room information
   */
  getRoomInfo: async (roomId) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, reason: 'Socket not connected' });
        return;
      }

      socket.emit('getRoomInfo', { roomId }, (response) => {
        resolve(response);
      });
    });
  },

  // ===========================================
  // GAME OPERATIONS
  // ===========================================
  
  /**
   * Start game
   */
  startGame: async (roomId) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, reason: 'Socket not connected' });
        return;
      }

      socket.emit('startGame', { roomId }, (response) => {
        resolve(response);
      });
    });
  },

  /**
   * Roll dice
   */
  rollDice: async (playerId) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, reason: 'Socket not connected' });
        return;
      }

      socket.emit('rollDice', { playerId }, (response) => {
        resolve(response);
      });
    });
  },

  /**
   * Buy property
   */
  buyProperty: async (playerId, propertyId) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, reason: 'Socket not connected' });
        return;
      }

      socket.emit('buyProperty', { playerId, propertyId }, (response) => {
        resolve(response);
      });
    });
  },

  /**
   * Pay rent
   */
  payRent: async (playerId, amount, toPlayerId) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, reason: 'Socket not connected' });
        return;
      }

      socket.emit('payRent', { playerId, amount, toPlayerId }, (response) => {
        resolve(response);
      });
    });
  },

  /**
   * End turn
   */
  endTurn: async (playerId) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, reason: 'Socket not connected' });
        return;
      }

      socket.emit('endTurn', { playerId }, (response) => {
        resolve(response);
      });
    });
  },

  /**
   * Move player
   */
  movePlayer: async (playerId, newPosition) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, reason: 'Socket not connected' });
        return;
      }

      socket.emit('movePlayer', { playerId, newPosition }, (response) => {
        resolve(response);
      });
    });
  },

  /**
   * Update player money
   */
  updatePlayerMoney: async (playerId, amount) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, reason: 'Socket not connected' });
        return;
      }

      socket.emit('updatePlayerMoney', { playerId, amount }, (response) => {
        resolve(response);
      });
    });
  },

  /**
   * Get game state
   */
  getGameState: async (roomId) => {
    return new Promise((resolve) => {
      if (!socket || !socket.connected) {
        resolve({ ok: false, reason: 'Socket not connected' });
        return;
      }

      socket.emit('getGameState', { roomId }, (response) => {
        resolve(response);
      });
    });
  }
};

export default gameClient;
