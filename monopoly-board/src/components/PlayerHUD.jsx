import React from 'react'
import { useGame } from '../context/GameProvider'

const PlayerHUD = () => {
  const { gameState, actions, ui, userPlayerId } = useGame()

  const currentPlayer = gameState?.players?.find(p => p.id === userPlayerId)
  const isPlayerTurn = gameState?.currentTurn === userPlayerId
  const phase = gameState?.phase

  if (!currentPlayer) {
    return (
      <div style={styles.container}>
        <div style={styles.noPlayer}>Player not found</div>
      </div>
    )
  }

  const handleAction = async (actionName, ...args) => {
    if (ui.isAwaitingServer) return
    
    const result = await actions[actionName](...args)
    if (!result.ok) {
      alert(`Action failed: ${result.reason}`)
    }
  }

  // Calculate net worth
  const netWorth = currentPlayer.money + 
    (currentPlayer.properties?.reduce((sum, prop) => sum + (prop.value || 0), 0) || 0)

  const canRoll = isPlayerTurn && phase === 'roll' && !ui.isDiceRolling
  const canBuy = isPlayerTurn && phase === 'purchase'
  const canEndTurn = isPlayerTurn && ['action', 'purchase'].includes(phase)
  const canBuild = isPlayerTurn && phase === 'action'
  const canTrade = isPlayerTurn && phase === 'action'

  const styles = {
    container: {
      padding: '15px',
      backgroundColor: '#fff',
      borderBottom: '1px solid #ddd'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '15px'
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: currentPlayer.color || '#666',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      marginRight: '10px'
    },
    playerInfo: {
      flex: 1
    },
    playerName: {
      fontSize: '16px',
      fontWeight: 'bold',
      margin: 0
    },
    playerStats: {
      fontSize: '12px',
      color: '#666',
      margin: '2px 0'
    },
    moneySection: {
      marginBottom: '15px',
      padding: '10px',
      backgroundColor: '#f9f9f9',
      borderRadius: '4px'
    },
    moneyAmount: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#2e7d32'
    },
    netWorth: {
      fontSize: '12px',
      color: '#666'
    },
    propertiesSection: {
      marginBottom: '15px'
    },
    propertyItem: {
      fontSize: '12px',
      padding: '4px 8px',
      margin: '2px 0',
      backgroundColor: '#f5f5f5',
      borderRadius: '2px',
      display: 'flex',
      justifyContent: 'space-between'
    },
    actionsSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    button: {
      padding: '10px 15px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: '#2196f3',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    buttonDanger: {
      backgroundColor: '#f44336'
    },
    buttonSuccess: {
      backgroundColor: '#4caf50'
    },
    turnIndicator: {
      padding: '8px',
      backgroundColor: '#e3f2fd',
      border: '1px solid #2196f3',
      borderRadius: '4px',
      textAlign: 'center',
      marginBottom: '10px',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    notTurnIndicator: {
      padding: '8px',
      backgroundColor: '#f5f5f5',
      border: '1px solid #ddd',
      borderRadius: '4px',
      textAlign: 'center',
      marginBottom: '10px',
      fontSize: '14px',
      color: '#666'
    },
    noPlayer: {
      textAlign: 'center',
      color: '#666',
      fontStyle: 'italic'
    }
  }

  return (
    <div style={styles.container}>
      {/* Turn Indicator */}
      <div style={isPlayerTurn ? styles.turnIndicator : styles.notTurnIndicator}>
        {isPlayerTurn ? "Your Turn" : "Waiting..."}
      </div>

      {/* Player Header */}
      <div style={styles.header}>
        <div style={styles.avatar}>
          {currentPlayer.name?.charAt(0)?.toUpperCase() || 'P'}
        </div>
        <div style={styles.playerInfo}>
          <div style={styles.playerName}>{currentPlayer.name}</div>
          <div style={styles.playerStats}>
            Position: {currentPlayer.position || 0}
          </div>
          {currentPlayer.isInJail && (
            <div style={{ ...styles.playerStats, color: '#f44336' }}>
              In Jail ({currentPlayer.jailTurns || 0}/3)
            </div>
          )}
        </div>
      </div>

      {/* Money Section */}
      <div style={styles.moneySection}>
        <div style={styles.moneyAmount}>
          ${currentPlayer.money?.toLocaleString() || 0}
        </div>
        <div style={styles.netWorth}>
          Net Worth: ${netWorth.toLocaleString()}
        </div>
      </div>

      {/* Properties Section */}
      <div style={styles.propertiesSection}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
          Properties ({currentPlayer.properties?.length || 0})
        </h4>
        <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
          {currentPlayer.properties?.map(property => (
            <div key={property.id} style={styles.propertyItem}>
              <span>{property.name}</span>
              <span>
                {property.houses > 0 && `${property.houses}H`}
                {property.hotels > 0 && `${property.hotels}Hotel`}
                {property.isMortgaged && ' (M)'}
              </span>
            </div>
          )) || (
            <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
              No properties owned
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.actionsSection}>
        {/* Roll Dice */}
        {canRoll && (
          <button
            style={{
              ...styles.button,
              ...(ui.isAwaitingServer ? styles.buttonDisabled : {})
            }}
            onClick={() => handleAction('requestRoll')}
            disabled={ui.isAwaitingServer}
            aria-label="Roll dice"
          >
            {ui.isDiceRolling ? 'Rolling...' : 'Roll Dice'}
          </button>
        )}

        {/* Purchase Phase Actions */}
        {canBuy && (
          <>
            <button
              style={{
                ...styles.button,
                ...styles.buttonSuccess,
                ...(ui.isAwaitingServer ? styles.buttonDisabled : {})
              }}
              onClick={() => handleAction('buyProperty', gameState.currentOffer?.propertyId)}
              disabled={ui.isAwaitingServer}
              aria-label="Buy property"
            >
              Buy Property
            </button>
            <button
              style={{
                ...styles.button,
                ...styles.buttonDanger,
                ...(ui.isAwaitingServer ? styles.buttonDisabled : {})
              }}
              onClick={() => handleAction('declineBuy', gameState.currentOffer?.propertyId)}
              disabled={ui.isAwaitingServer}
              aria-label="Decline property"
            >
              Decline
            </button>
          </>
        )}

        {/* Action Phase Buttons */}
        {canBuild && (
          <button
            style={{
              ...styles.button,
              ...(ui.isAwaitingServer ? styles.buttonDisabled : {})
            }}
            onClick={() => handleAction('buildHouse')}
            disabled={ui.isAwaitingServer}
            aria-label="Build house"
          >
            Build House
          </button>
        )}

        {canTrade && (
          <button
            style={{
              ...styles.button,
              ...(ui.isAwaitingServer ? styles.buttonDisabled : {})
            }}
            onClick={() => handleAction('openTradeModal')}
            disabled={ui.isAwaitingServer}
            aria-label="Propose trade"
          >
            Trade
          </button>
        )}

        {/* End Turn */}
        {canEndTurn && (
          <button
            style={{
              ...styles.button,
              ...(ui.isAwaitingServer ? styles.buttonDisabled : {})
            }}
            onClick={() => handleAction('endTurn')}
            disabled={ui.isAwaitingServer}
            aria-label="End turn"
          >
            End Turn
          </button>
        )}

        {/* Jail Actions */}
        {currentPlayer.isInJail && isPlayerTurn && (
          <>
            <button
              style={{
                ...styles.button,
                ...(ui.isAwaitingServer ? styles.buttonDisabled : {})
              }}
              onClick={() => handleAction('payFine')}
              disabled={ui.isAwaitingServer}
              aria-label="Pay jail fine"
            >
              Pay Fine ($50)
            </button>
            {currentPlayer.getOutOfJailCards > 0 && (
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonSuccess,
                  ...(ui.isAwaitingServer ? styles.buttonDisabled : {})
                }}
                onClick={() => handleAction('useGetOutOfJailCard')}
                disabled={ui.isAwaitingServer}
                aria-label="Use get out of jail card"
              >
                Use Jail Card
              </button>
            )}
          </>
        )}
      </div>

      {/* Server Error Display */}
      {ui.lastServerError && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#c62828'
        }}>
          Error: {ui.lastServerError}
        </div>
      )}
    </div>
  )
}

export default PlayerHUD
