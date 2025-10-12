const mongooose = require('mongoose');
const dotenv = require('dotenv');
const Card = require('../models/card.model');

dotenv.config({ path: '../../.env' });
console.log(process.env.MONGODB_URI);

const connectDb = async ()=>{
    try{
        await mongooose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    }catch (error) {
        console.error('Error connecting to MongoDB:', error);
        // process.exit(1);
    }
};

const cardData = [
    {
        cardId: 0,
        name: 'Bảo vệ',
        type: 'event',
        effect: {
            type: 'protect',
            duration: 1 
        },
        gameId: null
    },
    {
        cardId: 1,
        name: 'Đi đến ô Start',
        type: 'event',
        effect: {
            type: 'moveTo',
            targetPosition: 0
        },
        gameId: null
    },
    {
        cardId: 3,
        name: 'Ra khỏi đảo',
        type: 'event',
        effect: {
            type: 'getOutOfJail'
        },
        gameId: null
    },
    {
        cardId: 4,
        name: 'Thẻ du lịch',
        type: 'event',
        effect: {
            type: 'travelToNearest',
            propertyType: 'airport' 
        },
        gameId: null
    },
    {
        cardId: 5,
        name: 'Tổ chức World Cup',
        type: 'event',
        effect: {
            type: 'receiveMoneyFromAll',
            amount: 50
        },
        gameId: null
    },
    {
        cardId: 6,
        name: 'Phá hoại',
        type: 'action',
        effect: {
            type: 'destroyHouse',
            targetPlayer: 'opponent' 
        },
        gameId: null
    },
    {
        cardId: 7,
        name: 'Phạt',
        type: 'action',
        effect: {
            type: 'payMoney',
            amount: 100
        },
        gameId: null
    },
    {
        cardId: 8,
        name: 'Cúp điện',
        type: 'action',
        effect: {
            type: 'cutPower',
            targetPlayer: 'opponent',
            duration: 3
        },
        gameId: null
    },
    {
        cardId: 9,
        name: 'Đánh dấu màu đen',
        type: 'event',
        effect: {
            type: 'markAsBlack'
        },
        gameId: null
    },
    {
        cardId: 10,
        name: 'Hòn đảo bị lãng quên',
        type: 'event',
        effect: {
            type: 'skipTurn',
            duration: 2
        },
        gameId: null
    },
    {
        cardId: 11,
        name: 'Động đất',
        type: 'action',
        effect: {
            type: 'earthquake',
            destroyChance: 0.5
        },
        gameId: null
    },
    {
        cardId: 12,
        name: 'Thẻ buộc bán nhà',
        type: 'event',
        effect: {
            type: 'forceSellProperty',
            propertyType: 'house'
        },
        gameId: null
    },
    {
        cardId: 13,
        name: 'Thẻ bán nhà',
        type: 'action',
        effect: {
            type: 'sellProperty',
            targetPlayer: 'opponent',
            minAmount: 50
        },
        gameId: null
    },
    {
        cardId: 14,
        name: 'Đi tới World Cup',
        type: 'event',
        effect: {
            type: 'teleport',
            targetProperty: 'worldcup'
        },
        gameId: null
    },
    {
        cardId: 15,
        name: 'Thẻ giảm giá',
        type: 'event',
        effect: {
            type: 'discount',
            discountPercentage: 0.5,
            duration: 1
        },
        gameId: null
    }
];

const importData = async ()=>{
    console.log(cardData);
    try{
        await connectDb();
        await Card.deleteMany();
        await Card.insertMany(cardData);
        console.log('Data imported successfully');
        // process.exit(0);
    }catch (error) {
        console.error('Error importing data:', error);
        // process.exit(1);
    }
};

importData();