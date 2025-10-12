import { useContext, useCallback } from 'react';
import { WebSocketContext } from '../providers/WebSocketProvider';
import { SOCKET_EVENTS, PLAYER_ACTIONS } from '../config/socketEvents';

/**
 * Hook để sử dụng WebSocket cho game
 * Đóng gói các hàm emit và listen events
 */
export const useGameSocket = () => {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useGameSocket must be used within WebSocketProvider');
  }
  
  const { 
    socket, 
    connected, 
    gameState, 
    setGameState, 
    emit, 
    on, 
    off,
    connect,       // 👈 thêm
    disconnect     // 👈 thêm
  } = context;
  
  /**
   * Tạo phòng
   */
  const createRoom = useCallback((hostId, duration = 20) => {
    emit(SOCKET_EVENTS.ROOM_CREATE, { hostId, duration });
  }, [emit]);
  
  /**
   * Join phòng
   */
  const joinRoom = useCallback((roomCode, userId) => {
    emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode, userId });
  }, [emit]);
  
  /**
   * Rời phòng
   */
  const leaveRoom = useCallback((roomCode, playerId) => {
    emit(SOCKET_EVENTS.ROOM_LEAVE, { roomCode, playerId });
  }, [emit]);
  
  /**
   * Bắt đầu game
   */
  const startGame = useCallback((roomCode) => {
    emit(SOCKET_EVENTS.GAME_START, { roomCode });
  }, [emit]);
  
  /**
   * Roll dice - BẮT BUỘC dùng tên event 'roll-dice'
   */
  const rollDice = useCallback((roomCode, playerId) => {
    emit(SOCKET_EVENTS.ROLL_DICE, { roomCode, playerId });
  }, [emit]);
  
  /**
   * Player action (buy, upgrade, skip, etc.)
   */
  const playerAction = useCallback((action, data) => {
    emit(SOCKET_EVENTS.PLAYER_ACTION, { action, ...data });
  }, [emit]);
  
  /**
   * Mua property
   */
  const buyProperty = useCallback((roomCode, playerId, squareId) => {
    playerAction(PLAYER_ACTIONS.BUY, { roomCode, playerId, squareId });
  }, [playerAction]);
  
  /**
   * Nâng cấp property
   */
  const upgradeProperty = useCallback((roomCode, playerId, squareId) => {
    playerAction(PLAYER_ACTIONS.UPGRADE, { roomCode, playerId, squareId });
  }, [playerAction]);
  
  /**
   * Skip action
   */
  const skipAction = useCallback((roomCode, playerId) => {
    playerAction(PLAYER_ACTIONS.SKIP, { roomCode, playerId });
  }, [playerAction]);
  
  /**
   * Request kết thúc game (fallback nếu backend chưa có auto-end)
   */
  const requestEndGame = useCallback((roomCode) => {
    emit(SOCKET_EVENTS.GAME_END_REQUEST, { roomCode });
  }, [emit]);
  
  /**
   * Listen room created
   */
  const onRoomCreated = useCallback((callback) => {
    on(SOCKET_EVENTS.ROOM_CREATED, callback);
    return () => off(SOCKET_EVENTS.ROOM_CREATED, callback);
  }, [on, off]);
  
  /**
   * Listen room joined
   */
  const onRoomJoined = useCallback((callback) => {
    on(SOCKET_EVENTS.ROOM_JOINED, callback);
    return () => off(SOCKET_EVENTS.ROOM_JOINED, callback);
  }, [on, off]);
  
  /**
   * Listen room update
   */
  const onRoomUpdate = useCallback((callback) => {
    on(SOCKET_EVENTS.ROOM_UPDATE, callback);
    return () => off(SOCKET_EVENTS.ROOM_UPDATE, callback);
  }, [on, off]);
  
  /**
   * Listen game started
   */
  const onGameStarted = useCallback((callback) => {
    on(SOCKET_EVENTS.GAME_STARTED, callback);
    return () => off(SOCKET_EVENTS.GAME_STARTED, callback);
  }, [on, off]);
  
  /**
   * Listen dice result
   */
  const onDiceResult = useCallback((callback) => {
    on(SOCKET_EVENTS.DICE_RESULT, callback);
    return () => off(SOCKET_EVENTS.DICE_RESULT, callback);
  }, [on, off]);
  
  /**
   * Listen game update
   */
  const onGameUpdate = useCallback((callback) => {
    on(SOCKET_EVENTS.GAME_UPDATE, callback);
    return () => off(SOCKET_EVENTS.GAME_UPDATE, callback);
  }, [on, off]);
  
  /**
   * Listen game end
   */
  const onGameEnd = useCallback((callback) => {
    on(SOCKET_EVENTS.GAME_END, callback);
    return () => off(SOCKET_EVENTS.GAME_END, callback);
  }, [on, off]);
  
  /**
   * Listen errors
   */
  const onError = useCallback((callback) => {
    on(SOCKET_EVENTS.ROOM_ERROR, callback);
    on(SOCKET_EVENTS.GAME_ERROR, callback);
    return () => {
      off(SOCKET_EVENTS.ROOM_ERROR, callback);
      off(SOCKET_EVENTS.GAME_ERROR, callback);
    };
  }, [on, off]);
  
  return {
    socket,
    connected,
    gameState,
    setGameState,
    connect,       // 👈 export ra
    disconnect,    // 👈 export ra
    // Actions
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    rollDice,
    buyProperty,
    upgradeProperty,
    skipAction,
    requestEndGame,
    // Listeners
    onRoomCreated,
    onRoomJoined,
    onRoomUpdate,
    onGameStarted,
    onDiceResult,
    onGameUpdate,
    onGameEnd,
    onError,
  };
};
