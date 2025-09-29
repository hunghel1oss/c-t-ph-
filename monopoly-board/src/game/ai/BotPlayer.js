// Bot player management for client-side UI

import { gameClient } from '../services/gameClient'

export class BotPlayer {
  constructor(difficulty = 'medium', name = null) {
    this.difficulty = difficulty
    this.name = name || this.generateBotName()
    this.id = null
    this.isActive = false
  }

  generateBotName() {
    const botNames = {
      easy: [
        'Rookie Bot', 'Simple Sam', 'Easy Eddie', 'Beginner Bob', 'Casual Carl',
        'Newbie Nancy', 'Basic Betty', 'Starter Steve', 'Learning Larry'
      ],
      medium: [
        'Smart Bot', 'Clever Clara', 'Tactical Tom', 'Strategic Sue', 'Balanced Ben',
        'Moderate Mike', 'Average Amy', 'Standard Stan', 'Regular Rita'
      ],
      hard: [
        'Master Bot', 'Expert Eva', 'Genius Gary', 'Pro Player', 'Elite Emma',
        'Champion Chuck', 'Veteran Vicky', 'Ace Alex', 'Supreme Sarah'
      ]
    }

    const names = botNames[this.difficulty] || botNames.medium
    return names[Math.floor(Math.random() * names.length)]
  }

  // Get bot personality traits based on difficulty
  getPersonality() {
    const personalities = {
      easy: {
        aggressiveness: 0.3,
        riskTolerance: 0.2,
        tradingWillingness: 0.4,
        developmentFocus: 0.3,
        cashReserve: 0.6,
        description: 'Conservative player, prefers safe moves'
      },
      medium: {
        aggressiveness: 0.6,
        riskTolerance: 0.5,
        tradingWillingness: 0.6,
        developmentFocus: 0.7,
        cashReserve: 0.4,
        description: 'Balanced player, adapts to situations'
      },
      hard: {
        aggressiveness: 0.8,
        riskTolerance: 0.7,
        tradingWillingness: 0.8,
        developmentFocus: 0.9,
        cashReserve: 0.3,
        description: 'Aggressive player, maximizes profit opportunities'
      }
    }

    return personalities[this.difficulty] || personalities.medium
  }

  // Validate difficulty setting
  static validateDifficulty(difficulty) {
    const validDifficulties = ['easy', 'medium', 'hard']
    return validDifficulties.includes(difficulty)
  }

  // Get all available difficulties with descriptions
  static getDifficulties() {
    return [
      {
        value: 'easy',
        label: 'Easy',
        description: 'Makes simple, conservative decisions. Good for beginners.'
      },
      {
        value: 'medium',
        label: 'Medium',
        description: 'Balanced strategy with moderate risk-taking. Recommended for most games.'
      },
      {
        value: 'hard',
        label: 'Hard',
        description: 'Aggressive and strategic. Will maximize profits and make complex trades.'
      }
    ]
  }
}

// Bot management utilities
export const botManager = {
  // Add a bot to a game room
  async addBot(socket, gameId, difficulty = 'medium', customName = null) {
    if (!BotPlayer.validateDifficulty(difficulty)) {
      return { ok: false, reason: 'Invalid difficulty level' }
    }

    try {
      const result = await gameClient.addBot(socket, gameId, difficulty)
      
      if (result.ok) {
        // Create local bot instance for UI tracking
        const bot = new BotPlayer(difficulty, customName)
        bot.id = result.botId
        bot.isActive = true
        
        return {
          ok: true,
          bot,
          botId: result.botId,
          gameState: result.gameState
        }
      }
      
      return result
    } catch (error) {
      return {
        ok: false,
        reason: 'Failed to add bot',
        error: error.message
      }
    }
  },

  // Remove a bot from a game room
  async removeBot(socket, gameId, botId) {
    if (!botId) {
      return { ok: false, reason: 'Bot ID is required' }
    }

    try {
      const result = await gameClient.removeBot(socket, gameId, botId)
      return result
    } catch (error) {
      return {
        ok: false,
        reason: 'Failed to remove bot',
        error: error.message
      }
    }
  },

  // Get recommended bot count based on human players
  getRecommendedBotCount(humanPlayerCount, maxPlayers = 4) {
    if (humanPlayerCount >= maxPlayers) return 0
    if (humanPlayerCount === 1) return 2 // Solo player gets 2 bots for 3-player game
    if (humanPlayerCount === 2) return 1 // 2 humans get 1 bot for 3-player game
    if (humanPlayerCount === 3) return 1 // 3 humans get 1 bot for full 4-player game
    return Math.max(0, maxPlayers - humanPlayerCount)
  },

    // Create a balanced bot team
    createBalancedBotTeam(botCount) {
        if (botCount <= 0) return []
    
        const bots = []
        const difficulties = ['easy', 'medium', 'hard']
        
        for (let i = 0; i < botCount; i++) {
          // Distribute difficulties evenly
          const difficultyIndex = i % difficulties.length
          const difficulty = difficulties[difficultyIndex]
          
          const bot = new BotPlayer(difficulty)
          bots.push(bot)
        }
        
        return bots
      },
    
      // Create bots with specific difficulty distribution
      createCustomBotTeam(difficultyDistribution) {
        const bots = []
        
        for (const [difficulty, count] of Object.entries(difficultyDistribution)) {
          if (!BotPlayer.validateDifficulty(difficulty)) {
            console.warn(`Invalid difficulty: ${difficulty}`)
            continue
          }
          
          for (let i = 0; i < count; i++) {
            const bot = new BotPlayer(difficulty)
            bots.push(bot)
          }
        }
        
        return bots
      },
    
      // Get bot statistics for UI display
      getBotStats(bots) {
        const stats = {
          total: bots.length,
          byDifficulty: {
            easy: 0,
            medium: 0,
            hard: 0
          },
          active: 0
        }
    
        bots.forEach(bot => {
          if (bot.difficulty in stats.byDifficulty) {
            stats.byDifficulty[bot.difficulty]++
          }
          if (bot.isActive) {
            stats.active++
          }
        })
    
        return stats
      }
    }
    
    // React hook for bot management
    export const useBotManager = (socket, gameId) => {
      const [bots, setBots] = useState([])
      const [isLoading, setIsLoading] = useState(false)
      const [error, setError] = useState(null)
    
      const addBot = useCallback(async (difficulty = 'medium', customName = null) => {
        if (!socket || !gameId) {
          setError('Socket or game ID not available')
          return { ok: false, reason: 'Socket or game ID not available' }
        }
    
        setIsLoading(true)
        setError(null)
    
        try {
          const result = await botManager.addBot(socket, gameId, difficulty, customName)
          
          if (result.ok) {
            setBots(prev => [...prev, result.bot])
          } else {
            setError(result.reason)
          }
          
          return result
        } catch (err) {
          const errorMsg = err.message || 'Failed to add bot'
          setError(errorMsg)
          return { ok: false, reason: errorMsg }
        } finally {
          setIsLoading(false)
        }
      }, [socket, gameId])
    
      const removeBot = useCallback(async (botId) => {
        if (!socket || !gameId) {
          setError('Socket or game ID not available')
          return { ok: false, reason: 'Socket or game ID not available' }
        }
    
        setIsLoading(true)
        setError(null)
    
        try {
          const result = await botManager.removeBot(socket, gameId, botId)
          
          if (result.ok) {
            setBots(prev => prev.filter(bot => bot.id !== botId))
          } else {
            setError(result.reason)
          }
          
          return result
        } catch (err) {
          const errorMsg = err.message || 'Failed to remove bot'
          setError(errorMsg)
          return { ok: false, reason: errorMsg }
        } finally {
          setIsLoading(false)
        }
      }, [socket, gameId])
    
      const addBalancedBots = useCallback(async (count) => {
        const botTeam = botManager.createBalancedBotTeam(count)
        const results = []
    
        for (const bot of botTeam) {
          const result = await addBot(bot.difficulty, bot.name)
          results.push(result)
        }
    
        return results
      }, [addBot])
    
      const clearAllBots = useCallback(async () => {
        const results = []
        
        for (const bot of bots) {
          if (bot.id) {
            const result = await removeBot(bot.id)
            results.push(result)
          }
        }
    
        return results
      }, [bots, removeBot])
    
      const clearError = useCallback(() => {
        setError(null)
      }, [])
    
      return {
        bots,
        isLoading,
        error,
        addBot,
        removeBot,
        addBalancedBots,
        clearAllBots,
        clearError,
        botStats: botManager.getBotStats(bots)
      }
    }
    
    export default BotPlayer
    
