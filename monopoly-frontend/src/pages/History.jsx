import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { formatMoney } from '../utils/gameCalculations';

const History = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, win, lose
  
  useEffect(() => {
    // TODO: Fetch history from API
    // Mock data for now
    const mockHistory = [
      {
        id: '1',
        roomCode: 'ABC123',
        date: '2024-01-15',
        duration: 20,
        players: 4,
        rank: 1,
        totalAssets: 5000,
        result: 'win',
      },
      {
        id: '2',
        roomCode: 'XYZ789',
        date: '2024-01-14',
        duration: 60,
        players: 3,
        rank: 2,
        totalAssets: 3500,
        result: 'lose',
      },
      {
        id: '3',
        roomCode: 'DEF456',
        date: '2024-01-13',
        duration: 30,
        players: 4,
        rank: 3,
        totalAssets: 2000,
        result: 'lose',
      },
    ];
    
    setTimeout(() => {
      setHistory(mockHistory);
      setLoading(false);
    }, 500);
  }, []);
  
  const filteredHistory = history.filter(game => {
    if (filter === 'all') return true;
    if (filter === 'win') return game.rank === 1;
    if (filter === 'lose') return game.rank > 1;
    return true;
  });
  
  const stats = {
    totalGames: history.length,
    wins: history.filter(g => g.rank === 1).length,
    losses: history.filter(g => g.rank > 1).length,
    winRate: history.length > 0 ? ((history.filter(g => g.rank === 1).length / history.length) * 100).toFixed(1) : 0,
  };
  
  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black rounded-full text-xs font-bold">🥇 #1</span>;
      case 2:
        return <span className="px-3 py-1 bg-gradient-to-r from-gray-300 to-gray-500 text-black rounded-full text-xs font-bold">🥈 #2</span>;
      case 3:
        return <span className="px-3 py-1 bg-gradient-to-r from-orange-400 to-orange-600 text-black rounded-full text-xs font-bold">🥉 #3</span>;
      default:
        return <span className="px-3 py-1 bg-gray-600 text-white rounded-full text-xs font-bold">#{rank}</span>;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-graffiti-darker via-graffiti-dark to-graffiti-light">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-game text-neon-yellow neon-text mb-2">
            📜 Lịch sử trận đấu
          </h1>
          <p className="text-gray-400">
            Xem lại các trận đấu của bạn
          </p>
        </motion.div>
        
        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-graffiti-light rounded-lg p-4 border-2 border-neon-blue text-center">
              <p className="text-gray-400 text-xs mb-1">Tổng trận</p>
              <p className="text-neon-blue text-2xl font-bold">{stats.totalGames}</p>
            </div>
            
            <div className="bg-graffiti-light rounded-lg p-4 border-2 border-neon-green text-center">
              <p className="text-gray-400 text-xs mb-1">Thắng</p>
              <p className="text-neon-green text-2xl font-bold">{stats.wins}</p>
            </div>
            
            <div className="bg-graffiti-light rounded-lg p-4 border-2 border-red-500 text-center">
              <p className="text-gray-400 text-xs mb-1">Thua</p>
              <p className="text-red-500 text-2xl font-bold">{stats.losses}</p>
            </div>
            
            <div className="bg-graffiti-light rounded-lg p-4 border-2 border-neon-yellow text-center">
              <p className="text-gray-400 text-xs mb-1">Tỷ lệ thắng</p>
              <p className="text-neon-yellow text-2xl font-bold">{stats.winRate}%</p>
            </div>
          </div>
        </motion.div>
        
        {/* Filter */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-6"
        >
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-neon'
                  : 'bg-graffiti-light text-gray-400 hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('win')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                filter === 'win'
                  ? 'bg-gradient-to-r from-neon-green to-green-600 text-white shadow-neon'
                  : 'bg-graffiti-light text-gray-400 hover:text-white'
              }`}
            >
              Thắng
            </button>
            <button
              onClick={() => setFilter('lose')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                filter === 'lose'
                  ? 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-neon'
                  : 'bg-graffiti-light text-gray-400 hover:text-white'
              }`}
            >
              Thua
            </button>
          </div>
        </motion.div>
        
        {/* History list */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mb-4"></div>
              <p className="text-gray-400">Đang tải...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="bg-graffiti-light rounded-lg p-12 border-2 border-gray-600 text-center">
              <p className="text-gray-400 text-lg mb-4">📭</p>
              <p className="text-gray-400">Chưa có lịch sử trận đấu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-graffiti-light rounded-lg p-6 border-2 ${
                    game.rank === 1 ? 'border-neon-yellow shadow-neon' : 'border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {getRankBadge(game.rank)}
                      <div>
                        <p className="text-white font-bold">
                          Phòng {game.roomCode}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {game.date} • {game.duration} phút
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-neon-green text-xl font-bold">
                        {formatMoney(game.totalAssets)}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Tổng tài sản
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-600">
                    <div className="text-center">
                      <p className="text-gray-400 text-xs mb-1">Người chơi</p>
                      <p className="text-white font-bold">👥 {game.players}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs mb-1">Hạng</p>
                      <p className="text-neon-blue font-bold">#{game.rank}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs mb-1">Kết quả</p>
                      <p className={`font-bold ${game.rank === 1 ? 'text-neon-green' : 'text-red-500'}`}>
                        {game.rank === 1 ? '✓ Thắng' : '✗ Thua'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default History;

