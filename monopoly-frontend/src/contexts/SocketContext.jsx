import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // ✅ KẾT NỐI SOCKET
        const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            autoConnect: true
        });

        // ✅ LISTEN CONNECTION EVENTS
        socketInstance.on('connect', () => {
            console.log('✅ [Socket] Connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('❌ [Socket] Disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('❌ [Socket] Connection error:', error);
            setIsConnected(false);
        });

        setSocket(socketInstance);

        // ✅ CLEANUP KHI UNMOUNT
        return () => {
            console.log('🔌 [Socket] Cleaning up...');
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
