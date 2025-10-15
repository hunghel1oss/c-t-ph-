import { GAME_SETTINGS } from '../config/constants';

/**
 * Game Calculations Helper
 * Tính toán các giá trị trong game
 */

/**
 * Tính tổng tài sản của người chơi
 * @param {Object} player - PlayerState object
 * @param {Array} squareState - Mảng squareState từ backend
 * @returns {number} Tổng tài sản
 */
export const calculateTotalAssets = (player, squareState) => {
  if (!player || !squareState) return 0;
  
  let total = player.money || 0;
   
  // Cộng giá trị các property
  if (player.properties && player.properties.length > 0) {
    player.properties.forEach(squareIndex => {
      const square = squareState.find(s => s.index === squareIndex);
      if (square && square.price) {
        total += square.price;
        
        // Cộng giá trị nhà/hotel
        const houseLevel = player.houses?.[squareIndex] || 0;
        if (houseLevel > 0 && square.buildCost) {
          total += square.buildCost * houseLevel;
        }
      }
    });
  }
  
  return total;
};

/**
 * Tính tiền thuê phải trả
 * @param {Object} square - SquareState object
 * @param {number} houseLevel - Số nhà (0-4, 4=hotel)
 * @returns {number} Tiền thuê
 */
export const calculateRent = (square, houseLevel = 0) => {
  if (!square || !square.rent) return 0;
  
  // Nếu có hotel (level 4), không bị ảnh hưởng bởi thẻ chance (trừ cúp điện)
  if (houseLevel === 4) {
    return square.rent[4] || square.rent[square.rent.length - 1];
  }
  
  return square.rent[houseLevel] || square.rent[0];
};

/**
 * Tính ranking khi game kết thúc
 * @param {Array} playerState - Mảng playerState
 * @param {Array} squareState - Mảng squareState
 * @returns {Array} Mảng ranking sorted
 */
export const calculateRankings = (playerState, squareState) => {
  if (!playerState || !squareState) return [];
  
  const rankings = playerState.map(player => {
    const totalAssets = calculateTotalAssets(player, squareState);
    return {
      playerId: player.id,
      name: player.name,
      totalAssets,
      money: player.money,
      propertyValue: totalAssets - player.money,
      isBankrupt: player.isBankrupt || false,
    };
  });
  
  // Sort theo totalAssets giảm dần
  rankings.sort((a, b) => b.totalAssets - a.totalAssets);
  
  // Gán rank
  rankings.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  return rankings;
};

/**
 * Kiểm tra xem người chơi có thể mua property không
 * @param {Object} player - PlayerState
 * @param {Object} square - SquareState
 * @returns {boolean}
 */
export const canBuyProperty = (player, square) => {
  if (!player || !square) return false;
  if (square.ownerId) return false; // Đã có chủ
  if (!square.price) return false; // Không có giá
  if (player.money < square.price) return false; // Không đủ tiền
  return true;
};

/**
 * Kiểm tra xem người chơi có thể nâng cấp nhà không
 * @param {Object} player - PlayerState
 * @param {Object} square - SquareState
 * @param {Array} squareState - Toàn bộ squareState
 * @returns {boolean}
 */
export const canUpgradeProperty = (player, square, squareState) => {
  if (!player || !square || !squareState) return false;
  if (square.ownerId !== player.id) return false; // Không phải chủ
  if (!square.buildCost) return false; // Không thể xây
  
  const currentLevel = player.houses?.[square.index] || 0;
  if (currentLevel >= 4) return false; // Đã có hotel
  
  if (player.money < square.buildCost) return false; // Không đủ tiền
  
  // Kiểm tra có sở hữu cả nhóm màu không
  if (square.group) {
    const groupSquares = squareState.filter(s => s.group === square.group);
    const ownedInGroup = groupSquares.filter(s => s.ownerId === player.id);
    if (ownedInGroup.length !== groupSquares.length) return false;
  }
  
  return true;
};

/**
 * Format tiền hiển thị
 * @param {number} amount
 * @returns {string}
 */
export const formatMoney = (amount) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount}`;
};

/**
 * Tính vị trí mới sau khi roll dice
 * @param {number} currentPosition
 * @param {number} steps
 * @returns {Object} { newPosition, passedGo }
 */
export const calculateNewPosition = (currentPosition, steps) => {
  const newPosition = (currentPosition + steps) % GAME_SETTINGS.BOARD_SIZE;
  const passedGo = (currentPosition + steps) >= GAME_SETTINGS.BOARD_SIZE;
  
  return { newPosition, passedGo };
};

/**
 * Kiểm tra có phải hotel không (để xử lý logic thẻ chance)
 * @param {Object} player - PlayerState
 * @param {number} squareIndex
 * @returns {boolean}
 */
export const isHotel = (player, squareIndex) => {
  if (!player || !player.houses) return false;
  return player.houses[squareIndex] === 4;
};
