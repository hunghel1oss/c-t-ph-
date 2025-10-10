import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import { storage } from '../utils/storage';
import { SOCKET_EVENTS } from '../config/socketEvents';
import toast from 'react-hot-toast';

export const WebSocketContext = createContext(null);

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const socketRef = useRef(null);
  
  /**
   * Kết nối WebSocket với accessToken
   */
  const connect = useCallback(() => {
    const token = storage.getAccessToken();
    
    if (!token) {
      console.warn('No access token, cannot connect WebSocket');
      return;
    }
    
    // Nếu đã có socket, disconnect trước
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Tạo socket mới với token trong query
    const newSocket = io(WS_URL, {
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    
    // Event: connected
    newSocket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
      
      // Authenticate sau khi connect (nếu backend yêu cầu)
      newSocket.emit(SOCKET_EVENTS.AUTHENTICATE, { accessToken: token });
    });
    
    // Event: disconnected
    newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setConnected(false);
      
      // Nếu disconnect do token hết hạn, thử refresh
      if (reason === 'io server disconnect') {
        // Server chủ động disconnect, có thể do token hết hạn
        // Interceptor sẽ xử lý refresh token
      }
    });
    
    // Event: error
    newSocket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error('WebSocket error:', error);
      toast.error(error.message || 'Lỗi kết nối');
    });
    
    socketRef.current = newSocket;
    setSocket(newSocket);
    
    return newSocket;
  }, []);
  
  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      setGameState(null);
    }
  }, []);
  
  /**
   * Emit event
   */
  const emit = useCallback((event, data) => {
    if (socketRef.current && connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }, [connected]);
  
  /**
   * Listen to event
   */
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);
  
  /**
   * Remove listener
   */
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);
  
  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  const value = {
    socket,
    connected,
    gameState,
    setGameState,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

WebSocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
