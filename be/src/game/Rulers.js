/**
 * Monopoly Game Rules and Constants
 * Contains all game rules, calculations, and constants
 */

class Rules {
    static GAME_SETTINGS = {
      STARTING_MONEY: 3000,
      PASS_GO_BONUS: 300,
      MAX_PLAYERS: 4,
      MIN_PLAYERS: 2,
      JAIL_POSITION: 8,
      JAIL_FINE: 50,
      MAX_JAIL_TURNS: 3,
      MAX_DOUBLES_IN_ROW: 3,
      BOARD_SIZE: 32
    };
  
    static SQUARE_TYPES = {
      START: 'start',
      PROPERTY: 'property',
      RAILROAD: 'railroad',
      UTILITY: 'utility',
      TAX: 'tax',
      CHANCE: 'chance',
      COMMUNITY: 'community',
      JAIL: 'jail',
      GO_TO_JAIL: 'plane',
      FESTIVAL: 'festival',
      FREE_PARKING: 'free_parking'
    };
  
    static PROPERTY_GROUPS = {
      BROWN: [1, 2],
      LIGHT_BLUE: [3, 5, 6, 7],
      PINK: [9, 10, 11],
      ORANGE: [13, 15],
      RED: [17, 19],
      YELLOW: [21, 22, 23],
      GREEN: [26, 27],
      BLUE: [29, 31],
      RAILROAD: [4, 14, 18, 25],
      UTILITY: [30] // Tax squares can be treated as utilities
    };
  
    static MONOPOLY_MULTIPLIERS = {
      2: 2, // 2 properties in group = 2x rent
      3: 2, // 3 properties in group = 2x rent  
      4: 2  // 4 properties in group = 2x rent
    };
  
    static RAILROAD_RENT = {
      1: 50,
      2: 100,
      3: 150,
      4: 200
    };
  
    static HOUSE_LIMITS = {
      HOUSES_PER_PROPERTY: 4,
      TOTAL_HOUSES: 32,
      TOTAL_HOTELS: 12
    };
  
    /**
     * Calculate rent for a property
     */
    static calculateRent(squareTemplate, squareState, diceRoll = null) {
      const level = squareState.level || squareState.lever || 0;
      const baseRent = squareTemplate.rent?.base || 0;
  
      // Handle different property types
      switch (squareTemplate.type) {
        case 'property':
          return this.calculatePropertyRent(squareTemplate, squareState, level);
        
        case 'railroad':
          return this.calculateRailroadRent(squareState, level);
        
        case 'utility':
          return this.calculateUtilityRent(diceRoll);
        
        default:
          return baseRent;
      }
    }
  
    /**
     * Calculate property rent based on houses/hotels and monopoly status
     */
    static calculatePropertyRent(squareTemplate, squareState, level) {
      const rent = squareTemplate.rent;
      if (!rent) return 0;
  
      // If has houses/hotels, use level-based rent
      if (level > 0) {
        const levelKey = level === 5 ? 'hotel' : `house${level}`;
        return rent[levelKey] || rent.base;
      }
  
      // Base rent, potentially with monopoly multiplier
      let baseRent = rent.base;
      
      // Check for monopoly (this would need game state context)
      // For now, return base rent
      return baseRent;
    }
  
    /**
     * Calculate railroad rent based on number owned
     */
    static calculateRailroadRent(squareState, ownedCount = 1) {
      return this.RAILROAD_RENT[ownedCount] || this.RAILROAD_RENT[1];
    }
  
    /**
     * Calculate utility rent based on dice roll
     */
    static calculateUtilityRent(diceRoll) {
      if (!diceRoll) return 0;
      const total = diceRoll.d1 + diceRoll.d2;
      return total * 10; // 10x dice roll for utilities
    }
  
    /**
     * Check if player has monopoly on a property group
     */
    static hasMonopoly(playerId, propertyGroup, gameState) {
      const playerProperties = this.getPlayerProperties(playerId, gameState);
      const groupProperties = this.PROPERTY_GROUPS[propertyGroup] || [];
      
      return groupProperties.every(position => 
        playerProperties.some(prop => prop.position === position)
      );
    }
  
    /**
     * Get all properties owned by a player
     */
    static getPlayerProperties(playerId, gameState) {
      return gameState.boardState.filter(square => {
        const owner = square.owner || square.owen;
        return owner && owner.toString() === playerId.toString();
      });
    }
  
    /**
     * Calculate property group for a position
     */
    static getPropertyGroup(position) {
      for (const [group, positions] of Object.entries(this.PROPERTY_GROUPS)) {
        if (positions.includes(position)) {
          return group;
        }
      }
      return null;
    }
  
    /**
     * Check if property can be developed (build houses)
     */
    static canDevelopProperty(squareTemplate, squareState, gameState, playerId) {
      // Must own the property
      const owner = squareState.owner || squareState.owen;
      if (!owner || owner.toString() !== playerId.toString()) {
        return { canDevelop: false, reason: 'NOT_OWNER' };
      }
  
      // Must be a developable property
      if (squareTemplate.type !== 'property') {
        return { canDevelop: false, reason: 'NOT_DEVELOPABLE' };
      }
  
          // Must have monopoly on the property group
    const propertyGroup = this.getPropertyGroup(squareTemplate.position);
    if (!propertyGroup || !this.hasMonopoly(playerId, propertyGroup, gameState)) {
      return { canDevelop: false, reason: 'NO_MONOPOLY' };
    }

    // Cannot be mortgaged
    if (squareState.isMortgage) {
      return { canDevelop: false, reason: 'MORTGAGED' };
    }

    // Check current development level
    const currentLevel = squareState.level || squareState.lever || 0;
    if (currentLevel >= 5) { // 4 houses + 1 hotel = level 5
      return { canDevelop: false, reason: 'FULLY_DEVELOPED' };
    }

    // Check even development rule (all properties in group must be within 1 level)
    const groupProperties = this.PROPERTY_GROUPS[propertyGroup];
    const groupSquares = gameState.boardState.filter(square => 
      groupProperties.includes(square.position)
    );
    
    const levels = groupSquares.map(square => square.level || square.lever || 0);
    const minLevel = Math.min(...levels);
    const maxLevel = Math.max(...levels);
    
    if (currentLevel > minLevel) {
      return { canDevelop: false, reason: 'UNEVEN_DEVELOPMENT' };
    }

    // Check house/hotel availability
    if (currentLevel === 4) {
      // Trying to build hotel - need to check hotel availability
      const totalHotels = gameState.boardState.reduce((count, square) => 
        count + (square.level === 5 ? 1 : 0), 0
      );
      if (totalHotels >= this.HOUSE_LIMITS.TOTAL_HOTELS) {
        return { canDevelop: false, reason: 'NO_HOTELS_AVAILABLE' };
      }
    } else {
      // Trying to build house - check house availability
      const totalHouses = gameState.boardState.reduce((count, square) => {
        const level = square.level || square.lever || 0;
        return count + (level > 0 && level < 5 ? level : 0);
      }, 0);
      if (totalHouses >= this.HOUSE_LIMITS.TOTAL_HOUSES) {
        return { canDevelop: false, reason: 'NO_HOUSES_AVAILABLE' };
      }
    }

    return { canDevelop: true, buildCost: squareTemplate.buildCost || 100 };
  }

  /**
   * Calculate mortgage value for a property
   */
  static getMortgageValue(squareTemplate) {
    return Math.floor((squareTemplate.price || 0) / 2);
  }

  /**
   * Calculate unmortgage cost (mortgage value + 10%)
   */
  static getUnmortgageCost(squareTemplate) {
    const mortgageValue = this.getMortgageValue(squareTemplate);
    return Math.floor(mortgageValue * 1.1);
  }

  /**
   * Check if player can afford a purchase
   */
  static canAfford(playerMoney, cost) {
    return playerMoney >= cost;
  }

  /**
   * Calculate total net worth of a player
   */
  static calculateNetWorth(playerId, gameState, squareTemplates) {
    const player = gameState.players.find(p => p._id.toString() === playerId.toString());
    if (!player) return 0;

    let netWorth = player.money;

    // Add property values
    const playerProperties = this.getPlayerProperties(playerId, gameState);
    playerProperties.forEach(squareState => {
      const template = squareTemplates.find(t => t._id.toString() === squareState.squareId.toString());
      if (template) {
        if (squareState.isMortgage) {
          // Mortgaged properties count as negative (debt to unmortgage)
          netWorth -= this.getUnmortgageCost(template) - this.getMortgageValue(template);
        } else {
          // Unmortgaged properties count full value
          netWorth += template.price || 0;
          
          // Add house/hotel values
          const level = squareState.level || squareState.lever || 0;
          if (level > 0) {
            const buildCost = template.buildCost || 100;
            netWorth += level * buildCost;
          }
        }
      }
    });

    return Math.max(0, netWorth);
  }

  /**
   * Determine auction starting bid
   */
  static getAuctionStartingBid(squareTemplate) {
    return Math.floor((squareTemplate.price || 100) * 0.1); // 10% of property value
  }

  /**
   * Validate trade offer
   */
  static validateTradeOffer(offer, gameState) {
    const { fromPlayerId, toPlayerId, fromOffer, toOffer } = offer;

    // Basic validation
    if (fromPlayerId === toPlayerId) {
      return { valid: false, reason: 'CANNOT_TRADE_WITH_SELF' };
    }

    // Check if both players exist and are in game
    const fromPlayer = gameState.players.find(p => p._id.toString() === fromPlayerId.toString());
    const toPlayer = gameState.players.find(p => p._id.toString() === toPlayerId.toString());

    if (!fromPlayer || !toPlayer) {
      return { valid: false, reason: 'INVALID_PLAYERS' };
    }

    // Check money amounts
    if (fromOffer.money < 0 || toOffer.money < 0) {
      return { valid: false, reason: 'NEGATIVE_MONEY' };
    }

    if (fromOffer.money > fromPlayer.money || toOffer.money > toPlayer.money) {
      return { valid: false, reason: 'INSUFFICIENT_FUNDS' };
    }

    // Check property ownership
    const fromPlayerProperties = this.getPlayerProperties(fromPlayerId, gameState);
    const toPlayerProperties = this.getPlayerProperties(toPlayerId, gameState);

    for (const propertyId of fromOffer.properties || []) {
      if (!fromPlayerProperties.some(p => p._id.toString() === propertyId.toString())) {
        return { valid: false, reason: 'PROPERTY_NOT_OWNED_BY_FROM_PLAYER' };
      }
    }

    for (const propertyId of toOffer.properties || []) {
      if (!toPlayerProperties.some(p => p._id.toString() === propertyId.toString())) {
        return { valid: false, reason: 'PROPERTY_NOT_OWNED_BY_TO_PLAYER' };
      }
    }

    // Check for developed properties (cannot trade properties with houses)
    for (const propertyId of [...(fromOffer.properties || []), ...(toOffer.properties || [])]) {
      const squareState = gameState.boardState.find(s => s._id.toString() === propertyId.toString());
      if (squareState && (squareState.level > 0 || squareState.lever > 0)) {
        return { valid: false, reason: 'CANNOT_TRADE_DEVELOPED_PROPERTY' };
      }
    }

    return { valid: true };
  }

  /**
   * Check win condition
   */
  static checkWinCondition(gameState) {
    const activePlayers = gameState.players.filter(p => !p.isBankrupt);
    
    if (activePlayers.length === 1) {
      return {
        gameOver: true,
        winner: activePlayers[0],
        reason: 'LAST_PLAYER_STANDING'
      };
    }

    return { gameOver: false };
  }

  /**
   * Generate game statistics
   */
  static generateGameStats(gameState, squareTemplates) {
    const stats = {
      totalTurns: gameState.turnCount || 0,
      playerStats: {}
    };

    gameState.players.forEach(player => {
      const netWorth = this.calculateNetWorth(player._id, gameState, squareTemplates);
      const properties = this.getPlayerProperties(player._id, gameState);
      
      stats.playerStats[player._id] = {
        money: player.money,
        netWorth,
        propertiesOwned: properties.length,
        monopolies: this.getPlayerMonopolies(player._id, gameState),
        position: player.position,
        isBankrupt: player.isBankrupt || false
      };
    });

    return stats;
  }

  /**
   * Get all monopolies owned by a player
   */
  static getPlayerMonopolies(playerId, gameState) {
    const monopolies = [];
    
    for (const [groupName, positions] of Object.entries(this.PROPERTY_GROUPS)) {
      if (this.hasMonopoly(playerId, groupName, gameState)) {
        monopolies.push(groupName);
      }
    }

    return monopolies;
  }

  /**
   * Calculate minimum bid increment for auctions
   */
  static getMinimumBidIncrement(currentBid) {
    if (currentBid < 100) return 5;
    if (currentBid < 500) return 10;
    if (currentBid < 1000) return 25;
    return 50;
  }

  /**
   * Check if game should end due to time limit or other conditions
   */
  static shouldEndGame(gameState) {
    const activePlayers = gameState.players.filter(p => !p.isBankrupt);
    
    // End if only one player left
    if (activePlayers.length <= 1) {
      return { shouldEnd: true, reason: 'INSUFFICIENT_PLAYERS' };
    }

    // End if game has been running too long (optional rule)
    const maxTurns = 1000; // Configurable
    if (gameState.turnCount > maxTurns) {
      return { shouldEnd: true, reason: 'TIME_LIMIT' };
    }

    return { shouldEnd: false };
  }
}

module.exports = Rules;

  