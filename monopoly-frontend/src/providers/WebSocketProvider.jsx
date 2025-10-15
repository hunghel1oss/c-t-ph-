import { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import { storage } from '../utils/storage';
import { SOCKET_EVENTS } from '../config/socketEvents';
import toast from 'react-hot-toast';

export const WebSocketContext = createContext(null);

// Đã fix cứng port 8000 làm mặc định (hợp lý)
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8000'; 

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null); 
  // 🔥 CHAT FIX: Thêm trạng thái tin nhắn
  const [chatMessages, setChatMessages] = useState([]);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  /**
   * ✅ FIX: Kết nối WebSocket với accessToken - Tránh Multiple Connections
   */
  const connect = useCallback(() => {
    const token = storage.getAccessToken();
    
    if (!token) {
      console.warn('❌ [WebSocket] No access token, cannot connect WebSocket');
      return;
    }
    
    // ✅ FIX: Kiểm tra connection hiện tại trước khi tạo mới
    if (socketRef.current?.connected) {
      console.log('🔌 [WebSocket] Already connected, skipping...', socketRef.current.id);
      return socketRef.current;
    }
    
    // ✅ FIX: Cleanup existing socket properly
    if (socketRef.current) {
      console.log('🧹 [WebSocket] Cleaning up existing socket...');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      setChatMessages([]);
    }
    
    // Clear any pending reconnect timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    console.log('🔌 [WebSocket] Creating new connection to:', WS_URL);
    
    // ✅ FIX: Sử dụng auth object thay vì query (chuẩn Socket.IO)
    const newSocket = io(WS_URL, {
      auth: { token }, // ✅ Thay đổi từ query sang auth
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
      forceNew: true, // ✅ Force new connection
      timeout: 20000,
    });
    
    // ✅ Event: connected
    newSocket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('✅ [WebSocket] Connected successfully:', newSocket.id);
      setConnected(true);
      // ✅ Không cần emit authenticate nữa vì đã có auth trong connection
    });
    
    // ✅ Event: disconnected
    newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('❌ [WebSocket] Disconnected:', reason);
      setConnected(false);
      setChatMessages([]);
      
      // Auto-reconnect logic for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect after delay
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 [WebSocket] Attempting auto-reconnect...');
          connect();
        }, 3000);
      }
    });
    
    // ✅ FIX: Thêm connection_error handler
    newSocket.on('connect_error', (error) => {
      console.error('❌ [WebSocket] Connection error:', error);
      setConnected(false);
      toast.error('Lỗi kết nối: ' + (error.message || 'Không thể kết nối server'));
    });
    
    // ✅ Event: general error
    newSocket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error('❌ [WebSocket] Socket error:', error);
      toast.error(error.message || 'Lỗi socket');
    });
    
    // ✅ Event: reconnect attempt
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 [WebSocket] Reconnect attempt #${attemptNumber}`);
    });
    
    // ✅ Event: reconnect success
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ [WebSocket] Reconnected after ${attemptNumber} attempts`);
      toast.success('Đã kết nối lại!');
    });
    
    // ✅ Event: reconnect failed
    newSocket.on('reconnect_failed', () => {
      console.error('❌ [WebSocket] Reconnection failed');
      toast.error('Không thể kết nối lại. Vui lòng refresh trang.');
    });
    
    socketRef.current = newSocket;
    setSocket(newSocket);
    
    return newSocket;
  }, []);
  
  // ----------------------------------------------------
  // ✅ FIX REAL-TIME: Xử lý các sự kiện game real-time và CHAT
  // ----------------------------------------------------
  useEffect(() => {
    if (!socket) return;
    
    // ✅ Lắng nghe sự kiện cập nhật game chung từ Backend
    const handleGameUpdated = (data) => {
      console.log('🔄 [WebSocket] Game state updated real-time:', data.game);
      setGameState(data.game); 
      
      if (data.message) {
        toast.success(data.message, { duration: 1500 });
      }
    };

    // ✅ Lắng nghe sự kiện game bắt đầu
    const handleGameStarted = (data) => {
      console.log('🎉 [WebSocket] Game started real-time:', data.game);
      setGameState(data.game);
      toast.success('Trò chơi đã bắt đầu!');
    };

    // 🔥 CHAT FIX: Lắng nghe tin nhắn mới
    const handleChatMessage = (message) => {
      console.log('💬 [WebSocket] New chat message:', message);
      setChatMessages(prevMessages => [...prevMessages, message]);
    };
    
    // ✅ Register event listeners
    socket.on('GAME_UPDATED', handleGameUpdated);
    socket.on('GAME_STARTED', handleGameStarted);
    socket.on('chat:message', handleChatMessage);
    
    // ✅ Cleanup listeners khi socket thay đổi hoặc component unmount
    return () => {
      socket.off('GAME_UPDATED', handleGameUpdated);
      socket.off('GAME_STARTED', handleGameStarted);
      socket.off('chat:message', handleChatMessage);
    };
  }, [socket]);
  
  /**
   * ✅ FIX: Disconnect WebSocket với proper cleanup
   */
  const disconnect = useCallback(() => {
    console.log('🔌 [WebSocket] Disconnecting...');
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      setGameState(null);
      setChatMessages([]); // Reset messages
    }
  }, []);
  
  /**
   * ✅ Emit event với error handling
   */
  const emit = useCallback((event, data) => {
    if (socketRef.current && connected) {
      console.log(`📤 [WebSocket] Emitting ${event}:`, data);
      socketRef.current.emit(event, data);
    } else {
      console.warn(`⚠️ [WebSocket] Socket not connected, cannot emit: ${event}`, data);
      toast.error('Chưa kết nối server. Vui lòng thử lại.');
    }
  }, [connected]);
  
  /**
   * ✅ Listen to event với error handling
   */
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      console.log(`👂 [WebSocket] Listening to: ${event}`);
      socketRef.current.on(event, callback);
    } else {
      console.warn(`⚠️ [WebSocket] Socket not available, cannot listen to: ${event}`);
    }
  }, []);
  
  /**
   * ✅ Remove listener với error handling
   */
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      console.log(`🔇 [WebSocket] Removing listener: ${event}`);
      socketRef.current.off(event, callback);
    }
  }, []);
  
  // ✅ Cleanup khi unmount
  useEffect(() => {
    return () => {
      console.log('🧹 [WebSocket] Provider cleanup');
      disconnect();
    };
  }, [disconnect]);
  
  const value = {
    socket,
    connected,
    gameState,
    setGameState, 
    chatMessages, // 🔥 CHAT FIX: Export tin nhắn
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

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
