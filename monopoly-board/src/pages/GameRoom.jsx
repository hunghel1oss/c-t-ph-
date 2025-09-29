import React, { useRef, useEffect, useState } from 'react'
import { useGame } from '../context/GameProvider'
import MonopolyBoard from '../components/MonopolyBoard'
import Dice from '../components/Dice'
import PlayerHUD from '../components/PlayerHUD'
import Chat from '../components/Chat'
import TopBar from '../components/TopBar'
import ActiveLog from '../components/ActiveLog'
import BotPlayerUI from '../game/ai/BotPlayerUI'
import TradeModal from '../components/modals/TradeModal'
import AuctionModal from '../components/modals/AuctionModal'
import BankruptcyModal from '../components/modals/BankruptcyModal'

const GameRoom = () => {
  const { 
    gameState, 
    actions, 
    ui, 
    userPlayerId, 
    selectedTile, 
    setSelectedTile 
  } = useGame()
  
  const diceRef = useRef()
  const [showBotUI, setShowBotUI] = useState(false)

  // Handle dice animation when server sends roll result
  useEffect(() => {
    if (gameState?.lastDiceRoll && diceRef.current) {
      const { dice1, dice2 } = gameState.lastDiceRoll
      diceRef.current.animateTo(dice1, dice2).then(() => {
        if (actions.onDiceAnimationComplete) {
          actions.onDiceAnimationComplete()
        }
      })
    }
  }, [gameState?.lastDiceRoll, actions])

  // Auto-open modals based on game state
  useEffect(() => {
    if (gameState?.pendingTrade && gameState.pendingTrade.toPlayerId === userPlayerId) {
      // Trade modal will auto-open via its own logic
    }
  }, [gameState?.pendingTrade, userPlayerId])

  const isHost = gameState?.settings?.hostId === userPlayerId || 
                 gameState?.players?.[0]?.id === userPlayerId

  const handleTileClick = (tileIndex) => {
    setSelectedTile(tileIndex)
  }

  const handleStartGame = async () => {
    if (!isHost) return
    
    const result = await actions.startGame()
    if (!result.ok) {
      alert(`Failed to start game: ${result.reason}`)
    }
  }

  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    },
    leftColumn: {
      width: '250px',
      backgroundColor: '#fff',
      borderRight: '1px solid #ddd',
      display: 'flex',
      flexDirection: 'column',
      padding: '10px'
    },
    centerColumn: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    },
    rightColumn: {
      width: '300px',
      backgroundColor: '#fff',
      borderLeft: '1px solid #ddd',
      display: 'flex',
      flexDirection: 'column'
    },
    playersSection: {
      marginBottom: '20px'
    },
    playerItem: {
      padding: '8px',
      margin: '4px 0',
      borderRadius: '4px',
      backgroundColor: '#f9f9f9',
      border: '1px solid #eee'
    },
    currentPlayer: {
      backgroundColor: '#e3f2fd',
      border: '1px solid #2196f3'
    },
    hostControls: {
      marginBottom: '20px',
      padding: '10px',
      backgroundColor: '#f0f0f0',
      borderRadius: '4px'
    },
    button: {
      padding: '8px 16px',
      margin: '4px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: '#2196f3',
      color: 'white',
      cursor: 'pointer'
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    boardContainer: {
      position: 'relative',
      width: '600px',
      height: '600px'
    },
    diceContainer: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: 10
    },
    awaitingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '18px',
      zIndex: 20
    }
  }

  if (!gameState) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.centerColumn, fontSize: '18px' }}>
          Loading game...
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <TopBar />
      
      {/* Left Column - Players & Controls */}
      <div style={styles.leftColumn}>
        <div style={styles.playersSection}>
          <h3>Players ({gameState.players?.length || 0})</h3>
          {gameState.players?.map(player => (
            <div 
              key={player.id}
              style={{
                ...styles.playerItem,
                ...(player.id === gameState.currentTurn ? styles.currentPlayer : {})
              }}
            >
              <div style={{ fontWeight: 'bold', color: player.color }}>
                {player.name} {player.isBot ? '(Bot)' : ''}
              </div>
              <div style={{ fontSize: '12px' }}>
                ${player.money} | {player.properties?.length || 0} properties
              </div>
              {player.position !== undefined && (
                <div style={{ fontSize: '10px', color: '#666' }}>
                  Position: {player.position}
                </div>
              )}
            </div>
          ))}
        </div>

        {isHost && gameState.status === 'waiting' && (
          <div style={styles.hostControls}>
            <h4>Host Controls</h4>
            <button 
              style={{
                ...styles.button,
                ...(gameState.players?.length < 2 ? styles.buttonDisabled : {})
              }}
              onClick={handleStartGame}
              disabled={gameState.players?.length < 2}
              aria-label="Start game"
            >
              Start Game
            </button>
            
            <button 
              style={styles.button}
              onClick={() => setShowBotUI(!showBotUI)}
              aria-label="Toggle bot controls"
            >
              {showBotUI ? 'Hide' : 'Add'} Bots
            </button>
            
            {showBotUI && <BotPlayerUI />}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <Chat />
        </div>
      </div>

      {/* Center Column - Game Board */}
      <div style={styles.centerColumn}>
        <div style={styles.boardContainer}>
          <MonopolyBoard
            board={gameState.board}
            players={gameState.players}
            onTileClick={handleTileClick}
            highlight={gameState.currentOffer?.propertyIndex}
          />
          
          <div style={styles.diceContainer}>
            <Dice ref={diceRef} />
          </div>

          {ui.isAwaitingServer && (
            <div style={styles.awaitingOverlay}>
              Waiting for server...
            </div>
          )}
        </div>

        {gameState.phase && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              Phase: {gameState.phase}
            </div>
            {gameState.currentTurn && (
              <div style={{ fontSize: '14px', color: '#666' }}>
                Current turn: {gameState.players?.find(p => p.id === gameState.currentTurn)?.name}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column - HUD & Log */}
      <div style={styles.rightColumn}>
        <PlayerHUD />
        <div style={{ flex: 1, padding: '10px' }}>
          <ActiveLog />
        </div>
      </div>

      {/* Modals */}
      <TradeModal />
      <AuctionModal />
      <BankruptcyModal />
    </div>
  )
}

export default GameRoom
