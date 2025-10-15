/**
 * be/src/utils/gameHelper.js
 * Chứa các hàm tiện ích chung cho logic game (tránh circular dependencies)
 */

// ✅ Hàm 1: shuffleArray (Sắp xếp ngẫu nhiên mảng)
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// ✅ Hàm 2: getLevelFromSquare (Lấy cấp độ, xử lý lỗi chính tả nếu cần)
/**
 * Lấy level của ô đất, xử lý các trường hợp lỗi chính tả (level/lever)
 */
const getLevelFromSquare = (squareState) => {
  // Ưu tiên trường 'level', nếu không có, dùng 'lever' (lỗi chính tả cũ)
  return (typeof squareState.level !== 'undefined') ? squareState.level : (squareState.lever || 0);
};

// ✅ Hàm 3: setLevelToSquare
/**
 * Gán level cho ô đất (để đảm bảo cả hai trường đều được cập nhật nếu tồn tại)
 */
const setLevelToSquare = (squareState, level) => { 
  squareState.level = level; 
  squareState.lever = level; 
};


module.exports = {
    shuffleArray,
    getLevelFromSquare,
    setLevelToSquare,
};
