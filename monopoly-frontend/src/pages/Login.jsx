import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    setLoading(true);
    const result = await login({ email, password });
    setLoading(false);
    
    if (result.success) {
      navigate('/');
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
            <div className="w-20 h-20 bg-gradient-to-br from-neon-pink to-neon-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-neon animate-pulse-neon">
              <span className="text-4xl">🎲</span>
            </div>
            <h1 className="text-3xl font-game text-neon-yellow neon-text mb-2">
              CỜ TỈ PHÚ
            </h1>
            <p className="text-gray-400 text-sm">
              Đăng nhập để chơi
            </p>
          </motion.div>
        </div>
        
        {/* Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-graffiti-light rounded-2xl p-8 border-2 border-neon-blue shadow-neon"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-white text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-graffiti-dark border-2 border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none transition-colors"
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
                className="w-full px-4 py-3 bg-graffiti-dark border-2 border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none transition-colors"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            
            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-neon-pink to-neon-purple rounded-lg text-white font-bold text-lg hover:shadow-neon-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-neon"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          
          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-neon-blue hover:text-neon-green font-bold">
                Đăng ký ngay
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

export default Login;
