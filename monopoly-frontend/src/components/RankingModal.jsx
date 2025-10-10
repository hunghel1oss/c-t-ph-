import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { formatMoney } from '../utils/gameCalculations';

/**
 * Modal hiển thị bảng xếp hạng khi game kết thúc
 */
const RankingModal = ({ isOpen, rankings = [], onClose, onBackToHome }) => {
  if (!isOpen) return null;
  
  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'text-neon-yellow';
      case 2:
        return 'text-gray-300';
      case 3:
        return 'text-orange-400';
      default:
        return 'text-white';
    }
  };
  
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            className="bg-graffiti-dark rounded-lg p-8 max-w-2xl w-full mx-4 border-4 border-neon-yellow shadow-neon-strong"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-game text-neon-yellow neon-text mb-2">
                🏆 GAME OVER 🏆
              </h1>
              <p className="text-gray-400 text-sm">
                Kết quả trận đấu
              </p>
            </div>
            
            {/* Rankings */}
            <div className="space-y-4 mb-8">
              {rankings.map((entry, index) => (
                <motion.div
                  key={entry.playerId}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-graffiti-light rounded-lg p-4 border-2 ${
                    entry.rank === 1 ? 'border-neon-yellow' : 'border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Rank & Name */}
                    <div className="flex items-center space-x-4">
                      <span className={`text-3xl ${getRankColor(entry.rank)}`}>
                        {getRankIcon(entry.rank)}
                      </span>
                      <div>
                        <p className={`font-bold ${getRankColor(entry.rank)}`}>
                          {entry.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {entry.isBankrupt ? '💸 Phá sản' : ''}
                        </p>
                      </div>
                    </div>
                    
                    {/* Assets */}
                    <div className="text-right">
                      <p className="text-neon-green font-bold text-lg">
                        {formatMoney(entry.totalAssets)}
                      </p>
                      <p className="text-gray-400 text-xs">
                        💵 {formatMoney(entry.money)} | 🏠 {formatMoney(entry.propertyValue)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={onBackToHome}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-neon-blue to-blue-600 rounded-lg text-white font-bold hover:shadow-neon transition-all"
              >
                🏠 Về trang chủ
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg text-white font-bold hover:shadow-neon transition-all"
                >
                  Đóng
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

RankingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  rankings: PropTypes.arrayOf(
    PropTypes.shape({
      playerId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      rank: PropTypes.number.isRequired,
      totalAssets: PropTypes.number.isRequired,
      money: PropTypes.number.isRequired,
      propertyValue: PropTypes.number.isRequired,
      isBankrupt: PropTypes.bool,
    })
  ),
  onClose: PropTypes.func,
  onBackToHome: PropTypes.func.isRequired,
};

export default RankingModal;
