import React, { useState, useEffect } from 'react'
import { useGame } from '../../context/GameProvider'

const TradeModal = () => {
  const { gameState, actions, ui, userPlayerId } = useGame()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [offerMoney, setOfferMoney] = useState(0)
  const [requestMoney, setRequestMoney] = useState(0)
  const [offerProperties, setOfferProperties] = useState([])
  const [requestProperties, setRequestProperties] = useState([])

  const currentPlayer = gameState?.players?.find(p => p.id === userPlayerId)
  const pendingTrade = gameState?.pendingTrade
  const isReceivingTrade = pendingTrade && pendingTrade.toPlayerId === userPlayerId

  // Auto-open modal when receiving a trade
  useEffect(() => {
    if (isReceivingTrade) {
      setIsOpen(true)
    }
  }, [isReceivingTrade])

  // Expose openTradeModal action
  useEffect(() => {
    if (actions.openTradeModal === undefined) {
      actions.openTradeModal = () => setIsOpen(true)
    }
  }, [actions])

  const handleClose = () => {
    setIsOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setSelectedPlayer('')
    setOfferMoney(0)
    setRequestMoney(0)
    setOfferProperties([])
    setRequestProperties([])
  }

  const handlePropertyToggle = (propertyId, isOffer) => {
    if (isOffer) {
      setOfferProperties(prev => 
        prev.includes(propertyId) 
          ? prev.filter(id => id !== propertyId)
          : [...prev, propertyId]
      )
    } else {
      setRequestProperties(prev => 
        prev.includes(propertyId) 
          ? prev.filter(id => id !== propertyId)
          : [...prev, propertyId]
      )
    }
  }

  const handleProposeTrade = async () => {
    if (!selectedPlayer) {
      alert('Please select a player to trade with')
      return
    }

    const offer = {
      fromOffer: {
        money: offerMoney,
        properties: offerProperties
      },
      toOffer: {
        money: requestMoney,
        properties: requestProperties
      }
    }

    const result = await actions.tradeOffer(userPlayerId, selectedPlayer, offer)
    if (result.ok) {
      handleClose()
    } else {
      alert(`Trade failed: ${result.reason}`)
    }
  }

  const handleAcceptTrade = async () => {
    const result = await actions.acceptTrade(userPlayerId, pendingTrade.id)
    if (result.ok) {
      handleClose()
    } else {
      alert(`Accept failed: ${result.reason}`)
    }
  }

  const handleRejectTrade = async () => {
    const result = await actions.rejectTrade(userPlayerId, pendingTrade.id)
    if (result.ok) {
      handleClose()
    } else {
      alert(`Reject failed: ${result.reason}`)
    }
  }

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflowY: 'auto',
      position: 'relative'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      borderBottom: '1px solid #ddd',
      paddingBottom: '10px'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      padding: '5px'
    },
    section: {
      marginBottom: '20px'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    playerSelect: {
      width: '100%',
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      marginBottom: '10px'
    },
    moneyInput: {
      width: '100px',
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      textAlign: 'right'
    },
    propertyList: {
      maxHeight: '150px',
      overflowY: 'auto',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '10px'
    },
    propertyItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '4px 0',
      borderBottom: '1px solid #eee'
    },
    checkbox: {
      marginRight: '8px'
    },
    tradePreview: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '20px',
      marginBottom: '20px'
    },
    tradeColumn: {
      flex: 1,
      padding: '15px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#f9f9f9'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end'
    },
    button: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    primaryButton: {
      backgroundColor: '#2196f3',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#4caf50',
      color: 'white'
    },
    dangerButton: {
      backgroundColor: '#f44336',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#ddd',
      color: '#333'
    }
  }

  if (!isOpen) return null

  // Render incoming trade offer
  if (isReceivingTrade) {
    const fromPlayer = gameState.players.find(p => p.id === pendingTrade.fromPlayerId)
    
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.header}>
            <h2>Trade Offer from {fromPlayer?.name}</h2>
            <button style={styles.closeButton} onClick={handleClose}>×</button>
          </div>

          <div style={styles.tradePreview}>
            <div style={styles.tradeColumn}>
              <h3>You Give:</h3>
              <div>Money: ${pendingTrade.offer.toOffer.money}</div>
              <div>Properties:</div>
              <ul>
                {pendingTrade.offer.toOffer.properties.map(propId => {
                  const property = gameState.board?.find(sq => sq.id === propId)
                  return <li key={propId}>{property?.name || propId}</li>
                })}
              </ul>
            </div>
            
            <div style={styles.tradeColumn}>
              <h3>You Get:</h3>
              <div>Money: ${pendingTrade.offer.fromOffer.money}</div>
              <div>Properties:</div>
              <ul>
                {pendingTrade.offer.fromOffer.properties.map(propId => {
                  const property = gameState.board?.find(sq => sq.id === propId)
                  return <li key={propId}>{property?.name || propId}</li>
                })}
              </ul>
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button 
              style={{...styles.button, ...styles.successButton}}
              onClick={handleAcceptTrade}
              disabled={ui.isAwaitingServer}
            >
              Accept Trade
            </button>
            <button 
              style={{...styles.button, ...styles.dangerButton}}
              onClick={handleRejectTrade}
              disabled={ui.isAwaitingServer}
            >
              Reject Trade
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render trade proposal form
  const otherPlayers = gameState?.players?.filter(p => p.id !== userPlayerId) || []
  const selectedPlayerData = otherPlayers.find(p => p.id === selectedPlayer)

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2>Propose Trade</h2>
          <button style={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Select Player</div>
          <select 
            style={styles.playerSelect}
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
          >
            <option value="">Choose a player...</option>
            {otherPlayers.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} (${player.money})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.tradePreview}>
          {/* What you're offering */}
          <div style={styles.tradeColumn}>
            <h3>You Offer:</h3>
            
            <div style={{ marginBottom: '10px' }}>
              <label>Money: $</label>
              <input
                type="number"
                style={styles.moneyInput}
                value={offerMoney}
                onChange={(e) => setOfferMoney(Math.max(0, parseInt(e.target.value) || 0))}
                max={currentPlayer?.money || 0}
                />
              </div>
  
              <div>
                <div style={styles.sectionTitle}>Properties:</div>
                <div style={styles.propertyList}>
                  {currentPlayer?.properties?.map(property => (
                    <div key={property.id} style={styles.propertyItem}>
                      <input
                        type="checkbox"
                        style={styles.checkbox}
                        checked={offerProperties.includes(property.id)}
                        onChange={() => handlePropertyToggle(property.id, true)}
                      />
                      <span>{property.name}</span>
                      {property.isMortgaged && <span style={{ color: '#f44336' }}> (Mortgaged)</span>}
                    </div>
                  )) || <div style={{ fontStyle: 'italic', color: '#666' }}>No properties owned</div>}
                </div>
              </div>
            </div>
  
            {/* What you're requesting */}
            <div style={styles.tradeColumn}>
              <h3>You Request:</h3>
              
              <div style={{ marginBottom: '10px' }}>
                <label>Money: $</label>
                <input
                  type="number"
                  style={styles.moneyInput}
                  value={requestMoney}
                  onChange={(e) => setRequestMoney(Math.max(0, parseInt(e.target.value) || 0))}
                  max={selectedPlayerData?.money || 0}
                />
              </div>
  
              <div>
                <div style={styles.sectionTitle}>Properties:</div>
                <div style={styles.propertyList}>
                  {selectedPlayerData?.properties?.map(property => (
                    <div key={property.id} style={styles.propertyItem}>
                      <input
                        type="checkbox"
                        style={styles.checkbox}
                        checked={requestProperties.includes(property.id)}
                        onChange={() => handlePropertyToggle(property.id, false)}
                      />
                      <span>{property.name}</span>
                      {property.isMortgaged && <span style={{ color: '#f44336' }}> (Mortgaged)</span>}
                    </div>
                  )) || <div style={{ fontStyle: 'italic', color: '#666' }}>
                    {selectedPlayer ? 'No properties owned' : 'Select a player first'}
                  </div>}
                </div>
              </div>
            </div>
          </div>
  
          <div style={styles.buttonGroup}>
            <button 
              style={{...styles.button, ...styles.primaryButton}}
              onClick={handleProposeTrade}
              disabled={ui.isAwaitingServer || !selectedPlayer}
            >
              Propose Trade
            </button>
            <button 
              style={{...styles.button, ...styles.secondaryButton}}
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  export default TradeModal
  
