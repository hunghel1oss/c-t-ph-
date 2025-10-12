const GAME_CONSTANTS = {
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  STARTING_MONEY: 2000,
  GO_MONEY: 200,
  JAIL_FINE: 50,
  MAX_HOUSES: 5,
  
  CHANCE_CARDS: [
    { type: 'money', amount: 200, text: 'Bank pays you dividend of $200' },
    { type: 'money', amount: -100, text: 'Pay poor tax of $100' },
    { type: 'move', position: 0, text: 'Advance to GO' },
    { type: 'jail', text: 'Go to Jail' },
  ],
  
  COMMUNITY_CARDS: [
    { type: 'money', amount: 100, text: 'You inherit $100' },
    { type: 'money', amount: -50, text: 'Doctor fee. Pay $50' },
    { type: 'move', position: 0, text: 'Advance to GO' },
  ],
};

module.exports = { GAME_CONSTANTS };
