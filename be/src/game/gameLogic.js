const Room = require('../models/Room.models');
const Game = require('../models/game.model');
const User = require('../models/user.model');
const { squares } = require('../dataSquare/seed');
const GAME_CONSTANTS = require('../config/gameConstants');

/**
 * Create a new room
 */
const createRoom = async (userId, duration = 20) => {
  // Generate room code
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Create room
  const room = await Room.create({
    roomCode,
    hostId: userId,
    players: [{
      userId,
      name: user.name,
      pet: null,
      ready: false,
    }],
    duration,
    status: 'waiting',
  });

  await room.populate('players.userId', 'name email');

  return {
    success: true,
    roomCode,
    room: formatRoom(room),
  };
};

/**
 * Join existing room
 */
const joinRoom = async (roomCode, userId) => {
  const room = await Room.findOne({ roomCode, status: 'waiting' });
  
  if (!room) {
    throw new Error('Room not found or already started');
  }

  if (room.players.length >= GAME_CONSTANTS.MAX_PLAYERS) {
    throw new Error('Room is full');
  }

  // Check if already in room
  const existingPlayer = room.players.find(p => p.userId.toString() === userId);
  if (existingPlayer) {
    throw new Error('Already in this room');
  }

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Add player
  room.players.push({
    userId,
    name: user.name,
    pet: null,
    ready: false,
  });

  await room.save();
  await room.populate('players.userId', 'name email');

  return {
    success: true,
    room: formatRoom(room),
  };
};

/**
 * Start game
 */
const startGame = async (roomCode) => {
  const room = await Room.findOne({ roomCode, status: 'waiting' });
  
  if (!room) {
    throw new Error('Room not found or already started');
  }

  if (room.players.length < GAME_CONSTANTS.MIN_PLAYERS) {
    throw new Error(`Need at least ${GAME_CONSTANTS.MIN_PLAYERS} players`);
  }

  // Check all players ready
  const allReady = room.players.every(p => p.ready);
  if (!allReady) {
    throw new Error('Not all players are ready');
  }

  // Create game
  const game = await Game.create({
    roomId: room._id,
    players: room.players.map(p => ({
      userId: p.userId,
      name: p.name,
      pet: p.pet,
      money: GAME_CONSTANTS.STARTING_MONEY,
      position: 0,
      properties: [],
      inJail: false,
      jailTurns: 0,
    })),
    board: squares,
    currentTurn: room.players[0].userId,
    turnOrder: room.players.map(p => p.userId),
    diceRoll: null,
    gameLog: [{
      type: 'game_start',
      message: 'Game started!',
      timestamp: new Date(),
    }],
    status: 'playing',
    startTime: new Date(),
    duration: room.duration,
  });

  // Update room
  room.status = 'playing';
  room.gameId = game._id;
  await room.save();

  return {
    success: true,
    gameState: formatGameState(game),
  };
};

/**
 * Roll dice
 */
const rollDice = async (roomCode, playerId) => {
  const room = await Room.findOne({ roomCode, status: 'playing' });
  if (!room) {
    throw new Error('Room not found or not playing');
  }

  const game = await Game.findById(room.gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  // Verify turn
  if (game.currentTurn.toString() !== playerId) {
    throw new Error('Not your turn');
  }

  // Roll dice
  const dice = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
  const total = dice[0] + dice[1];

  game.diceRoll = { dice, total };

  // Find player
  const player = game.players.find(p => p.userId.toString() === playerId);
  if (!player) {
    throw new Error('Player not found');
  }

  // Move player
  const oldPosition = player.position;
  player.position = (player.position + total) % game.board.length;

  // Check if passed GO
  if (player.position < oldPosition) {
    player.money += GAME_CONSTANTS.GO_MONEY;
    game.gameLog.push({
      type: 'pass_go',
      playerId,
      message: `${player.name} passed GO and collected $${GAME_CONSTANTS.GO_MONEY}`,
      timestamp: new Date(),
    });
  }

  // Handle landing
  const square = game.board[player.position];
  const events = await handleSquareLanding(game, player, square);

  // Save game
  await game.save();

  return {
    success: true,
    dice,
    events,
    gameState: formatGameState(game),
  };
};

/**
 * Handle square landing
 */
const handleSquareLanding = async (game, player, square) => {
  const events = [];

  switch (square.type) {
    case 'property':
      if (!square.owner) {
        events.push({
          type: 'can_buy',
          squareIndex: square.index,
          price: square.price,
        });
      } else if (square.owner !== player.userId.toString()) {
        // Pay rent
        const rent = calculateRent(square);
        player.money -= rent;
        
        const owner = game.players.find(p => p.userId.toString() === square.owner);
        if (owner) {
          owner.money += rent;
        }

        events.push({
          type: 'pay_rent',
          amount: rent,
          to: square.owner,
        });

        game.gameLog.push({
          type: 'pay_rent',
          playerId: player.userId,
          message: `${player.name} paid $${rent} rent to ${owner?.name}`,
          timestamp: new Date(),
        });
      }
      break;

    case 'chance':
    case 'community_chest':
      const card = drawCard(square.type);
      events.push({
        type: 'card',
        card,
      });
      await applyCardEffect(game, player, card);
      break;

    case 'tax':
      player.money -= square.amount;
      events.push({
        type: 'tax',
        amount: square.amount,
      });
      game.gameLog.push({
        type: 'tax',
        playerId: player.userId,
        message: `${player.name} paid $${square.amount} tax`,
        timestamp: new Date(),
      });
      break;

    case 'go_to_jail':
      player.inJail = true;
      player.jailTurns = 0;
      player.position = game.board.findIndex(s => s.type === 'jail');
      events.push({
        type: 'go_to_jail',
      });
      break;
  }

  return events;
};

/**
 * Calculate rent
 */
const calculateRent = (square) => {
  if (!square.rent) return 0;
  return square.rent[square.houses || 0] || square.rent[0];
};

/**
 * Draw card
 */
const drawCard = (type) => {
  const cards = type === 'chance' ? GAME_CONSTANTS.CHANCE_CARDS : GAME_CONSTANTS.COMMUNITY_CARDS;
  return cards[Math.floor(Math.random() * cards.length)];
};

/**
 * Apply card effect
 */
const applyCardEffect = async (game, player, card) => {
  switch (card.type) {
    case 'money':
      player.money += card.amount;
      break;
    case 'move':
      player.position = card.position;
      break;
    case 'jail':
      player.inJail = true;
      player.position = game.board.findIndex(s => s.type === 'jail');
      break;
  }

  game.gameLog.push({
    type: 'card',
    playerId: player.userId,
    message: `${player.name}: ${card.text}`,
    timestamp: new Date(),
  });
};

/**
 * Buy property
 */
const buyProperty = async (roomCode, playerId, squareIndex) => {
  const room = await Room.findOne({ roomCode, status: 'playing' });
  if (!room) {
    throw new Error('Room not found');
  }

  const game = await Game.findById(room.gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  const player = game.players.find(p => p.userId.toString() === playerId);
  if (!player) {
    throw new Error('Player not found');
  }

  const square = game.board[squareIndex];
  if (!square || square.type !== 'property') {
    throw new Error('Invalid property');
  }

  if (square.owner) {
    throw new Error('Property already owned');
  }

  if (player.money < square.price) {
    throw new Error('Not enough money');
  }

  // Buy property
  player.money -= square.price;
  square.owner = playerId;
  player.properties.push(squareIndex);

  game.gameLog.push({
    type: 'buy_property',
    playerId,
    message: `${player.name} bought ${square.name} for $${square.price}`,
    timestamp: new Date(),
  });

  await game.save();

  return {
    success: true,
    gameState: formatGameState(game),
  };
};

/**
 * Upgrade property
 */
const upgradeProperty = async (roomCode, playerId, squareIndex) => {
  const room = await Room.findOne({ roomCode, status: 'playing' });
  if (!room) {
    throw new Error('Room not found');
  }

  const game = await Game.findById(room.gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  const player = game.players.find(p => p.userId.toString() === playerId);
  if (!player) {
    throw new Error('Player not found');
  }

  const square = game.board[squareIndex];
  if (!square || square.type !== 'property') {
    throw new Error('Invalid property');
  }

  if (square.owner !== playerId) {
    throw new Error('You do not own this property');
  }

  if ((square.houses || 0) >= 5) {
    throw new Error('Maximum houses reached');
  }

  const upgradeCost = square.housePrice || square.price * 0.5;
  if (player.money < upgradeCost) {
    throw new Error('Not enough money');
  }

  // Upgrade
  player.money -= upgradeCost;
  square.houses = (square.houses || 0) + 1;

  game.gameLog.push({
    type: 'upgrade_property',
    playerId,
    message: `${player.name} upgraded ${square.name} to ${square.houses} house(s)`,
    timestamp: new Date(),
  });

  await game.save();

  return {
    success: true,
    gameState: formatGameState(game),
  };
};

/**
 * Skip action
 */
const skipAction = async (roomCode, playerId) => {
  const room = await Room.findOne({ roomCode, status: 'playing' });
  if (!room) {
    throw new Error('Room not found');
  }

  const game = await Game.findById(room.gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  if (game.currentTurn.toString() !== playerId) {
    throw new Error('Not your turn');
  }

  // Next turn
  await nextTurn(game);
  await game.save();

  return {
    success: true,
    gameState: formatGameState(game),
  };
};

/**
 * Next turn
 */
const nextTurn = async (game) => {
  const currentIndex = game.turnOrder.findIndex(id => id.toString() === game.currentTurn.toString());
  const nextIndex = (currentIndex + 1) % game.turnOrder.length;
  game.currentTurn = game.turnOrder[nextIndex];
  game.diceRoll = null;
};

/**
 * Leave room
 */
const leaveRoom = async (roomCode, userId) => {
  const room = await Room.findOne({ roomCode });
  if (!room) {
    throw new Error('Room not found');
  }

  // Remove player
  room.players = room.players.filter(p => p.userId.toString() !== userId);

  // If host leaves, assign new host
  if (room.hostId.toString() === userId && room.players.length > 0) {
    room.hostId = room.players[0].userId;
  }

  // If no players, delete room
  if (room.players.length === 0) {
    await room.deleteOne();
    return { success: true, room: null };
  }

  await room.save();
  await room.populate('players.userId', 'name email');

  return {
    success: true,
    room: formatRoom(room),
  };
};

/**
 * Format room data
 */
const formatRoom = (room) => {
  return {
    roomCode: room.roomCode,
    hostId: room.hostId,
    players: room.players.map(p => ({
      userId: p.userId._id || p.userId,
      name: p.userId.name || p.name,
      email: p.userId.email,
      pet: p.pet,
      ready: p.ready,
    })),
    duration: room.duration,
    status: room.status,
    gameId: room.gameId,
    createdAt: room.createdAt,
  };
};

/**
 * Format game state
 */
const formatGameState = (game) => {
  return {
    gameId: game._id,
    players: game.players,
    board: game.board,
    currentTurn: game.currentTurn,
    turnOrder: game.turnOrder,
    diceRoll: game.diceRoll,
    gameLog: game.gameLog.slice(-10), // Last 10 logs
    status: game.status,
    startTime: game.startTime,
    duration: game.duration,
  };
};

module.exports = {
  createRoom,
  joinRoom,
  startGame,
  rollDice,
  buyProperty,
  upgradeProperty,
  skipAction,
  leaveRoom,
};
