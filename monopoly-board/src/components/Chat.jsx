import React, { useState, useEffect, useRef } from 'react'
import { useGame } from '../context/GameProvider'

const Chat = () => {
  const { gameState, gameClient, userPlayerId } = useGame()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef(null)

  const currentPlayer = gameState?.players?.find(p => p.id === userPlayerId)

  // Listen for incoming messages
  useEffect(() => {
    if (!gameClient?.socket) return

    const handleMessage = (data) => {
      const newMessage = {
        id: Date.now() + Math.random(),
        playerId: data.playerId,
        playerName: data.playerName,
        message: data.message,
        timestamp: new Date(data.timestamp || Date.now()),
        type: data.type || 'chat'
      }
      
      setMessages(prev => [...prev.slice(-49), newMessage]) // Keep last 50 messages
    }

    gameClient.socket.on('receive_message', handleMessage)
    gameClient.socket.on('system_message', (data) => {
      handleMessage({ ...data, type: 'system' })
    })

    return () => {
      gameClient.socket.off('receive_message', handleMessage)
      gameClient.socket.off('system_message', handleMessage)
    }
  }, [gameClient?.socket])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !gameClient?.socket) return

    const messageData = {
      message: inputMessage.trim(),
      playerId: userPlayerId,
      playerName: currentPlayer?.name || 'Unknown',
      timestamp: new Date().toISOString()
    }

    gameClient.socket.emit('send_message', messageData)
    setInputMessage('')
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getPlayerColor = (playerId) => {
    const player = gameState?.players?.find(p => p.id === playerId)
    return player?.color || '#666'
  }

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: isMinimized ? 'auto' : '300px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#fff'
    },
    header: {
      padding: '8px 12px',
      backgroundColor: '#f5f5f5',
      borderBottom: '1px solid #ddd',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer'
    },
    headerTitle: {
      fontSize: '14px',
      fontWeight: 'bold',
      margin: 0
    },
    minimizeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      padding: '2px 6px'
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px',
      display: isMinimized ? 'none' : 'block'
    },
    message: {
      marginBottom: '8px',
      fontSize: '12px',
      lineHeight: '1.4'
    },
    systemMessage: {
      fontStyle: 'italic',
      color: '#666',
      textAlign: 'center'
    },
    messageHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '2px'
    },
    playerName: {
      fontWeight: 'bold',
      fontSize: '11px'
    },
    timestamp: {
      fontSize: '10px',
      color: '#999'
    },
    messageText: {
      wordWrap: 'break-word',
      paddingLeft: '4px'
    },
    inputContainer: {
      padding: '8px',
      borderTop: '1px solid #ddd',
      display: isMinimized ? 'none' : 'flex',
      gap: '6px'
    },
    input: {
      flex: 1,
      padding: '6px 8px',
      border: '1px solid #ddd',
      borderRadius: '3px',
      fontSize: '12px'
    },
    sendButton: {
      padding: '6px 12px',
      border: 'none',
      borderRadius: '3px',
      backgroundColor: '#2196f3',
      color: 'white',
      cursor: 'pointer',
      fontSize: '12px'
    },
    sendButtonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    noMessages: {
      textAlign: 'center',
      color: '#999',
      fontStyle: 'italic',
      fontSize: '12px',
      padding: '20px'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header} onClick={() => setIsMinimized(!isMinimized)}>
        <h4 style={styles.headerTitle}>
          Chat ({messages.length})
        </h4>
        <button style={styles.minimizeButton} aria-label="Toggle chat">
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>

      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.noMessages}>
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              style={{
                ...styles.message,
                ...(message.type === 'system' ? styles.systemMessage : {})
              }}
            >
              {message.type === 'system' ? (
                <div style={styles.messageText}>
                  {message.message}
                </div>
              ) : (
                <>
                  <div style={styles.messageHeader}>
                    <span 
                      style={{
                        ...styles.playerName,
                        color: getPlayerColor(message.playerId)
                      }}
                    >
                      {message.playerName}:
                    </span>
                    <span style={styles.timestamp}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div style={styles.messageText}>
                    {message.message}
                  </div>
                </>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form style={styles.inputContainer} onSubmit={handleSendMessage}>
        <input
          type="text"
          style={styles.input}
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          maxLength={200}
        />
        <button
          type="submit"
          style={{
            ...styles.sendButton,
            ...((!inputMessage.trim() || !gameClient?.socket) ? styles.sendButtonDisabled : {})
        }}
        disabled={!inputMessage.trim() || !gameClient?.socket}
        aria-label="Send message"
      >
        Send
      </button>
    </form>
  </div>
)
}

export default Chat

