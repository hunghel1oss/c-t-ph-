import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../providers/WebSocketProvider';
import { useTimer } from '../hooks/useTimer';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Board2D from '../components/Board2D';
import PlayerAvatar from '../components/PlayerAvatar';
import Dice3D from '../components/Dice3D';
import ActionModal from '../components/ActionModal';
import RankingModal from '../components/RankingModal';
import { calculateRankings, canBuyProperty, canUpgradeProperty } from '../utils/gameCalculations';
import { GAME_EVENT_TYPES, SOCKET_EVENTS } from '../config/socketEvents';
import { gameAPI } from '../api/game.api';

const Game = () => {
  const { roomCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Refs để tránh loop
  const hasJoinedRoom = useRef(false);
  const listenersSetup = useRef(false);
  const fetchedGameId = useRef(null);
  
  // ✅ WebSocket hook
  const {
    socket,
    connected,
    gameState,
    setGameState,
    connect: connectSocket,
    emit,
    on,
    off
  } = useWebSocket();
  
  // ✅ Local state
  const [localGameId, setLocalGameId] = useState(
    roomCode || 
    location.state?.gameId || 
    localStorage.getItem('lastGameId') || 
    null
  );
  const [localPlayerStateId, setLocalPlayerStateId] = useState(
    location.state?.playerStateId || 
    null
  );
  const [dice, setDice] = useState([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [showRanking, setShowRanking] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // ✅ Timer hook
  const { timeLeft, isRunning, start: startTimer, formatTime } = useTimer(
    gameState?.duration || 20,
    () => {
      toast.error('Hết giờ!');
    }
  );

  // ✅ Format time utility
  const formatTimeDisplay = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // ✅ Game actions
  const rollDice = useCallback((gameId, playerId) => {
    console.log('🎲 [Game] Rolling dice:', { gameId, playerId });
    emit(SOCKET_EVENTS.ROLL_DICE, { gameId, playerId });
  }, [emit]);
  
  const buyProperty = useCallback((gameId, playerId, squareIndex) => {
    console.log('🏠 [Game] Buying property:', { gameId, playerId, squareIndex });
    emit(SOCKET_EVENTS.BUY_PROPERTY, { gameId, playerId, squareIndex });
  }, [emit]);
  
  const upgradeProperty = useCallback((gameId, playerId, squareIndex) => {
    console.log('⬆️ [Game] Upgrading property:', { gameId, playerId, squareIndex });
    emit(SOCKET_EVENTS.UPGRADE_PROPERTY, { gameId, playerId, squareIndex });
  }, [emit]);
  
  const skipAction = useCallback((gameId, playerId) => {
    console.log('⏭️ [Game] Skipping action:', { gameId, playerId });
    emit(SOCKET_EVENTS.SKIP_ACTION, { gameId, playerId });
  }, [emit]);

  const sendChatMessage = useCallback((message) => {
    if (!message.trim() || !connected || !localGameId) return;
    
    console.log('💬 [Game] Sending chat message:', message);
    emit(SOCKET_EVENTS.CHAT_MESSAGE, {
      gameId: localGameId,
      playerId: user?.id,
      message: message.trim(),
      timestamp: Date.now()
    });
    setChatInput('');
  }, [emit, connected, localGameId, user?.id]);

  // ✅ Fetch game data - FIXED
  const fetchGameData = useCallback(async (idToFetch) => {
    if (!idToFetch || !user || fetchedGameId.current === idToFetch) {
      console.warn('⚠️ [Game] Skip fetch - already fetched or missing data:', {
        idToFetch,
        user: !!user,
        alreadyFetched: fetchedGameId.current === idToFetch
      });
      setLoading(false);
      return;
    }
    
    try {
      console.log('🚀 [Game] Fetching game data for ID:', idToFetch);
      fetchedGameId.current = idToFetch; // ✅ Mark as fetched
      setError(null);
      
      const response = await gameAPI.getGameInfo(idToFetch);
      console.log('📥 [Game] API Response:', response);
      
      if (response.success && response.game) {
        setGameState(response.game);
        setLocalPlayerStateId(response.playerStateId);
        setLocalGameId(response.game.id);
        localStorage.setItem('lastGameId', response.game.id);
        
        console.log('✅ [Game] Game data loaded successfully:', {
          gameId: response.game.id,
          playerStateId: response.playerStateId,
          status: response.game.status
        });
        
        toast.success('Đã tải game thành công!');
      } else {
        throw new Error(response.message || 'Game not found');
      }
    } catch (error) {
      console.error('❌ [Game] Fetch error:', error);
      setError(error.message);
      toast.error('Không thể tải game: ' + error.message);
      fetchedGameId.current = null; // ✅ Reset on error
    } finally {
      setLoading(false);
    }
  }, [user, setGameState]);

  // ✅ Handle game events
  const handleGameEvent = useCallback((event) => {
    console.log('🎯 [Game] Handling game event:', event);
    
    switch (event.type) {
      case GAME_EVENT_TYPES.OFFER_BUY:
        const square = gameState?.squareState?.find(s => s.index === event.squareIndex);
        const player = gameState?.playerState?.find(p => p.id === event.playerId);
        
        if (square && player && player.id === user?.id) {
          setCurrentAction({
            type: 'buy',
            square,
            player,
          });
          setShowActionModal(true);
        }
        break;
      
      case GAME_EVENT_TYPES.PAY_RENT:
        toast.error(`💸 Trả tiền thuê: $${event.amount}`);
        break;
      
      case GAME_EVENT_TYPES.PASS_GO:
        toast.success(`🏁 Qua điểm xuất phát! +$${event.bonus}`);
        break;
      
      case GAME_EVENT_TYPES.GO_TO_JAIL:
        toast.error('⛓️ Vào tù!');
        break;
      
      case GAME_EVENT_TYPES.DRAW_CARD:
        toast.info(`🎴 ${event.cardDescription}`);
        break;
      
      case GAME_EVENT_TYPES.TAX:
        toast.error(`💰 Đóng thuế: $${event.amount}`);
        break;
      
      case GAME_EVENT_TYPES.BANKRUPT:
        toast.error(`💸 ${event.playerName} phá sản!`);
        break;
      
      default:
        console.warn('⚠️ [Game] Unknown event type:', event.type);
        break;
    }
  }, [gameState, user]);

  // ✅ Socket event listeners - SETUP ONCE
  useEffect(() => {
    if (!socket || !connected || listenersSetup.current) return;
    
    console.log('👂 [Game] Setting up socket listeners...');
    listenersSetup.current = true;
    
    const handleDiceResult = (data) => {
      console.log('🎲 [Game] Dice result received:', data);
      setDice(data.dice);
      setIsRolling(true);
      
      setTimeout(() => {
        setIsRolling(false);
        
        if (data.events && data.events.length > 0) {
          data.events.forEach((event) => {
            handleGameEvent(event);
          });
        }
        
        if (data.gameState) {
          setGameState(data.gameState);
        }
      }, 1000);
    };
    
    const handleGameUpdate = (data) => {
      console.log('🔄 [Game] Game update received:', data);
      setGameState(data);
    };
    
    const handleGameEnd = (data) => {
      console.log('🏁 [Game] Game end received:', data);
      const finalRankings = calculateRankings(data.playerState || [], data.squareState || []);
      setRankings(finalRankings);
      setShowRanking(true);
      toast.success('Trận đấu kết thúc!');
    };
    
    const handleGameJoined = (data) => {
      console.log('🎮 [Game] Game joined successfully:', data);
      if (data.success && data.gameState) {
        setGameState(data.gameState);
        toast.success('Đã tham gia game!');
      }
    };

    const handleChatMessage = (data) => {
      console.log('💬 [Game] Chat message received:', data);
      setChatMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        playerId: data.playerId,
        playerName: data.playerName,
        message: data.message,
        timestamp: data.timestamp
      }]);
    };
    
    const handleSocketError = (error) => {
      console.error('❌ [Game] Socket error:', error);
      toast.error(error.message || 'Có lỗi xảy ra');
    };
    
    // Register listeners
    on(SOCKET_EVENTS.DICE_RESULT, handleDiceResult);
    on(SOCKET_EVENTS.GAME_UPDATE, handleGameUpdate);
    on(SOCKET_EVENTS.GAME_END, handleGameEnd);
    on(SOCKET_EVENTS.GAME_JOINED, handleGameJoined);
    on(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
    on(SOCKET_EVENTS.ERROR, handleSocketError);
    
    // ✅ Cleanup ONLY on unmount
    return () => {
      console.log('🧹 [Game] Cleaning up socket listeners on unmount...');
      listenersSetup.current = false;
      off(SOCKET_EVENTS.DICE_RESULT, handleDiceResult);
      off(SOCKET_EVENTS.GAME_UPDATE, handleGameUpdate);
      off(SOCKET_EVENTS.GAME_END, handleGameEnd);
      off(SOCKET_EVENTS.GAME_JOINED, handleGameJoined);
      off(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
      off(SOCKET_EVENTS.ERROR, handleSocketError);
    };
  }, [socket, connected]); // ✅ ONLY depend on socket and connected

  // ✅ MAIN useEffect - FETCH GAME DATA ONCE
  useEffect(() => {
    console.log('🔍 [Game] Main useEffect check:', { 
      roomCode,
      localGameId, 
      user: !!user, 
      gameState: !!gameState, 
      loading,
      connected,
      fetchedGameId: fetchedGameId.current
    });
    
    if (!user) {
      console.log('❌ [Game] No user, redirecting to login');
      navigate('/login');
      return;
    }

    // ✅ Connect socket if not connected
    if (user && !connected) {
      console.log('🔌 [Game] Auto-connecting socket...');
      connectSocket();
      return; // ✅ Return early, let next render handle fetch
    }

    // ✅ Determine gameId to use
    const gameIdToUse = roomCode || localGameId || location.state?.gameId;
    
    // ✅ Only fetch if we have gameId, no gameState, and haven't fetched yet
    if (gameIdToUse && !gameState && loading && !fetchedGameId.current) {
      console.log('🚀 [Game] Fetching game with ID:', gameIdToUse);
      fetchGameData(gameIdToUse);
    } else if (!gameIdToUse && loading) {
      console.warn('⚠️ [Game] No gameId found anywhere');
      setLoading(false);
      setError('Không tìm thấy game. Vui lòng tạo game mới hoặc tham gia game khác.');
    } else if (gameState && loading) {
      // ✅ If we have gameState, stop loading
      setLoading(false);
    }
  }, [roomCode, user, connected, gameState, loading, fetchGameData, connectSocket, navigate]);

  // ✅ JOIN GAME ROOM - SEPARATE useEffect
  useEffect(() => {
    if (gameState?.id && connected && user && !hasJoinedRoom.current) {
      console.log('🎮 [Game] Joining game room:', gameState.id);
      hasJoinedRoom.current = true;
      emit(SOCKET_EVENTS.GAME_JOIN, { 
        gameId: gameState.id, 
        userId: user.id 
      });
    }
  }, [gameState?.id, connected, user, emit]);

  // ✅ Start timer when game starts
  useEffect(() => {
    if (gameState?.status === 'in_progress' && !isRunning) {
      console.log('⏰ [Game] Starting timer...');
      startTimer();
    }
  }, [gameState?.status, isRunning, startTimer]);

  // ✅ Reset refs when gameState changes significantly
  useEffect(() => {
    if (gameState?.id && gameState.id !== fetchedGameId.current) {
      hasJoinedRoom.current = false;
    }
  }, [gameState?.id]);

  // ✅ Game action handlers
  const handleRollDice = () => {
    if (!gameState || !user) {
      toast.error('Chưa sẵn sàng để chơi!');
      return;
    }
    
    const currentPlayer = gameState.playerState?.find(p => p.id === gameState.currentTurn);
    if (!currentPlayer || currentPlayer.id !== user?.id) {
      toast.error('Chưa đến lượt của bạn!');
      return;
    }
    
    if (isRolling) {
      toast.error('Đang tung xúc xắc...');
      return;
    }
    
    if (!connected) {
      toast.error('Chưa kết nối server!');
      return;
    }
    
    rollDice(localGameId, user.id);
  };

  const handleAction = (actionType) => {
    if (!currentAction) {
      toast.error('Không có hành động nào được chọn!');
      return;
    }
    
    const { square, player } = currentAction;
    
    if (!connected) {
      toast.error('Chưa kết nối server!');
      return;
    }
    
    switch (actionType) {
      case 'buy':
        buyProperty(localGameId, localPlayerStateId, square.index); 
        toast.success(`Đã mua ${square.name}!`);
        break;
      
      case 'upgrade':
        upgradeProperty(localGameId, localPlayerStateId, square.index);
        toast.success(`Đã nâng cấp ${square.name}!`);
        break;
      
      case 'skip':
        skipAction(localGameId, localPlayerStateId);
        toast.info('Đã bỏ qua hành động.');
        break;
      
      default:
        toast.error('Hành động không hợp lệ!');
        break;
    }
    
    setShowActionModal(false);
    setCurrentAction(null);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChatMessage(chatInput);
    }
  };

  const getAvailableActions = () => {
    if (!currentAction) return [];
    
    const { square, player } = currentAction;
    const actions = [];
    
    if (canBuyProperty(player, square)) {
      actions.push({
        type: 'buy',
        label: 'Mua đất',
        cost: square.price,
        disabled: false,
      });
    }
    
    if (canUpgradeProperty(player, square, gameState?.squareState)) {
      actions.push({
        type: 'upgrade',
        label: 'Nâng cấp',
        cost: square.buildCost,
        disabled: false,
      });
    }
    
    actions.push({
      type: 'skip',
      label: 'Bỏ qua',
      disabled: false,
    });
    
    return actions;
  };

  const handleRetry = () => {
    const gameIdToRetry = roomCode || localGameId;
    if (gameIdToRetry) {
      setLoading(true);
      setError(null);
      fetchedGameId.current = null; // ✅ Reset fetch flag
      hasJoinedRoom.current = false; // ✅ Reset join flag
      fetchGameData(gameIdToRetry);
    } else {
      navigate('/');
    }
  };

  // ✅ Computed values
  const currentPlayer = gameState?.playerState?.find(p => p.id === gameState?.currentTurn);
  const myPlayer = gameState?.playerState?.find(p => p.id === user?.id);
  const isMyTurn = currentPlayer?.id === user?.id;

  // ✅ Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-graffiti-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-yellow mx-auto mb-4"></div>
          <p className="text-white text-lg mb-4">Đang tải game...</p>
          {error && (
            <div className="mt-4">
              <p className="text-red-400 mb-2">Lỗi: {error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-neon-blue hover:bg-blue-600 rounded-lg text-white transition-colors mr-2"
              >
                Thử lại
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                Về trang chủ
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ No game state fallback
  if (!gameState && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-graffiti-dark">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Không tìm thấy game
          </h2>
          <p className="text-gray-400 mb-6">
            {error || 'Game không tồn tại hoặc đã kết thúc'}
          </p>
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              Room Code: {roomCode || 'Không có'}<br/>
              Game ID: {localGameId || 'Không có'}
            </div>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-neon-cyan hover:bg-cyan-400 rounded-lg text-black font-medium transition-colors"
                disabled={!roomCode && !localGameId}
              >
                Thử lại
              </button>
              <button 
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-graffiti-dark text-white overflow-hidden">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-neon-cyan/30 p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              ← Thoát
            </button>
            <h1 className="text-2xl font-bold text-neon-cyan">
              Game #{roomCode || localGameId}
            </h1>
            <div className={`px-3 py-1 rounded-full text-sm ${
              connected ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {connected ? '🟢 Đã kết nối' : '🔴 Mất kết nối'}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Timer */}
            <div className="text-center">
              <div className="text-sm text-gray-400">Thời gian còn lại</div>
              <div className={`text-xl font-mono ${
                timeLeft <= 60 ? 'text-red-400' : 'text-neon-yellow'
              }`}>
                {formatTimeDisplay(timeLeft)}
              </div>
            </div>
            
            {/* Current Turn */}
            <div className="text-center">
              <div className="text-sm text-gray-400">Lượt hiện tại</div>
              <div className="text-lg font-bold text-neon-cyan">
                {currentPlayer?.name || 'Đang chờ...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Players */}
        <div className="w-80 bg-black/30 backdrop-blur-sm border-r border-neon-cyan/30 p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-neon-yellow">Người chơi</h2>
          <div className="space-y-3">
            {gameState.playerState?.map((player) => (
              <motion.div
                key={player.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  player.id === gameState.currentTurn
                    ? 'border-neon-yellow bg-neon-yellow/10 shadow-lg shadow-neon-yellow/20'
                    : 'border-gray-600 bg-gray-800/50'
                } ${
                  player.id === user?.id ? 'ring-2 ring-neon-cyan' : ''
                }`}
                animate={player.id === gameState.currentTurn ? {
                  scale: [1, 1.02, 1],
                  transition: { duration: 2, repeat: Infinity }
                } : {}}
              >
                <div className="flex items-center space-x-3">
                  <PlayerAvatar
                    player={player}
                    size="sm"
                    showTurn={player.id === gameState.currentTurn}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold">{player.name}</h3>
                      {player.id === user?.id && (
                        <span className="text-xs bg-neon-cyan text-black px-2 py-1 rounded-full">
                          Bạn
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      Vị trí: {player.position}
                    </div>
                    <div className="text-lg font-bold text-neon-green">
                      ${player.money?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-400">
                      Tài sản: {player.properties?.length || 0}
                    </div>
                  </div>
                </div>
                
                {/* Player status indicators */}
                <div className="flex space-x-2 mt-2">
                  {player.inJail && (
                    <span className="text-xs bg-red-600 px-2 py-1 rounded-full">
                      ⛓️ Tù
                    </span>
                  )}
                  {player.bankrupt && (
                    <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                      💸 Phá sản
                    </span>
                  )}
                </div>
              </motion.div>
            )) || []}
          </div>
        </div>
        
        {/* Center - Game Board */}
        <div className="flex-1 flex flex-col">
          {/* Board Container */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative">
  
             <Board2D
              squareState={gameState?.squareState || []}
              playerState={gameState?.playerState || []}
              onSquareClick={(square) => {
                console.log('Square clicked:', square);
              }}
            />  
              
              {/* Dice in center of board */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 border border-neon-cyan/30">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-neon-cyan mb-2">Xúc xắc</h3>
                    <Dice3D
                      dice={dice}
                      isRolling={isRolling}
                      onRollComplete={() => setIsRolling(false)}
                    />
                  </div>
                  
                  {/* Roll Button */}
                  <button
                    onClick={handleRollDice}
                    disabled={!isMyTurn || isRolling || !connected}
                    className={`w-full py-3 px-6 rounded-lg font-bold transition-all ${
                      isMyTurn && !isRolling && connected
                        ? 'bg-neon-yellow hover:bg-yellow-400 text-black hover:shadow-lg hover:shadow-neon-yellow/50'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isRolling ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span>Đang tung...</span>
                      </div>
                    ) : !connected ? (
                      'Mất kết nối'
                    ) : !isMyTurn ? (
                      'Chờ lượt'
                    ) : (
                      'Tung xúc xắc'
                    )}
                  </button>
                  
                  {/* Last roll result */}
                  {!isRolling && (
                    <div className="text-center mt-2 text-sm text-gray-400">
                      Kết quả: {dice[0]} + {dice[1]} = {dice[0] + dice[1]}
                    </div>
                  )}
                </div>
              </div>
                        </div>
          </div>

          {/* Bottom Controls */}
          <div className="bg-black/30 backdrop-blur-sm border-t border-neon-cyan/30 p-4">
            <div className="flex justify-between items-center max-w-4xl mx-auto">
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-gray-400">Vòng:</span>
                  <span className="text-white ml-2 font-bold">{gameState.round || 1}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Người chơi:</span>
                  <span className="text-white ml-2 font-bold">
                    {gameState.playerState?.length || 0}/{gameState.maxPlayers || 4}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const currentRankings = calculateRankings(
                      gameState?.playerState || [], 
                      gameState?.squareState || []
                    );
                    setRankings(currentRankings);
                    setShowRanking(true);
                  }}
                  className="px-4 py-2 bg-neon-blue hover:bg-blue-600 rounded-lg text-white transition-colors"
                >
                  Xem bảng xếp hạng
                </button>
              </div>
              
              <div className="text-sm text-gray-400">
                Trạng thái: {gameState.status === 'in_progress' ? 'Đang chơi' : 'Chờ bắt đầu'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Game Info & Chat */}
        <div className="w-80 bg-black/30 backdrop-blur-sm border-l border-neon-cyan/30 flex flex-col">
          {/* Game Info */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-neon-yellow">Thông tin game</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Trạng thái:</span>
                <span className={`font-medium ${
                  gameState.status === 'in_progress' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {gameState.status === 'in_progress' ? 'Đang chơi' : 'Chờ bắt đầu'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Số người chơi:</span>
                <span className="text-white">{gameState.playerState?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vòng hiện tại:</span>
                <span className="text-white">{gameState.round || 1}</span>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-neon-cyan">Chat</h3>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm">
                  Chưa có tin nhắn nào
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-lg text-sm ${
                      msg.playerId === user?.id
                        ? 'bg-neon-cyan/20 border border-neon-cyan/30 ml-4'
                        : 'bg-gray-800/50 border border-gray-700 mr-4'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-medium text-xs ${
                        msg.playerId === user?.id ? 'text-neon-cyan' : 'text-gray-400'
                      }`}>
                        {msg.playerId === user?.id ? 'Bạn' : msg.playerName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="text-white">{msg.message}</div>
                  </div>
                ))
              )}
            </div>
            
            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-cyan"
                  disabled={!connected}
                  maxLength={200}
                />
                <button
                  type="submit"
                  disabled={!connected || !chatInput.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    connected && chatInput.trim()
                      ? 'bg-neon-cyan hover:bg-cyan-400 text-black'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Gửi
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showActionModal && currentAction && (
          <ActionModal
            isOpen={showActionModal}
            onClose={() => {
              setShowActionModal(false);
              setCurrentAction(null);
            }}
            action={currentAction}
            availableActions={getAvailableActions()}
            onAction={handleAction}
          />
        )}
        
        {showRanking && (
          <RankingModal
            isOpen={showRanking}
            onClose={() => setShowRanking(false)}
            rankings={rankings.length > 0 ? rankings : calculateRankings(gameState?.playerState || [], gameState?.squareState || [])}
            gameState={gameState}
          />
        )}
      </AnimatePresence>

      {/* Connection Status Toast */}
      {!connected && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
        >
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Đang kết nối lại...</span>
          </div>
        </motion.div>
      )}

      {/* Game Status Overlay */}
      {gameState?.status === 'waiting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40"
        >
          <div className="bg-graffiti-dark border border-neon-cyan rounded-xl p-8 text-center max-w-md">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-neon-cyan mb-4">
              Đang chờ người chơi
            </h2>
            <p className="text-gray-400 mb-6">
              Cần ít nhất {gameState.minPlayers || 2} người chơi để bắt đầu
            </p>
            <div className="text-lg text-neon-yellow">
              {gameState.playerState?.length || 0} / {gameState.maxPlayers || 4} người chơi
            </div>
          </div>
        </motion.div>
      )}

      {/* Turn Notification */}
      <AnimatePresence>
        {isMyTurn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-neon-yellow text-black px-8 py-4 rounded-xl font-bold text-xl shadow-lg shadow-neon-yellow/50">
              🎯 Đến lượt của bạn!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay for Actions */}
      {isRolling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30 pointer-events-none"
        >
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎲</div>
            <div className="text-2xl font-bold text-neon-cyan mb-2">
              Đang tung xúc xắc...
            </div>
            <div className="text-lg text-gray-400">
              Kết quả: {dice[0]} + {dice[1]} = {dice[0] + dice[1]}
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="text-xl">❌</div>
              <div className="flex-1">
                <div className="font-bold mb-1">Có lỗi xảy ra</div>
                <div className="text-sm opacity-90">{error}</div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-white/80 hover:text-white text-lg"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug Panel (chỉ hiện trong development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-xs">
          <div className="font-bold mb-2">🐛 Debug Info</div>
          <div>Room Code: {roomCode}</div>
          <div>GameID: {localGameId}</div>
          <div>PlayerID: {localPlayerStateId}</div>
          <div>Connected: {connected ? '✅' : '❌'}</div>
          <div>My Turn: {isMyTurn ? '✅' : '❌'}</div>
          <div>Game Status: {gameState?.status}</div>
          <div>Players: {gameState?.playerState?.length || 0}</div>
          <div>Current Turn: {currentPlayer?.name}</div>
          <div>Loading: {loading ? '✅' : '❌'}</div>
          <div>Has GameState: {gameState ? '✅' : '❌'}</div>
          <div>Fetched ID: {fetchedGameId.current}</div>
          <div>Joined Room: {hasJoinedRoom.current ? '✅' : '❌'}</div>
          <div>Listeners Setup: {listenersSetup.current ? '✅' : '❌'}</div>
        </div>
      )}
    </div>
  );
};

export default Game;
