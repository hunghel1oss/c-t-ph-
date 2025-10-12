const setUpSocketHandlers = require('./socketHandlers');
const setupGameSocket = require('./game.socket');

module.exports = (io) => {
  setUpSocketHandlers(io);  // socket chung
  setupGameSocket(io);      // socket cho game
};
