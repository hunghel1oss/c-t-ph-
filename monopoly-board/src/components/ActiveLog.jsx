import React, { useEffect, useRef } from 'react'
import { useGame } from '../context/GameProvider'

const ActiveLog = () => {
  const { gameState } = useGame()
  const logEndRef = useRef(null)

  const gameLog = gameState?.gameLog || []
  const recentLogs = gameLog.slice(-10).reverse() // Show last 10 in reverse chronological order

  // Auto-scroll to show newest entries
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [gameLog.length])

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getLogTypeStyle = (type) => {
    const baseStyle = {
      padding: '6px 8px',
      margin: '3px 0',
      borderRadius: '3px',
      fontSize: '12px',
      lineHeight: '1.3'
    }

    switch (type) {
      case 'trade':
        return { ...baseStyle, backgroundColor: '#e3f2fd', borderLeft: '3px solid #2196f3' }
      case 'purchase':
        return { ...baseStyle, backgroundColor: '#e8f5e8', borderLeft: '3px solid #4caf50' }
      case 'rent':
        return { ...baseStyle, backgroundColor: '#fff3e0', borderLeft: '3px solid #ff9800' }
      case 'jail':
        return { ...baseStyle, backgroundColor: '#ffebee', borderLeft: '3px solid #f44336' }
      case 'bankruptcy':
        return { ...baseStyle, backgroundColor: '#fce4ec', borderLeft: '3px solid #e91e63' }
      case 'auction':
        return { ...baseStyle, backgroundColor: '#f3e5f5', borderLeft: '3px solid #9c27b0' }
      case 'dice':
        return { ...baseStyle, backgroundColor: '#f5f5f5', borderLeft: '3px solid #666' }
      case 'system':
        return { ...baseStyle, backgroundColor: '#e0f2f1', borderLeft: '3px solid #009688' }
      default:
        return { ...baseStyle, backgroundColor: '#f9f9f9', borderLeft: '3px solid #ccc' }
    }
  }

  const getPlayerName = (playerId) => {
    if (!playerId) return 'System'
    const player = gameState?.players?.find(p => p.id === playerId)
    return player?.name || `Player ${playerId}`
  }

  const getPlayerColor = (playerId) => {
    if (!playerId) return '#666'
    const player = gameState?.players?.find(p => p.id === playerId)
    return player?.color || '#666'
  }

  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      padding: '10px',
      borderBottom: '1px solid #ddd',
      backgroundColor: '#f5f5f5'
    },
    headerTitle: {
      margin: 0,
      fontSize: '14px',
      fontWeight: 'bold'
    },
    logContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px',
      backgroundColor: '#fafafa'
    },
    logEntry: {
      display: 'flex',
      flexDirection: 'column'
    },
    logHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2px'
    },
    playerName: {
      fontSize: '10px',
      fontWeight: 'bold'
    },
    timestamp: {
      fontSize: '9px',
      color: '#999'
    },
    logMessage: {
      wordWrap: 'break-word'
    },
    noLogs: {
      textAlign: 'center',
      color: '#666',
      fontStyle: 'italic',
      padding: '20px',
      fontSize: '12px'
    },
    clearButton: {
      background: 'none',
      border: 'none',
      color: '#666',
      cursor: 'pointer',
      fontSize: '10px',
      padding: '2px 4px'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={styles.headerTitle}>Game Log</h4>
          <span style={{ fontSize: '10px', color: '#666' }}>
            ({gameLog.length} events)
          </span>
        </div>
      </div>

      <div style={styles.logContainer}>
        {recentLogs.length === 0 ? (
          <div style={styles.noLogs}>
            No game events yet
          </div>
        ) : (
          <>
            {recentLogs.map((logEntry, index) => (
              <div 
                key={logEntry.id || `${logEntry.timestamp}-${index}`}
                style={getLogTypeStyle(logEntry.type)}
              >
                <div style={styles.logEntry}>
                  <div style={styles.logHeader}>
                    <span 
                      style={{
                        ...styles.playerName,
                        color: getPlayerColor(logEntry.playerId)
                      }}
                    >
                      {getPlayerName(logEntry.playerId)}
                    </span>
                    <span style={styles.timestamp}>
                      {formatTimestamp(logEntry.timestamp)}
                    </span>
                  </div>
                  <div style={styles.logMessage}>
                    {logEntry.message}
                  </div>
                </div>
              </div>
            ))}
            <div ref={logEndRef} />
          </>
        )}
      </div>

      {gameLog.length > 10 && (
        <div style={{ 
          padding: '5px 10px', 
          borderTop: '1px solid #ddd', 
          backgroundColor: '#f5f5f5',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '10px', color: '#666' }}>
            Showing last 10 of {gameLog.length} events
          </span>
        </div>
      )}
    </div>
  )
}

export default ActiveLog
