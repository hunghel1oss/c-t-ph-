/**
 * Game Manager Unit Tests
 * Tests core game mechanics and rules validation
 */

const GameManager = require('../src/game/GameManager');
const Rules = require('../src/game/Rules');
const Decks = require('../src/game/Decks');
const BotAI = require('../src/game/BotAI');

// Mock MongoDB models
jest.mock('../src/models/game.model');
jest.mock('../src/models/playerState.model');
jest.mock('../src/models/squareState.model');
jest.mock('../src/models/SquareTemplate.model');
jest.mock('mongoose');

const Game = require('../src/models/game.model');
const PlayerState = require('../src/models/playerState.model');
const SquareState = require('../src/models/squareState.model');
const SquareTemplate = require('../src/models/SquareTemplate.model');

describe('GameManager', () => {
  let gameManager;
  let mockIo;

  beforeEach(() => {
    // Mock Socket.io
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };

    gameManager = new GameManager(mockIo);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Game Creation and Setup', () => {
    it('should create a new game with valid settings', async () => {
      const mockGame = {
        _id: 'game123',
        roomCode: 'ABC123',
        status: 'waiting',
        settings: { maxPlayers: 4 }
      };

      const mockPlayer = {
        _id: 'player123',
        gameId: 'game123',
        userId: 'user123',
        money: 1500,
        position: 0
      };

      Game.prototype.save = jest.fn().mockResolvedValue(mockGame);
      PlayerState.prototype.save = jest.fn().mockResolvedValue(mockPlayer);
      SquareState.find = jest.fn().mockResolvedValue([]);
      SquareState.insertMany = jest.fn().mockResolvedValue([]);

      const result = await gameManager.createGame('user123', { maxPlayers: 4 });

      expect(result).toHaveProperty('gameId');
      expect(result).toHaveProperty('roomCode');
      expect(result).toHaveProperty('playerStateId');
    });

    it('should join existing game with valid room code', async () => {
      const mockGame = {
        _id: 'game123',
        roomCode: 'ABC123',
        status: 'waiting',
        players: ['player123']
      };

      Game.findOne = jest.fn().mockResolvedValue(mockGame);
      Game.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGame)
      });
      PlayerState.prototype.save = jest.fn().mockResolvedValue({});

      const result = await gameManager.joinGame('user456', 'ABC123');

      expect(result).toHaveProperty('gameId', 'game123');
    });

    it('should reject joining full game', async () => {
      const mockGame = {
        _id: 'game123',
        roomCode: 'ABC123',
        status: 'waiting',
        settings: { maxPlayers: 2 },
        players: ['player1', 'player2']
      };

      Game.findOne = jest.fn().mockResolvedValue(mockGame);
      Game.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGame)
      });

      await expect(gameManager.joinGame('user456', 'ABC123'))
        .rejects.toThrow('Game is full');
    });
  });

  describe('Dice Rolling and Movement', () => {
    let mockGameState;

    beforeEach(() => {
      mockGameState = {
        _id: 'game123',
        currentTurn: 'player123',
        phase: 'rolling',
        players: [{
          _id: 'player123',
          position: 0,
          money: 1500,
          inJail: false,
          doubleTurns: 0
        }],
        boardState: Array(32).fill(null).map((_, i) => ({
          position: i,
          squareId: `square${i}`,
          owner: null
        }))
      };

      gameManager.rooms.set('game123', mockGameState);
    });

    it('should roll dice and move player', async () => {
      // Mock dice roll
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5) // First die: 4
        .mockReturnValueOnce(0.3); // Second die: 2

      Game.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGameState)
      });
      PlayerState.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await gameManager.rollDice('game123', 'player123');

      const updatedState = gameManager.getRoom('game123');
      expect(updatedState.players[0].position).toBe(6); // 0 + 4 + 2
      expect(updatedState.lastDiceRoll).toEqual([4, 2]);
    });

    it('should handle doubles correctly', async () => {
      // Mock double roll
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5) // First die: 4
        .mockReturnValueOnce(0.5); // Second die: 4

      Game.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGameState)
      });
      PlayerState.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await gameManager.rollDice('game123', 'player123');

      const updatedState = gameManager.getRoom('game123');
      expect(updatedState.players[0].doubleTurns).toBe(1);
      expect(updatedState.phase).toBe('rolling'); // Can roll again
    });

    it('should send player to jail on third double', async () => {
      mockGameState.players[0].doubleTurns = 2;

      // Mock double roll
      Math.random = jest.fn()
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5);

      Game.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGameState)
      });
      PlayerState.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await gameManager.rollDice('game123', 'player123');

      const updatedState = gameManager.getRoom('game123');
      expect(updatedState.players[0].position).toBe(8); // Jail position
      expect(updatedState.players[0].inJail).toBe(true);
      expect(updatedState.players[0].doubleTurns).toBe(0);
    });

    it('should collect GO money when passing', async () => {
      mockGameState.players[0].position = 30; // Near GO

      // Mock roll that passes GO
      Math.random = jest.fn()
        .mockReturnValueOnce(0.8) // 5
        .mockReturnValueOnce(0.8); // 5

      Game.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGameState)
      });
      PlayerState.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await gameManager.rollDice('game123', 'player123');

      const updatedState = gameManager.getRoom('game123');
      expect(updatedState.players[0].position).toBe(8); // 30 + 10 - 32
      expect(updatedState.players[0].money).toBe(1800); // 1500 + 300
    });
  });

  describe('Property Purchase and Rent', () => {
    let mockGameState;
    let mockSquareTemplates;

    beforeEach(() => {
      mockGameState = {
        _id: 'game123',
        players: [{
          _id: 'player123',
          money: 1500,
          position: 1
        }, {
          _id: 'player456',
          money: 1500,
          position: 0
        }],
        boardState: [{
          _id: 'square1',
          position: 1,
          squareId: 'template1',
          owner: null,
          level: 0
        }]
      };

      mockSquareTemplates = [{
        _id: 'template1',
        name: 'Mediterranean Avenue',
        type: 'property',
        position: 1,
        price: 60,
        rent: { base: 2, house1: 10, house2: 30, house3: 90, house4: 160, hotel: 250 },
        buildCost: 50,
        group: 'brown'
      }];

      gameManager.rooms.set('game123', mockGameState);
      SquareTemplate.find = jest.fn().mockResolvedValue(mockSquareTemplates);
    });

    it('should calculate rent correctly for unimproved property', () => {
      const squareTemplate = mockSquareTemplates[0];
      const squareState = mockGameState.boardState[0];

      const rent = Rules.calculateRent(squareTemplate, squareState);
      expect(rent).toBe(2);
    });

    it('should calculate rent with monopoly bonus', () => {
      const squareTemplate = mockSquareTemplates[0];
      const squareState = { ...mockGameState.boardState[0], hasMonopoly: true };

      const rent = Rules.calculateRent(squareTemplate, squareState);
      expect(rent).toBe(4); // Double rent for monopoly
    });

    it('should calculate rent for developed property', () => {
      const squareTemplate = mockSquareTemplates[0];
      const squareState = { ...mockGameState.boardState[0], level: 2 };

      const rent = Rules.calculateRent(squareTemplate, squareState);
      expect(rent).toBe(30); // house2 rent
    });

    it('should detect monopoly ownership', () => {
      const gameState = {
        boardState: [
          { position: 1, owner: 'player123' },
          { position: 3, owner: 'player123' }
        ]
      };

      const hasMonopoly = Rules.hasMonopoly('player123', 'brown', gameState);
      expect(hasMonopoly).toBe(true);
    });

    it('should validate property development rules', () => {
      const squareTemplate = mockSquareTemplates[0];
      const squareState = { level: 0, owner: 'player123', isMortgage: false };
      const gameState = {
        boardState: [
          { position: 1, owner: 'player123', level: 0 },
          { position: 3, owner: 'player123', level: 0 }
        ]
      };

      const canDevelop = Rules.canDevelopProperty(squareTemplate, squareState, gameState, 'player123');
      expect(canDevelop.canDevelop).toBe(true);
    });

    it('should prevent uneven development', () => {
      const squareTemplate = mockSquareTemplates[0];
      const squareState = { level: 2, owner: 'player123', isMortgage: false };
      const gameState = {
        boardState: [
          { position: 1, owner: 'player123', level: 2 },
          { position: 3, owner: 'player123', level: 0 } // Uneven
        ]
      };

      const canDevelop = Rules.canDevelopProperty(squareTemplate, squareState, gameState, 'player123');
      expect(canDevelop.canDevelop).toBe(false);
      expect(canDevelop.reason).toBe('UNEVEN_DEVELOPMENT');
    });
  });

  describe('Chance and Community Chest Cards', () => {
    let decks;
    let mockGameState;

    beforeEach(() => {
      decks = new Decks();
      mockGameState = {
        players: [{
          _id: 'player123',
          money: 1500,
          position: 5
        }],
        chanceCards: decks.shuffleChanceDeck(),
        communityCards: decks.shuffleCommunityDeck()
      };
    });

    it('should draw and execute money collection card', async () => {
      const collectMoneyCard = {
        id: 'test_collect',
        text: 'Bank pays you dividend of $50.',
        action: 'COLLECT_MONEY',
        data: { amount: 50 }
      };

      PlayerState.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const mongoose = require('mongoose');
      mongoose.startSession = jest.fn().mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      });

      const result = await decks.executeCardAction(collectMoneyCard, mockGameState, 'player123', gameManager);
      
      expect(result.success).toBe(true);
      expect(mockGameState.players[0].money).toBe(1550);
    });

    it('should draw and execute move to position card', async () => {
      const moveCard = {
        id: 'test_move',
        text: 'Advance to GO. Collect $300.',
        action: 'MOVE_TO_POSITION',
        data: { position: 0, collectGo: true }
      };

      PlayerState.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const mongoose = require('mongoose');
      mongoose.startSession = jest.fn().mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      });

      const result = await decks.executeCardAction(moveCard, mockGameState, 'player123', gameManager);
      
      expect(result.success).toBe(true);
      expect(mockGameState.players[0].position).toBe(0);
      expect(mockGameState.players[0].money).toBe(1800); // 1500 + 300
    });

    it('should execute go to jail card', async () => {
      const jailCard = {
        id: 'test_jail',
        text: 'Go to Jail.',
        action: 'GO_TO_JAIL',
        data: {}
      };

      PlayerState.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const mongoose = require('mongoose');
      mongoose.startSession = jest.fn().mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      });

      const result = await decks.executeCardAction(jailCard, mockGameState, 'player123', gameManager);
      
      expect(result.success).toBe(true);
      expect(mockGameState.players[0].position).toBe(8); // Jail position
      expect(mockGameState.players[0].inJail).toBe(true);
    });

    it('should handle repair costs card', async () => {
      const repairCard = {
        id: 'test_repairs',
        text: 'Make general repairs. $25 per house, $100 per hotel.',
        action: 'PAY_REPAIRS',
        data: { houseRepair: 25, hotelRepair: 100 }
      };

      // Mock player with properties
      const gameStateWithProperties = {
        ...mockGameState,
        boardState: [
          { owner: 'player123', level: 2 }, // 2 houses
          { owner: 'player123', level: 5 }, // 1 hotel
          { owner: 'player456', level: 1 }  // Not our property
        ]
      };

      PlayerState.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const mongoose = require('mongoose');
      mongoose.startSession = jest.fn().mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      });

      const result = await decks.executeCardAction(repairCard, gameStateWithProperties, 'player123', gameManager);
      
      expect(result.success).toBe(true);
      // Should pay: 2 houses * $25 + 1 hotel * $100 = $150
      expect(gameStateWithProperties.players[0].money).toBe(1350);
    });
  });

  describe('Mortgaging and Trading', () => {
    it('should calculate mortgage value correctly', () => {
      const squareTemplate = { price: 200 };
      const mortgageValue = Rules.getMortgageValue(squareTemplate);
      expect(mortgageValue).toBe(100); // Half of price
    });

    it('should calculate unmortgage cost correctly', () => {
      const squareTemplate = { price: 200 };
      const unmortgageCost = Rules.getUnmortgageCost(squareTemplate);
      expect(unmortgageCost).toBe(110); // Mortgage value + 10%
    });

    it('should validate trade offers', () => {
      const tradeOffer = {
        fromPlayerId: 'player123',
        toPlayerId: 'player456',
        fromOffer: { money: 100, properties: [] },
        toOffer: { money: 50, properties: [] }
      };

      const gameState = {
        players: [
          { _id: 'player123', money: 1500 },
          { _id: 'player456', money: 1000 }
        ]
      };

      const validation = Rules.validateTradeOffer(tradeOffer, gameState);
      expect(validation.valid).toBe(true);
    });

    it('should reject invalid trade offers', () => {
      const tradeOffer = {
        fromPlayerId: 'player123',
        toPlayerId: 'player456',
        fromOffer: { money: 2000, properties: [] }, // More than player has
        toOffer: { money: 50, properties: [] }
      };

      const gameState = {
        players: [
          { _id: 'player123', money: 1500 },
          { _id: 'player456', money: 1000 }
        ]
      };

      const validation = Rules.validateTradeOffer(tradeOffer, gameState);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('INSUFFICIENT_FUNDS');
    });
  });

  describe('Auction System', () => {
    it('should determine minimum bid increment', () => {
      expect(Rules.getMinimumBidIncrement(50)).toBe(5);
      expect(Rules.getMinimumBidIncrement(150)).toBe(10);
      expect(Rules.getMinimumBidIncrement(600)).toBe(25);
      expect(Rules.getMinimumBidIncrement(1200)).toBe(50);
    });

    it('should calculate auction starting bid', () => {
      const squareTemplate = { price: 200 };
      const startingBid = Rules.getAuctionStartingBid(squareTemplate);
      expect(startingBid).toBe(20); // 10% of property value
    });
  });

  describe('Bankruptcy and Win Conditions', () => {
    it('should detect win condition with one player remaining', () => {
      const gameState = {
        players: [
          { _id: 'player123', isBankrupt: false },
          { _id: 'player456', isBankrupt: true },
          { _id: 'player789', isBankrupt: true }
        ]
      };

      const winCheck = Rules.checkWinCondition(gameState);
      expect(winCheck.gameOver).toBe(true);
      expect(winCheck.winner._id).toBe('player123');
      expect(winCheck.reason).toBe('LAST_PLAYER_STANDING');
    });

    it('should not detect win condition with multiple active players', () => {
      const gameState = {
        players: [
          { _id: 'player123', isBankrupt: false },
          { _id: 'player456', isBankrupt: false },
          { _id: 'player789', isBankrupt: true }
        ]
      };

      const winCheck = Rules.checkWinCondition(gameState);
      expect(winCheck.gameOver).toBe(false);
    });

    it('should calculate net worth correctly', () => {
        const gameState = {
          players: [
            { _id: 'player123', money: 1500 }
          ],
          boardState: [
            { owner: 'player123', squareId: 'template1', level: 2, isMortgage: false },
            { owner: 'player123', squareId: 'template2', level: 0, isMortgage: true },
            { owner: 'player456', squareId: 'template3', level: 1, isMortgage: false }
          ]
        };
  
        const squareTemplates = [
          { _id: 'template1', price: 200, buildCost: 50 },
          { _id: 'template2', price: 180, buildCost: 50 },
          { _id: 'template3', price: 220, buildCost: 50 }
        ];
  
        const netWorth = Rules.calculateNetWorth('player123', gameState, squareTemplates);
        
        // Expected: 1500 (cash) + 200 (property1) + 100 (2 houses) + 90 (mortgaged property2 at half value)
        expect(netWorth).toBe(1890);
      });
  
      it('should handle bankruptcy liquidation', () => {
        const gameState = {
          players: [
            { _id: 'player123', money: 50, isBankrupt: false }
          ],
          boardState: [
            { owner: 'player123', squareId: 'template1', level: 2, isMortgage: false }
          ]
        };
  
        const squareTemplates = [
          { _id: 'template1', price: 200, buildCost: 50 }
        ];
  
        const debt = 500;
        const canPay = Rules.canPayDebt('player123', debt, gameState, squareTemplates);
        
        expect(canPay.canPay).toBe(false);
        expect(canPay.totalAssets).toBe(350); // 50 cash + 200 property + 100 houses
        expect(canPay.shortfall).toBe(150);
      });
    });
  
    describe('Bot AI Integration', () => {
      let botAI;
  
      beforeEach(() => {
        botAI = new BotAI('medium');
      });
  
      it('should create bot with correct personality', () => {
        const personality = botAI.personality;
        expect(personality).toHaveProperty('aggressiveness');
        expect(personality).toHaveProperty('riskTolerance');
        expect(personality).toHaveProperty('tradingWillingness');
        expect(personality.aggressiveness).toBeGreaterThan(0);
        expect(personality.aggressiveness).toBeLessThanOrEqual(1);
      });
  
      it('should make purchase decisions based on difficulty', async () => {
        const gameState = {
          phase: 'property_decision',
          players: [
            { _id: 'bot123', money: 1500, position: 1, isBot: true }
          ],
          boardState: [
            { position: 1, squareId: 'template1', owner: null }
          ]
        };
  
        const squareTemplates = [
          { _id: 'template1', position: 1, type: 'property', price: 60, rent: { base: 2 } }
        ];
  
        SquareTemplate.find = jest.fn().mockResolvedValue(squareTemplates);
  
        const decision = await botAI.makeDecision(gameState, 'bot123');
        expect(decision).toHaveProperty('action');
        expect(['PURCHASE_PROPERTY', 'DECLINE_PURCHASE']).toContain(decision.action);
      });
  
      it('should handle auction bidding', async () => {
        const gameState = {
          phase: 'auction',
          activeAuction: {
            propertyId: 'property1',
            currentBid: 50,
            currentBidder: 'player456'
          },
          players: [
            { _id: 'bot123', money: 1500, isBot: true }
          ]
        };
  
        const squareTemplates = [
          { _id: 'template1', position: 1, type: 'property', price: 100, rent: { base: 6 } }
        ];
  
        SquareTemplate.find = jest.fn().mockResolvedValue(squareTemplates);
  
        const decision = await botAI.makeDecision(gameState, 'bot123');
        expect(decision).toHaveProperty('action');
        expect(['PLACE_BID', 'PASS_AUCTION']).toContain(decision.action);
      });
  
      it('should evaluate trade offers', async () => {
        const tradeOffer = {
          fromOffer: { money: 100, properties: [] },
          toOffer: { money: 50, properties: ['property1'] }
        };
  
        const gameState = {
          players: [{ _id: 'bot123', money: 1500, isBot: true }],
          boardState: [{ _id: 'property1', squareId: 'template1' }]
        };
  
        const squareTemplates = [
          { _id: 'template1', price: 200, rent: { base: 10 } }
        ];
  
        SquareTemplate.find = jest.fn().mockResolvedValue(squareTemplates);
  
        const evaluation = botAI.evaluateTradeOffer(tradeOffer, { 
          botPlayer: gameState.players[0],
          squareTemplates 
        });
  
        expect(evaluation).toHaveProperty('action');
        expect(['ACCEPT_TRADE', 'DECLINE_TRADE']).toContain(evaluation.action);
      });
    });
  
    describe('Turn Management', () => {
      let mockGameState;
  
      beforeEach(() => {
        mockGameState = {
          _id: 'game123',
          currentTurn: 'player123',
          turnOrder: ['player123', 'player456', 'player789'],
          players: [
            { _id: 'player123', isBankrupt: false },
            { _id: 'player456', isBankrupt: false },
            { _id: 'player789', isBankrupt: true }
          ]
        };
  
        gameManager.rooms.set('game123', mockGameState);
      });
  
      it('should advance turn to next active player', () => {
        const nextPlayer = Rules.getNextPlayer(mockGameState);
        expect(nextPlayer).toBe('player456');
      });
  
      it('should skip bankrupt players', () => {
        mockGameState.currentTurn = 'player456';
        const nextPlayer = Rules.getNextPlayer(mockGameState);
        expect(nextPlayer).toBe('player123'); // Skip player789 who is bankrupt
      });
  
      it('should handle end turn correctly', async () => {
        Game.findByIdAndUpdate = jest.fn().mockResolvedValue(mockGameState);
        
        await gameManager.endTurn('game123', 'player123');
        
        const updatedState = gameManager.getRoom('game123');
        expect(updatedState.currentTurn).toBe('player456');
        expect(updatedState.phase).toBe('rolling');
      });
    });
  
    describe('Jail Mechanics', () => {
      let mockGameState;
  
      beforeEach(() => {
        mockGameState = {
          players: [{
            _id: 'player123',
            position: 8,
            inJail: true,
            jailTurns: 1,
            money: 1500,
            getOutOfJailFreeCards: 0
          }]
        };
      });
  
      it('should handle jail roll for doubles', () => {
        const diceRoll = [3, 3]; // Doubles
        const result = Rules.handleJailRoll('player123', diceRoll, mockGameState);
        
        expect(result.released).toBe(true);
        expect(result.canMove).toBe(true);
        expect(mockGameState.players[0].inJail).toBe(false);
      });
  
      it('should handle jail roll without doubles', () => {
        const diceRoll = [3, 4]; // Not doubles
        const result = Rules.handleJailRoll('player123', diceRoll, mockGameState);
        
        expect(result.released).toBe(false);
        expect(result.canMove).toBe(false);
        expect(mockGameState.players[0].jailTurns).toBe(2);
      });
  
      it('should release on third turn regardless of roll', () => {
        mockGameState.players[0].jailTurns = 3;
        const diceRoll = [2, 4]; // Not doubles
        const result = Rules.handleJailRoll('player123', diceRoll, mockGameState);
        
        expect(result.released).toBe(true);
        expect(result.forcedRelease).toBe(true);
        expect(mockGameState.players[0].money).toBe(1450); // Paid $50 fine
      });
  
      it('should use Get Out of Jail Free card', () => {
        mockGameState.players[0].getOutOfJailFreeCards = 1;
        
        const result = Rules.useGetOutOfJailCard('player123', mockGameState);
        
        expect(result.success).toBe(true);
        expect(mockGameState.players[0].inJail).toBe(false);
        expect(mockGameState.players[0].getOutOfJailFreeCards).toBe(0);
      });
    });
  
    describe('Special Squares', () => {
      it('should handle tax squares', () => {
        const taxSquare = {
          type: 'tax',
          name: 'Income Tax',
          taxAmount: 200
        };
  
        const gameState = {
          players: [{ _id: 'player123', money: 1500 }]
        };
  
        const result = Rules.handleSpecialSquare(taxSquare, gameState, 'player123');
        
        expect(result.action).toBe('PAY_TAX');
        expect(result.amount).toBe(200);
        expect(gameState.players[0].money).toBe(1300);
      });
  
      it('should handle utility rent calculation', () => {
        const utilitySquare = {
          type: 'utility',
          name: 'Electric Company'
        };
  
        const squareState = {
          owner: 'player456'
        };
  
        const gameState = {
          boardState: [
            { type: 'utility', owner: 'player456' },
            { type: 'utility', owner: 'player456' }
          ]
        };
  
        const diceRoll = [3, 4]; // Total: 7
        const rent = Rules.calculateUtilityRent(utilitySquare, squareState, gameState, diceRoll);
        
        expect(rent).toBe(70); // 7 * 10 (owns both utilities)
      });
  
      it('should handle railroad rent calculation', () => {
        const railroadSquare = {
          type: 'railroad',
          name: 'Reading Railroad'
        };
  
        const squareState = {
          owner: 'player456'
        };
  
        const gameState = {
          boardState: [
            { type: 'railroad', owner: 'player456' },
            { type: 'railroad', owner: 'player456' },
            { type: 'railroad', owner: 'player123' },
            { type: 'railroad', owner: 'player456' }
          ]
        };
  
        const rent = Rules.calculateRailroadRent(railroadSquare, squareState, gameState);
        
        expect(rent).toBe(100); // 3 railroads owned: $100
      });
    });
  
    describe('Error Handling', () => {
      it('should handle invalid game ID', async () => {
        Game.findById = jest.fn().mockResolvedValue(null);
        
        await expect(gameManager.rollDice('invalid123', 'player123'))
          .rejects.toThrow('Game not found');
      });
  
      it('should handle invalid player turn', async () => {
        const mockGameState = {
          currentTurn: 'player456',
          phase: 'rolling'
        };
  
        gameManager.rooms.set('game123', mockGameState);
        
        await expect(gameManager.rollDice('game123', 'player123'))
          .rejects.toThrow('Not your turn');
      });
  
      it('should handle insufficient funds', () => {
        const gameState = {
          players: [{ _id: 'player123', money: 50 }]
        };
  
        expect(() => Rules.deductMoney('player123', 100, gameState))
          .toThrow('Insufficient funds');
      });
  
      it('should handle database transaction failures', async () => {
        const mongoose = require('mongoose');
        const mockSession = {
          startTransaction: jest.fn(),
          commitTransaction: jest.fn().mockRejectedValue(new Error('DB Error')),
          abortTransaction: jest.fn(),
          endSession: jest.fn()
        };
  
        mongoose.startSession = jest.fn().mockResolvedValue(mockSession);
        PlayerState.findById = jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue({ money: 1500 })
        });
  
        await expect(gameManager.handleMoneyTransaction('player123', -100))
          .rejects.toThrow('DB Error');
        
        expect(mockSession.abortTransaction).toHaveBeenCalled();
      });
    });
  
    describe('Game State Persistence', () => {
      it('should save game state to database', async () => {
        const mockGameState = {
          _id: 'game123',
          status: 'playing',
          currentTurn: 'player123'
        };
  
        Game.findByIdAndUpdate = jest.fn().mockResolvedValue(mockGameState);
        
        await gameManager.saveGameState('game123', { status: 'playing' });
        
        expect(Game.findByIdAndUpdate).toHaveBeenCalledWith(
          'game123',
          { status: 'playing' },
          { new: true }
        );
      });
  
      it('should refresh game state from database', async () => {
        const mockGame = {
          _id: 'game123',
          status: 'playing',
          players: [{ _id: 'player123' }]
        };
  
        Game.findById = jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockGame)
        });
  
        SquareState.find = jest.fn().mockResolvedValue([]);
  
        await gameManager.refreshGameState('game123');
        
        const gameState = gameManager.getRoom('game123');
        expect(gameState).toBeDefined();
        expect(gameState._id).toBe('game123');
      });
    });
  });
  
