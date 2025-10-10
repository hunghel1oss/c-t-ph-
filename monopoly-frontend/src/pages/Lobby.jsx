import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGameSocket } from '../hooks/useGameSocket';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import { PET_TYPES, PET_COLORS, GAME_SETTINGS } from '../config/constants';

const Lobby = () => {
  const { roomCode } = useParams();
  const { user } = useAuth();
  const { 
    connected, 
    gameState, 
    setGameState,
    startGame, 
    leaveRoom,
    onRoomUpdate, 
    onGameStarted,
    onError 
  } = useGameSocket();
  const navigate = useNavigate();
  
  const [selectedPet, setSelectedPet] = useState('lion');
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  
  // Listen to room updates
  useEffect(() => {
    const unsubscribeUpdate = onRoomUpdate((data) => {
      console.log('Room update:', data);
      setRoomInfo(data.room);
      setPlayers(data.room.players || []);
      setIsHost(data.room.hostId === user?.id);
    });
    
    const unsubscribeStarted = onGameStarted((data) => {
      console.log('Game started:', data);
      toast.success('Trận đấu bắt đầu!');
      setGameState(data.gameState);
      navigate(`/game/${roomCode}`);
    });
    
    const unsubscribeError = onError((error) => {
      console.error('Lobby error:', error);
      toast.error(error.message || 'Có lỗi xảy ra');
    });
    
    return () => {
      unsubscribeUpdate();
      unsubscribeStarted();
      unsubscribeError();
    };
  }, [onRoomUpdate, onGameStarted, onError, user, roomCode, navigate, setGameState]);
  
  const handleStartGame = () => {
    if (!isHost) {
      toast.error('Chỉ chủ phòng mới có thể bắt đầu');
      return;
    }
    
    if (players.length < GAME_SETTINGS.MIN_PLAYERS) {
      toast.error(`Cần ít nhất ${GAME_SETTINGS.MIN_PLAYERS} người chơi`);
      return;
    }
    
    startGame(roomCode);
  };
  
  const handleLeaveRoom = () => {
    leaveRoom(roomCode, user.id);
    navigate('/');
  };
  
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Đã copy mã phòng!');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-graffiti-darker via-graffiti-dark to-graffiti-light">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Room info */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="bg-graffiti-light rounded-2xl p-6 border-4 border-neon-yellow shadow-neon">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-game text-neon-yellow neon-text mb-2">
                  Phòng chờ
                </h1>
                <p className="text-gray-400 text-sm">
                  {connected ? '🟢 Đã kết nối' : '🔴 Mất kết nối'}
                </p>
              </div>
              
              <div className="text-right">
                <button
                  onClick={copyRoomCode}
                  className="px-6 py-3 bg-gradient-to-r from-neon-pink to-neon-purple rounded-lg text-white font-bold hover:shadow-neon transition-all mb-2"
                >
                  📋 {roomCode}
                </button>
                <p className="text-gray-400 text-xs">
                  Click để copy mã phòng
                </p>
              </div>
            </div>
            
            {roomInfo && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-600">
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Chủ phòng</p>
                  <p className="text-neon-pink font-bold">
                    {players.find(p => p.id === roomInfo.hostId)?.name || 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Thời gian</p>
                  <p className="text-neon-blue font-bold">
                    ⏱️ {roomInfo.duration} phút
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs mb-1">Người chơi</p>
                  <p className="text-neon-green font-bold">
                    👥 {players.length}/{GAME_SETTINGS.MAX_PLAYERS}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Pet selection */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="bg-graffiti-light rounded-2xl p-6 border-2 border-gray-600">
            <h2 className="text-xl font-bold text-white mb-4">
              🦁 Chọn linh vật của bạn
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PET_TYPES.map((pet) => (
                <button
                  key={pet}
                  onClick={() => setSelectedPet(pet)}
                  className={`p-4 rounded-lg border-4 transition-all ${
                    selectedPet === pet
                      ? 'border-neon-yellow shadow-neon scale-105'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{
                    backgroundColor: PET_COLORS[pet] + '20',
                  }}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-2">
                      {pet === 'lion' && '🦁'}
                      {pet === 'dragon' && '🐉'}
                      {pet === 'unicorn' && '🦄'}
                      {pet === 'phoenix' && '🔥'}
                    </div>
                    <p className="text-white font-bold text-sm capitalize">
                      {pet}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Players list */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="bg-graffiti-light rounded-2xl p-6 border-2 border-gray-600">
            <h2 className="text-xl font-bold text-white mb-4">
              👥 Danh sách người chơi
            </h2>
            
            <div className="space-y-3">
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-graffiti-dark rounded-lg p-4 border-2 border-gray-600 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{
                        backgroundColor: PET_COLORS[player.pet || 'lion'],
                        boxShadow: `0 0 20px ${PET_COLORS[player.pet || 'lion']}`,
                      }}
                    >
                      {player.pet === 'lion' && '🦁'}
                      {player.pet === 'dragon' && '🐉'}
                      {player.pet === 'unicorn' && '🦄'}
                      {player.pet === 'phoenix' && '🔥'}
                    </div>
                    
                    <div>
                      <p className="text-white font-bold">
                        {player.name}
                        {player.id === roomInfo?.hostId && (
                          <span className="ml-2 px-2 py-1 bg-neon-yellow text-black text-xs rounded">
                            👑 Host
                          </span>
                        )}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {player.id === user?.id ? 'Bạn' : 'Người chơi'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-neon-green bg-opacity-20 text-neon-green rounded-full text-xs">
                      ✓ Sẵn sàng
                    </span>
                  </div>
                </motion.div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: GAME_SETTINGS.MAX_PLAYERS - players.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="bg-graffiti-dark rounded-lg p-4 border-2 border-dashed border-gray-700 flex items-center justify-center"
                >
                  <p className="text-gray-600 text-sm">
                    Đang chờ người chơi...
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex space-x-4">
            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={players.length < GAME_SETTINGS.MIN_PLAYERS}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-neon-green to-green-600 rounded-lg text-white font-bold text-lg hover:shadow-neon-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-neon"
              >
                🎮 Bắt đầu trận đấu
              </button>
            )}
            
            <button
              onClick={handleLeaveRoom}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-red-600 to-red-800 rounded-lg text-white font-bold text-lg hover:shadow-neon transition-all"
            >
              🚪 Rời phòng
            </button>
          </div>
          
          {!isHost && (
            <p className="text-center text-gray-400 text-sm mt-4">
              Đang chờ chủ phòng bắt đầu trận đấu...
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Lobby;
