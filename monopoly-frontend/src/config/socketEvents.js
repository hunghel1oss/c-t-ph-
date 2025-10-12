/**
 * Socket Event Names Configuration
 * Tập trung tất cả tên event để dễ mapping với backend
 * Nếu backend thay đổi tên event, chỉ cần sửa ở đây
 */

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  
  // Room Management
  ROOM_CREATE: 'room:create',
  ROOM_CREATED: 'room:created',
  ROOM_JOIN: 'room:join',
  ROOM_JOINED: 'room:joined',
  ROOM_LEAVE: 'room:leave',
  ROOM_UPDATE: 'room:update',
  ROOM_ERROR: 'room:error',
  
  // Game Flow
  GAME_START: 'game:start',
  GAME_STARTED: 'game:started',
  GAME_UPDATE: 'game:update',
  GAME_END: 'game:end',
  GAME_END_REQUEST: 'game:end:request',
  GAME_TIMER: 'game:timer',
  
  // Player Actions - BẮT BUỘC dùng đúng tên backend
  ROLL_DICE: 'roll-dice',           // Backend event name
  DICE_RESULT: 'dice:result',
  PLAYER_ACTION: 'player:action',
  PLAYER_MOVED: 'player:moved',
  
  // Property Actions
  BUY_PROPERTY: 'buy:property',
  UPGRADE_PROPERTY: 'upgrade:property',
  SELL_PROPERTY: 'sell:property',
  MORTGAGE_PROPERTY: 'mortgage:property',
  
  // Special Events
  DRAW_CARD: 'draw:card',
  PAY_RENT: 'pay:rent',
  GO_TO_JAIL: 'go:jail',
  LEAVE_JAIL: 'leave:jail',
  
  // Trade
  TRADE_OFFER: 'trade:offer',
  TRADE_ACCEPT: 'trade:accept',
  TRADE_REJECT: 'trade:reject',
  
  // Errors
  ERROR: 'error',
  GAME_ERROR: 'game:error',
};

// Action types cho player:action event
export const PLAYER_ACTIONS = {
  BUY: 'buy',
  SKIP: 'skip',
  UPGRADE: 'upgrade',
  SELL: 'sell',
  MORTGAGE: 'mortgage',
  UNMORTGAGE: 'unmortgage',
  PAY_JAIL_FINE: 'payJailFine',
  USE_JAIL_CARD: 'useJailCard',
};

// Event types trong DiceResult.events
export const GAME_EVENT_TYPES = {
  PAY_RENT: 'payRent',
  OFFER_BUY: 'offerBuy',
  DRAW_CARD: 'drawCard',
  GO_TO_JAIL: 'goToJail',
  PASS_GO: 'passGo',
  TAX: 'tax',
  BANKRUPT: 'bankrupt',
};
