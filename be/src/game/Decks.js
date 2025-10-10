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
  // Decks class methods for shuffling, drawing, and executing card actions with transaction safety
    shuffleChanceDeck() {
      const shuffled = [...this.chanceCards]; // Tao 1 ban sao de xao tron
      for (let i = shuffled.length - 1; i > 0; i--) { // Xao tron bang thuat toan Fisher-Yates 
        const j = Math.floor(Math.random() * (i + 1)); // Chon vi tri ngau nhien tung vong lap de xao tron 
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Hoan doi vi tri 2 phan tu de xao tron 
      } 
      return shuffled; // Tra ve mang da xao tron
    }
  // Tuong tu nhu tren de xao tron mang communityCards 
    shuffleCommunityDeck() {
      const shuffled = [...this.communityCards]; // Tao 1 ban sao de xao tron
      for (let i = shuffled.length - 1; i > 0; i--) { // Xao tron bang thuat toan Fisher-Yates
        const j = Math.floor(Math.random() * (i + 1)); // Chon vi tri ngau nhien tung vong lap de xao tron
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Hoan doi vi tri 2 phan tu de xao tron
      }
      return shuffled;
    }
  // Neu deck null hoac rong thi xao tron lai, lay la bai dau tien, neu khong phai la bai "Get Out of Jail Free" thi bo lai cuoi deck
    drawChanceCard(deck) {  
      if (!deck || deck.length === 0) { // Neu deck null hoac rong thi xao tron lai
        deck = this.shuffleChanceDeck(); // Xao tron lai deck chance cards
      }
      const card = deck.shift(); // Lay la bai dau tien cua deck  
      
      // If it's a "Get Out of Jail Free" card, don't put it back in deck
      if (card.action !== 'GET_OUT_OF_JAIL_FREE') {
        deck.push(card); // Neu khong phai la bai "Get Out of Jail Free" thi bo lai cuoi deck
      }
      
      return { card, deck };
    }
  // Tuong tu nhu tren de xao tron mang communityCards va rut bai
    drawCommunityCard(deck) {
      if (!deck || deck.length === 0) { // Neu deck null hoac rong thi xao tron lai
        deck = this.shuffleCommunityDeck(); // Xao tron lai deck community cards
      }
      const card = deck.shift(); // Lay la bai dau tien cua deck
      
      // If it's a "Get Out of Jail Free" card, don't put it back in deck
      if (card.action !== 'GET_OUT_OF_JAIL_FREE') {
        deck.push(card); // Neu khong phai la bai "Get Out of Jail Free" thi bo lai cuoi deck
      }
      
      return { card, deck };
    }
  // Thuc hien hanh dong cua la bai voi tinh an toan giao dich
    async executeCardAction(card, gameState, playerId, gameManager) {
      const player = gameState.players.find(p => p._id.toString() === playerId.toString()); // Tim player hien tai trong gameState 
      if (!player) throw new Error('Player not found'); // Neu khong tim thay player thi bao loi va ket thuc 
  
      const session = await require('mongoose').startSession(); // Bat dau 1 session moi de quan ly giao dich
      session.startTransaction(); // Bat dau giao dich moi
      // Su dung switch case de thuc hien hanh dong tuong ung voi tung loai la bai
      try {
        switch (card.action) { // Su dung switch case de thuc hien hanh dong tuong ung voi tung loai la bai
          case 'COLLECT_MONEY':// Truong hop la bai thu tien tu ngan hang hoac tu cac nguoi choi khac
            await this.handleCollectMoney(player, card.data.amount, session); // Goi ham xu ly thu tien tuong ung 
            break;
  
          case 'PAY_MONEY': // Truong hop la bai tra tien cho ngan hang
            await this.handlePayMoney(player, card.data.amount, session); // Goi ham xu ly tra tien tuong ung
            break;
  
          case 'MOVE_TO_POSITION': // Truong hop la bai di chuyen den vi tri cu the tren ban co
            await this.handleMoveToPosition(player, card.data, gameState, session); // Goi ham xu ly di chuyen den vi tri cu the
            break;
  
          case 'MOVE_RELATIVE': // Truong hop la bai di chuyen tuong doi (tang hoac giam so o tren ban co)
            await this.handleMoveRelative(player, card.data.spaces, gameState, session); // Goi ham xu ly di chuyen tuong doi
            break;
  
          case 'MOVE_TO_NEAREST': // Truong hop la bai di chuyen den loai o gan nhat (duong sat hoac tien ich)
            await this.handleMoveToNearest(player, card.data, gameState, session); // Goi ham xu ly di chuyen den loai o gan nhat
            break;
  
          case 'GO_TO_JAIL': // Truong hop la bai di den nha tu (Go to Jail)
            await this.handleGoToJail(player, session); // Goi ham xu ly di den nha tu (Go to Jail)
            break;
  
          case 'GET_OUT_OF_JAIL_FREE': // Truong hop la bai thoat khoi nha tu (Get Out of Jail Free)
            await this.handleGetOutOfJailFree(player, session); // Goi ham xu ly thoat khoi nha tu (Get Out of Jail Free)
            break;
  
          case 'PAY_REPAIRS': // Truong hop la bai tra tien sua chua nha cua va khach san
            await this.handlePayRepairs(player, card.data, gameState, session); // Goi ham xu ly tra tien sua chua nha cua va khach san
            break;

          case 'PAY_ALL_PLAYERS': // Truong hop la bai tra tien cho tat ca nguoi choi
            await this.handlePayAllPlayers(player, card.data.amount, gameState, session); // Goi ham xu ly tra tien cho tat ca nguoi choi
            break;
  
          case 'COLLECT_FROM_ALL_PLAYERS': // Truong hop la bai thu tien tu tat ca nguoi choi
            await this.handleCollectFromAllPlayers(player, card.data.amount, gameState, session); // Goi ham xu ly thu tien tu tat ca nguoi choi
            break;
  
          default:
            console.warn('Unknown card action:', card.action); // Neu la bai khong xac dinh thi in canh bao 
        }
  
        await session.commitTransaction(); // Neu tat ca cac hanh dong tren thanh cong thi commit giao dich
        return { success: true, newPosition: player.position }; // Tra ve ket qua thanh cong va vi tri moi cua nguoi choi
  
      } catch (error) {
        await session.abortTransaction(); // Neu co loi xay ra trong qua trinh thuc hien thi abort giao dich
        console.error('Error executing card action:', error); // In loi ra console de de dang giai quyet

        throw error; // Re-throw the error to be handled by the caller
      } finally {
        session.endSession();
      }
    }
    // Cac ham xu ly chi tiet cho tung loai hanh dong cua la bai
    async handleCollectMoney(player, amount, session) { // Truong hop la bai thu tien tu ngan hang hoac tu cac nguoi choi khac
      const PlayerState = require('../models/playerState.model'); // Import model PlayerState de cap nhat trang thai nguoi choi trong database
      player.money += amount; // Tang so tien cua nguoi choi
      await PlayerState.findByIdAndUpdate(player._id, { money: player.money }, { session }); // Cap nhat so tien moi cua nguoi choi trong database voi session hien tai
    }
    
    // Truong hop la bai tra tien cho ngan hang hoac tu cac nguoi choi khac
    async handlePayMoney(player, amount, session) { // Truong hop la bai tra tien cho ngan hang hoac tu cac nguoi choi khac
      const PlayerState = require('../models/playerState.model'); // Import model PlayerState de cap nhat trang thai nguoi choi trong database
      player.money -= amount; // Giam so tien cua nguoi choi
      if (player.money < 0) player.money = 0; // Neu so tien am thi dat ve 0
      await PlayerState.findByIdAndUpdate(player._id, { money: player.money }, { session }); // Cap nhat so tien moi cua nguoi choi trong database voi session hien tai
    }
    
    // Truong hop la bai di chuyen den vi tri khac tren ban co
    async handleMoveToPosition(player, data, gameState, session) { // Truong hop la bai di chuyen den vi tri khac tren ban co
      const PlayerState = require('../models/playerState.model'); // Import model PlayerState de cap nhat trang thai nguoi choi trong database
      const oldPosition = player.position;  // Luu vi tri cu truoc khi di chuyen
      const newPosition = data.position; // Vi tri moi can di chuyen den
  
      // Check if passed GO
      if (data.collectGo && (newPosition < oldPosition || newPosition === 0)) { // Neu vi tri moi nho hon vi tri cu hoac bang 0 (GO) va co yeu cau thu tien GO
        player.money += 300; // Tang tien GO cho nguoi choi (300)
      }
      
      // Update player position and money in database 
      player.position = newPosition;  // Cap nhat vi tri moi cho nguoi choi
      await PlayerState.findByIdAndUpdate( // Cap nhat vi tri va so tien moi cua nguoi choi trong database voi session hien tai
        player._id,  
        { position: player.position, money: player.money }, 
        { session }
      );
    }
    
    // Truong hop la bai di chuyen theo vi tri khac nhau (tang hoac giam so o tren ban co)
    async handleMoveRelative(player, spaces, gameState, session) { // Truong hop la bai di chuyen theo vi tri khac nhau (tang hoac giam so o tren ban co)
      const PlayerState = require('../models/playerState.model'); // Import model PlayerState de cap nhat trang thai nguoi choi trong database  
      const oldPosition = player.position; // Luu vi tri cu truoc khi di chuyen
      let newPosition = (player.position + spaces) % 32; // Tinh vi tri moi sau khi di chuyen (32 la so o tren ban co)
      
      // Handle negative movement
      if (newPosition < 0) {
        newPosition = 32 + newPosition;
      }
  
      // Check if passed GO (only if moving forward and crossing position 0)
      if (spaces > 0 && newPosition < oldPosition) { // Neu di chuyen ve phia truoc va vi tri moi nho hon vi tri cu
        player.money += 300; // Tang tien GO cho nguoi choi (300)
      }
      // Update player position in database
      player.position = newPosition;// Cap nhat vi tri moi cho nguoi choi
      await PlayerState.findByIdAndUpdate( // Cap nhat vi tri va so tien moi cua nguoi choi trong database voi session hien tai
        player._id, 
        { position: player.position, money: player.money }, 
        { session }
      );
    }

    // Truong hop la bai di chuyen theo vi tri khac nhau (tang hoac giam so o tren ban co)
    async handleMoveToNearest(player, data, gameState, session) {
      const SquareTemplate = require('../models/SquareTemplate.model'); // Import model SquareTemplate de lay thong tin cac o tren ban co
      const PlayerState = require('../models/playerState.model'); // Import model PlayerState de cap nhat trang thai nguoi choi trong database
      
      const squareTemplates = await SquareTemplate.find().session(session); // Lay tat ca cac o tren ban co tu database voi session hien tai
      const targetSquares = squareTemplates.filter(sq => sq.type === data.type); // Loc ra cac o co loai trung voi loai can tim (railroad hoac utility)
      
      if (targetSquares.length === 0) return;
  
      // Find nearest target square
      let nearestDistance = Infinity;
      let nearestPosition = player.position;
      
      // Find nearest target square
      targetSquares.forEach(square => {
        let distance = square.position - player.position;
        if (distance <= 0) distance += 32; // Wrap around board
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPosition = square.position;
        }
      });
  
      const oldPosition = player.position; // Luu vi tri cu truoc khi di chuyen
      player.position = nearestPosition;
  
      // Check if passed GO
      if (nearestPosition < oldPosition) {
        player.money += 300; // Tang tien GO cho nguoi choi (300)
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
    
    // Truong hop la bai di chuyen den tu (jail)
    async handleGoToJail(player, session) { // Truong hop la bai di chuyen den tuat (jail)
      const PlayerState = require('../models/playerState.model'); // Import model PlayerState de cap nhat trang thai nguoi choi trong database
      player.position = 8; // Jail position
      player.inJail = true; // Dat trang thai trong tu
      player.jailTurns = 0; // Dat so luot o trong tu ve 0
      player.doubleTurns = 0; // Dat so luot tung cap ve 0
  
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
    
    // Truong hop la bai "Get Out of Jail Free"
    async handleGetOutOfJailFree(player, session) {
      const PlayerState = require('../models/playerState.model'); // Import model PlayerState de cap nhat trang thai nguoi choi trong database
      player.getOutOfJailFreeCards = (player.getOutOfJailFreeCards || 0) + 1; // Tang so luong bai "Get Out of Jail Free" cua nguoi choi len 1
      
      await PlayerState.findByIdAndUpdate(
        player._id,
        { getOutOfJailFreeCards: player.getOutOfJailFreeCards },
        { session }
      );
    }
    
    // Truong hop la bai "Pay Repairs"
    async handlePayRepairs(player, data, gameState, session) {
      const PlayerState = require('../models/playerState.model'); // Import model PlayerState de cap nhat trang thai nguoi choi trong database
      const Rules = require('../game/Rulers'); // Import Rules de lay thong tin ve cac o ma nguoi choi so huu trong gameState
      
      const playerProperties = Rules.getPlayerProperties(player._id, gameState); // Lay cac o ma nguoi choi so huu trong gameState
      let totalCost = 0; // Bien luu tong chi phi sua chua
  
      playerProperties.forEach(squareState => { // Duyet qua tung o ma nguoi choi so huu
        const level = squareState.level || squareState.lever || 0; // Lay level (so nha) cua o, neu khong co thi dat ve 0
        if (level > 0) {
          if (level === 4) { // Hotel
            totalCost += data.hotelRepair;
          } else { // Houses
            totalCost += level * data.houseRepair;
          }
        }
      });
  
      player.money -= totalCost;
      await PlayerState.findByIdAndUpdate(player._id, { money: player.money }, { session });
    }
  
    // Truong hop la bai "Pay All Players" va "Collect From All Players"
    async handlePayAllPlayers(player, amount, gameState, session) {
      const PlayerState = require('../models/playerState.model'); // Import model PlayerState de cap nhat trang thai nguoi choi trong database
      const otherPlayers = gameState.players.filter(p =>  
        p._id.toString() !== player._id.toString() && !p.isBankrupt
      );
  
      const totalPayment = otherPlayers.length * amount; // Tinh tong so tien can tra cho tat ca nguoi choi khac
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
    
    // Truong hop la bai "Collect From All Players"
    async handleCollectFromAllPlayers(player, amount, gameState, session) {
      const PlayerState = require('../models/playerState.model'); // Import model PlayerState de cap nhat trang thai nguoi choi trong database
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
      const chanceCard = this.chanceCards.find(card => card.id === cardId); // Tim la bai trong deck chanceCards
      if (chanceCard) return { card: chanceCard, type: 'chance' };  // Neu tim thay thi tra ve la bai va loai la 'chance'
  
      const communityCard = this.communityCards.find(card => card.id === cardId); // Tim la bai trong deck communityCards
      if (communityCard) return { card: communityCard, type: 'community' }; // Neu tim thay thi tra ve la bai va loai la 'community'
  
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
  