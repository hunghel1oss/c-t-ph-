// be/src/dataSquare/seed.js (FIXED for 32 squares)

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SquareTemplate = require('../models/SquareTemplate.model');

dotenv.config({ path: '../../.env' });

const connectDb = async ()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

const rawSquares = [
  // GO (0)
  { position: 0, type: 'go', name: 'GO', description: 'Collect $200' },
  // Brown (1, 3)
  { position: 1, type: 'property', name: 'Mediterranean Avenue', color: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], housePrice: 50 },
  { position: 2, type: 'community_chest', name: 'Community Chest' },
  { position: 3, type: 'property', name: 'Baltic Avenue', color: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], housePrice: 50 },
  // Tax (4)
  { position: 4, type: 'tax', name: 'Income Tax', amount: 200 },
  // Railroad (5)
  { position: 5, type: 'railroad', name: 'Reading Railroad', price: 200, rent: [25, 50, 100, 200], housePrice: 100 },
  // Light Blue (6, 8, 9)
  { position: 6, type: 'property', name: 'Oriental Avenue', color: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], housePrice: 50 },
  { position: 7, type: 'chance', name: 'Chance' },
  { position: 8, type: 'property', name: 'Vermont Avenue', color: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], housePrice: 50 },
  { position: 9, type: 'property', name: 'Connecticut Avenue', color: 'lightblue', price: 120, rent: [8, 40, 100, 300, 450, 600], housePrice: 50 },
  // Jail (10)
  { position: 10, type: 'jail', name: 'Just Visiting / Jail' },
  // Pink (11, 13, 14)
  { position: 11, type: 'property', name: 'St. Charles Place', color: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], housePrice: 100 },
  { position: 12, type: 'utility', name: 'Electric Company', price: 150 },
  { position: 13, type: 'property', name: 'States Avenue', color: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], housePrice: 100 },
  { position: 14, type: 'property', name: 'Virginia Avenue', color: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], housePrice: 100 },
  // Railroad (15)
  { position: 15, type: 'railroad', name: 'Pennsylvania Railroad', price: 200, rent: [25, 50, 100, 200], housePrice: 100 },
  // Orange (16, 18, 19)
  { position: 16, type: 'property', name: 'St. James Place', color: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], housePrice: 100 },
  { position: 17, type: 'community_chest', name: 'Community Chest' },
  { position: 18, type: 'property', name: 'Tennessee Avenue', color: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], housePrice: 100 },
  { position: 19, type: 'property', name: 'New York Avenue', color: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], housePrice: 100 },
  // Free Parking (20)
  { position: 20, type: 'free_parking', name: 'Free Parking' },
  // Red (21, 23, 24)
  { position: 21, type: 'property', name: 'Kentucky Avenue', color: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], housePrice: 150 },
  { position: 22, type: 'chance', name: 'Chance' },
  { position: 23, type: 'property', name: 'Indiana Avenue', color: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], housePrice: 150 },
  { position: 24, type: 'property', name: 'Illinois Avenue', color: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], housePrice: 150 },
  // Railroad (25)
  { position: 25, type: 'railroad', name: 'B&O Railroad', price: 200, rent: [25, 50, 100, 200], housePrice: 100 },
  // Yellow (26, 27, 29)
  { position: 26, type: 'property', name: 'Atlantic Avenue', color: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], housePrice: 150 },
  { position: 27, type: 'property', name: 'Ventnor Avenue', color: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], housePrice: 150 },
  { position: 28, type: 'utility', name: 'Water Works', price: 150 },
  { position: 29, type: 'property', name: 'Marvin Gardens', color: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], housePrice: 150 },
  // Go To Jail (30)
  { position: 30, type: 'go_to_jail', name: 'Go To Jail' },
  // Green (31) - CHỈ LẤY ĐẾN 31
  { position: 31, type: 'property', name: 'Pacific Avenue', color: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], housePrice: 200 },
  // VỊ TRÍ 32-39 BỊ BỎ QUA HOẶC CẦN XÓA TỪ RAW DATA
];

// Lọc và ánh xạ chỉ 32 ô đầu tiên (0-31)
const squares = rawSquares
    .filter(sq => sq.position <= 31) // Đảm bảo chỉ lấy 32 ô
    .map(sq => {
        const newSq = {
            position: sq.position,
            name: sq.name,
            type: sq.type,
            price: sq.price || 0,
            amount: sq.amount,
            color: sq.color,
            housePrice: sq.housePrice // Giữ lại housePrice thô
        };

        if (sq.rent && sq.rent.length >= 5) {
            // Chuyển đổi mảng rent sang object
            newSq.rent = {
                base: sq.rent[0],
                house1: sq.rent[1],
                house2: sq.rent[2],
                house3: sq.rent[3],
                hotel: sq.rent[5] || sq.rent[4] 
            };
            // Định nghĩa buildCost dựa trên housePrice
            newSq.buildCost = {
                house: sq.housePrice || 0, 
                hotel: sq.housePrice || 0 
            };
        } else if (sq.rent && sq.rent.length > 0) {
            // Xử lý Railroad/Utility
            newSq.rent = { base: sq.rent[0] };
        }

        return newSq;
    });

const importData = async () => {
    try {
        await connectDb();
        // ✅ FIX LỖI E11000: Xóa tất cả dữ liệu cũ trước khi chèn
        await SquareTemplate.deleteMany({}); 
        await SquareTemplate.insertMany(squares);
        console.log('✅ Data imported successfully');
        
    }catch (error) {
        console.error('❌ Error importing data:', error);
        if (error.code === 11000) {
             console.error('⚠️ Duplicate key error (E11000). Check for duplicate "position" values in the seed data.');
        }
        process.exit(1);
    }
};

importData();