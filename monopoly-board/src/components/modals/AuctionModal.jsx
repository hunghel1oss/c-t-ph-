import React, { useState, useEffect } from 'react'
import { useGame } from '../../context/GameProvider'

const AuctionModal = () => {
  const { gameState, actions, ui, userPlayerId } = useGame()
  const [bidAmount, setBidAmount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const activeAuction = gameState?.activeAuction
  const currentPlayer = gameState?.players?.find(p => p.id === userPlayerId)

  // Auto-open modal when auction starts
  useEffect(() => {
    if (activeAuction) {
      setIsOpen(true)
      setBidAmount((activeAuction.currentBid || 0) + 10) // Set default bid slightly higher
    } else {
      setIsOpen(false)
    }
  }, [activeAuction])

  const handleClose = () => {
    setIsOpen(false)
  }

  const handlePlaceBid = async () => {
    if (bidAmount <= (activeAuction.currentBid || 0)) {
      alert('Bid must be higher than current bid')
      return
    }

    if (bidAmount > (currentPlayer?.money || 0)) {
      alert('Insufficient funds for this bid')
      return
    }

    const result = await actions.auctionBid(userPlayerId, activeAuction.propertyId, bidAmount)
    if (!result.ok) {
      alert(`Bid failed: ${result.reason}`)
    }
  }

  const handlePass = async () => {
    const result = await actions.auctionPass(userPlayerId, activeAuction.propertyId)
    if (!result.ok) {
      alert(`Pass failed: ${result.reason}`)
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
      maxWidth: '500px',
      width: '90%',
      position: 'relative'
    },
    header: {
      textAlign: 'center',
      marginBottom: '20px',
      borderBottom: '1px solid #ddd',
      paddingBottom: '15px'
    },
    propertyInfo: {
      backgroundColor: '#f9f9f9',
      padding: '15px',
      borderRadius: '4px',
      marginBottom: '20px'
    },
    propertyName: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '5px'
    },
    propertyDetails: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '10px'
    },
    currentBidSection: {
      textAlign: 'center',
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#e3f2fd',
      borderRadius: '4px'
    },
    currentBid: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1976d2'
    },
    currentBidder: {
      fontSize: '14px',
      color: '#666',
      marginTop: '5px'
    },
    biddersSection: {
      marginBottom: '20px'
    },
    biddersList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '10px'
    },
    bidderChip: {
      padding: '4px 8px',
      backgroundColor: '#e0e0e0',
      borderRadius: '12px',
      fontSize: '12px'
    },
    activeBidder: {
      backgroundColor: '#4caf50',
      color: 'white'
    },
    passedBidder: {
      backgroundColor: '#f44336',
      color: 'white',
      textDecoration: 'line-through'
    },
    bidInputSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '20px',
      justifyContent: 'center'
    },
    bidInput: {
      width: '120px',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      textAlign: 'right',
      fontSize: '16px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'center'
    },
    button: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    bidButton: {
      backgroundColor: '#4caf50',
      color: 'white'
    },
    passButton: {
      backgroundColor: '#f44336',
      color: 'white'
    },
    disabledButton: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    playerMoney: {
      textAlign: 'center',
      fontSize: '12px',
      color: '#666',
      marginBottom: '15px'
    },
    timer: {
      textAlign: 'center',
      fontSize: '14px',
      color: '#f44336',
      fontWeight: 'bold',
      marginBottom: '10px'
    }
  }

  if (!isOpen || !activeAuction) return null

  const property = gameState?.board?.find(sq => sq.id === activeAuction.propertyId)
  const currentBidder = activeAuction.currentBidderId ? 
    gameState.players?.find(p => p.id === activeAuction.currentBidderId) : null

  const isPlayerActive = activeAuction.activeBidders?.includes(userPlayerId)
  const hasPlayerPassed = activeAuction.passedBidders?.includes(userPlayerId)
  const canBid = isPlayerActive && !hasPlayerPassed && !ui.isAwaitingServer
  const canPass = isPlayerActive && !hasPlayerPassed && !ui.isAwaitingServer

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2>Property Auction</h2>
          {activeAuction.timeRemaining && (
            <div style={styles.timer}>
              Time remaining: {Math.ceil(activeAuction.timeRemaining / 1000)}s
            </div>
          )}
        </div>

        {property && (
          <div style={styles.propertyInfo}>
            <div style={styles.propertyName}>{property.name}</div>
            <div style={styles.propertyDetails}>
              Purchase Price: ${property.price}
            </div>
            {property.rent && (
              <div style={styles.propertyDetails}>
                Base Rent: ${property.rent}
              </div>
            )}
          </div>
        )}

        <div style={styles.currentBidSection}>
          <div>Current Bid:</div>
          <div style={styles.currentBid}>
            ${activeAuction.currentBid || 0}
          </div>
          {currentBidder && (
            <div style={styles.currentBidder}>
              by {currentBidder.name}
            </div>
          )}
        </div>

        <div style={styles.biddersSection}>
          <div><strong>Bidders:</strong></div>
          <div style={styles.biddersList}>
            {gameState.players?.map(player => {
              const isActive = activeAuction.activeBidders?.includes(player.id)
              const hasPassed = activeAuction.passedBidders?.includes(player.id)
              
              if (!isActive && !hasPassed) return null
              
              return (
                <div 
                  key={player.id}
                  style={{
                    ...styles.bidderChip,
                    ...(hasPassed ? styles.passedBidder : {}),
                    ...(player.id === activeAuction.currentBidderId ? styles.activeBidder : {})
                  }}
                >
                  {player.name}
                </div>
              )
            })}
          </div>
        </div>

        <div style={styles.playerMoney}>
          Your Money: ${currentPlayer?.money?.toLocaleString() || 0}
        </div>

        {canBid && (
          <div style={styles.bidInputSection}>
            <label>Your Bid: $</label>
            <input
              type="number"
              style={styles.bidInput}
              value={bidAmount}
              onChange={(e) => setBidAmount(Math.max(0, parseInt(e.target.value) || 0))}
              min={(activeAuction.currentBid || 0) + 1}
              max={currentPlayer?.money || 0}
            />
          </div>
        )}

        <div style={styles.buttonGroup}>
          {canBid && (
            <button
              style={{
                ...styles.button,
                ...styles.bidButton,
                ...(ui.isAwaitingServer || bidAmount <= (activeAuction.currentBid || 0) || bidAmount > (currentPlayer?.money || 0) ? styles.disabledButton : {})
              }}
              onClick={handlePlaceBid}
              disabled={ui.isAwaitingServer || bidAmount <= (activeAuction.currentBid || 0) || bidAmount > (currentPlayer?.money || 0)}
              aria-label="Place bid"
            >
              {ui.isAwaitingServer ? 'Placing Bid...' : 'Place Bid'}
            </button>
          )}

          {canPass && (
            <button
              style={{
                ...styles.button,
                ...styles.passButton,
                ...(ui.isAwaitingServer ? styles.disabledButton : {})
              }}
              onClick={handlePass}
              disabled={ui.isAwaitingServer}
              aria-label="Pass auction"
            >
              {ui.isAwaitingServer ? 'Passing...' : 'Pass'}
            </button>
          )}

          {(!canBid && !canPass) && (
            <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
              {hasPlayerPassed ? 'You have passed this auction' : 'Waiting for other players...'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuctionModal
