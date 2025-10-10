const mongoose = require('mongoose');
const dotenv = require('dotenv');
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

const squares = [
  // GO
  {
    position: 0,
    type: 'go',
    name: 'GO',
    description: 'Collect $200',
  },
  
  // Brown properties
  {
    position: 1,
    type: 'property',
    name: 'Mediterranean Avenue',
    color: 'brown',
    price: 60,
    rent: [2, 10, 30, 90, 160, 250],
    housePrice: 50,
  },
  {
    position: 2,
    type: 'community_chest',
    name: 'Community Chest',
  },
  {
    position: 3,
    type: 'property',
    name: 'Baltic Avenue',
    color: 'brown',
    price: 60,
    rent: [4, 20, 60, 180, 320, 450],
    housePrice: 50,
  },
  
  // Tax
  {
    position: 4,
    type: 'tax',
    name: 'Income Tax',
    amount: 200,
  },
  
  // Railroad
  {
    position: 5,
    type: 'railroad',
    name: 'Reading Railroad',
    price: 200,
    rent: [25, 50, 100, 200],
  },
  
  // Light Blue properties
  {
    position: 6,
    type: 'property',
    name: 'Oriental Avenue',
    color: 'lightblue',
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    housePrice: 50,
  },
  {
    position: 7,
    type: 'chance',
    name: 'Chance',
  },
  {
    position: 8,
    type: 'property',
    name: 'Vermont Avenue',
    color: 'lightblue',
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    housePrice: 50,
  },
  {
    position: 9,
    type: 'property',
    name: 'Connecticut Avenue',
    color: 'lightblue',
    price: 120,
    rent: [8, 40, 100, 300, 450, 600],
    housePrice: 50,
  },
  
  // Jail
  {
    position: 10,
    type: 'jail',
    name: 'Just Visiting / Jail',
  },
  
  // Pink properties
  {
    position: 11,
    type: 'property',
    name: 'St. Charles Place',
    color: 'pink',
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    housePrice: 100,
  },
  {
    position: 12,
    type: 'utility',
    name: 'Electric Company',
    price: 150,
  },
  {
    position: 13,
    type: 'property',
    name: 'States Avenue',
    color: 'pink',
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    housePrice: 100,
  },
  {
    position: 14,
    type: 'property',
    name: 'Virginia Avenue',
    color: 'pink',
    price: 160,
    rent: [12, 60, 180, 500, 700, 900],
    housePrice: 100,
  },
  
  // Railroad
  {
    position: 15,
    type: 'railroad',
    name: 'Pennsylvania Railroad',
    price: 200,
    rent: [25, 50, 100, 200],
  },
  
  // Orange properties
  {
    position: 16,
    type: 'property',
    name: 'St. James Place',
    color: 'orange',
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    housePrice: 100,
  },
  {
    position: 17,
    type: 'community_chest',
    name: 'Community Chest',
  },
  {
    position: 18,
    type: 'property',
    name: 'Tennessee Avenue',
    color: 'orange',
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    housePrice: 100,
  },
  {
    position: 19,
    type: 'property',
    name: 'New York Avenue',
    color: 'orange',
    price: 200,
    rent: [16, 80, 220, 600, 800, 1000],
    housePrice: 100,
  },
  
  // Free Parking
  {
    position: 20,
    type: 'free_parking',
    name: 'Free Parking',
  },
  
  // Red properties
  {
    position: 21,
    type: 'property',
    name: 'Kentucky Avenue',
    color: 'red',
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    housePrice: 150,
  },
  {
    position: 22,
    type: 'chance',
    name: 'Chance',
  },
  {
    position: 23,
    type: 'property',
    name: 'Indiana Avenue',
    color: 'red',
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    housePrice: 150,
  },
  {
    position: 24,
    type: 'property',
    name: 'Illinois Avenue',
    color: 'red',
    price: 240,
    rent: [20, 100, 300, 750, 925, 1100],
    housePrice: 150,
  },
  
  // Railroad
  {
    position: 25,
    type: 'railroad',
    name: 'B&O Railroad',
    price: 200,
    rent: [25, 50, 100, 200],
  },
  
  // Yellow properties
  {
    position: 26,
    type: 'property',
    name: 'Atlantic Avenue',
    color: 'yellow',
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    housePrice: 150,
  },
  {
    position: 27,
    type: 'property',
    name: 'Ventnor Avenue',
    color: 'yellow',
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    housePrice: 150,
  },
  {
    position: 28,
    type: 'utility',
    name: 'Water Works',
    price: 150,
  },
  {
    position: 29,
    type: 'property',
    name: 'Marvin Gardens',
    color: 'yellow',
    price: 280,
    rent: [24, 120, 360, 850, 1025, 1200],
    housePrice: 150,
  },
  
  // Go To Jail
  {
    position: 30,
    type: 'go_to_jail',
    name: 'Go To Jail',
  },
  
  // Green properties
  {
    position: 31,
    type: 'property',
    name: 'Pacific Avenue',
    color: 'green',
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    housePrice: 200,
  },
  {
    position: 32,
    type: 'property',
    name: 'North Carolina Avenue',
    color: 'green',
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    housePrice: 200,
  },
  {
    position: 33,
    type: 'community_chest',
    name: 'Community Chest',
  },
  {
    position: 34,
    type: 'property',
    name: 'Pennsylvania Avenue',
    color: 'green',
    price: 320,
    rent: [28, 150, 450, 1000, 1200, 1400],
    housePrice: 200,
  },
  
  // Railroad
  {
    position: 35,
    type: 'railroad',
    name: 'Short Line',
    price: 200,
    rent: [25, 50, 100, 200],
  },
  
  // Chance
  {
    position: 36,
    type: 'chance',
    name: 'Chance',
  },
  
  // Dark Blue properties
  {
    position: 37,
    type: 'property',
    name: 'Park Place',
    color: 'darkblue',
    price: 350,
    rent: [35, 175, 500, 1100, 1300, 1500],
    housePrice: 200,
  },
  
  // Luxury Tax
  {
    position: 38,
    type: 'tax',
    name: 'Luxury Tax',
    amount: 100,
  },
  
  // Boardwalk
  {
    position: 39,
    type: 'property',
    name: 'Boardwalk',
    color: 'darkblue',
    price: 400,
    rent: [50, 200, 600, 1400, 1700, 2000],
    housePrice: 200,
  },
];

module.exports = { squares };


const importData = async () => {
    try {
        await connectDb();
        await SquareTemplate.deleteMany();
        await SquareTemplate.insertMany(squares);
        console.log('Data imported successfully');
        // process.exit();
    }catch (error) {
        console.error('Error importing data:', error);
        // process.exit(1);
    }
};

importData();