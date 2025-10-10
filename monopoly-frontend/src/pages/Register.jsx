import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    setLoading(true);
    const result = await register({ name, email, password });
    setLoading(false);
    
    if (result.success) {
      navigate('/login');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-graffiti-darker via-graffiti-dark to-graffiti-light">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-block"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-neon-green to-neon-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-neon animate-pulse-neon">
              <span className="text-4xl">🎲</span>
            </div>
            <h1 className="text-3xl font-game text-neon-yellow neon-text mb-2">
              CỜ TỈ PHÚ
            </h1>
            <p className="text-gray-400 text-sm">
              Tạo tài khoản mới
            </p>
          </motion.div>
        </div>
        
        {/* Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-graffiti-light rounded-2xl p-8 border-2 border-neon-green shadow-neon"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-white text-sm font-bold mb-2">
                Tên hiển thị
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-graffiti-dark border-2 border-gray-600 rounded-lg text-white focus:border-neon-green focus:outline-none transition-colors"
                placeholder="Tên của bạn"
                disabled={loading}
              />
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-white text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-graffiti-dark border-2 border-gray-600 rounded-lg text-white focus:border-neon-green focus:outline-none transition-colors"
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-white text-sm font-bold mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-graffiti-dark border-2 border-gray-600 rounded-lg text-white focus:border-neon-green focus:outline-none transition-colors"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            
            {/* Confirm Password */}
            <div>
              <label className="block text-white text-sm font-bold mb-2">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-graffiti-dark border-2 border-gray-600 rounded-lg text-white focus:border-neon-green focus:outline-none transition-colors"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            
            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-neon-green to-green-600 rounded-lg text-white font-bold text-lg hover:shadow-neon-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-neon"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>
          
          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-neon-blue hover:text-neon-green font-bold">
                Đăng nhập
              </Link>
            </p>
          </div>
        </motion.div>
        
        {/* Decorative elements */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            🎮 Powered by React + Socket.IO + Three.js
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
