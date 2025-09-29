// Game state reducer for managing local UI state and server game state

export const initialState = {
    // Connection state
    isConnected: false,
    isAwaitingServer: false,
    lastServerError: null,
    
    // Game state (server authoritative)
    gameState: null,
    gameId: null,
    roomCode: null,
    userPlayerId: null,
    
    // UI state (local only)
    selectedProperty: null,
    modals: {
      propertyDetails: false,
      tradeOffer: false,
      auction: false,
      cardDisplay: false,
      gameSettings: false,
      playerStats: false
    },
    
    // Animation state
    isDiceRolling: false,
    lastDiceRoll: null,
    
    // Current game elements
    currentCard: null,
    pendingTrade: null,
    
    // Event log for activity feed
    eventLog: []
  }
  
  export const gameReducer = (state, action) => {
    switch (action.type) {
      // Connection actions
      case 'SET_CONNECTED':
        return {
          ...state,
          isConnected: action.payload,
          lastServerError: action.payload ? null : state.lastServerError
        }
  
      case 'SET_AWAITING_SERVER':
        return {
          ...state,
          isAwaitingServer: action.payload
        }
  
      case 'SET_ERROR':
        return {
          ...state,
          lastServerError: action.payload,
          isAwaitingServer: false
        }
  
      case 'CLEAR_ERROR':
        return {
          ...state,
          lastServerError: null
        }
  
      // Room and game state actions
      case 'SET_ROOM_INFO':
        return {
          ...state,
          gameId: action.payload.gameId || state.gameId,
          roomCode: action.payload.roomCode || state.roomCode,
          userPlayerId: action.payload.userPlayerId || state.userPlayerId
        }
  
      case 'SET_GAME_STATE':
        return {
          ...state,
          gameState: action.payload,
          // Update event log if provided
          eventLog: action.payload.log || state.eventLog
        }
  
      case 'UPDATE_GAME_STATE':
        // Merge partial game state update
        return {
          ...state,
          gameState: state.gameState ? {
            ...state.gameState,
            ...action.payload
          } : action.payload
        }
  
      // UI state actions
      case 'SET_SELECTED_PROPERTY':
        return {
          ...state,
          selectedProperty: action.payload
        }
  
      case 'SET_MODAL_OPEN':
        return {
          ...state,
          modals: {
            ...state.modals,
            [action.payload.modalType]: action.payload.isOpen
          }
        }
  
      case 'CLOSE_ALL_MODALS':
        return {
          ...state,
          modals: Object.keys(state.modals).reduce((acc, key) => {
            acc[key] = false
            return acc
          }, {})
        }
  
      // Animation actions
      case 'SET_DICE_ROLLING':
        return {
          ...state,
          isDiceRolling: action.payload
        }
  
      case 'SET_LAST_DICE_ROLL':
        return {
          ...state,
          lastDiceRoll: action.payload
        }
  
      // Game element actions
      case 'SET_CURRENT_CARD':
        return {
          ...state,
          currentCard: action.payload,
          modals: {
            ...state.modals,
            cardDisplay: action.payload !== null
          }
        }
  
      case 'SET_PENDING_TRADE':
        return {
          ...state,
          pendingTrade: action.payload,
          modals: {
            ...state.modals,
            tradeOffer: action.payload !== null
          }
        }
  
      // Event log actions
      case 'ADD_LOG_ENTRY':
        return {
          ...state,
          eventLog: [
            ...state.eventLog.slice(-49), // Keep last 50 entries
            {
              id: Date.now() + Math.random(),
              timestamp: new Date().toISOString(),
              message: action.payload,
              type: action.logType || 'info'
            }
          ]
        }
  
      case 'CLEAR_LOG':
        return {
          ...state,
          eventLog: []
        }
  
      // Reset actions
      case 'RESET_GAME_STATE':
        return {
          ...initialState,
          isConnected: state.isConnected
        }
  
      case 'RESET_UI_STATE':
        return {
          ...state,
          selectedProperty: null,
          modals: { ...initialState.modals },
          isDiceRolling: false,
          currentCard: null,
          pendingTrade: null
        }
  
      default:
        console.warn(`Unknown action type: ${action.type}`)
        return state
    }
  }
  
  // Action creators for convenience
  export const actionCreators = {
    setConnected: (isConnected) => ({
      type: 'SET_CONNECTED',
      payload: isConnected
    }),
  
    setAwaitingServer: (isAwaiting) => ({
      type: 'SET_AWAITING_SERVER',
      payload: isAwaiting
    }),
  
    setError: (error) => ({
      type: 'SET_ERROR',
      payload: error
    }),
  
    clearError: () => ({
      type: 'CLEAR_ERROR'
    }),
  
    setRoomInfo: (roomInfo) => ({
      type: 'SET_ROOM_INFO',
      payload: roomInfo
    }),
  
    setGameState: (gameState) => ({
      type: 'SET_GAME_STATE',
      payload: gameState
    }),
  
    updateGameState: (partialState) => ({
      type: 'UPDATE_GAME_STATE',
      payload: partialState
    }),
  
    setSelectedProperty: (propertyId) => ({
      type: 'SET_SELECTED_PROPERTY',
      payload: propertyId
    }),
  
    setModalOpen: (modalType, isOpen) => ({
      type: 'SET_MODAL_OPEN',
      payload: { modalType, isOpen }
    }),
  
    closeAllModals: () => ({
      type: 'CLOSE_ALL_MODALS'
    }),
  
    setDiceRolling: (isRolling) => ({
      type: 'SET_DICE_ROLLING',
      payload: isRolling
    }),
  
    setLastDiceRoll: (diceValues) => ({
      type: 'SET_LAST_DICE_ROLL',
      payload: diceValues
    }),
  
    setCurrentCard: (card) => ({
      type: 'SET_CURRENT_CARD',
      payload: card
    }),
  
    setPendingTrade: (trade) => ({
      type: 'SET_PENDING_TRADE',
      payload: trade
    }),
  
    addLogEntry: (message, logType = 'info') => ({
      type: 'ADD_LOG_ENTRY',
      payload: message,
      logType
    }),
  
    clearLog: () => ({
      type: 'CLEAR_LOG'
    }),
  
    resetGameState: () => ({
      type: 'RESET_GAME_STATE'
    }),
  
    resetUIState: () => ({
      type: 'RESET_UI_STATE'
    })
  }
  
  // Selectors for derived state
  export const selectors = {
    // Game state selectors
    getCurrentPlayer: (state) => {
      if (!state.gameState || !state.userPlayerId) return null
      return state.gameState.players?.find(p => p.id === state.userPlayerId) || null
    },
  
    getPlayerByPosition: (state, position) => {
      if (!state.gameState) return null
      return state.gameState.players?.find(p => p.position === position) || null
    },
  
    getCurrentTurnPlayer: (state) => {
      if (!state.gameState) return null
      return state.gameState.players?.find(p => p.id === state.gameState.currentTurn) || null
    },
  
    getPropertyById: (state, propertyId) => {
      if (!state.gameState || !state.gameState.board) return null
      return state.gameState.board.find(square => square.id === propertyId) || null
    },
  
    getPlayerProperties: (state, playerId) => {
      if (!state.gameState || !state.gameState.board) return []
      return state.gameState.board.filter(square => square.ownerId === playerId)
    },
  
    // UI state selectors
    isModalOpen: (state, modalType) => {
      return state.modals[modalType] || false
    },
  
    hasError: (state) => {
      return state.lastServerError !== null
    },
  
    isPlayerTurn: (state) => {
      if (!state.gameState || !state.userPlayerId) return false
      return state.gameState.currentTurn === state.userPlayerId
    },
  
    canRollDice: (state) => {
      const currentPlayer = selectors.getCurrentPlayer(state)
      if (!currentPlayer || !selectors.isPlayerTurn(state)) return false
      return state.gameState.phase === 'roll' && !state.isDiceRolling
    },
  
    canEndTurn: (state) => {
      if (!selectors.isPlayerTurn(state)) return false
      return ['purchase', 'action', 'jail'].includes(state.gameState.phase)
    },
  
    // Game phase selectors
    isInPhase: (state, phase) => {
      return state.gameState?.phase === phase
    },
  
    getAvailableActions: (state) => {
      const currentPlayer = selectors.getCurrentPlayer(state)
      if (!currentPlayer || !selectors.isPlayerTurn(state)) return []
  
      const actions = []
      const phase = state.gameState.phase
  
      switch (phase) {
        case 'roll':
          if (!state.isDiceRolling) actions.push('rollDice')
          break
        case 'purchase':
          actions.push('buyProperty', 'declineProperty')
          break
        case 'auction':
          actions.push('placeBid', 'passAuction')
          break
        case 'action':
          actions.push('endTurn', 'buildHouse', 'mortgage', 'trade')
          break
        case 'jail':
          actions.push('payFine', 'rollForJail')
          if (currentPlayer.getOutOfJailCards > 0) actions.push('useJailCard')
          break
      }
  
      return actions
    }
  }
  
  export default gameReducer
  