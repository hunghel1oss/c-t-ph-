import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../providers/WebSocketProvider';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Lobby = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useWebSocket();

  const [gameData, setGameData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  // ✅ Lấy từ state (truyền từ Home khi tạo/join)
  const gameId = location.state?.gameId;
  const roomCode = location.state?.roomCode;
  const playerStateId = location.state?.playerStateId;

  // ✅ LOAD GAME DATA
  useEffect(() => {
    if (!gameId) {
      toast.error('Không tìm thấy thông tin phòng');
      navigate('/');
      return;
    }

    const fetchGameData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_URL}/games/${gameId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setGameData(response.data.game);
          setPlayers(response.data.game.players);
          setIsHost(response.data.isHost);
          console.log('✅ [Lobby] Game data loaded:', response.data);
        }
      } catch (error) {
        console.error('❌ [Lobby] Failed to load game:', error);
        toast.error('Không thể tải thông tin phòng');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, navigate]);

  // ✅ SOCKET: JOIN ROOM
  useEffect(() => {
    if (!socket || !connected || !roomCode) return;

    console.log('🔌 [Lobby] Joining room:', roomCode);
    socket.emit('join_room', { roomCode });

    // ✅ LISTEN: PLAYER JOINED
    socket.on('player_joined', (data) => {
      console.log('👤 [Lobby] Player joined:', data);
      setPlayers(data.players);
      toast.success(`${data.player.userId.username} đã tham gia!`);
    });

    // ✅ LISTEN: PLAYER LEFT
    socket.on('player_left', (data) => {
      console.log('👋 [Lobby] Player left:', data);
      setPlayers(data.players);
      toast.info(`${data.player.userId.username} đã rời phòng`);
    });

    // ✅ LISTEN: GAME STARTED
    socket.on('game_started', (data) => {
      console.log('🎮 [Lobby] Game started:', data);
      toast.success('Game đã bắt đầu!');
      navigate('/game', { state: { gameId: data.gameId } });
    });

    return () => {
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_started');
    };
  }, [socket, connected, roomCode, navigate]);

  // ✅ HANDLE: START GAME
  const handleStartGame = async () => {
    if (!isHost) {
      toast.error('Chỉ chủ phòng mới có thể bắt đầu game!');
      return;
    }

    if (players.length < 2) {
      toast.error('Cần ít nhất 2 người chơi để bắt đầu!');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/game/start`,
        { gameId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        socket.emit('start_game', { roomCode, gameId });
      }
    } catch (error) {
      console.error('❌ [Lobby] Start game failed:', error);
      toast.error('Không thể bắt đầu game');
    }
  };

  // ✅ HANDLE: LEAVE ROOM
  const handleLeaveRoom = () => {
    socket.emit('leave_room', { roomCode, playerStateId });
    navigate('/');
  };

  // ✅ AVATARS
  const avatars = [
    { id: 'lion', name: 'Lion', emoji: '🦁' },
    { id: 'dragon', name: 'Dragon', emoji: '🐉' },
    { id: 'unicorn', name: 'Unicorn', emoji: '🦄' },
    { id: 'phoenix', name: 'Phoenix', emoji: '🔥' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-graffiti-dark">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-white">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-graffiti-dark p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="bg-graffiti-card rounded-xl p-6 mb-6 border-4 border-graffiti-yellow">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-black text-graffiti-yellow mb-2">
                PHÒNG CHỜ
              </h1>
              <p className="text-white text-lg">
                Mã phòng: <span className="font-bold text-graffiti-cyan">{roomCode}</span>
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(roomCode);
                toast.success('Đã copy mã phòng!');
              }}
              className="btn-graffiti"
            >
              📋 COPY MÃ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CHỌN LINH VẬT */}
          <div className="bg-graffiti-card rounded-xl p-6 border-4 border-graffiti-pink">
            <h2 className="text-2xl font-black text-graffiti-pink mb-4">
              🎭 Chọn linh vật của bạn
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`p-6 rounded-xl border-4 transition-all ${
                    selectedAvatar === avatar.id
                      ? 'border-graffiti-yellow bg-graffiti-yellow/20 scale-105'
                      : 'border-graffiti-gray hover:border-graffiti-cyan'
                  }`}
                >
                  <div className="text-6xl mb-2">{avatar.emoji}</div>
                  <p className="text-white font-bold">{avatar.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* DANH SÁCH NGƯỜI CHƠI */}
          <div className="bg-graffiti-card rounded-xl p-6 border-4 border-graffiti-cyan">
            <h2 className="text-2xl font-black text-graffiti-cyan mb-4">
              👥 Danh sách người chơi ({players.length}/4)
            </h2>
            <div className="space-y-3">
              {players.map((player, index) => (
                <div
                  key={player._id}
                  className={`p-4 rounded-lg border-2 ${
                    index === 0
                      ? 'border-graffiti-yellow bg-graffiti-yellow/10'
                      : 'border-graffiti-gray'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-graffiti-purple flex items-center justify-center text-2xl">
                        {player.userId.avatar || '👤'}
                      </div>
                      <div>
                        <p className="text-white font-bold">
                          {player.userId.username}
                          {index === 0 && (
                            <span className="ml-2 text-graffiti-yellow">👑 Chủ phòng</span>
                          )}
                        </p>
                        <p className="text-graffiti-gray text-sm">
                          {player.userId.email}
                        </p>
                      </div>
                    </div>
                    {player.userId._id === user.id && (
                      <span className="text-graffiti-green font-bold">Bạn</span>
                    )}
                  </div>
                </div>
              ))}

              {/* EMPTY SLOTS */}
              {[...Array(4 - players.length)].map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="p-4 rounded-lg border-2 border-dashed border-graffiti-gray"
                >
                  <p className="text-graffiti-gray text-center">
                    Đang chờ người chơi...
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex gap-4">
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className="btn-graffiti flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🎮 BẮT ĐẦU GAME
            </button>
          )}
          <button
            onClick={handleLeaveRoom}
            className="btn-graffiti-secondary"
          >
            🚪 RỜI PHÒNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
