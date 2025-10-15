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
      // Reset tin nhắn khi disconnect
      setChatMessages([]);
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
      
      newSocket.emit(SOCKET_EVENTS.AUTHENTICATE, { token }); 
    });
    
    // Event: disconnected
    newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setConnected(false);
      setChatMessages([]);
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
  
  // ----------------------------------------------------
  // ✅ FIX REAL-TIME: Xử lý các sự kiện game real-time và CHAT
  // ----------------------------------------------------
  useEffect(() => {
    if (!socket) return;
    
    // Lắng nghe sự kiện cập nhật game chung từ Backend
    socket.on('GAME_UPDATED', (data) => {
        console.log('🔄 Game state updated real-time:', data.game);
        setGameState(data.game); 
        
        if (data.message) {
            toast.success(data.message, { duration: 1500 });
        }
    });

    // Lắng nghe sự kiện game bắt đầu
    socket.on('GAME_STARTED', (data) => {
        console.log('🎉 Game started real-time:', data.game);
        setGameState(data.game);
        toast.success('Trò chơi đã bắt đầu!');
    });

    // 🔥 CHAT FIX: Lắng nghe tin nhắn mới
    socket.on('chat:message', (message) => {
        setChatMessages(prevMessages => [...prevMessages, message]);
    });
    
    // Cleanup listeners khi socket thay đổi hoặc component unmount
    return () => {
        socket.off('GAME_UPDATED');
        socket.off('GAME_STARTED');
        socket.off('chat:message'); // Cleanup chat listener
    };
  }, [socket]);
  
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
      setChatMessages([]); // Reset messages
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