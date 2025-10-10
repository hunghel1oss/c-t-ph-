import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGameSocket } from '../hooks/useGameSocket';
import { useTimer } from '../hooks/useTimer';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Board2D from '../components/Board2D';
import PlayerAvatar from '../components/PlayerAvatar';
import Dice3D from '../components/Dice3D';
import ActionModal from '../components/ActionModal';
import RankingModal from '../components/RankingModal';
import { calculateRankings, canBuyProperty, canUpgradeProperty } from '../utils/gameCalculations';
import { GAME_EVENT_TYPES } from '../config/socketEvents';

const Game = () => {
  const { roomCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    connected,
    gameState,
    setGameState,
    rollDice,
    buyProperty,
    upgradeProperty,
    skipAction,
    onDiceResult,
    onGameUpdate,
    onGameEnd,
    onError,
  } = useGameSocket();
  
  // Local state
  const [dice, setDice] = useState([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [showRanking, setShowRanking] = useState(false);
  const [rankings, setRankings] = useState([]);
  
  // Timer
  const { timeLeft, isRunning, start: startTimer, formatTime } = useTimer(
    gameState?.duration || 20,
    () => {
      toast.error('Hết giờ!');
    }
  );
  
  // Start timer when game starts
  useEffect(() => {
    if (gameState && gameState.status === 'playing' && !isRunning) {
      startTimer();
    }
  }, [gameState, isRunning, startTimer]);
  
  // Listen to game events
  useEffect(() => {
    const unsubscribeDice = onDiceResult((data) => {
      console.log('Dice result:', data);
      setDice(data.dice);
      setIsRolling(true);
      
      setTimeout(() => {
        setIsRolling(false);
        
        // Handle events
        if (data.events && data.events.length > 0) {
          data.events.forEach((event) => {
            handleGameEvent(event);
          });
        }
        
        // Update game state
        if (data.gameState) {
          setGameState(data.gameState);
        }
      }, 1000);
    });
    
    const unsubscribeUpdate = onGameUpdate((data) => {
      console.log('Game update:', data);
      setGameState(data);
    });
    
    const unsubscribeEnd = onGameEnd((data) => {
      console.log('Game end:', data);
      const finalRankings = calculateRankings(data.playerState, data.squareState);
      setRankings(finalRankings);
      setShowRanking(true);
      toast.success('Trận đấu kết thúc!');
    });
    
    const unsubscribeError = onError((error) => {
      console.error('Game error:', error);
      toast.error(error.message || 'Có lỗi xảy ra');
    });
    
    return () => {
      unsubscribeDice();
      unsubscribeUpdate();
      unsubscribeEnd();
      unsubscribeError();
    };
  }, [onDiceResult, onGameUpdate, onGameEnd, onError, setGameState]);
  
  /**
   * Handle game events from backend
   */
  const handleGameEvent = useCallback((event) => {
    switch (event.type) {
      case GAME_EVENT_TYPES.OFFER_BUY:
        // Show buy modal
        const square = gameState.squareState.find(s => s.index === event.squareIndex);
        const player = gameState.playerState.find(p => p.id === event.playerId);
        
        if (square && player && player.id === user.id) {
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
        break;
    }
  }, [gameState, user]);
  
  /**
   * Handle roll dice
   */
  const handleRollDice = () => {
    if (!gameState || !user) return;
    
    const currentPlayer = gameState.playerState.find(p => p.id === gameState.currentTurn);
    if (!currentPlayer || currentPlayer.id !== user.id) {
      toast.error('Chưa đến lượt của bạn!');
      return;
    }
    
    if (isRolling) {
      toast.error('Đang tung xúc xắc...');
      return;
    }
    
    rollDice(roomCode, user.id);
  };
  
  /**
   * Handle action modal
   */
  const handleAction = (actionType) => {
    if (!currentAction) return;
    
    const { square, player } = currentAction;
    
    switch (actionType) {
      case 'buy':
        buyProperty(roomCode, player.id, square.index);
        toast.success(`Đã mua ${square.name}!`);
        break;
      
      case 'upgrade':
        upgradeProperty(roomCode, player.id, square.index);
        toast.success(`Đã nâng cấp ${square.name}!`);
        break;
      
      case 'skip':
        skipAction(roomCode, player.id);
        break;
      
      default:
        break;
    }
    
    setShowActionModal(false);
    setCurrentAction(null);
  };
  
  /**
   * Get available actions for current square
   */
  const getAvailableActions = () => {
    if (!currentAction) return [];
    
    const { square, player } = currentAction;
    const actions = [];
    
    // Buy action
    if (canBuyProperty(player, square)) {
      actions.push({
        type: 'buy',
        label: 'Mua đất',
        cost: square.price,
        disabled: false,
      });
    }
    
    // Upgrade action
    if (canUpgradeProperty(player, square, gameState.squareState)) {
      actions.push({
        type: 'upgrade',
        label: 'Nâng cấp',
        cost: square.buildCost,
        disabled: false,
      });
    }
    
    // Skip action
    actions.push({
      type: 'skip',
      label: 'Bỏ qua',
      disabled: false,
    });
    
    return actions;
  };
  
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-graffiti-dark">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-white">Đang tải game...</p>
        </div>
      </div>
    );
  }
  
  const currentPlayer = gameState.playerState.find(p => p.id === gameState.currentTurn);
  const myPlayer = gameState.playerState.find(p => p.id === user?.id);
  const isMyTurn = currentPlayer?.id === user?.id;
  
  return (
    <div className="min-h-screen bg-graffiti-dark relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-graffiti-darker via-graffiti-dark to-graffiti-light opacity-50"></div>
      
      {/* Top bar */}
      <div className="relative z-10 bg-graffiti-darker border-b-2 border-neon-yellow px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-game text-neon-yellow neon-text">
              CỜ TỈ PHÚ
            </h1>
            <span className="text-gray-400 text-sm">
              {connected ? '🟢' : '🔴'} {roomCode}
            </span>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Timer */}
            <div className="text-center">
              <p className="text-gray-400 text-xs">Thời gian</p>
              <p className="text-neon-blue text-lg font-bold">{formatTime}</p>
            </div>
            
            {/* Current turn */}
            <div className="text-center">
              <p className="text-gray-400 text-xs">Lượt chơi</p>
              <p className="text-neon-green text-sm font-bold">
                {currentPlayer?.name || 'N/A'}
              </p>
            </div>
            
            {/* Leave button */}
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
            >
              Thoát
            </button>
          </div>
        </div>
      </div>
      
      {/* Main game area */}
      <div className="relative z-10 container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar - Player info */}
          <div className="col-span-3 space-y-4">
            {/* My player info */}
            {myPlayer && (
              <div className="bg-graffiti-light rounded-lg p-4 border-2 border-neon-pink">
                <h3 className="text-neon-pink font-bold mb-3">Thông tin của bạn</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-white">
                    💵 Tiền: <span className="text-neon-green font-bold">${myPlayer.money}</span>
                  </p>
                  <p className="text-white">
                    🏠 Đất: <span className="text-neon-blue font-bold">{myPlayer.properties?.length || 0}</span>
                  </p>
                  <p className="text-white">
                    📍 Vị trí: <span className="text-neon-yellow font-bold">#{myPlayer.position}</span>
                  </p>
                </div>
              </div>
            )}
            
            {/* Dice */}
            <div className="bg-graffiti-light rounded-lg p-4 border-2 border-gray-600">
              <h3 className="text-white font-bold mb-3 text-center">Xúc xắc</h3>
              <Dice3D dice={dice} isRolling={isRolling} />
              
              <button
                onClick={handleRollDice}
                disabled={!isMyTurn || isRolling}
                className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-neon-pink to-neon-purple rounded-lg text-white font-bold hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRolling ? 'Đang tung...' : isMyTurn ? '🎲 Tung xúc xắc' : 'Chờ lượt...'}
              </button>
            </div>
          </div>
          
          {/* Center - Game board */}
          <div className="col-span-6 relative">
            <div className="bg-graffiti-light rounded-lg p-4 border-4 border-neon-yellow shadow-neon-strong" style={{ height: '700px' }}>
              <Board2D
                squareState={gameState.squareState}
                playerState={gameState.playerState}
                onSquareClick={(square) => console.log('Square clicked:', square)}
              />
            </div>
            
            {/* Player avatars */}
            {gameState.playerState.map((player, index) => {
              const positions = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
              return (
                <PlayerAvatar
                  key={player.id}
                  player={player}
                  position={positions[index]}
                  isCurrentTurn={player.id === currentPlayer?.id}
                />
              );
            })}
          </div>
          
          {/* Right sidebar - Game log */}
          <div className="col-span-3">
            <div className="bg-graffiti-light rounded-lg p-4 border-2 border-gray-600 h-full">
              <h3 className="text-white font-bold mb-3">📜 Nhật ký game</h3>
              <div className="space-y-2 text-xs text-gray-400 max-h-96 overflow-y-auto">
                <p>• Game bắt đầu</p>
                <p>• {currentPlayer?.name} đang chơi</p>
                {/* Add more game logs here */}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Turn indicator */}
      <AnimatePresence>
        {isMyTurn && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-neon-yellow to-neon-orange px-8 py-4 rounded-full shadow-neon-strong animate-pulse-neon">
              <p className="text-black font-bold text-lg">
                ⭐ Đến lượt bạn! ⭐
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Action Modal */}
      <ActionModal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setCurrentAction(null);
        }}
        square={currentAction?.square}
        player={currentAction?.player}
        actions={getAvailableActions()}
        onAction={handleAction}
      />
      
      {/* Ranking Modal */}
      <RankingModal
        isOpen={showRanking}
        rankings={rankings}
        onClose={() => setShowRanking(false)}
        onBackToHome={() => navigate('/')}
      />
    </div>
  );
};

export default Game;
