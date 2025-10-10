const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SquareState = require('../models/squareState.model');
const SquareTemplate = require('../models/SquareTemplate.model');

dotenv.config({ path: '../../.env' });
console.log(process.env.MONGODB_URI);
const connectDb = async ()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        // process.exit(1);
    }
};

const createInitialGameData = async ()  => {
    try{
        await connectDb();
        const SquareTemplates = await SquareTemplate.find({});
        const gameSquares = SquareTemplates.map(template => ({
            squareId: template._id,
            owen: null,
            lever: 0,
            isMortgage: false,
        }));
        await SquareState.deleteMany();
        await SquareState.insertMany(gameSquares);
        console.log('Data imported successfully');
        // process.exit(0);
    }catch (error) {
        console.error('Error importing data:', error);
        // process.exit(1);
    }
};

createInitialGameData();