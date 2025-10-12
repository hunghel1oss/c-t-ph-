/**
 * Bot AI Logic for Monopoly Game
 * Implements decision-making algorithms for computer players
 */

const Rules = require('../game/Rulers');

class BotAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.personality = this.generatePersonality();
  }

  generatePersonality() {
    const personalities = {
      easy: {
        aggressiveness: 0.3,
        riskTolerance: 0.2,
        tradingWillingness: 0.4,
        developmentFocus: 0.3,
        cashReserve: 0.4 // Keep 40% of money as reserve
      },
      medium: {
        aggressiveness: 0.6,
        riskTolerance: 0.5,
        tradingWillingness: 0.6,
        developmentFocus: 0.7,
        cashReserve: 0.3
      },
      hard: {
        aggressiveness: 0.8,
        riskTolerance: 0.7,
        tradingWillingness: 0.8,
        developmentFocus: 0.9,
        cashReserve: 0.2
      },
      expert: {
        aggressiveness: 0.9,
        riskTolerance: 0.6,
        tradingWillingness: 0.9,
        developmentFocus: 0.95,
        cashReserve: 0.15
      }
    };

    return personalities[this.difficulty] || personalities.medium;
  }

  async makeDecision(gameState, botPlayerId) {
    const botPlayer = gameState.players.find(p => p._id.toString() === botPlayerId);
    if (!botPlayer) return { action: null };

    // Analyze current game situation
    const analysis = await this.analyzeGameState(gameState, botPlayerId);
    
    // Determine what phase we're in and what actions are available
    switch (gameState.phase) {
      case 'rolling':
        return this.decideRoll(analysis);
      
      case 'resolving':
        return this.decideSquareAction(analysis, gameState);
      
      case 'property_decision':
        return this.decidePurchase(analysis, gameState);
      
      case 'auction':
        return this.decideBid(analysis, gameState);
      
      case 'trading':
        return this.decideTrade(analysis, gameState);
      
      case 'development':
        return this.decideDevelopment(analysis, gameState);
      
      case 'jail':
        return this.decideJailAction(analysis, gameState);
      
      default:
        return { action: 'END_TURN' };
    }
  }

  async analyzeGameState(gameState, botPlayerId) {
    const botPlayer = gameState.players.find(p => p._id.toString() === botPlayerId);
    const opponents = gameState.players.filter(p => p._id.toString() !== botPlayerId && !p.isBankrupt);
    
    // Get square templates for calculations
    const SquareTemplate = require('../models/SquareTemplate.model');
    const squareTemplates = await SquareTemplate.find();
    
    const analysis = {
      botPlayer,
      opponents,
      squareTemplates,
      gamePhase: this.determineGamePhase(gameState),
      botNetWorth: Rules.calculateNetWorth(botPlayerId, gameState, squareTemplates),
      botProperties: Rules.getPlayerProperties(botPlayerId, gameState),
      botMonopolies: Rules.getPlayerMonopolies(botPlayerId, gameState),
      opponentThreats: this.analyzeOpponentThreats(opponents, gameState, squareTemplates),
      availableActions: this.getAvailableActions(gameState, botPlayerId),
      cashReserveNeeded: this.calculateCashReserve(gameState, botPlayerId),
      propertyValues: this.calculatePropertyValues(gameState, squareTemplates)
    };

    return analysis;
  }

  determineGamePhase(gameState) {
    const totalProperties = gameState.boardState.filter(sq => sq.owner || sq.owen).length;
    const totalSquares = gameState.boardState.length;
    const propertyOwnership = totalProperties / totalSquares;

    if (propertyOwnership < 0.3) return 'early';
    if (propertyOwnership < 0.7) return 'middle';
    return 'late';
  }

  decideRoll(analysis) {
    // Bot always rolls when it's their turn
    return { 
      action: 'ROLL_DICE',
      reasoning: 'Bot turn - rolling dice'
    };
  }

  decideSquareAction(analysis, gameState) {
    const currentPosition = analysis.botPlayer.position;
    const squareState = gameState.boardState[currentPosition];
    const squareTemplate = analysis.squareTemplates.find(t => 
      t._id.toString() === squareState.squareId.toString()
    );

    if (!squareTemplate) {
      return { action: 'END_TURN' };
    }

    // Handle different square types
    switch (squareTemplate.type) {
      case 'property':
        const owner = squareState.owner || squareState.owen;
        if (!owner) {
          return this.decidePurchase(analysis, gameState, squareTemplate);
        }
        break;
      
      case 'chance':
      case 'community':
        return { action: 'DRAW_CARD' };
      
      default:
        return { action: 'END_TURN' };
    }

    return { action: 'END_TURN' };
  }

  decidePurchase(analysis, gameState, squareTemplate = null) {
    if (!squareTemplate) {
      const currentPosition = analysis.botPlayer.position;
      const squareState = gameState.boardState[currentPosition];
      squareTemplate = analysis.squareTemplates.find(t => 
        t._id.toString() === squareState.squareId.toString()
      );
    }

    if (!squareTemplate) {
      return { action: 'DECLINE_PURCHASE' };
    }

    const price = squareTemplate.price || 0;
    const canAfford = analysis.botPlayer.money >= price;
    const shouldKeepReserve = (analysis.botPlayer.money - price) >= analysis.cashReserveNeeded;

    if (!canAfford) {
      return { action: 'DECLINE_PURCHASE', reasoning: 'Cannot afford' };
    }

    // Calculate property value score
    const propertyScore = this.calculatePropertyScore(squareTemplate, analysis);
    const purchaseThreshold = this.getPurchaseThreshold(analysis.gamePhase);

    const shouldPurchase = propertyScore >= purchaseThreshold && 
                          (shouldKeepReserve || this.personality.riskTolerance > 0.6);

    return {
      action: shouldPurchase ? 'PURCHASE_PROPERTY' : 'DECLINE_PURCHASE',
      reasoning: `Property score: ${propertyScore}, threshold: ${purchaseThreshold}`
    };
  }

  calculatePropertyScore(squareTemplate, analysis) {
    let score = 0;

    // Base value from rent potential
    const baseRent = squareTemplate.rent?.base || 0;
    score += baseRent * 2;

    // Monopoly potential bonus
    const propertyGroup = Rules.getPropertyGroup(squareTemplate.position);
    if (propertyGroup) {
      const groupProperties = Rules.PROPERTY_GROUPS[propertyGroup];
      const ownedInGroup = analysis.botProperties.filter(prop => 
        groupProperties.includes(prop.position)
      ).length;
      
      const monopolyProgress = ownedInGroup / groupProperties.length;
      score += monopolyProgress * 200;

      // Extra bonus if close to monopoly
      if (monopolyProgress >= 0.5) {
        score += 150;
      }
    }

    // Strategic position value (corners, high-traffic areas)
    const strategicPositions = [1, 6, 9, 11, 16, 19, 21, 24, 26, 29];
    if (strategicPositions.includes(squareTemplate.position)) {
      score += 50;
    }

    // Opponent blocking value
    const opponentThreat = this.calculateOpponentThreat(squareTemplate, analysis);
    score += opponentThreat * 100;

    // Game phase adjustments
    switch (analysis.gamePhase) {
      case 'early':
        score *= 1.2; // More aggressive in early game
        break;
      case 'late':
        score *= 0.8; // More conservative in late game
        break;
    }

    return score;
  }

  calculateOpponentThreat(squareTemplate, analysis) {
    const propertyGroup = Rules.getPropertyGroup(squareTemplate.position);
    if (!propertyGroup) return 0;

    const groupProperties = Rules.PROPERTY_GROUPS[propertyGroup];
    let maxOpponentOwnership = 0;

    analysis.opponents.forEach(opponent => {
      const opponentProperties = Rules.getPlayerProperties(opponent._id, { 
        boardState: analysis.botPlayer.gameState?.boardState || [] 
      });
      const ownedInGroup = opponentProperties.filter(prop => 
        groupProperties.includes(prop.position)
      ).length;
      
      const ownership = ownedInGroup / groupProperties.length;
      maxOpponentOwnership = Math.max(maxOpponentOwnership, ownership);
    });

    return maxOpponentOwnership;
  }

  getPurchaseThreshold(gamePhase) {
    const baseThreshold = {
      early: 100,
      middle: 150,
      late: 200
    };

    const threshold = baseThreshold[gamePhase] || 150;
    return threshold * (1 + this.personality.aggressiveness * 0.5);
  }

  decideBid(analysis, gameState) {
    const auction = gameState.activeAuction;
    if (!auction) {
      return { action: 'PASS_AUCTION' };
    }

    const squareTemplate = analysis.squareTemplates.find(t => 
      t._id.toString() === auction.propertyId.toString()
    );

    if (!squareTemplate) {
      return { action: 'PASS_AUCTION' };
    }

    const propertyValue = this.calculatePropertyScore(squareTemplate, analysis);
    const maxBid = Math.floor(propertyValue * (0.8 + this.personality.riskTolerance * 0.4));
    const currentBid = auction.currentBid || 0;
    const minIncrement = Rules.getMinimumBidIncrement(currentBid);
    const nextBid = currentBid + minIncrement;

    // Don't bid if we can't afford it or it exceeds our max
    if (nextBid > analysis.botPlayer.money || nextBid > maxBid) {
      return { action: 'PASS_AUCTION' };
    }

    // Don't bid if it would leave us with insufficient reserves
    if ((analysis.botPlayer.money - nextBid) < analysis.cashReserveNeeded) {
      return { action: 'PASS_AUCTION' };
    }

    return {
      action: 'PLACE_BID',
      amount: nextBid,
      reasoning: `Property value: ${propertyValue}, max bid: ${maxBid}`
    };
  }

  decideTrade(analysis, gameState) {
    // For now, bot doesn't initiate trades but may respond to them
    const pendingTrade = gameState.pendingTrade;
    
    if (pendingTrade && pendingTrade.toPlayerId === analysis.botPlayer._id.toString()) {
      return this.evaluateTradeOffer(pendingTrade, analysis);
    }

    return { action: 'NO_TRADE' };
  }

  evaluateTradeOffer(tradeOffer, analysis) {
    const { fromOffer, toOffer } = tradeOffer;
    
    // Calculate value of what we're giving vs receiving
    const givingValue = this.calculateTradeValue(toOffer, analysis, 'giving');
    const receivingValue = this.calculateTradeValue(fromOffer, analysis, 'receiving');
    
    const tradeRatio = receivingValue / (givingValue || 1);
    const acceptThreshold = 1.1 + (1 - this.personality.tradingWillingness) * 0.5;

    const shouldAccept = tradeRatio >= acceptThreshold;

    return {
      action: shouldAccept ? 'ACCEPT_TRADE' : 'DECLINE_TRADE',
      reasoning: `Trade ratio: ${tradeRatio.toFixed(2)}, threshold: ${acceptThreshold.toFixed(2)}`
    };
  }

  calculateTradeValue(offer, analysis, perspective) {
    let value = 0;

    // Money value
    value += offer.money || 0;

    // Property values
    if (offer.properties) {
      offer.properties.forEach(propertyId => {
        const squareState = analysis.botPlayer.gameState?.boardState?.find(sq => 
          sq._id.toString() === propertyId.toString()
        );
        if (squareState) {
          const template = analysis.squareTemplates.find(t => 
            t._id.toString() === squareState.squareId.toString()
          );
          if (template) {
            const propertyScore = this.calculatePropertyScore(template, analysis);
            value += propertyScore;
          }
        }
      });
    }

    return value;
  }

  decideDevelopment(analysis, gameState) {
    const developableProperties = this.findDevelopableProperties(analysis);
    
    if (developableProperties.length === 0) {
      return { action: 'NO_DEVELOPMENT' };
    }

    // Sort by development priority
    developableProperties.sort((a, b) => b.priority - a.priority);
    
    const bestProperty = developableProperties[0];
    const buildCost = bestProperty.template.buildCost || 100;

    // Check if we can afford it and maintain cash reserve
    if (analysis.botPlayer.money >= buildCost + analysis.cashReserveNeeded) {
      return {
        action: 'BUILD_HOUSE',
        propertyId: bestProperty.squareState._id,
        reasoning: `Developing ${bestProperty.template.name} (priority: ${bestProperty.priority})`
      };
    }

    return { action: 'NO_DEVELOPMENT' };
  }

  findDevelopableProperties(analysis) {
    const developable = [];

    analysis.botMonopolies.forEach(groupName => {
      const groupProperties = Rules.PROPERTY_GROUPS[groupName];
      
      groupProperties.forEach(position => {
        const squareState = analysis.botPlayer.gameState?.boardState?.[position];
        const template = analysis.squareTemplates.find(t => 
          t._id.toString() === squareState?.squareId.toString()
        );

        if (template && squareState) {
          const canDevelop = Rules.canDevelopProperty(
            template, 
            squareState, 
            analysis.botPlayer.gameState, 
            analysis.botPlayer._id
          );

          if (canDevelop.canDevelop) {
            const priority = this.calculateDevelopmentPriority(template, squareState, analysis);
            developable.push({
              template,
              squareState,
              priority
            });
          }
        }
      });
    });

    return developable;
  }

  calculateDevelopmentPriority(template, squareState, analysis) {
    let priority = 0;

    // Base rent increase potential
    const currentLevel = squareState.level || squareState.lever || 0;
    const nextLevelRent = this.getNextLevelRent(template, currentLevel);
    const currentRent = Rules.calculateRent(template, squareState);
    const rentIncrease = nextLevelRent - currentRent;
    
    priority += rentIncrease * 0.1;

    // Strategic value (high-traffic areas)
    const strategicPositions = [6, 9, 16, 19, 21, 24];
    if (strategicPositions.includes(template.position)) {
      priority += 50;
    }

    // Game phase adjustments
    switch (analysis.gamePhase) {
      case 'middle':
        priority *= 1.3; // Peak development time
        break;
      case 'late':
        priority *= 0.7; // Less valuable in late game
        break;
    }

    return priority;
  }

  getNextLevelRent(template, currentLevel) {
    const rent = template.rent;
    if (!rent) return 0;

    switch (currentLevel) {
      case 0: return rent.house1 || rent.base * 2;
      case 1: return rent.house2 || rent.house1 * 2;
      case 2: return rent.house3 || rent.house2 * 2;
      case 3: return rent.house4 || rent.house3 * 2;
      case 4: return rent.hotel || rent.house4 * 2;
      default: return rent.hotel || rent.base * 10;
    }
  }

  decideJailAction(analysis, gameState) {
    const jailTurns = analysis.botPlayer.jailTurns || 0;
    const hasGetOutCard = (analysis.botPlayer.getOutOfJailFreeCards || 0) > 0;
    const canAffordFine = analysis.botPlayer.money >= 50;

    // Use Get Out of Jail Free card if available and it's strategic
    if (hasGetOutCard && (jailTurns >= 2 || this.personality.aggressiveness > 0.7)) {
      return { action: 'USE_JAIL_CARD' };
    }

    // Pay fine if can afford and it's turn 3 or very aggressive
    if (canAffordFine && (jailTurns >= 2 || this.personality.aggressiveness > 0.8)) {
      return { action: 'PAY_JAIL_FINE' };
    }

    // Otherwise try to roll doubles
    return { action: 'ROLL_IN_JAIL' };
  }

  analyzeOpponentThreats(opponents, gameState, squareTemplates) {
    return opponents.map(opponent => {
      const netWorth = Rules.calculateNetWorth(opponent._id, gameState, squareTemplates);
      const properties = Rules.getPlayerProperties(opponent._id, gameState);
      const monopolies = Rules.getPlayerMonopolies(opponent._id, gameState);
      
      return {
        playerId: opponent._id,
        netWorth,
        propertyCount: properties.length,
        monopolyCount: monopolies.length,
        threatLevel: this.calculateThreatLevel(opponent, netWorth, monopolies.length)
      };
    });
  }

  calculateThreatLevel(opponent, netWorth, monopolyCount) {
    let threat = 0;
    
    threat += netWorth * 0.0001; // Net worth factor
    threat += monopolyCount * 0.3; // Monopoly factor
    threat += (opponent.money || 0) * 0.0002; // Liquid cash factor
    
    return Math.min(threat, 1); // Cap at 1.0
  }

  getAvailableActions(gameState, botPlayerId) {
    const actions = [];
    
    // Always available actions
    actions.push('END_TURN');
    
    // Phase-specific actions
    switch (gameState.phase) {
      case 'rolling':
        actions.push('ROLL_DICE');
        break;
      case 'property_decision':
        actions.push('PURCHASE_PROPERTY', 'DECLINE_PURCHASE');
        break;
      case 'auction':
        actions.push('PLACE_BID', 'PASS_AUCTION');
        break;
    }
    
    return actions;
  }

  calculateCashReserve(gameState, botPlayerId) {
    const botPlayer = gameState.players.find(p => p._id.toString() === botPlayerId);
    if (!botPlayer) return 0;

    const baseCashReserve = botPlayer.money * this.personality.cashReserve;
    
    // Adjust based on game phase
    const phaseMultiplier = {
      early: 0.8,
      middle: 1.0,
      late: 1.2
    };
    
    const gamePhase = this.determineGamePhase(gameState);
    return baseCashReserve * (phaseMultiplier[gamePhase] || 1.0);
  }

  calculatePropertyValues(gameState, squareTemplates) {
    const values = new Map();
    
    squareTemplates.forEach(template => {
      if (template.type === 'property') {
        const baseValue = template.price || 0;
        const rentValue = (template.rent?.base || 0) * 20; // 20x annual rent estimate
        const strategicValue = this.getStrategicValue(template.position);
        
        values.set(template._id.toString(), baseValue + rentValue + strategicValue);
      }
    });
    
    return values;
  }

  getStrategicValue(position) {
    // High-traffic squares get bonus value
    const highTraffic = [6, 9, 16, 19, 21, 24]; // Common landing spots
    const mediumTraffic = [1, 3, 11, 13, 26, 29];
    
    if (highTraffic.includes(position)) return 100;
    if (mediumTraffic.includes(position)) return 50;
    return 0;
  }

  // Method to adjust difficulty dynamically
  adjustDifficulty(newDifficulty) {
    this.difficulty = newDifficulty;
    this.personality = this.generatePersonality();
  }

  // Get bot status for debugging
  getBotStatus(gameState, botPlayerId) {
    return {
      difficulty: this.difficulty,
      personality: this.personality,
      currentPhase: gameState.phase,
      playerId: botPlayerId
    };
  }
}

module.exports = BotAI;
