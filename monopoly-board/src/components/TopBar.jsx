import React from 'react'
import { useGame } from '../context/GameProvider'

const TopBar = () => {
  const { gameState, ui } = useGame()

  const roomCode = gameState?.roomCode || 'Unknown'
  const connectedPlayers = gameState?.players?.length || 0
  const maxPlayers = gameState?.settings?.maxPlayers || 8
  const isConnected = ui?.isConnected !== false

  const styles = {
    container: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '50px',
      backgroundColor: '#2196f3',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 100,
      borderBottom: '1px solid #1976d2'
    },
    leftSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    logo: {
      fontSize: '18px',
      fontWeight: 'bold'
    },
    roomInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    roomCode: {
      fontSize: '16px',
      fontWeight: 'bold',
      backgroundColor: 'rgba(255,255,255,0.2)',
      padding: '4px 8px',
      borderRadius: '4px'
    },
    playersCount: {
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    playersIcon: {
      fontSize: '16px'
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    connectionStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px'
    },
    statusIndicator: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: isConnected ? '#4caf50' : '#f44336'
    },
    settingsButton: {
      background: 'none',
      border: '1px solid rgba(255,255,255,0.3)',
      color: 'white',
      padding: '6px 12px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    gameStatus: {
      fontSize: '14px',
      fontWeight: 'bold',
      textTransform: 'capitalize'
    },
    reconnecting: {
      fontSize: '12px',
      color: '#ffeb3b',
      fontStyle: 'italic'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.leftSection}>
        <div style={styles.logo}>
          🎲 Monopoly
        </div>
        
        <div style={styles.roomInfo}>
          <div style={styles.roomCode}>
            Room: {roomCode}
          </div>
          
          <div style={styles.playersCount}>
            <span style={styles.playersIcon}>👥</span>
            {connectedPlayers}/{maxPlayers}
          </div>
          
          {gameState?.status && (
            <div style={styles.gameStatus}>
              {gameState.status}
            </div>
          )}
        </div>
      </div>

      <div style={styles.rightSection}>
        <div style={styles.connectionStatus}>
          <div style={styles.statusIndicator}></div>
          <span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        {ui?.isReconnecting && (
          <div style={styles.reconnecting}>
            Reconnecting...
          </div>
        )}
        
        <button 
          style={styles.settingsButton}
          onClick={() => {
            // Settings functionality can be added later
            alert('Settings panel coming soon!')
          }}
          aria-label="Open settings"
        >
          ⚙️ Settings
        </button>
      </div>
    </div>
  )
}

export default TopBar
