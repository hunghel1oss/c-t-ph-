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
        process.exit(1);
    }
};

const squares = [
    {
        position: 0,
        name: 'Go',
        type: 'start',
        price: 0,
        rent: {
            base: 0,
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        },
        buildCost: {
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        }
    },
    {
        position: 1,
        name: 'GRANIND',
        type: 'property',
        price: 50,
        rent: {
            base: 2,
            house1: 18,
            house2: 38,
            house3: 58,
            hotel: 100,
        },
        buildCost: {
            house1: 50,
            house2: 100,
            house3: 150,
            hotel: 300,
        }
    },
    {
        position: 2,
        name: 'SEVILLA',
        type: 'property',
        price: 60,
        rent: {
            base: 8,
            house1: 36,
            house2: 56,
            house3: 86,
            hotel: 150,
        },
        buildCost: {
            house1: 100,
            house2: 180,
            house3: 250,
            hotel: 450,
        }
    },
    {
        position: 3,
        name: 'MADRID',
        type: 'property',
        price: 80,
        rent: {
            base: 14,
            house1: 60,
            house2: 100,
            house3: 150,
            hotel: 200,
        },
        buildCost: {
            house1: 150,
            house2: 250,
            house3: 350,
            hotel: 500,
        }
    },
    {
        position: 4,
        name: 'BALI',
        type: 'railroad',
        price:200, 
        rent: {
            base: 50,
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        },
        buildCost: {
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        }
    },
    {
        position: 5,
        name: 'HONG KONG',
        type: 'property',
        price: 100,
        rent: {
            base: 30,
            house1: 80,
            house2: 120,
            house3: 160,
            hotel: 220,
        },
        buildCost: {
            house1: 250,
            house2: 350,
            house3: 400,
            hotel: 550,
        }
    },
    {
        position: 6,
        name: 'THUONG HAI',
        type: 'property',
        price: 120,
        rent: {
            base: 40,
            house1: 100,
            house2: 140,
            house3: 180,
            hotel: 260,
        },
        buildCost: {
            house1: 270,
            house2: 370,
            house3: 470,
            hotel: 600,
        }
    },
    {
        position: 7,
        name: 'SHANGHAI',
        type: 'property',
        price: 140,
        rent: {
            base: 50,
            house1: 120,
            house2: 160,
            house3: 200,
            hotel: 280,
        },
        buildCost: {
            house1: 290,
            house2: 390,
            house3: 490,
            hotel: 650,
        }
    },
    {
        position: 8,
        name: 'PRISON',
        type: 'jail',
        price: 0,
        rent: {
            base: 0,
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        },
        buildCost: {
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        }
    },
    {
        position: 9,
        name: 'VENEDICK',
        type: 'property',
        price: 160,
        rent: {
            base: 60,
            house1: 140,
            house2: 180,
            house3: 220,
            hotel: 300,
        },
        buildCost: {
            house1: 310,
            house2: 420,
            house3: 450,
            hotel: 700,
        }
    },
    {
        position: 10,
        name: 'MILAN',
        type: 'property',
        price: 180,
        rent: {
            base: 70,
            house1: 160,
            house2: 200,
            house3: 340,
            hotel: 420,
        },
        buildCost: {
            house1: 350,
            house2: 450,
            house3: 480,
            hotel: 750,
        }
    },
    {
        position: 11,
        name: 'ROMA',
        type: 'property',
        price: 200,
        rent: {
            base: 80,
            house1: 180,
            house2: 220,
            house3: 360,
            hotel: 440,
        },
        buildCost: {
            house1: 380,
            house2: 480,
            house3: 520,
            hotel: 800,
        }
    },
    {
        position: 12,
        name: 'CHANCE',
        type: 'chance',
        price: 0,
        rent: {
            base: 0,
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        },
        buildCost: {
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        }
    },
    {
        position: 13,
        name: 'HAMBURG',
        type: 'property',
        price: 220,
        rent: {
            base: 90,
            house1: 200,
            house2: 240,
            house3: 380,
            hotel: 560,
        },
        buildCost: {
            house1: 400,
            house2: 500,
            house3: 550,
            hotel: 850,
        }
    },
    {
        position: 14,
        name: 'HA LONG BAY',
        type: 'railroad',
        price:200, 
        rent: {
            base: 50,
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        },
        buildCost: {
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        }

    },
    {
        position: 15,
        name: 'BERLIN',
        type: 'property',
        price: 240,
        rent: {
            base: 100,
            house1: 220,
            house2: 260,
            house3: 400,
            hotel: 600,
        },
        buildCost: {
            house1: 450,
            house2: 550,
            house3: 600,
            hotel: 900,
        }
    },
    {
        position: 16,
        name: 'FESTVALE',
        type: 'festival',
        price: 0,
        rent: {
            base: 0,
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        },
        buildCost: {
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        }
    },
    {
        position: 17,
        name: 'LONDON',
        type: 'property',
        price: 260,
        rent: {
            base: 110,
            house1: 240,
            house2: 280,
            house3: 420,
            hotel: 620,
        },
        buildCost: {
            house1: 500,
            house2: 600,
            house3: 650,
            hotel: 950,
        }
    },
        {
        position: 18,
        name: 'DUBAI',
        type: 'railroad',
        price:200, 
        rent: {
            base: 50,
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        },
        buildCost: {
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        }
    },
    {
        position: 19,
        name: 'SIDNEY',
        type: 'property',
        price: 280,
        rent: {
            base: 130,
            house1: 260,
            house2: 300,
            house3: 440,
            hotel: 640,
        },
        buildCost: {
            house1: 550,
            house2: 650,
            house3: 700,
            hotel: 1000,
        }
    },
    {
        position: 20,
        name: 'CHANCE',
        type: 'chance',
        price: 0,
        rent: {
            base: 0,
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        },
        buildCost: {
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        }
    },
    {
        position: 21,
        name: 'CHICAGO',
        type: 'property',
        price: 300,
        rent: {
            base: 140,
            house1: 280,
            house2: 320,
            house3: 460,
            hotel: 660,
        },
        buildCost: {
            house1: 600,
            house2: 700,
            house3: 750,
            hotel: 1050,
        }
    },
    {
        position: 22,
        name: 'LAS VEGAS',
        type: 'property',
        price: 320,
        rent: {
            base: 150,
            house1: 300,
            house2: 340,
            house3: 480,
            hotel: 680,
        },
        buildCost: {
            house1: 700,
            house2: 800,
            house3: 850,
            hotel: 1150,
        }
    },
    {
        position: 23,
        name: 'NEW YORK',
        type: 'property',
        price: 340,
        rent: {
            base: 160,
            house1: 350,
            house2: 400,
            house3: 540,
            hotel: 740,
        },
        buildCost: {
            house1: 750,
            house2: 850,
            house3: 900,
            hotel: 1200,
        }
    },
    {
        position: 24,
        name: 'GO TO PLANE',
        type: 'plane',
        price: 0,
        rent: {
            base: 0,
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        },
        buildCost: {
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        }
    },
    {
        position: 25,
        name: 'NICE',
        type: 'railroad',
        price:200, 
        rent: {
            base: 50,
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        },
        buildCost: {
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        }
    },
    {
        position: 26,
        name: 'LYON',
        type: 'property',
        price: 350,
        rent: {
            base: 180,
            house1: 400,
            house2: 500,
            house3: 600,
            hotel: 800,
        },
        buildCost: {
            house1: 800,
            house2: 900,
            house3: 950,
            hotel: 1250,
        }
    },
    {
        position: 27,
        name: 'PARIS',
        type: 'property',
        price: 400,
        rent: {
            base: 200,
            house1: 450,
            house2: 550,
            house3: 650,
            hotel: 850,
        },
        buildCost: {
            house1: 850,
            house2: 950,
            house3: 1000,
            hotel: 1300,
        }
    },
    {
        position: 28,
        name: 'CHANCE',
        type: 'chance',
        price: 0,
        rent: {
            base: 0,
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        },
        buildCost: {
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        }
    },
    {
        position: 29,
        name: 'OSAKA',
        type: 'property',
        price: 450,
        rent: {
            base: 220,
            house1: 500,
            house2: 600,
            house3: 700,
            hotel: 900,
        },
        buildCost: {
            house1: 1000,
            house2: 1100,
            house3: 1200,
            hotel: 1500,
        }
    },
    {
        position: 30,
        name: 'VERGE',
        type: 'tax',
        price: 0,
        rent: {
            base: 0,
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        },
        buildCost: {
            house1: 0,
            house2: 0,
            house3: 0,
            hotel: 0,
        }
    },
    {
        position: 31,
        name: 'TOKYO',
        type: 'property',
        price: 500,
        rent: {
            base: 240,
            house1: 600,
            house2: 700,
            house3: 800,
            hotel: 1000,
        },
        buildCost: {
            house1: 1100,
            house2: 1200,
            house3: 1300,
            hotel: 1600,
        }
    }
];

const importData = async () => {
    try {
        await connectDb();
        await SquareTemplate.deleteMany();
        await SquareTemplate.insertMany(squares);
        console.log('Data imported successfully');
        process.exit();
    }catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
};

importData();