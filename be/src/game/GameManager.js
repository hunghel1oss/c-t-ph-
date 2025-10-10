const mongoose = require('mongoose');
const Game = require('../models/game.model');
const PlayerState = require('../models/playerState.model');
const SquareState = require('../models/squareState.model');
const SquareTemplate = require('../models/SquareTemplate.model');
const Rules = require('../game/Rulers');
const Decks = require('./Decks');
const BotAI = require('./BotAI');
const { v4: uuidv4 } = require('uuid');

class GameManager {
  constructor(io) {
    this.io = io;
    this.activeGames = new Map(); // gameId -> gameState
    this.playerSockets = new Map(); // playerId -> socketId
    this.botPlayers = new Map(); // gameId -> Set of botPlayerIds
    this.decks = new Decks();
  }

  // Room Management
  getAllRooms() {
    return Array.from(this.activeGames.values()).map(game => ({
      id: game.id,
      roomCode: game.roomCode,
      playerCount: game.players.length,
      maxPlayers: game.settings.maxPlayers,
      status: game.status,
      createdAt: game.createdAt
    }));
  }

  getRoom(gameId) {
    return this.activeGames.get(gameId);
  }

  async createGame(hostUserId, settings = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Clean up existing games for this user
      await Game.deleteMany({ players: { $in: [hostUserId] } }, { session });
      await PlayerState.deleteMany({ userId: hostUserId }, { session });

      // Generate room code
      const roomCode = await this.generateRoomCode();

      // Create player state
      const playerState = new PlayerState({
        userId: hostUserId,
        money: settings.startingMoney || 3000,
        position: 0
      });
      await playerState.save({ session });

      // Initialize board state
      const squareTemplates = await SquareTemplate.find().session(session);
      const squareStates = squareTemplates.map(template => ({
        squareId: template._id,
        owner: null,
        owen: null, // maintain compatibility
        level: 0,
        lever: 0, // maintain compatibility
        isMortgage: false
      }));

      const createdSquareStates = await SquareState.insertMany(squareStates, { session });
      const squareStateIds = createdSquareStates.map(ss => ss._id);

      // Create game
      const newGame = new Game({
        roomCode,
        players: [playerState._id],
        currentTurn: playerState._id,
        status: 'waiting',
        boardState: squareStateIds,
        turnOrder: [playerState._id]
      });
      await newGame.save({ session });

      playerState.gameId = newGame._id;
      await playerState.save({ session });

      // Initialize in-memory game state
      const gameState = await this.initializeGameState(newGame._id, session);
      this.activeGames.set(newGame._id.toString(), gameState);

      await session.commitTransaction();
      return { gameId: newGame._id, roomCode, playerStateId: playerState._id };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async joinGame(userId, roomCode) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const game = await Game.findOne({ roomCode, status: 'waiting' }).session(session);
      if (!game) throw new Error('Game not found or already started');
      if (game.players.length >= 4) throw new Error('Game is full');

      // Check if user already in game
      const existingPlayer = await PlayerState.findOne({ userId, gameId: game._id }).session(session);
      if (existingPlayer) throw new Error('User already in game');

      // Create new player
      const playerState = new PlayerState({
        userId,
        gameId: game._id,
        money: 3000,
        position: 0
      });
      await playerState.save({ session });

      game.players.push(playerState._id);
      await game.save({ session });

      // Update in-memory state
      const gameState = this.activeGames.get(game._id.toString());
      if (gameState) {
        await this.refreshGameState(game._id.toString(), session);
      }

      await session.commitTransaction();
      
      // Broadcast player joined
      this.io.to(game._id.toString()).emit('playerJoined', {
        playerId: playerState._id,
        gameState: this.activeGames.get(game._id.toString())
      });

      return { gameId: game._id, playerStateId: playerState._id };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async startGame(gameId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const game = await Game.findById(gameId).session(session);
      if (!game) throw new Error('Game not found');
      if (game.status !== 'waiting') throw new Error('Game already started');
      if (game.players.length < 2) throw new Error('Need at least 2 players');

      // Shuffle turn order
      const shuffledPlayers = [...game.players].sort(() => Math.random() - 0.5);
      game.turnOrder = shuffledPlayers;
      game.currentTurn = shuffledPlayers[0];
      game.status = 'in_progress';
      await game.save({ session });

      // Update in-memory state
      const gameState = await this.refreshGameState(gameId, session);
      gameState.phase = 'rolling';
      gameState.decks = {
        chance: this.decks.shuffleChanceDeck(),
        community: this.decks.shuffleCommunityDeck()
      };

      await session.commitTransaction();

      // Broadcast game started
      this.io.to(gameId).emit('gameStarted', { gameState });

      return gameState;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async rollDice(gameId, playerId) {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) throw new Error('Game not found');
    if (gameState.currentTurn.toString() !== playerId) throw new Error('Not your turn');
    if (gameState.phase !== 'rolling') throw new Error('Cannot roll dice now');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Roll dice
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2;
      const isDoubles = d1 === d2;

      const player = await PlayerState.findById(playerId).session(session);
      if (!player) throw new Error('Player not found');

      // Handle doubles and jail
      if (isDoubles) {
        player.doubleTurns = (player.doubleTurns || 0) + 1;
        if (player.doubleTurns >= 3) {
          // Go to jail
          player.position = 8; // jail position
          player.inJail = true;
          player.jailTurns = 0;
          player.doubleTurns = 0;
          await player.save({ session });
          
          gameState.currentRoll = { d1, d2, total, isDoubles };
          gameState.phase = 'resolving';
          
          await session.commitTransaction();
          
          this.io.to(gameId).emit('rollResult', {
            playerId,
            dice: [d1, d2],
            total,
            newPosition: 8,
            events: ['SENT_TO_JAIL_TRIPLE_DOUBLES'],
            gameState
          });
          
          return this.endTurn(gameId, playerId);
        }
      }

      // Handle jail
      if (player.inJail) {
        if (isDoubles) {
          player.inJail = false;
          player.jailTurns = 0;
          player.doubleTurns = 0;
        } else {
          player.jailTurns = (player.jailTurns || 0) + 1;
          if (player.jailTurns >= 3) {
            // Must pay fine
            player.money -= 50;
            player.inJail = false;
            player.jailTurns = 0;
          } else {
            await player.save({ session });
            await session.commitTransaction();
            
            this.io.to(gameId).emit('rollResult', {
              playerId,
              dice: [d1, d2],
              total,
              newPosition: player.position,
              events: ['STILL_IN_JAIL'],
              gameState
            });
            
            return this.endTurn(gameId, playerId);
          }
        }
      }

      // Move player
      const oldPosition = player.position;
      let newPosition = (player.position + total) % 32;
      
      // Check if passed GO
      const events = [];
      if (oldPosition + total >= 32) {
        player.money += 300; // Pass GO bonus
        events.push('PASSED_GO');
      }

      player.position = newPosition;
      await player.save({ session });

      // Update game state
      gameState.currentRoll = { d1, d2, total, isDoubles };
      gameState.phase = 'resolving';

      await session.commitTransaction();

      // Broadcast roll result
      this.io.to(gameId).emit('rollResult', {
        playerId,
        dice: [d1, d2],
        total,
        newPosition,
        events,
        gameState
      });

      // Process square landing
      return this.processSquareLanding(gameId, playerId);

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async processSquareLanding(gameId, playerId) {
    const gameState = this.activeGames.get(gameId);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const player = await PlayerState.findById(playerId).session(session);
      const squareState = await SquareState.findById(gameState.boardState[player.position]).session(session);
      const squareTemplate = await SquareTemplate.findById(squareState.squareId).session(session);

      let action = await this.determineSquareAction(player, squareState, squareTemplate, gameState);

      await session.commitTransaction();

      // Emit square action
      this.io.to(gameId).emit('squareAction', {
        playerId,
        position: player.position,
        action,
        gameState
      });

      // Handle automatic actions
      if (action.autoResolve) {
        return this.handleSquareAction(gameId, playerId, action);
      }

      return action;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async determineSquareAction(player, squareState, squareTemplate, gameState) {
    switch (squareTemplate.type) {
      case 'property':
        const owner = squareState.owner || squareState.owen;
        if (!owner) {
          return {
            type: 'OFFER_PURCHASE',
            property: squareTemplate,
            price: squareTemplate.price,
            canAfford: player.money >= squareTemplate.price
          };
        } else if (owner.toString() === player._id.toString()) {
          return {
            type: 'OWN_PROPERTY',
            property: squareTemplate,
            autoResolve: true
          };
        } else {
          const rent = Rules.calculateRent(squareTemplate, squareState, gameState.currentRoll);
          return {
            type: 'PAY_RENT',
            property: squareTemplate,
            owner,
            rent,
            autoResolve: true
          };
        }

      case 'railroad':
        return this.handleRailroadSquare(player, squareState, squareTemplate, gameState);

      case 'tax':
        return {
          type: 'PAY_TAX',
          amount: squareTemplate.price || 100,
          autoResolve: true
        };

      case 'chance':
        return {
          type: 'DRAW_CHANCE',
          autoResolve: true
        };

      case 'jail':
        return {
          type: 'VISITING_JAIL',
          autoResolve: true
        };

      case 'plane':
        return {
          type: 'GO_TO_JAIL',
          autoResolve: true
        };

      default:
        return {
          type: 'NO_ACTION',
          autoResolve: true
        };
    }
  }

  async handleSquareAction(gameId, playerId, action) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const player = await PlayerState.findById(playerId).session(session);
      
      switch (action.type) {
        case 'PAY_RENT':
          await this.processRentPayment(player, action, session);
          break;
        case 'PAY_TAX':
          player.money -= action.amount;
          await player.save({ session });
          break;
        case 'DRAW_CHANCE':
          await this.processChanceCard(gameId, playerId, session);
          break;
        case 'GO_TO_JAIL':
          player.position = 8;
          player.inJail = true;
          player.jailTurns = 0;
          await player.save({ session });
          break;
      }

      await session.commitTransaction();
      
      // Check for bankruptcy
      if (player.money < 0) {
        return this.handleBankruptcy(gameId, playerId);
      }

      // End turn if no doubles
      const gameState = this.activeGames.get(gameId);
      if (!gameState.currentRoll.isDoubles) {
        return this.endTurn(gameId, playerId);
      }

      // Continue turn with doubles
      gameState.phase = 'rolling';
      this.io.to(gameId).emit('gameStateUpdate', { gameState });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async endTurn(gameId, playerId) {
    const gameState = this.activeGames.get(gameId);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const game = await Game.findById(gameId).session(session);
      const currentIndex = game.turnOrder.findIndex(p => p.toString() === playerId);
      const nextIndex = (currentIndex + 1) % game.turnOrder.length;
      
      game.currentTurn = game.turnOrder[nextIndex];
      await game.save({ session });

      // Reset doubles counter
      const player = await PlayerState.findById(playerId).session(session);
      player.doubleTurns = 0;
      await player.save({ session });

      gameState.currentTurn = game.currentTurn;
      gameState.phase = 'rolling';
      gameState.currentRoll = null;

      await session.commitTransaction();

      // Handle bot turn
      const nextPlayer = await PlayerState.findById(game.currentTurn);
      if (this.botPlayers.get(gameId)?.has(nextPlayer._id.toString())) {
        setTimeout(() => this.handleBotTurn(gameId, nextPlayer._id.toString()), 2000);
      }

      this.io.to(gameId).emit('turnEnded', {
        previousPlayer: playerId,
        currentPlayer: game.currentTurn,
        gameState
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async handleBotTurn(gameId, botPlayerId) {
    const gameState = this.activeGames.get(gameId);
    if (!gameState || gameState.currentTurn.toString() !== botPlayerId) return;

    try {
      // Bot rolls dice
      await this.rollDice(gameId, botPlayerId);
      
      // Bot makes decisions based on AI logic
      const botAI = new BotAI();
      const decision = await botAI.makeDecision(gameState, botPlayerId);
      
      if (decision.action) {
        await this.executeBotAction(gameId, botPlayerId, decision);
      }
    } catch (error) {
      console.error('Bot turn error:', error);
      // End turn on error
      this.endTurn(gameId, botPlayerId);
    }
  }

  // Utility methods
  async generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomCode;
    let isUnique = false;

    while (!isUnique) {
      roomCode = '';
      for (let i = 0; i < 6; i++) {
        roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      const existingGame = await Game.findOne({ roomCode });
      if (!existingGame) isUnique = true;
    }

    return roomCode;
  }

  async initializeGameState(gameId, session) {
    const game = await Game.findById(gameId)
      .populate('players')
      .populate('boardState')
      .session(session);

    return {
      id: gameId,
      roomCode: game.roomCode,
      status: game.status,
      phase: 'waiting',
      players: game.players,
      boardState: game.boardState,
      currentTurn: game.currentTurn,
      turnOrder: game.turnOrder,
      settings: {
        startingMoney: 3000,
        passGo: 300,
        maxPlayers: 4,
        jailTurnLimit: 3
      },
      currentRoll: null,
      activeAuction: null,
      gameLog: [],
      createdAt: game.createdAt
    };
  }

  async refreshGameState(gameId, session) {
    const gameState = await this.initializeGameState(gameId, session);
    this.activeGames.set(gameId, gameState);
    return gameState;
  }

  // Socket connection management
  registerPlayerSocket(playerId, socketId) {
    this.playerSockets.set(playerId, socketId);
  }

  unregisterPlayerSocket(playerId) {
    this.playerSockets.delete(playerId);
  }

  getPlayerSocket(playerId) {
    return this.playerSockets.get(playerId);
  }
}

module.exports = GameManager;
