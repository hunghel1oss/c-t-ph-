import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGameSocket } from '../hooks/useGameSocket';
import { gameAPI } from '../api/game.api';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import { PET_TYPES, DURATION_OPTIONS } from '../config/constants';

const Home = () => {
  const { user, handleAuthError } = useAuth(); // ← THÊM handleAuthError
  const { connect, connected } = useGameSocket();
  const navigate = useNavigate();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(20);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Connect WebSocket
  useEffect(() => {
    if (user && !connected) {
      connect();
    }
  }, [user, connected, connect]);
  
  // ✅ TẠO PHÒNG
  const handleCreateRoom = async () => {
    console.log('🎮 [Home] Create room clicked');
    console.log('🎮 [Home] User:', user);
    console.log('🎮 [Home] Duration:', selectedDuration);
    
    if (!user) {
      toast.error('Chưa đăng nhập');
      navigate('/login');
      return;
    }
    
    // ✅ KIỂM TRA TOKEN TRƯỚC KHI GỌI API
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    console.log('🔑 [Home] Token exists:', !!token);
    console.log('🔑 [Home] Token (first 20 chars):', token?.substring(0, 20) + '...');
    
    if (!token) {
      console.error('❌ [Home] No token found, redirecting to login');
      toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
      handleAuthError();
      return;
    }
    
    setLoading(true);
    setShowCreateModal(false);
    
    try {
      console.log('📡 [Home] Calling gameAPI.createRoom...');
      
      const response = await gameAPI.createRoom({ 
        duration: selectedDuration 
      });
      
      console.log('✅ [Home] Room created:', response);
      
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
      console.error('❌ [Home] Create room error:', error);
      console.error('❌ [Home] Error message:', error.message);
      console.error('❌ [Home] Error response:', error.response?.data);
      
      // ✅ XỬ LÝ LỖI 401
      if (error.message === 'AUTHENTICATION_REQUIRED' || error.response?.status === 401) {
        console.error('❌ [Home] Authentication error, logging out');
        handleAuthError();
      } else {
        toast.error(error.response?.data?.message || 'Không thể tạo phòng');
      }
      
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ VÀO PHÒNG
  const handleJoinRoom = async () => {
    console.log('🚪 [Home] Join room clicked');
    console.log('🚪 [Home] Room code:', roomCode);
    console.log('🚪 [Home] User:', user);
    
    if (!user) {
      toast.error('Chưa đăng nhập');
      navigate('/login');
      return;
    }
    
    if (!roomCode || roomCode.length !== 6) {
      toast.error('Mã phòng không hợp lệ');
      return;
    }
    
    // ✅ KIỂM TRA TOKEN
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    console.log('🔑 [Home] Token exists:', !!token);
    
    if (!token) {
      console.error('❌ [Home] No token found, redirecting to login');
      toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
      handleAuthError();
      return;
    }
    
    setLoading(true);
    setShowJoinModal(false);
    
    try {
      console.log('📡 [Home] Calling gameAPI.joinRoom...');
      
      const response = await gameAPI.joinRoom({ 
        roomCode: roomCode.toUpperCase() 
      });
      
      console.log('✅ [Home] Room joined:', response);
      
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
      console.error('❌ [Home] Join room error:', error);
      
      // ✅ XỬ LÝ LỖI 401
      if (error.message === 'AUTHENTICATION_REQUIRED' || error.response?.status === 401) {
        console.error('❌ [Home] Authentication error, logging out');
        handleAuthError();
      } else {
        toast.error(error.response?.data?.message || 'Không thể vào phòng');
      }
      
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-graffiti-darker via-graffiti-dark to-graffiti-light">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero section */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-game text-neon-yellow neon-text mb-4 animate-pulse-neon">
            CỜ TỈ PHÚ
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            Trò chơi Monopoly phong cách Graffiti
          </p>
          <p className="text-neon-blue text-sm">
            {connected ? '🟢 Đã kết nối Socket' : '🔴 Đang kết nối Socket...'}
          </p>
          {user && (
            <p className="text-neon-green text-xs mt-1">
              👤 {user.username || user.email}
            </p>
          )}
        </motion.div>
        
        {/* Main actions */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          {/* Create Room */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-graffiti-light rounded-2xl p-8 border-4 border-neon-pink shadow-neon hover:shadow-neon-strong transition-all cursor-pointer"
            onClick={() => setShowCreateModal(true)}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-neon-pink to-neon-purple rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <span className="text-4xl">🎮</span>
              </div>
              <h2 className="text-2xl font-bold text-neon-pink mb-2">
                Tạo phòng
              </h2>
              <p className="text-gray-400 text-sm">
                Tạo phòng mới và mời bạn bè tham gia
              </p>
            </div>
          </motion.div>
          
          {/* Join Room */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-graffiti-light rounded-2xl p-8 border-4 border-neon-blue shadow-neon hover:shadow-neon-strong transition-all cursor-pointer"
            onClick={() => setShowJoinModal(true)}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-neon-blue to-neon-green rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <span className="text-4xl">🚪</span>
              </div>
              <h2 className="text-2xl font-bold text-neon-blue mb-2">
                Vào phòng
              </h2>
              <p className="text-gray-400 text-sm">
                Nhập mã phòng để tham gia trận đấu
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* Features */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6"
        >
          <div className="bg-graffiti-light rounded-lg p-6 border-2 border-gray-600">
            <div className="text-center">
              <span className="text-3xl mb-2 block">🎲</span>
              <h3 className="text-neon-yellow font-bold mb-2">Xúc xắc 3D</h3>
              <p className="text-gray-400 text-sm">
                Hiệu ứng xúc xắc 3D sống động
              </p>
            </div>
          </div>
          
          <div className="bg-graffiti-light rounded-lg p-6 border-2 border-gray-600">
            <div className="text-center">
              <span className="text-3xl mb-2 block">🦁</span>
              <h3 className="text-neon-green font-bold mb-2">Linh vật 3D</h3>
              <p className="text-gray-400 text-sm">
                4 linh vật độc đáo: Sư tử, Rồng, Kỳ lân, Phượng hoàng
              </p>
            </div>
          </div>
          
          <div className="bg-graffiti-light rounded-lg p-6 border-2 border-gray-600">
            <div className="text-center">
              <span className="text-3xl mb-2 block">⚡</span>
              <h3 className="text-neon-pink font-bold mb-2">Realtime</h3>
              <p className="text-gray-400 text-sm">
                Chơi realtime với Socket.IO
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Create Room Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-graffiti-dark rounded-2xl p-8 max-w-md w-full mx-4 border-4 border-neon-pink shadow-neon-strong"
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
                        : 'bg-graffiti-light text-gray-400 hover:text-white'
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
      
      {/* Join Room Modal */}
      {showJoinModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setShowJoinModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-graffiti-dark rounded-2xl p-8 max-w-md w-full mx-4 border-4 border-neon-blue shadow-neon-strong"
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
                className="w-full px-4 py-3 bg-graffiti-light border-2 border-gray-600 rounded-lg text-white text-center text-2xl font-bold focus:border-neon-blue focus:outline-none transition-colors uppercase"
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

                
