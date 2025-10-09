const { useState, useEffect, useRef } = require('react')
const { io } = require('socket.io-client')

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000'

export const useSocket = ({ onConnect, onDisconnect } = {}) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: maxReconnectAttempts
    })

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setIsConnected(true)
      reconnectAttemptsRef.current = 0
      
      if (onConnect) {
        onConnect()
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setIsConnected(false)
      
      if (onDisconnect) {
        onDisconnect(reason)
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
      reconnectAttemptsRef.current++
      
      // Custom reconnection logic if needed
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
        newSocket.disconnect()
      }
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
      reconnectAttemptsRef.current = 0
      
      if (onConnect) {
        onConnect()
      }
    })

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket reconnection attempt:', attemptNumber)
    })

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error)
    })

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed')
      setIsConnected(false)
    })

    setSocket(newSocket)

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      newSocket.removeAllListeners()
      newSocket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [onConnect, onDisconnect])

  // Manual reconnect function
  const reconnect = () => {
    if (socket && !isConnected) {
      socket.connect()
    }
  }

  // Manual disconnect function
  const disconnect = () => {
    if (socket && isConnected) {
      socket.disconnect()
    }
  }

  return {
    socket,
    isConnected,
    reconnect,
    disconnect
  }
}

// For backward compatibility, also export as default
export default useSocket
