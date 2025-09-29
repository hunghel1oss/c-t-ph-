import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import { gameClient } from '../services/gameClient'
import { gameReducer, initialState } from './reducer'

const GameContext = createContext()

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const diceAnimationCallbackRef = useRef(null)
  const pendingRollResultRef = useRef(null)

  // Socket connection with event handlers
  const socket = useSocket({
    onConnect: () => {
      dispatch({ type: 'SET_CONNECTED', payload: true })
      // Re-authenticate and get current game state if we were in a room
      if (state.gameId) {
        handleGetGameState()
      }
    },
    onDisconnect: () => {
      dispatch({ type: 'SET_CONNECTED', payload: false })
    }
  })

  // Server event listeners
  useEffect(() => {
    if (!socket) return

    // Game state events
    socket.on('gameState', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.reason })
      }
    })

    socket.on('gameStateUpdate', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
      }
    })

    // Room events
    socket.on('roomCreated', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_ROOM_INFO', payload: {
          gameId: data.gameId,
          roomCode: data.roomCode,
          userPlayerId: data.playerStateId
        }})
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.reason })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    socket.on('roomJoined', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_ROOM_INFO', payload: {
          gameId: data.gameId,
          userPlayerId: data.playerStateId
        }})
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.reason })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    socket.on('playerJoined', (data) => {
      dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
      dispatch({ type: 'ADD_LOG_ENTRY', payload: `Player joined the game` })
    })

    socket.on('playerLeft', (data) => {
      dispatch({ type: 'ADD_LOG_ENTRY', payload: `Player left the game` })
    })

    socket.on('gameStarted', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Game started!' })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    // Dice and movement events
    socket.on('rollResult', (data) => {
      if (data.ok) {
        const { dice, newPosition, passedGo, goMoney } = data
        
        // Store roll result for dice animation
        pendingRollResultRef.current = { dice, newPosition, passedGo, goMoney }
        
        // Trigger dice animation
        dispatch({ type: 'SET_DICE_ROLLING', payload: true })
        dispatch({ type: 'SET_LAST_DICE_ROLL', payload: dice })
        
        // Add log entry
        let logMessage = `Rolled ${dice[0]} and ${dice[1]} (total: ${dice[0] + dice[1]})`
        if (passedGo) logMessage += ` - Passed GO, collected $${goMoney}`
        dispatch({ type: 'ADD_LOG_ENTRY', payload: logMessage })
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.reason })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    socket.on('playerMoved', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
      }
    })

    // Property events
    socket.on('propertyPurchased', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Property purchased' })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    socket.on('propertyDeclined', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    // Auction events
    socket.on('auctionStarted', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Auction started' })
      }
    })

    socket.on('bidPlaced', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: `Bid placed: $${data.bidAmount}` })
      }
    })

    socket.on('auctionPassed', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Player passed on auction' })
      }
    })

    socket.on('auctionEnded', (data) => {
      dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
      if (data.winner) {
        dispatch({ type: 'ADD_LOG_ENTRY', payload: `Auction won for $${data.finalBid}` })
      } else {
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Auction ended with no winner' })
      }
    })

    // Development events
    socket.on('houseBuilt', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: `House built for $${data.cost}` })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    socket.on('houseSold', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: `House sold for $${data.refund}` })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    socket.on('propertyMortgaged', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: `Property mortgaged for $${data.mortgageValue}` })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    socket.on('propertyUnmortgaged', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: `Property unmortgaged for $${data.cost}` })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    // Trading events
    socket.on('tradeOfferReceived', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'SET_PENDING_TRADE', payload: data.tradeOffer })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Trade offer received' })
      }
    })

    socket.on('tradeOfferSent', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Trade offer sent' })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    socket.on('tradeAccepted', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'SET_PENDING_TRADE', payload: null })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Trade completed' })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    socket.on('tradeRejected', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'SET_PENDING_TRADE', payload: null })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Trade rejected' })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    socket.on('tradeCancelled', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'SET_PENDING_TRADE', payload: null })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Trade cancelled' })
      }
    })

    // Card events
    socket.on('cardDrawn', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'SET_CURRENT_CARD', payload: data.card })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: `Drew card: ${data.card.text}` })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    socket.on('cardEffectExecuted', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'SET_CURRENT_CARD', payload: null })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Card effect applied' })
      }
    })

    // Jail events
    socket.on('jailFinePaid', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: `Paid jail fine: $${data.amount}` })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    socket.on('jailCardUsed', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Used Get Out of Jail Free card' })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    // Turn events
    socket.on('turnEnded', (data) => {
      if (data.ok) {
        dispatch({ type: 'SET_GAME_STATE', payload: data.gameState })
        dispatch({ type: 'ADD_LOG_ENTRY', payload: 'Turn ended' })
      }
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    // Error events
    socket.on('error', (data) => {
      dispatch({ type: 'SET_ERROR', payload: data.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    })

    // Cleanup listeners
    return () => {
      socket.off('gameState')
      socket.off('gameStateUpdate')
      socket.off('roomCreated')
      socket.off('roomJoined')
      socket.off('playerJoined')
      socket.off('playerLeft')
      socket.off('gameStarted')
      socket.off('rollResult')
      socket.off('playerMoved')
      socket.off('propertyPurchased')
      socket.off('propertyDeclined')
      socket.off('auctionStarted')
      socket.off('bidPlaced')
      socket.off('auctionPassed')
      socket.off('auctionEnded')
      socket.off('houseBuilt')
      socket.off('houseSold')
      socket.off('propertyMortgaged')
      socket.off('propertyUnmortgaged')
      socket.off('tradeOfferReceived')
      socket.off('tradeOfferSent')
      socket.off('tradeAccepted')
      socket.off('tradeRejected')
      socket.off('tradeCancelled')
      socket.off('cardDrawn')
      socket.off('cardEffectExecuted')
      socket.off('jailFinePaid')
      socket.off('jailCardUsed')
      socket.off('turnEnded')
      socket.off('error')
    }
  }, [socket, state.gameId])

  // Action handlers
  const handleCreateRoom = useCallback(async (userId, settings = {}) => {
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.createRoom(socket, userId, settings)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket])

  const handleJoinRoom = useCallback(async (userId, roomCode) => {
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.joinRoom(socket, userId, roomCode)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket])

  const handleStartGame = useCallback(async () => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.startGame(socket, state.gameId, state.userPlayerId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleRequestRoll = useCallback(async () => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.requestRoll(socket, state.gameId, state.userPlayerId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleBuyProperty = useCallback(async (propertyId) => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.buyProperty(socket, state.gameId, state.userPlayerId, propertyId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleDeclineBuy = useCallback(async (propertyId) => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.declineBuy(socket, state.gameId, state.userPlayerId, propertyId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleEndTurn = useCallback(async () => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.endTurn(socket, state.gameId, state.userPlayerId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleBuildHouse = useCallback(async (propertyId) => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.buildHouse(socket, state.gameId, state.userPlayerId, propertyId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleSellHouse = useCallback(async (propertyId) => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.sellHouse(socket, state.gameId, state.userPlayerId, propertyId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleMortgage = useCallback(async (propertyId) => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.mortgage(socket, state.gameId, state.userPlayerId, propertyId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleUnmortgage = useCallback(async (propertyId) => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.unmortgage(socket, state.gameId, state.userPlayerId, propertyId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleAuctionBid = useCallback(async (bidAmount) => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.auctionBid(socket, state.gameId, state.userPlayerId, bidAmount)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleAuctionPass = useCallback(async () => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.auctionPass(socket, state.gameId, state.userPlayerId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleTradeOffer = useCallback(async (toPlayerId, offer) => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.tradeOffer(socket, state.gameId, state.userPlayerId, toPlayerId, offer)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleAcceptTrade = useCallback(async (tradeId) => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.acceptTrade(socket, state.gameId, state.userPlayerId, tradeId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleRejectTrade = useCallback(async (tradeId) => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.rejectTrade(socket, state.gameId, state.userPlayerId, tradeId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleDrawCard = useCallback(async (cardType) => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.drawCard(socket, state.gameId, state.userPlayerId, cardType)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handlePayFine = useCallback(async () => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.payFine(socket, state.gameId, state.userPlayerId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleUseGetOutOfJailCard = useCallback(async () => {
    if (!state.gameId || !state.userPlayerId) return { ok: false, reason: 'Not in a game' }
    
    dispatch({ type: 'SET_AWAITING_SERVER', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })
    
    const result = await gameClient.useGetOutOfJailCard(socket, state.gameId, state.userPlayerId)
    if (!result.ok) {
      dispatch({ type: 'SET_ERROR', payload: result.reason })
      dispatch({ type: 'SET_AWAITING_SERVER', payload: false })
    }
    return result
  }, [socket, state.gameId, state.userPlayerId])

  const handleGetGameState = useCallback(async () => {
    if (!state.gameId) return { ok: false, reason: 'Not in a game' }
    
    const result = await gameClient.getGameState(socket, state.gameId)
    return result
  }, [socket, state.gameId])

  // Dice animation integration
  const animateDiceToResult = useCallback((dice1, dice2) => {
    // This is called by Dice component when animation completes
    dispatch({ type: 'SET_DICE_ROLLING', payload: false })
    
    // Apply pending roll result
    if (pendingRollResultRef.current) {
      const { newPosition, passedGo, goMoney } = pendingRollResultRef.current
      // The gameState should already be updated via server events
      // This is just to clean up the pending state
      pendingRollResultRef.current = null
    }
  }, [])

  // Register dice animation callback
  const registerDiceAnimationCallback = useCallback((callback) => {
    diceAnimationCallbackRef.current = callback
  }, [])

  // UI state management
  const setSelectedProperty = useCallback((propertyId) => {
    dispatch({ type: 'SET_SELECTED_PROPERTY', payload: propertyId })
  }, [])

  const setModalOpen = useCallback((modalType, isOpen) => {
    dispatch({ type: 'SET_MODAL_OPEN', payload: { modalType, isOpen } })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const notifyError = useCallback((reason) => {
    dispatch({ type: 'SET_ERROR', payload: reason })
  }, [])

  // Context value
  const contextValue = {
    // Game state
    gameState: state.gameState,
    gameId: state.gameId,
    roomCode: state.roomCode,
    userPlayerId: state.userPlayerId,
    
    // UI state
    isConnected: state.isConnected,
    isAwaitingServer: state.isAwaitingServer,
    lastServerError: state.lastServerError,
    selectedProperty: state.selectedProperty,
    modals: state.modals,
    isDiceRolling: state.isDiceRolling,
    lastDiceRoll: state.lastDiceRoll,
    currentCard: state.currentCard,
    pendingTrade: state.pendingTrade,
    eventLog: state.eventLog,
    
        // Actions
        actions: {
            createRoom: handleCreateRoom,
            joinRoom: handleJoinRoom,
            startGame: handleStartGame,
            requestRoll: handleRequestRoll,
            buyProperty: handleBuyProperty,
            declineBuy: handleDeclineBuy,
            endTurn: handleEndTurn,
            buildHouse: handleBuildHouse,
            sellHouse: handleSellHouse,
            mortgage: handleMortgage,
            unmortgage: handleUnmortgage,
            auctionBid: handleAuctionBid,
            auctionPass: handleAuctionPass,
            tradeOffer: handleTradeOffer,
            acceptTrade: handleAcceptTrade,
            rejectTrade: handleRejectTrade,
            drawCard: handleDrawCard,
            payFine: handlePayFine,
            useGetOutOfJailCard: handleUseGetOutOfJailCard,
            getGameState: handleGetGameState
          },
          
          // UI helpers
          setSelectedProperty,
          setModalOpen,
          clearError,
          notifyError,
          animateDiceToResult,
          registerDiceAnimationCallback
        }
      
        return (
          <GameContext.Provider value={contextValue}>
            {children}
          </GameContext.Provider>
        )
      }
      