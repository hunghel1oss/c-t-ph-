import React, { useState } from 'react'
import { useGame } from '../../context/GameProvider'

const BotPlayerUI = () => {
  const { gameState, actions, ui, userPlayerId } = useGame()
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium')
  const [isAdding, setIsAdding] = useState(false)

  const isHost = gameState?.settings?.hostId === userPlayerId || 
                 gameState?.players?.[0]?.id === userPlayerId

  const currentPlayerCount = gameState?.players?.length || 0
  const maxPlayers = gameState?.settings?.maxPlayers || 8
  const canAddBot = isHost && currentPlayerCount < maxPlayers && gameState?.status === 'waiting'

  const botDifficulties = [
    { value: 'easy', label: 'Easy', description: 'Makes simple decisions' },
    { value: 'medium', label: 'Medium', description: 'Balanced strategy' },
    { value: 'hard', label: 'Hard', description: 'Aggressive player' },
    { value: 'expert', label: 'Expert', description: 'Advanced AI' }
  ]

  const handleAddBot = async () => {
    if (!canAddBot || isAdding) return

    setIsAdding(true)
    
    try {
      const result = await actions.addBot(selectedDifficulty)
      if (!result.ok) {
        alert(`Failed to add bot: ${result.reason}`)
      }
    } catch (error) {
      alert(`Error adding bot: ${error.message}`)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveBot = async (botId) => {
    if (!isHost) return

    const result = await actions.removeBot(botId)
    if (!result.ok) {
      alert(`Failed to remove bot: ${result.reason}`)
    }
  }

  const styles = {
    container: {
      padding: '15px',
      backgroundColor: '#f9f9f9',
      borderRadius: '4px',
      border: '1px solid #ddd',
      marginTop: '10px'
    },
    header: {
      fontSize: '14px',
      fontWeight: 'bold',
      marginBottom: '10px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    playerCount: {
      fontSize: '12px',
      color: '#666'
    },
    difficultySection: {
      marginBottom: '15px'
    },
    difficultyLabel: {
      fontSize: '12px',
      fontWeight: 'bold',
      marginBottom: '5px',
      display: 'block'
    },
    difficultySelect: {
      width: '100%',
      padding: '6px',
      border: '1px solid #ddd',
      borderRadius: '3px',
      fontSize: '12px'
    },
    difficultyDescription: {
      fontSize: '10px',
      color: '#666',
      marginTop: '3px',
      fontStyle: 'italic'
    },
    addButton: {
      width: '100%',
      padding: '8px',
      border: 'none',
      borderRadius: '3px',
      backgroundColor: '#4caf50',
      color: 'white',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 'bold',
      marginBottom: '15px'
    },
    addButtonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    botsList: {
      maxHeight: '120px',
      overflowY: 'auto'
    },
    botItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 8px',
      margin: '3px 0',
      backgroundColor: '#fff',
      border: '1px solid #eee',
      borderRadius: '3px',
      fontSize: '11px'
    },
    botInfo: {
      flex: 1
    },
    botName: {
      fontWeight: 'bold',
      marginBottom: '2px'
    },
    botDifficulty: {
      color: '#666',
      fontSize: '10px'
    },
    removeButton: {
      background: 'none',
      border: 'none',
      color: '#f44336',
      cursor: 'pointer',
      fontSize: '12px',
      padding: '2px 4px'
    },
    noBotsMessage: {
      textAlign: 'center',
      color: '#666',
      fontStyle: 'italic',
      fontSize: '11px',
      padding: '10px'
    },
    warningMessage: {
      fontSize: '11px',
      color: '#f57c00',
      backgroundColor: '#fff3e0',
      padding: '6px',
      borderRadius: '3px',
      marginBottom: '10px',
      border: '1px solid #ffcc02'
    }
  }

  if (!isHost) {
    return (
      <div style={styles.container}>
        <div style={styles.noBotsMessage}>
          Only the host can manage bots
        </div>
      </div>
    )
  }

  const currentBots = gameState?.players?.filter(p => p.isBot) || []
  const selectedDifficultyInfo = botDifficulties.find(d => d.value === selectedDifficulty)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>Bot Players</span>
        <span style={styles.playerCount}>
          {currentPlayerCount}/{maxPlayers}
        </span>
      </div>

      {currentPlayerCount >= maxPlayers && (
        <div style={styles.warningMessage}>
          Room is full. Remove a player to add bots.
        </div>
      )}

      {gameState?.status !== 'waiting' && (
        <div style={styles.warningMessage}>
          Cannot add bots after game has started.
        </div>
      )}

      <div style={styles.difficultySection}>
        <label style={styles.difficultyLabel}>
          Bot Difficulty:
        </label>
        <select
          style={styles.difficultySelect}
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          disabled={!canAddBot}
        >
          {botDifficulties.map(difficulty => (
            <option key={difficulty.value} value={difficulty.value}>
              {difficulty.label}
            </option>
          ))}
        </select>
        {selectedDifficultyInfo && (
          <div style={styles.difficultyDescription}>
            {selectedDifficultyInfo.description}
          </div>
        )}
      </div>

      <button
        style={{
          ...styles.addButton,
          ...(!canAddBot || isAdding || ui.isAwaitingServer ? styles.addButtonDisabled : {})
        }}
        onClick={handleAddBot}
        disabled={!canAddBot || isAdding || ui.isAwaitingServer}
        aria-label="Add bot player"
      >
        {isAdding ? 'Adding Bot...' : `Add ${selectedDifficultyInfo?.label} Bot`}
      </button>

      <div style={styles.botsList}>
        {currentBots.length === 0 ? (
          <div style={styles.noBotsMessage}>
            No bots added yet
          </div>
        ) : (
          currentBots.map(bot => (
            <div key={bot.id} style={styles.botItem}>
              <div style={styles.botInfo}>
                <div style={styles.botName}>
                  {bot.name}
                </div>
                <div style={styles.botDifficulty}>
                  {bot.difficulty || 'medium'} difficulty
                </div>
              </div>
              <button
                style={styles.removeButton}
                onClick={() => handleRemoveBot(bot.id)}
                disabled={ui.isAwaitingServer}
                aria-label={`Remove bot ${bot.name}`}
                title="Remove bot"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {currentBots.length > 0 && (
        <div style={{ fontSize: '10px', color: '#666', marginTop: '8px' }}>
          Tip: Bots will make moves automatically during the game
        </div>
      )}
    </div>
  )
}

export default BotPlayerUI
