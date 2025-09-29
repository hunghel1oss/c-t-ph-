import React, { useState, useEffect } from 'react'
import { useGame } from '../../context/GameProvider'

const BankruptcyModal = () => {
  const { gameState, actions, ui, userPlayerId } = useGame()
  const [isOpen, setIsOpen] = useState(false)

  const currentPlayer = gameState?.players?.find(p => p.id === userPlayerId)
  const isBankrupt = currentPlayer?.isBankrupt || currentPlayer?.money < 0

  // Auto-open modal when player becomes bankrupt
  useEffect(() => {
    if (isBankrupt && !isOpen) {
      setIsOpen(true)
    }
  }, [isBankrupt, isOpen])

  const handleAcceptElimination = async () => {
    const result = await actions.acceptElimination(userPlayerId)
    if (result.ok) {
      setIsOpen(false)
    } else {
      alert(`Elimination failed: ${result.reason}`)
    }
  }

  const handleClose = () => {
    // Only allow closing if player is no longer bankrupt
    if (!isBankrupt) {
      setIsOpen(false)
    }
  }

  const calculateNetWorth = () => {
    if (!currentPlayer) return 0
    
    const propertyValue = currentPlayer.properties?.reduce((sum, prop) => {
      let value = prop.mortgageValue || (prop.price * 0.5) || 0
      if (prop.houses > 0) value += prop.houses * (prop.houseCost || 0) * 0.5
      if (prop.hotels > 0) value += prop.hotels * (prop.houseCost || 0) * 2.5
      return sum + value
    }, 0) || 0
    
    return currentPlayer.money + propertyValue
  }

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '30px',
      maxWidth: '500px',
      width: '90%',
      textAlign: 'center',
      border: '3px solid #f44336'
    },
    header: {
      marginBottom: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#f44336',
      marginBottom: '10px'
    },
    subtitle: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '20px'
    },
    statsSection: {
      backgroundColor: '#f9f9f9',
      padding: '20px',
      borderRadius: '4px',
      marginBottom: '20px'
    },
    statItem: {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '8px 0',
      fontSize: '14px'
    },
    statLabel: {
      fontWeight: 'bold'
    },
    statValue: {
      color: '#666'
    },
    negativeValue: {
      color: '#f44336',
      fontWeight: 'bold'
    },
    propertiesSection: {
      marginBottom: '20px'
    },
    propertiesList: {
      maxHeight: '150px',
      overflowY: 'auto',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '10px',
      backgroundColor: '#f9f9f9'
    },
    propertyItem: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '4px 0',
      borderBottom: '1px solid #eee',
      fontSize: '12px'
    },
    propertyName: {
      flex: 1,
      textAlign: 'left'
    },
    propertyValue: {
      color: '#666'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'center',
      marginTop: '20px'
    },
    button: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    eliminationButton: {
      backgroundColor: '#f44336',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#ddd',
      color: '#333'
    },
    disabledButton: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    message: {
      fontSize: '14px',
      color: '#666',
      fontStyle: 'italic',
      marginBottom: '15px'
    },
    finalRanking: {
      backgroundColor: '#e3f2fd',
      padding: '15px',
      borderRadius: '4px',
      marginBottom: '20px'
    },
    rankingTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '10px'
    }
  }

  if (!isOpen || !isBankrupt) return null

  const netWorth = calculateNetWorth()
  const finalRanking = gameState?.eliminatedPlayers?.length ? 
    gameState.players.length - gameState.eliminatedPlayers.length + 1 : 
    gameState?.players?.length

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.title}>BANKRUPTCY</div>
          <div style={styles.subtitle}>
            You have run out of money and assets to continue playing
          </div>
        </div>

        <div style={styles.statsSection}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Cash:</span>
            <span style={{...styles.statValue, ...(currentPlayer?.money < 0 ? styles.negativeValue : {})}}>
              ${currentPlayer?.money?.toLocaleString() || 0}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Property Value:</span>
            <span style={styles.statValue}>
              ${(netWorth - (currentPlayer?.money || 0)).toLocaleString()}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Net Worth:</span>
            <span style={{...styles.statValue, ...(netWorth < 0 ? styles.negativeValue : {})}}>
              ${netWorth.toLocaleString()}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Properties Owned:</span>
            <span style={styles.statValue}>
              {currentPlayer?.properties?.length || 0}
            </span>
          </div>
        </div>

        {currentPlayer?.properties?.length > 0 && (
          <div style={styles.propertiesSection}>
            <h4>Your Properties:</h4>
            <div style={styles.propertiesList}>
              {currentPlayer.properties.map(property => (
                <div key={property.id} style={styles.propertyItem}>
                  <span style={styles.propertyName}>
                    {property.name}
                    {property.houses > 0 && ` (${property.houses}H)`}
                    {property.hotels > 0 && ` (${property.hotels} Hotel)`}
                    {property.isMortgaged && ' (Mortgaged)'}
                  </span>
                  <span style={styles.propertyValue}>
                    ${property.mortgageValue || Math.floor((property.price || 0) * 0.5)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {finalRanking && (
          <div style={styles.finalRanking}>
            <div style={styles.rankingTitle}>Final Position</div>
            <div>#{finalRanking} out of {gameState?.players?.length} players</div>
          </div>
        )}

        <div style={styles.message}>
          All your properties will be returned to the bank and auctioned to other players.
        </div>

        <div style={styles.buttonGroup}>
          <button
            style={{
              ...styles.button,
              ...styles.eliminationButton,
              ...(ui.isAwaitingServer ? styles.disabledButton : {})
            }}
            onClick={handleAcceptElimination}
            disabled={ui.isAwaitingServer}
            aria-label="Accept elimination"
          >
            {ui.isAwaitingServer ? 'Processing...' : 'Accept Elimination'}
          </button>
        </div>

        <div style={{ marginTop: '15px', fontSize: '12px', color: '#999' }}>
          Thank you for playing! You can continue to watch the game.
        </div>
      </div>
    </div>
  )
}

export default BankruptcyModal
