/**
 * Socket.io Game Event Handlers
 * Server-authoritative game event processing with validation and broadcasting
 */

const GameManager = require('../game/GameManager');
const Rules = require('../game/Rules');
const PlayerState = require('../models/playerState.model');
const Game = require('../models/game.model');
const SquareState = require('../models/squareState.model');
const SquareTemplate = require('../models/SquareTemplate.model');
const mongoose = require('mongoose');

class GameHandlers {
  constructor(io, gameManager) {
    this.io = io;
    this.gameManager = gameManager;
  }

  registerHandlers(socket) {
    // Room Management
    socket.on('createRoom', (data) => this.handleCreateRoom(socket, data));
    socket.on('joinRoom', (data) => this.handleJoinRoom(socket, data));
    socket.on('startGame', (data) => this.handleStartGame(socket, data));
    socket.on('leaveRoom', (data) => this.handleLeaveRoom(socket, data));

    // Game Actions
    socket.on('requestRoll', (data) => this.handleRequestRoll(socket, data));
    socket.on('buyProperty', (data) => this.handleBuyProperty(socket, data));
    socket.on('declineBuy', (data) => this.handleDeclineBuy(socket, data));
    socket.on('endTurn', (data) => this.handleEndTurn(socket, data));

    // Development
    socket.on('buildHouse', (data) => this.handleBuildHouse(socket, data));
    socket.on('sellHouse', (data) => this.handleSellHouse(socket, data));
    socket.on('mortgage', (data) => this.handleMortgage(socket, data));
    socket.on('unmortgage', (data) => this.handleUnmortgage(socket, data));

    // Auctions
    socket.on('auctionBid', (data) => this.handleAuctionBid(socket, data));
    socket.on('auctionPass', (data) => this.handleAuctionPass(socket, data));

    // Trading
    socket.on('tradeOffer', (data) => this.handleTradeOffer(socket, data));
    socket.on('acceptTrade', (data) => this.handleAcceptTrade(socket, data));
    socket.on('rejectTrade', (data) => this.handleRejectTrade(socket, data));
    socket.on('cancelTrade', (data) => this.handleCancelTrade(socket, data));

    // Jail Actions
    socket.on('payFine', (data) => this.handlePayFine(socket, data));
    socket.on('useGetOutOfJailCard', (data) => this.handleUseGetOutOfJailCard(socket, data));

    // Card Actions
    socket.on('drawCard', (data) => this.handleDrawCard(socket, data));

    // Utility
    socket.on('getGameState', (data) => this.handleGetGameState(socket, data));
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  // Room Management Handlers
  async handleCreateRoom(socket, data) {
    try {
      const { userId, settings = {} } = data;
      
      if (!userId) {
        return socket.emit('error', { ok: false, reason: 'USER_ID_REQUIRED' });
      }

      const result = await this.gameManager.createGame(userId, settings);
      
      // Join socket to room
      socket.join(result.gameId.toString());
      this.gameManager.registerPlayerSocket(result.playerStateId.toString(), socket.id);

      const gameState = this.gameManager.getRoom(result.gameId.toString());
      
      socket.emit('roomCreated', {
        ok: true,
        gameId: result.gameId,
        roomCode: result.roomCode,
        playerStateId: result.playerStateId,
        gameState
      });

    } catch (error) {
      console.error('Create room error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleJoinRoom(socket, data) {
    try {
      const { userId, roomCode } = data;
      
      if (!userId || !roomCode) {
        return socket.emit('error', { ok: false, reason: 'USER_ID_AND_ROOM_CODE_REQUIRED' });
      }

      const result = await this.gameManager.joinGame(userId, roomCode);
      
      // Join socket to room
      socket.join(result.gameId.toString());
      this.gameManager.registerPlayerSocket(result.playerStateId.toString(), socket.id);

      const gameState = this.gameManager.getRoom(result.gameId.toString());
      
      socket.emit('roomJoined', {
        ok: true,
        gameId: result.gameId,
        playerStateId: result.playerStateId,
        gameState
      });

      // Broadcast to other players
      socket.to(result.gameId.toString()).emit('playerJoined', {
        playerId: result.playerStateId,
        gameState
      });

    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleStartGame(socket, data) {
    try {
      const { gameId, playerId } = data;
      
      if (!gameId || !playerId) {
        return socket.emit('error', { ok: false, reason: 'GAME_ID_AND_PLAYER_ID_REQUIRED' });
      }

      // Verify player is host (first player in game)
      const game = await Game.findById(gameId).populate('players');
      if (!game || game.players[0]._id.toString() !== playerId) {
        return socket.emit('error', { ok: false, reason: 'ONLY_HOST_CAN_START' });
      }

      const gameState = await this.gameManager.startGame(gameId);
      
      this.io.to(gameId).emit('gameStarted', {
        ok: true,
        gameState
      });

    } catch (error) {
      console.error('Start game error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleLeaveRoom(socket, data) {
    try {
      const { gameId, playerId } = data;
      
      if (gameId) {
        socket.leave(gameId);
        this.gameManager.unregisterPlayerSocket(playerId);
        
        socket.to(gameId).emit('playerLeft', {
          playerId,
          timestamp: new Date().toISOString()
        });
      }

      socket.emit('leftRoom', { ok: true });

    } catch (error) {
      console.error('Leave room error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  // Game Action Handlers
  async handleRequestRoll(socket, data) {
    try {
      const { gameId, playerId } = data;
      
      if (!gameId || !playerId) {
        return socket.emit('error', { ok: false, reason: 'GAME_ID_AND_PLAYER_ID_REQUIRED' });
      }

      // Validate it's player's turn
      const gameState = this.gameManager.getRoom(gameId);
      if (!gameState) {
        return socket.emit('error', { ok: false, reason: 'GAME_NOT_FOUND' });
      }

      if (gameState.currentTurn.toString() !== playerId) {
        return socket.emit('error', { ok: false, reason: 'NOT_YOUR_TURN' });
      }

      if (gameState.phase !== 'rolling') {
        return socket.emit('error', { ok: false, reason: 'CANNOT_ROLL_NOW' });
      }

      await this.gameManager.rollDice(gameId, playerId);
      
      // Response is handled by GameManager via socket emissions

    } catch (error) {
      console.error('Roll dice error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleBuyProperty(socket, data) {
    try {
      const { gameId, playerId, propertyId } = data;
      
      if (!gameId || !playerId) {
        return socket.emit('error', { ok: false, reason: 'GAME_ID_AND_PLAYER_ID_REQUIRED' });
      }

      const result = await this.purchaseProperty(gameId, playerId, propertyId);
      
      this.io.to(gameId).emit('propertyPurchased', {
        ok: true,
        playerId,
        propertyId,
        gameState: this.gameManager.getRoom(gameId)
      });

      // Continue turn processing
      await this.gameManager.endTurn(gameId, playerId);

    } catch (error) {
      console.error('Buy property error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleDeclineBuy(socket, data) {
    try {
      const { gameId, playerId, propertyId } = data;
      
      if (!gameId || !playerId) {
        return socket.emit('error', { ok: false, reason: 'GAME_ID_AND_PLAYER_ID_REQUIRED' });
      }

      // Start auction
      await this.startAuction(gameId, propertyId);
      
      const gameState = this.gameManager.getRoom(gameId);
      this.io.to(gameId).emit('auctionStarted', {
        ok: true,
        propertyId,
        gameState
      });

    } catch (error) {
      console.error('Decline buy error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleEndTurn(socket, data) {
    try {
      const { gameId, playerId } = data;
      
      if (!gameId || !playerId) {
        return socket.emit('error', { ok: false, reason: 'GAME_ID_AND_PLAYER_ID_REQUIRED' });
      }

      const gameState = this.gameManager.getRoom(gameId);
      if (gameState.currentTurn.toString() !== playerId) {
        return socket.emit('error', { ok: false, reason: 'NOT_YOUR_TURN' });
      }

      await this.gameManager.endTurn(gameId, playerId);

    } catch (error) {
      console.error('End turn error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  // Development Handlers
  async handleBuildHouse(socket, data) {
    try {
      const { gameId, playerId, propertyId } = data;
      
      if (!gameId || !playerId || !propertyId) {
        return socket.emit('error', { ok: false, reason: 'MISSING_REQUIRED_FIELDS' });
      }

      const result = await this.buildHouse(gameId, playerId, propertyId);
      
      this.io.to(gameId).emit('houseBuilt', {
        ok: true,
        playerId,
        propertyId,
        newLevel: result.newLevel,
        cost: result.cost,
        gameState: this.gameManager.getRoom(gameId)
      });

    } catch (error) {
      console.error('Build house error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleSellHouse(socket, data) {
    try {
      const { gameId, playerId, propertyId } = data;
      
      if (!gameId || !playerId || !propertyId) {
        return socket.emit('error', { ok: false, reason: 'MISSING_REQUIRED_FIELDS' });
      }

      const result = await this.sellHouse(gameId, playerId, propertyId);
      
      this.io.to(gameId).emit('houseSold', {
        ok: true,
        playerId,
        propertyId,
        newLevel: result.newLevel,
        refund: result.refund,
        gameState: this.gameManager.getRoom(gameId)
      });

    } catch (error) {
      console.error('Sell house error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleMortgage(socket, data) {
    try {
      const { gameId, playerId, propertyId } = data;
      
      if (!gameId || !playerId || !propertyId) {
        return socket.emit('error', { ok: false, reason: 'MISSING_REQUIRED_FIELDS' });
      }

      const result = await this.mortgageProperty(gameId, playerId, propertyId);
      
      this.io.to(gameId).emit('propertyMortgaged', {
        ok: true,
        playerId,
        propertyId,
        mortgageValue: result.mortgageValue,
        gameState: this.gameManager.getRoom(gameId)
      });

    } catch (error) {
      console.error('Mortgage error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleUnmortgage(socket, data) {
    try {
      const { gameId, playerId, propertyId } = data;
      
      if (!gameId || !playerId || !propertyId) {
        return socket.emit('error', { ok: false, reason: 'MISSING_REQUIRED_FIELDS' });
      }

      const result = await this.unmortgageProperty(gameId, playerId, propertyId);
      
      this.io.to(gameId).emit('propertyUnmortgaged', {
        ok: true,
        playerId,
        propertyId,
        cost: result.cost,
        gameState: this.gameManager.getRoom(gameId)
      });

    } catch (error) {
      console.error('Unmortgage error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  // Auction Handlers
  async handleAuctionBid(socket, data) {
    try {
      const { gameId, playerId, bidAmount } = data;
      
      if (!gameId || !playerId || typeof bidAmount !== 'number') {
        return socket.emit('error', { ok: false, reason: 'INVALID_BID_DATA' });
      }

      const result = await this.placeBid(gameId, playerId, bidAmount);
      
      this.io.to(gameId).emit('bidPlaced', {
        ok: true,
        playerId,
        bidAmount,
        gameState: this.gameManager.getRoom(gameId)
      });

    } catch (error) {
      console.error('Auction bid error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleAuctionPass(socket, data) {
    try {
      const { gameId, playerId } = data;
      
      if (!gameId || !playerId) {
        return socket.emit('error', { ok: false, reason: 'GAME_ID_AND_PLAYER_ID_REQUIRED' });
      }

      const result = await this.passAuction(gameId, playerId);
      
      this.io.to(gameId).emit('auctionPassed', {
        ok: true,
        playerId,
        gameState: this.gameManager.getRoom(gameId)
      });

      // Check if auction ended
      if (result.auctionEnded) {
        this.io.to(gameId).emit('auctionEnded', {
          winner: result.winner,
          finalBid: result.finalBid,
          propertyId: result.propertyId,
          gameState: this.gameManager.getRoom(gameId)
        });
      }

    } catch (error) {
      console.error('Auction pass error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  // Trading Handlers
  async handleTradeOffer(socket, data) {
    try {
      const { gameId, fromPlayerId, toPlayerId, offer } = data;
      
      if (!gameId || !fromPlayerId || !toPlayerId || !offer) {
        return socket.emit('error', { ok: false, reason: 'INVALID_TRADE_DATA' });
      }

      const tradeOffer = {
        id: require('uuid').v4(),
        gameId,
        fromPlayerId,
        toPlayerId,
        fromOffer: offer.fromOffer,
        toOffer: offer.toOffer,
        status: 'pending',
        createdAt: new Date()
      };

      // Validate trade
      const gameState = this.gameManager.getRoom(gameId);
      const validation = Rules.validateTradeOffer(tradeOffer, gameState);
      
      if (!validation.valid) {
        return socket.emit('error', { ok: false, reason: validation.reason });
      }

      // Store trade offer in game state
      gameState.pendingTrade = tradeOffer;
      
      // Notify target player
      const targetSocket = this.gameManager.getPlayerSocket(toPlayerId);
      if (targetSocket) {
        this.io.to(targetSocket).emit('tradeOfferReceived', {
          ok: true,
          tradeOffer,
          gameState
        });
      }

      socket.emit('tradeOfferSent', {
        ok: true,
        tradeOffer,
        gameState
      });

    } catch (error) {
      console.error('Trade offer error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleAcceptTrade(socket, data) {
    try {
      const { gameId, playerId, tradeId } = data;
      
      if (!gameId || !playerId || !tradeId) {
        return socket.emit('error', { ok: false, reason: 'MISSING_REQUIRED_FIELDS' });
      }

      const result = await this.executeTrade(gameId, tradeId, 'accepted');
      
      this.io.to(gameId).emit('tradeAccepted', {
        ok: true,
        tradeId,
        executedTrade: result,
        gameState: this.gameManager.getRoom(gameId)
      });

    } catch (error) {
      console.error('Accept trade error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleRejectTrade(socket, data) {
    try {
      const { gameId, playerId, tradeId } = data;
      
      if (!gameId || !playerId || !tradeId) {
        return socket.emit('error', { ok: false, reason: 'MISSING_REQUIRED_FIELDS' });
      }

      const gameState = this.gameManager.getRoom(gameId);
      if (gameState.pendingTrade && gameState.pendingTrade.id === tradeId) {
        gameState.pendingTrade = null;
      }

      this.io.to(gameId).emit('tradeRejected', {
        ok: true,
        tradeId,
        gameState
      });

    } catch (error) {
      console.error('Reject trade error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleCancelTrade(socket, data) {
    try {
      const { gameId, playerId, tradeId } = data;
      
      const gameState = this.gameManager.getRoom(gameId);
      if (gameState.pendingTrade && 
          gameState.pendingTrade.id === tradeId && 
          gameState.pendingTrade.fromPlayerId === playerId) {
        gameState.pendingTrade = null;
      }

      this.io.to(gameId).emit('tradeCancelled', {
        ok: true,
        tradeId,
        gameState
      });

    } catch (error) {
      console.error('Cancel trade error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  // Jail Handlers
  async handlePayFine(socket, data) {
    try {
      const { gameId, playerId } = data;
      
      if (!gameId || !playerId) {
        return socket.emit('error', { ok: false, reason: 'GAME_ID_AND_PLAYER_ID_REQUIRED' });
      }

      const result = await this.payJailFine(gameId, playerId);
      
      this.io.to(gameId).emit('jailFinePaid', {
        ok: true,
        playerId,
        amount: result.amount,
        gameState: this.gameManager.getRoom(gameId)
      });

    } catch (error) {
      console.error('Pay fine error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  async handleUseGetOutOfJailCard(socket, data) {
    try {
      const { gameId, playerId } = data;
      
      if (!gameId || !playerId) {
        return socket.emit('error', { ok: false, reason: 'GAME_ID_AND_PLAYER_ID_REQUIRED' });
      }

      const result = await this.useJailCard(gameId, playerId);
      
      this.io.to(gameId).emit('jailCardUsed', {
        ok: true,
        playerId,
        gameState: this.gameManager.getRoom(gameId)
      });

    } catch (error) {
      console.error('Use jail card error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  // Card Handlers
  async handleDrawCard(socket, data) {
    try {
      const { gameId, playerId, cardType } = data;
      
      if (!gameId || !playerId || !cardType) {
        return socket.emit('error', { ok: false, reason: 'MISSING_REQUIRED_FIELDS' });
      }

      const result = await this.drawCard(gameId, playerId, cardType);
      
      this.io.to(gameId).emit('cardDrawn', {
        ok: true,
        playerId,
        card: result.card,
        cardType,
        gameState: this.gameManager.getRoom(gameId)
      });

      // Execute card effect
      if (result.card.action !== 'GET_OUT_OF_JAIL_FREE') {
        setTimeout(async () => {
          await this.executeCardEffect(gameId, playerId, result.card);
        }, 3000); // Give players time to read the card
      }

    } catch (error) {
      console.error('Draw card error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  // Utility Handlers
  async handleGetGameState(socket, data) {
    try {
      const { gameId } = data;
      
      if (!gameId) {
        return socket.emit('error', { ok: false, reason: 'GAME_ID_REQUIRED' });
      }

      const gameState = this.gameManager.getRoom(gameId);
      if (!gameState) {
        return socket.emit('error', { ok: false, reason: 'GAME_NOT_FOUND' });
      }

      socket.emit('gameState', {
        ok: true,
        gameState
      });

    } catch (error) {
      console.error('Get game state error:', error);
      socket.emit('error', { ok: false, reason: error.message });
    }
  }

  handleDisconnect(socket) {
    console.log('Player disconnected:', socket.id);
    // Clean up socket references
    for (const [playerId, socketId] of this.gameManager.playerSockets.entries()) {
      if (socketId === socket.id) {
        this.gameManager.unregisterPlayerSocket(playerId);
        break;
      }
    }
  }

  // Helper Methods
  async purchaseProperty(gameId, playerId, propertyId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const gameState = this.gameManager.getRoom(gameId);
      const player = await PlayerState.findById(playerId).session(session);
      const squareState = await SquareState.findById(propertyId).session(session);
      const squareTemplate = await SquareTemplate.findById(squareState.squareId).session(session);

      // Validate purchase
      if (squareState.owner || squareState.owen) {
        throw new Error('Property already owned');
      }

      if (player.money < squareTemplate.price) {
        throw new Error('Insufficient funds');
      }

      // Execute purchase
      player.money -= squareTemplate.price;
      squareState.owner = playerId;
      squareState.owen = playerId; // Compatibility

      await player.save({ session });
      await squareState.save({ session });

      await session.commitTransaction();
      
      // Update in-memory state
      await this.gameManager.refreshGameState(gameId, session);

      return { success: true };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async startAuction(gameId, propertyId) {
    const gameState = this.gameManager.getRoom(gameId);
    const squareState = gameState.boardState.find(sq => sq._id.toString() === propertyId);
    const squareTemplate = await SquareTemplate.findById(squareState.squareId);

    gameState.activeAuction = {
      propertyId,
      currentBid: 0,
      currentBidder: null,
      participants: gameState.players.filter(p => !p.isBankrupt).map(p => p._id),
      passedPlayers: new Set(),
      startingBid: Rules.getAuctionStartingBid(squareTemplate),
      createdAt: new Date()
    };

    gameState.phase = 'auction';
  }

  async buildHouse(gameId, playerId, propertyId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const gameState = this.gameManager.getRoom(gameId);
      const player = await PlayerState.findById(playerId).session(session);
      const squareState = await SquareState.findById(propertyId).session(session);
      const squareTemplate = await SquareTemplate.findById(squareState.squareId).session(session);

      // Validate development
      const canDevelop = Rules.canDevelopProperty(squareTemplate, squareState, gameState, playerId);
      if (!canDevelop.canDevelop) {
        throw new Error(canDevelop.reason);
      }

      const buildCost = squareTemplate.buildCost || 100;
      if (player.money < buildCost) {
        throw new Error('Insufficient funds');
      }

      // Execute development
      player.money -= buildCost;
      const currentLevel = squareState.level || squareState.lever || 0;
      squareState.level = currentLevel + 1;
      squareState.lever = currentLevel + 1; // Compatibility

      await player.save({ session });
      await squareState.save({ session });

      await session.commitTransaction();

      return { newLevel: squareState.level, cost: buildCost };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async sellHouse(gameId, playerId, propertyId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const player = await PlayerState.findById(playerId).session(session);
      const squareState = await SquareState.findById(propertyId).session(session);
      const squareTemplate = await SquareTemplate.findById(squareState.squareId).session(session);

      const currentLevel = squareState.level || squareState.lever || 0;
      if (currentLevel <= 0) {
        throw new Error('No houses to sell');
      }

      const owner = squareState.owner || squareState.owen;
      if (owner.toString() !== playerId) {
        throw new Error('Not property owner');
      }

      // Calculate refund (half of build cost)
      const buildCost = squareTemplate.buildCost || 100;
      const refund = Math.floor(buildCost / 2);

      // Execute sale
      player.money += refund;
      squareState.level = currentLevel - 1;
      squareState.lever = currentLevel - 1; // Compatibility

      await player.save({ session });
      await squareState.save({ session });

      await session.commitTransaction();

      return { newLevel: squareState.level, refund };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async mortgageProperty(gameId, playerId, propertyId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const player = await PlayerState.findById(playerId).session(session);
      const squareState = await SquareState.findById(propertyId).session(session);
      const squareTemplate = await SquareTemplate.findById(squareState.squareId).session(session);

      // Validate mortgage
      const owner = squareState.owner || squareState.owen;
      if (owner.toString() !== playerId) {
        throw new Error('Not property owner');
      }

      if (squareState.isMortgage) {
        throw new Error('Property already mortgaged');
      }

      const level = squareState.level || squareState.lever || 0;
      if (level > 0) {
        throw new Error('Cannot mortgage developed property');
      }

      // Execute mortgage
      const mortgageValue = Rules.getMortgageValue(squareTemplate);
      player.money += mortgageValue;
      squareState.isMortgage = true;

      await player.save({ session });
      await squareState.save({ session });

      await session.commitTransaction();

      return { mortgageValue };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async unmortgageProperty(gameId, playerId, propertyId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const player = await PlayerState.findById(playerId).session(session);
        const squareState = await SquareState.findById(propertyId).session(session);
        const squareTemplate = await SquareTemplate.findById(squareState.squareId).session(session);
  
        // Validate unmortgage
        const owner = squareState.owner || squareState.owen;
        if (owner.toString() !== playerId) {
          throw new Error('Not property owner');
        }
  
        if (!squareState.isMortgage) {
          throw new Error('Property not mortgaged');
        }
  
        // Calculate unmortgage cost (mortgage value + 10%)
        const unmortgageCost = Rules.getUnmortgageCost(squareTemplate);
        if (player.money < unmortgageCost) {
          throw new Error('Insufficient funds to unmortgage');
        }
  
        // Execute unmortgage
        player.money -= unmortgageCost;
        squareState.isMortgage = false;
  
        await player.save({ session });
        await squareState.save({ session });
  
        await session.commitTransaction();
  
        return { cost: unmortgageCost };
  
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }
  
    async placeBid(gameId, playerId, bidAmount) {
      const gameState = this.gameManager.getRoom(gameId);
      const auction = gameState.activeAuction;
  
      if (!auction) {
        throw new Error('No active auction');
      }
  
      if (auction.passedPlayers.has(playerId)) {
        throw new Error('Player already passed');
      }
  
      const player = gameState.players.find(p => p._id.toString() === playerId);
      if (!player || player.money < bidAmount) {
        throw new Error('Insufficient funds for bid');
      }
  
      const minBid = auction.currentBid + Rules.getMinimumBidIncrement(auction.currentBid);
      if (bidAmount < minBid) {
        throw new Error(`Minimum bid is ${minBid}`);
      }
  
      // Update auction state
      auction.currentBid = bidAmount;
      auction.currentBidder = playerId;
      auction.lastBidTime = new Date();
  
      return { success: true };
    }
  
    async passAuction(gameId, playerId) {
      const gameState = this.gameManager.getRoom(gameId);
      const auction = gameState.activeAuction;
  
      if (!auction) {
        throw new Error('No active auction');
      }
  
      auction.passedPlayers.add(playerId);
  
      // Check if auction should end
      const activeBidders = auction.participants.filter(p => !auction.passedPlayers.has(p));
      
      if (activeBidders.length <= 1) {
        // Auction ends
        const winner = auction.currentBidder;
        const finalBid = auction.currentBid;
        const propertyId = auction.propertyId;
  
        if (winner && finalBid > 0) {
          // Execute purchase
          await this.purchaseProperty(gameId, winner, propertyId);
        }
  
        // Clear auction
        gameState.activeAuction = null;
        gameState.phase = 'playing';
  
        return {
          auctionEnded: true,
          winner,
          finalBid,
          propertyId
        };
      }
  
      return { auctionEnded: false };
    }
  
    async executeTrade(gameId, tradeId, status) {
      const session = await mongoose.startSession();
      session.startTransaction();
  
      try {
        const gameState = this.gameManager.getRoom(gameId);
        const trade = gameState.pendingTrade;
  
        if (!trade || trade.id !== tradeId) {
          throw new Error('Trade not found');
        }
  
        if (status !== 'accepted') {
          gameState.pendingTrade = null;
          return { success: true, executed: false };
        }
  
        const fromPlayer = await PlayerState.findById(trade.fromPlayerId).session(session);
        const toPlayer = await PlayerState.findById(trade.toPlayerId).session(session);
  
        // Validate trade is still valid
        const validation = Rules.validateTradeOffer(trade, gameState);
        if (!validation.valid) {
          throw new Error(validation.reason);
        }
  
        // Execute money transfers
        if (trade.fromOffer.money > 0) {
          fromPlayer.money -= trade.fromOffer.money;
          toPlayer.money += trade.fromOffer.money;
        }
  
        if (trade.toOffer.money > 0) {
          toPlayer.money -= trade.toOffer.money;
          fromPlayer.money += trade.toOffer.money;
        }
  
        // Execute property transfers
        if (trade.fromOffer.properties && trade.fromOffer.properties.length > 0) {
          for (const propertyId of trade.fromOffer.properties) {
            const squareState = await SquareState.findById(propertyId).session(session);
            squareState.owner = trade.toPlayerId;
            squareState.owen = trade.toPlayerId; // Compatibility
            await squareState.save({ session });
          }
        }
  
        if (trade.toOffer.properties && trade.toOffer.properties.length > 0) {
          for (const propertyId of trade.toOffer.properties) {
            const squareState = await SquareState.findById(propertyId).session(session);
            squareState.owner = trade.fromPlayerId;
            squareState.owen = trade.fromPlayerId; // Compatibility
            await squareState.save({ session });
          }
        }
  
        await fromPlayer.save({ session });
        await toPlayer.save({ session });
  
        await session.commitTransaction();
  
        // Clear pending trade
        gameState.pendingTrade = null;
  
        // Refresh game state
        await this.gameManager.refreshGameState(gameId, session);
  
        return {
          success: true,
          executed: true,
          trade
        };
  
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }
  
    async payJailFine(gameId, playerId) {
      const session = await mongoose.startSession();
      session.startTransaction();
  
      try {
        const player = await PlayerState.findById(playerId).session(session);
  
        if (!player.inJail) {
          throw new Error('Player not in jail');
        }
  
        const fine = 50;
        if (player.money < fine) {
          throw new Error('Insufficient funds to pay fine');
        }
  
        // Pay fine and release from jail
        player.money -= fine;
        player.inJail = false;
        player.jailTurns = 0;
  
        await player.save({ session });
        await session.commitTransaction();
  
        return { amount: fine };
  
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }
  
    async useJailCard(gameId, playerId) {
      const session = await mongoose.startSession();
      session.startTransaction();
  
      try {
        const player = await PlayerState.findById(playerId).session(session);
  
        if (!player.inJail) {
          throw new Error('Player not in jail');
        }
  
        const cards = player.getOutOfJailFreeCards || 0;
        if (cards <= 0) {
          throw new Error('No Get Out of Jail Free cards');
        }
  
        // Use card and release from jail
        player.getOutOfJailFreeCards = cards - 1;
        player.inJail = false;
        player.jailTurns = 0;
  
        await player.save({ session });
        await session.commitTransaction();
  
        return { success: true };
  
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }
  
    async drawCard(gameId, playerId, cardType) {
      const gameState = this.gameManager.getRoom(gameId);
      const Decks = require('../game/Decks');
      const decks = new Decks();
  
      let result;
      if (cardType === 'chance') {
        result = decks.drawChanceCard(gameState.chanceCards);
        gameState.chanceCards = result.deck;
      } else if (cardType === 'community') {
        result = decks.drawCommunityCard(gameState.communityCards);
        gameState.communityCards = result.deck;
      } else {
        throw new Error('Invalid card type');
      }
  
      return result;
    }
  
    async executeCardEffect(gameId, playerId, card) {
      const gameState = this.gameManager.getRoom(gameId);
      const Decks = require('../game/Decks');
      const decks = new Decks();
  
      try {
        const result = await decks.executeCardAction(card, gameState, playerId, this.gameManager);
        
        // Refresh game state and broadcast update
        await this.gameManager.refreshGameState(gameId);
        
        this.io.to(gameId).emit('cardEffectExecuted', {
          ok: true,
          playerId,
          card,
          result,
          gameState: this.gameManager.getRoom(gameId)
        });
  
        // Continue turn if needed
        if (card.action !== 'GO_TO_JAIL') {
          setTimeout(async () => {
            await this.gameManager.endTurn(gameId, playerId);
          }, 2000);
        }
  
      } catch (error) {
        console.error('Card effect execution error:', error);
        this.io.to(gameId).emit('error', {
          ok: false,
          reason: 'CARD_EFFECT_FAILED',
          details: error.message
        });
      }
    }
  }
  
  module.exports = GameHandlers;
  
