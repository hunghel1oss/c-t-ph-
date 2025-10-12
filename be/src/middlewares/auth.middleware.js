const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Middleware bảo vệ route - yêu cầu có token hợp lệ
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Lấy token từ header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Nếu không có token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có token, truy cập bị từ chối',
      });
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user từ id trong token
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    // Gắn user vào request để route sau dùng
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);

    let message = 'Không được phép, token không hợp lệ';
    if (error.name === 'TokenExpiredError') {
      message = 'Token đã hết hạn';
    }

    res.status(401).json({
      success: false,
      message,
    });
  }
};

module.exports = { protect };
