// monopoly-frontend/src/config/constants.js

// 🎮 Game settings - phải khớp với backend
export const GAME_SETTINGS = {
  STARTING_MONEY: 3000,
  PASS_GO_BONUS: 300,
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  JAIL_POSITION: 8,
  JAIL_FINE: 50,
  MAX_JAIL_TURNS: 3,
  BOARD_SIZE: 32,
};

// ⏱ Thời lượng game cho người chơi chọn
export const DURATION_OPTIONS = [
  { value: 20, label: '20 phút' },
  { value: 60, label: '60 phút' },
];

// 🐾 Loại thú cưng trong game
export const PET_TYPES = ['lion', 'dragon', 'unicorn', 'phoenix'];

// 🎨 Màu sắc thú cưng
export const PET_COLORS = {
  lion: '#FFD700',      // Vàng
  dragon: '#FF4500',    // Đỏ cam
  unicorn: '#FF10F0',   // Hồng neon
  phoenix: '#00F0FF',   // Xanh neon
};

// 🎨 Màu sắc cho từng loại ô trên bàn cờ
export const SQUARE_TYPE_COLORS = {
  start: '#39FF14',         // Xanh lá neon
  property: '#00F0FF',      // Xanh dương neon
  railroad: '#FFFF00',      // Vàng neon
  utility: '#FF6600',       // Cam neon
  tax: '#FF0000',           // Đỏ
  chance: '#FF10F0',        // Hồng neon
  community: '#BF00FF',     // Tím neon
  jail: '#808080',          // Xám
  plane: '#FF0000',         // Đỏ (go to jail)
  festival: '#39FF14',      // Xanh lá
  free_parking: '#FFD700',  // Vàng
};

// 🌐 API endpoints (chuẩn nhất, gộp cả cái cũ + mới)
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
  },
  GAME: {
    CREATE: '/api/games/create',         // ✅ chuẩn RESTful
    JOIN: '/api/games/join',
    LIST: '/api/games/rooms',
    START: '/api/games/start',
    ROLL: '/api/games/roll',
    PROCESS: '/api/games/process',
  },
};