/**
 * Chance and Community Chest Card Decks
 * Manages card shuffling, drawing, and effects
 */

class Decks {
    constructor() {
      this.chanceCards = this.createChanceDeck();
      this.communityCards = this.createCommunityDeck();
    }
  
    createChanceDeck() {
      return [
        {
          id: 'chance_1',
          text: 'Advance to GO. Collect $300.',
          action: 'MOVE_TO_POSITION',
          data: { position: 0, collectGo: true }
        },
        {
          id: 'chance_2',
          text: 'Advance to Boardwalk (Position 31).',
          action: 'MOVE_TO_POSITION',
          data: { position: 31, collectGo: true }
        },
        {
          id: 'chance_3',
          text: 'Advance to St. Charles Place (Position 9). If you pass GO, collect $300.',
          action: 'MOVE_TO_POSITION',
          data: { position: 9, collectGo: true }
        },
        {
          id: 'chance_4',
          text: 'Advance to nearest Railroad. If unowned, you may buy it. If owned, pay owner twice the rental.',
          action: 'MOVE_TO_NEAREST',
          data: { type: 'railroad', payDouble: true }
        },
        {
          id: 'chance_5',
          text: 'Advance to nearest Railroad. If unowned, you may buy it. If owned, pay owner twice the rental.',
          action: 'MOVE_TO_NEAREST',
          data: { type: 'railroad', payDouble: true }
        },
        {
          id: 'chance_6',
          text: 'Advance to nearest Utility. If unowned, you may buy it. If owned, pay owner 10 times dice roll.',
          action: 'MOVE_TO_NEAREST',
          data: { type: 'utility', payMultiple: 10 }
        },
        {
          id: 'chance_7',
          text: 'Bank pays you dividend of $50.',
          action: 'COLLECT_MONEY',
          data: { amount: 50 }
        },
        {
          id: 'chance_8',
          text: 'Get Out of Jail Free. This card may be kept until needed.',
          action: 'GET_OUT_OF_JAIL_FREE',
          data: { keepable: true }
        },
        {
          id: 'chance_9',
          text: 'Go Back 3 Spaces.',
          action: 'MOVE_RELATIVE',
          data: { spaces: -3 }
        },
        {
          id: 'chance_10',
          text: 'Go to Jail. Go directly to Jail. Do not pass GO, do not collect $300.',
          action: 'GO_TO_JAIL',
          data: {}
        },
        {
          id: 'chance_11',
          text: 'Make general repairs on all your property. For each house pay $25, for each hotel pay $100.',
          action: 'PAY_REPAIRS',
          data: { houseRepair: 25, hotelRepair: 100 }
        },
        {
          id: 'chance_12',
          text: 'Pay poor tax of $15.',
          action: 'PAY_MONEY',
          data: { amount: 15 }
        },
        {
          id: 'chance_13',
          text: 'Take a trip to Reading Railroad (Position 4). If you pass GO, collect $300.',
          action: 'MOVE_TO_POSITION',
          data: { position: 4, collectGo: true }
        },
        {
          id: 'chance_14',
          text: 'You have been elected Chairman of the Board. Pay each player $50.',
          action: 'PAY_ALL_PLAYERS',
          data: { amount: 50 }
        },
        {
          id: 'chance_15',
          text: 'Your building loan matures. Collect $150.',
          action: 'COLLECT_MONEY',
          data: { amount: 150 }
        },
        {
          id: 'chance_16',
          text: 'You have won a crossword competition. Collect $100.',
          action: 'COLLECT_MONEY',
          data: { amount: 100 }
        }
      ];
    }
  
    createCommunityDeck() {
      return [
        {
          id: 'community_1',
          text: 'Advance to GO. Collect $300.',
          action: 'MOVE_TO_POSITION',
          data: { position: 0, collectGo: true }
        },
        {
          id: 'community_2',
          text: 'Bank error in your favor. Collect $200.',
          action: 'COLLECT_MONEY',
          data: { amount: 200 }
        },
        {
          id: 'community_3',
          text: 'Doctor\'s fees. Pay $50.',
          action: 'PAY_MONEY',
          data: { amount: 50 }
        },
        {
          id: 'community_4',
          text: 'From sale of stock you get $50.',
          action: 'COLLECT_MONEY',
          data: { amount: 50 }
        },
        {
          id: 'community_5',
          text: 'Get Out of Jail Free. This card may be kept until needed.',
          action: 'GET_OUT_OF_JAIL_FREE',
          data: { keepable: true }
        },
        {
          id: 'community_6',
          text: 'Go to Jail. Go directly to Jail. Do not pass GO, do not collect $300.',
          action: 'GO_TO_JAIL',
          data: {}
        },
        {
          id: 'community_7',
          text: 'Grand Opera Night. Collect $50 from every player.',
          action: 'COLLECT_FROM_ALL_PLAYERS',
          data: { amount: 50 }
        },
        {
          id: 'community_8',
          text: 'Holiday Fund matures. Receive $100.',
          action: 'COLLECT_MONEY',
          data: { amount: 100 }
        },
        {
          id: 'community_9',
          text: 'Income tax refund. Collect $20.',
          action: 'COLLECT_MONEY',
          data: { amount: 20 }
        },
        {
          id: 'community_10',
          text: 'It is your birthday. Collect $10 from every player.',
          action: 'COLLECT_FROM_ALL_PLAYERS',
          data: { amount: 10 }
        },
        {
          id: 'community_11',
          text: 'Life insurance matures. Collect $100.',
          action: 'COLLECT_MONEY',
          data: { amount: 100 }
        },
        {
          id: 'community_12',
          text: 'Hospital fees. Pay $100.',
          action: 'PAY_MONEY',
          data: { amount: 100 }
        },
        {
          id: 'community_13',
          text: 'School fees. Pay $150.',
          action: 'PAY_MONEY',
          data: { amount: 150 }
        },
        {
          id: 'community_14',
          text: 'Receive $25 consultancy fee.',
          action: 'COLLECT_MONEY',
          data: { amount: 25 }
        },
        {
          id: 'community_15',
          text: 'You are assessed for street repairs. Pay $40 per house and $115 per hotel.',
          action: 'PAY_REPAIRS',
          data: { houseRepair: 40, hotelRepair: 115 }
        },
        {
          id: 'community_16',
          text: 'You have won second prize in a beauty contest. Collect $10.',
          action: 'COLLECT_MONEY',
          data: { amount: 10 }
        }
      ];
    }
  
    shuffleChanceDeck() {
      const shuffled = [...this.chanceCards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
  
    shuffleCommunityDeck() {
      const shuffled = [...this.communityCards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
  
    drawChanceCard(deck) {
      if (!deck || deck.length === 0) {
        deck = this.shuffleChanceDeck();
      }
      const card = deck.shift();
      
      // If it's a "Get Out of Jail Free" card, don't put it back in deck
      if (card.action !== 'GET_OUT_OF_JAIL_FREE') {
        deck.push(card);
      }
      
      return { card, deck };
    }
  
    drawCommunityCard(deck) {
      if (!deck || deck.length === 0) {
        deck = this.shuffleCommunityDeck();
      }
      const card = deck.shift();
      
      // If it's a "Get Out of Jail Free" card, don't put it back in deck
      if (card.action !== 'GET_OUT_OF_JAIL_FREE') {
        deck.push(card);
      }
      
      return { card, deck };
    }
  
    async executeCardAction(card, gameState, playerId, gameManager) {
      const player = gameState.players.find(p => p._id.toString() === playerId.toString());
      if (!player) throw new Error('Player not found');
  
      const session = await require('mongoose').startSession();
      session.startTransaction();
  
      try {
        switch (card.action) {
          case 'COLLECT_MONEY':
            await this.handleCollectMoney(player, card.data.amount, session);
            break;
  
          case 'PAY_MONEY':
            await this.handlePayMoney(player, card.data.amount, session);
            break;
  
          case 'MOVE_TO_POSITION':
            await this.handleMoveToPosition(player, card.data, gameState, session);
            break;
  
          case 'MOVE_RELATIVE':
            await this.handleMoveRelative(player, card.data.spaces, gameState, session);
            break;
  
          case 'MOVE_TO_NEAREST':
            await this.handleMoveToNearest(player, card.data, gameState, session);
            break;
  
          case 'GO_TO_JAIL':
            await this.handleGoToJail(player, session);
            break;
  
          case 'GET_OUT_OF_JAIL_FREE':
            await this.handleGetOutOfJailFree(player, session);
            break;
  
          case 'PAY_REPAIRS':
            await this.handlePayRepairs(player, card.data, gameState, session);
            break;
  
          case 'PAY_ALL_PLAYERS':
            await this.handlePayAllPlayers(player, card.data.amount, gameState, session);
            break;
  
          case 'COLLECT_FROM_ALL_PLAYERS':
            await this.handleCollectFromAllPlayers(player, card.data.amount, gameState, session);
            break;
  
          default:
            console.warn('Unknown card action:', card.action);
        }
  
        await session.commitTransaction();
        return { success: true, newPosition: player.position };
  
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }
  
    async handleCollectMoney(player, amount, session) {
      const PlayerState = require('../models/playerState.model');
      player.money += amount;
      await PlayerState.findByIdAndUpdate(player._id, { money: player.money }, { session });
    }
  
    async handlePayMoney(player, amount, session) {
      const PlayerState = require('../models/playerState.model');
      player.money -= amount;
      await PlayerState.findByIdAndUpdate(player._id, { money: player.money }, { session });
    }
  
    async handleMoveToPosition(player, data, gameState, session) {
      const PlayerState = require('../models/playerState.model');
      const oldPosition = player.position;
      const newPosition = data.position;
  
      // Check if passed GO
      if (data.collectGo && (newPosition < oldPosition || newPosition === 0)) {
        player.money += 300;
      }
  
      player.position = newPosition;
      await PlayerState.findByIdAndUpdate(
        player._id, 
        { position: player.position, money: player.money }, 
        { session }
      );
    }
  
    async handleMoveRelative(player, spaces, gameState, session) {
      const PlayerState = require('../models/playerState.model');
      const oldPosition = player.position;
      let newPosition = (player.position + spaces) % 32;
      
      // Handle negative movement
      if (newPosition < 0) {
        newPosition = 32 + newPosition;
      }
  
      // Check if passed GO (only if moving forward and crossing position 0)
      if (spaces > 0 && newPosition < oldPosition) {
        player.money += 300;
      }
  
      player.position = newPosition;
      await PlayerState.findByIdAndUpdate(
        player._id, 
        { position: player.position, money: player.money }, 
        { session }
      );
    }
  
    async handleMoveToNearest(player, data, gameState, session) {
      const SquareTemplate = require('../models/SquareTemplate.model');
      const PlayerState = require('../models/playerState.model');
      
      const squareTemplates = await SquareTemplate.find().session(session);
      const targetSquares = squareTemplates.filter(sq => sq.type === data.type);
      
      if (targetSquares.length === 0) return;
  
      // Find nearest target square
      let nearestDistance = Infinity;
      let nearestPosition = player.position;
  
      targetSquares.forEach(square => {
        let distance = square.position - player.position;
        if (distance <= 0) distance += 32; // Wrap around board
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPosition = square.position;
        }
      });
  
      const oldPosition = player.position;
      player.position = nearestPosition;
  
      // Check if passed GO
      if (nearestPosition < oldPosition) {
        player.money += 300;
      }
  
      await PlayerState.findByIdAndUpdate(
        player._id, 
        { position: player.position, money: player.money }, 
        { session }
      );
  
      // Store special payment rules for this landing
      gameState.specialCardEffect = {
        type: data.type,
        payDouble: data.payDouble,
        payMultiple: data.payMultiple
      };
    }
  
    async handleGoToJail(player, session) {
      const PlayerState = require('../models/playerState.model');
      player.position = 8; // Jail position
      player.inJail = true;
      player.jailTurns = 0;
      player.doubleTurns = 0;
  
      await PlayerState.findByIdAndUpdate(
        player._id,
        { 
          position: 8, 
          inJail: true, 
          jailTurns: 0, 
          doubleTurns: 0 
        },
        { session }
      );
    }
  
    async handleGetOutOfJailFree(player, session) {
      const PlayerState = require('../models/playerState.model');
      player.getOutOfJailFreeCards = (player.getOutOfJailFreeCards || 0) + 1;
      
      await PlayerState.findByIdAndUpdate(
        player._id,
        { getOutOfJailFreeCards: player.getOutOfJailFreeCards },
        { session }
      );
    }
  
    async handlePayRepairs(player, data, gameState, session) {
      const PlayerState = require('../models/playerState.model');
      const Rules = require('./Rules');
      
      const playerProperties = Rules.getPlayerProperties(player._id, gameState);
      let totalCost = 0;
  
      playerProperties.forEach(squareState => {
        const level = squareState.level || squareState.lever || 0;
        if (level > 0) {
          if (level === 5) { // Hotel
            totalCost += data.hotelRepair;
          } else { // Houses
            totalCost += level * data.houseRepair;
          }
        }
      });
  
      player.money -= totalCost;
      await PlayerState.findByIdAndUpdate(player._id, { money: player.money }, { session });
    }
  
    async handlePayAllPlayers(player, amount, gameState, session) {
      const PlayerState = require('../models/playerState.model');
      const otherPlayers = gameState.players.filter(p => 
        p._id.toString() !== player._id.toString() && !p.isBankrupt
      );
  
      const totalPayment = otherPlayers.length * amount;
      player.money -= totalPayment;
  
      // Update current player
      await PlayerState.findByIdAndUpdate(player._id, { money: player.money }, { session });
  
      // Update other players
      for (const otherPlayer of otherPlayers) {
        otherPlayer.money += amount;
        await PlayerState.findByIdAndUpdate(
          otherPlayer._id, 
          { money: otherPlayer.money }, 
          { session }
        );
      }
    }
  
    async handleCollectFromAllPlayers(player, amount, gameState, session) {
      const PlayerState = require('../models/playerState.model');
      const otherPlayers = gameState.players.filter(p => 
        p._id.toString() !== player._id.toString() && !p.isBankrupt
      );
  
      let totalCollected = 0;
  
      // Collect from other players
      for (const otherPlayer of otherPlayers) {
        const payment = Math.min(amount, otherPlayer.money); // Can't pay more than they have
        otherPlayer.money -= payment;
        totalCollected += payment;
        
        await PlayerState.findByIdAndUpdate(
          otherPlayer._id, 
          { money: otherPlayer.money }, 
          { session }
        );
      }
  
      // Give to current player
      player.money += totalCollected;
      await PlayerState.findByIdAndUpdate(player._id, { money: player.money }, { session });
    }
  
    // Utility method to get card by ID
    getCardById(cardId) {
      const chanceCard = this.chanceCards.find(card => card.id === cardId);
      if (chanceCard) return { card: chanceCard, type: 'chance' };
  
      const communityCard = this.communityCards.find(card => card.id === cardId);
      if (communityCard) return { card: communityCard, type: 'community' };
  
      return null;
    }
  
    // Get all available cards (for testing/debugging)
    getAllCards() {
      return {
        chance: this.chanceCards,
        community: this.communityCards
      };
    }
  }
  
  module.exports = Decks;
  