import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGameSocket } from '../hooks/useGameSocket';
import { gameAPI } from '../api/game.api';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import { DURATION_OPTIONS } from '../config/constants';
// ✅ IMPORT GALAXY BACKGROUND VÀO TRANG HOME
import GalaxyBackground from '../components/GalaxyBackground'; 

const Home = () => {
  // Destructure logout từ useAuth
  const { user, handleAuthError, logout } = useAuth(); 
  const { connect, connected } = useGameSocket();
  const navigate = useNavigate();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(20);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Ref cho Logo (GSAP/Motion Target)
  const logoRef = useRef(null); 
  
  // Connect WebSocket
  useEffect(() => {
    if (user && !connected) {
      connect();
    }
  }, [user, connected, connect]);

  // Wrapper xử lý lỗi Authentication
  const handleAuthErrorWrapper = () => {
      if (handleAuthError) {
        handleAuthError();
      } else {
        logout();
        navigate('/login');
      }
  };

  // ✅ TẠO PHÒNG
  const handleCreateRoom = async () => {
    
    if (!user) {
      toast.error('Chưa đăng nhập');
      navigate('/login');
      return;
    }
    
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    if (!token) {
      toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
      handleAuthErrorWrapper();
      return;
    }
    
    setLoading(true);
    setShowCreateModal(false);
    
    try {
      const response = await gameAPI.createRoom({ 
        duration: selectedDuration 
      });
      
      if (response.success) {
        toast.success(`Phòng ${response.roomCode} đã được tạo!`);
        
        // Lưu thông tin phòng
        localStorage.setItem('currentRoom', JSON.stringify({
          roomCode: response.roomCode,
          gameId: response.gameId,
          playerStateId: response.playerStateId,
        }));
        
        // Navigate to lobby
        navigate(`/lobby/${response.roomCode}`,{
          state: {
            gameId: response.gameId,
            roomCode: response.roomCode,
            playerStateId: response.playerStateId
          }
        });
      }
      
    } catch (error) {
      if (error.response?.status === 401 || error.message === 'AUTHENTICATION_REQUIRED') {
        handleAuthErrorWrapper();
      } else {
        toast.error(error.response?.data?.message || 'Không thể tạo phòng');
      }
      
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ VÀO PHÒNG
  const handleJoinRoom = async () => {
    
    if (!user) {
      toast.error('Chưa đăng nhập');
      navigate('/login');
      return;
    }
    
    if (!roomCode || roomCode.length !== 6) {
      toast.error('Mã phòng không hợp lệ');
      return;
    }
    
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    if (!token) {
      toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
      handleAuthErrorWrapper();
      return;
    }
    
    setLoading(true);
    setShowJoinModal(false);
    
    try {
      const response = await gameAPI.joinRoom({ 
        roomCode: roomCode.toUpperCase() 
      });
      
      if (response.success) {
        toast.success(`Đã vào phòng ${response.roomCode}!`);
        
        // Lưu thông tin phòng
        localStorage.setItem('currentRoom', JSON.stringify({
          roomCode: response.roomCode,
          gameId: response.gameId,
          playerStateId: response.playerStateId,
        }));
        
        // Navigate to lobby
        navigate(`/lobby/${response.roomCode}`,{
          state: {
            gameId: response.gameId,
            roomCode: response.roomCode,
            playerStateId: response.playerStateId
          }
        });
      }
      
    } catch (error) {
      if (error.response?.status === 401 || error.message === 'AUTHENTICATION_REQUIRED') {
        handleAuthErrorWrapper();
      } else {
        toast.error(error.response?.data?.message || 'Không thể vào phòng');
      }
      
    } finally {
      setLoading(false);
    }
  };
  
  return (
    // ✅ LỚP NỀN: Trong suốt, để GalaxyBackground là nền
    <div className="min-h-screen relative bg-transparent"> 
      
      {/* 1. COMPONENT 3D GALAXY (Nền) */}
      <GalaxyBackground /> 
      
      {/* 2. LỚP PHỦ UI KÍNH MỜ (FROSTED GLASS EFFECT) */}
      <div className="relative z-10 min-h-screen">
          
          {/* ✅ THANH HEADER KÍNH MỜ (Frosted Header) */}
          <div className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/5 border-b border-white/10 shadow-xl shadow-black/50">
             {/* Truyền ref cho Header để nó có thể áp dụng cho Logo */}
             <Header logoRef={logoRef} /> 
          </div>
          
          <div className="container mx-auto px-4 py-12 pt-32"> {/* Tăng padding top để tránh header */}
              {/* Hero section */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-16"
              >
                {/* ✅ TIÊU ĐỀ LOGO HUNG HUAN SIÊU ĐẸP */}
                <h1 
                    ref={logoRef} // Gắn ref cho hiệu ứng
                    // Sử dụng lớp CSS tùy chỉnh cho hiệu ứng chuyển màu
                    className="text-8xl md:text-9xl tracking-widest mb-4 logo-galaxy-animated"
                    style={{ fontFamily: 'var(--font-game, fantasy)' }}
                >
                    HUNG HUAN
                </h1>
                <p className="text-white/80 text-xl font-light mb-4">
                    Trải nghiệm đa chiều trong không gian Cờ Tỷ Phú
                </p>
                <div className="inline-flex items-center space-x-4">
                    <p className="text-neon-green text-sm">
                        {connected ? '🟢 Đã kết nối Socket' : '🔴 Đang kết nối Socket...'}
                    </p>
                    {user && (
                        <p className="text-white/70 text-sm bg-white/10 px-3 py-1 rounded-full">
                            {/* ✅ FIX: Dùng user.name (Đã sửa) */}
                            👤 {user.name || user.email}
                        </p>
                    )}
                </div>
              </motion.div>
              
              {/* Main actions - Nút Tạo Phòng / Vào Phòng */}
              <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 mb-16">
                  
                  {/* ✅ TẠO PHÒNG (GLASS CARD PINK) */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255, 16, 240, 0.7)' }}
                    transition={{ type: 'spring', stiffness: 150, delay: 0.2 }}
                    className="glass-card-border-pink p-10 rounded-2xl cursor-pointer relative overflow-hidden"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <div className="text-center relative z-10">
                      <span className="text-7xl block mb-4 animate-pulse">🌌</span>
                      <h2 className="text-3xl font-bold text-neon-pink mb-2 uppercase tracking-wider">
                        Tạo Phòng Mới
                      </h2>
                      <p className="text-white/70 text-base font-light">
                        Khởi tạo thế giới của riêng bạn trong ngân hà.
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* ✅ VÀO PHÒNG (GLASS CARD BLUE) */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 240, 255, 0.7)' }}
                    transition={{ type: 'spring', stiffness: 150, delay: 0.3 }}
                    className="glass-card-border-blue p-10 rounded-2xl cursor-pointer relative overflow-hidden"
                    onClick={() => setShowJoinModal(true)}
                  >
                    <div className="text-center relative z-10">
                      <span className="text-7xl block mb-4 animate-float">🪐</span>
                      <h2 className="text-3xl font-bold text-neon-blue mb-2 uppercase tracking-wider">
                        Vào Phòng
                      </h2>
                      <p className="text-white/70 text-base font-light">
                        Tham gia vào cuộc phiêu lưu đã có sẵn.
                      </p>
                    </div>
                  </motion.div>
              </div>
              
              {/* Features - Cải tiến styling */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6"
              >
                <motion.div 
                    whileHover={{ translateY: -5, scale: 1.02 }}
                    className="bg-white/5 rounded-xl p-8 border border-gray-700 backdrop-blur-sm shadow-xl"
                >
                  <div className="text-center">
                    <span className="text-4xl mb-3 block text-neon-yellow">🎲</span>
                    <h3 className="text-neon-yellow font-bold mb-2">Xúc xắc 3D</h3>
                    <p className="text-gray-400 text-sm">
                      Hiệu ứng xúc xắc 3D sống động
                    </p>
                  </div>
                </motion.div>
                
                <motion.div
                    whileHover={{ translateY: -5, scale: 1.02 }}
                    className="bg-white/5 rounded-xl p-8 border border-gray-700 backdrop-blur-sm shadow-xl"
                >
                  <div className="text-center">
                    <span className="text-4xl mb-3 block text-neon-green">🦁</span>
                    <h3 className="text-neon-green font-bold mb-2">Linh vật 3D</h3>
                    <p className="text-gray-400 text-sm">
                      4 linh vật độc đáo
                    </p>
                  </div>
                </motion.div>
                
                <motion.div
                    whileHover={{ translateY: -5, scale: 1.02 }}
                    className="bg-white/5 rounded-xl p-8 border border-gray-700 backdrop-blur-sm shadow-xl"
                >
                  <div className="text-center">
                    <span className="text-4xl mb-3 block text-neon-pink">⚡</span>
                    <h3 className="text-neon-pink font-bold mb-2">Realtime</h3>
                    <p className="text-gray-400 text-sm">
                      Chơi realtime với Socket.IO
                    </p>
                  </div>
                </motion.div>
              </motion.div>
          </div>
      </div>
      
      {/* Create Room Modal (Giữ nguyên logic/styling cơ bản) */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border-4 border-neon-pink shadow-neon-strong"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-neon-pink mb-6">Tạo phòng mới</h2>
            
            <div className="mb-6">
              <label className="block text-white text-sm font-bold mb-3">
                Thời gian trận đấu
              </label>
              <div className="space-y-3">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDuration(option.value)}
                    className={`w-full py-3 px-4 rounded-lg font-bold transition-all ${
                      selectedDuration === option.value
                        ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-neon'
                        : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    ⏱️ {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-neon-pink to-neon-purple rounded-lg text-white font-bold hover:shadow-neon-strong transition-all disabled:opacity-50"
              >
                {loading ? 'Đang tạo...' : 'Tạo phòng'}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 px-6 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-bold transition-colors"
              >
                Hủy
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Join Room Modal (Giữ nguyên logic/styling cơ bản) */}
      {showJoinModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
          onClick={() => setShowJoinModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border-4 border-neon-blue shadow-neon-strong"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-neon-blue mb-6">Vào phòng</h2>
            
            <div className="mb-6">
              <label className="block text-white text-sm font-bold mb-3">
                Mã phòng (6 ký tự)
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-3 bg-white/10 border-2 border-gray-600 rounded-lg text-white text-center text-2xl font-bold focus:border-neon-blue focus:outline-none transition-colors uppercase"
                placeholder="ABC123"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleJoinRoom}
                disabled={loading || roomCode.length !== 6}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-neon-blue to-neon-green rounded-lg text-white font-bold hover:shadow-neon-strong transition-all disabled:opacity-50"
              >
                {loading ? 'Đang vào...' : 'Vào phòng'}
              </button>
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 px-6 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-bold transition-colors"
              >
                Hủy
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Home;