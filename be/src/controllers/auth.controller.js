
const User = require('../models/user.model');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const payload = {
            id: user.id
        };

        const AccessToken = jwt.sign(
            payload,
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        const RefreshToken = jwt.sign(
            payload,
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );
        user.refreshToken = RefreshToken;
        await user.save();

        res.json({ AccessToken, RefreshToken });
    }catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const logout = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.refreshToken = null;
        await user.save();
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = { register , login , logout};