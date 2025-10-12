import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { formatMoney } from '../utils/gameCalculations';

/**
 * Modal để người chơi thực hiện action (buy, upgrade, skip, etc.)
 */
const ActionModal = ({ 
  isOpen, 
  onClose, 
  square, 
  player,
  actions = [],
  onAction,
}) => {
  if (!isOpen || !square) return null;
  
  const handleAction = (actionType) => {
    if (onAction) {
      onAction(actionType);
    }
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-graffiti-dark rounded-lg p-6 max-w-md w-full mx-4 border-4 border-neon-pink shadow-neon"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-neon-yellow text-xl font-bold mb-2">
                {square.name}
              </h2>
              <p className="text-gray-400 text-sm">
                Bạn đang ở ô này. Chọn hành động:
              </p>
            </div>
            
            {/* Square info */}
            <div className="bg-graffiti-light rounded-lg p-4 mb-4">
              {square.price && (
                <p className="text-white text-sm mb-2">
                  💰 Giá: <span className="text-neon-green font-bold">{formatMoney(square.price)}</span>
                </p>
              )}
              {square.rent && square.rent[0] && (
                <p className="text-white text-sm mb-2">
                  🏠 Thuê cơ bản: <span className="text-neon-blue font-bold">{formatMoney(square.rent[0])}</span>
                </p>
              )}
              {player && (
                <p className="text-white text-sm">
                  💵 Tiền của bạn: <span className="text-neon-green font-bold">{formatMoney(player.money)}</span>
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              {actions.map((action) => (
                <button
                  key={action.type}
                  onClick={() => handleAction(action.type)}
                  disabled={action.disabled}
                  className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                    action.disabled
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : action.type === 'buy'
                      ? 'bg-gradient-to-r from-neon-green to-green-600 text-white hover:shadow-neon'
                      : action.type === 'upgrade'
                      ? 'bg-gradient-to-r from-neon-blue to-blue-600 text-white hover:shadow-neon'
                      : action.type === 'skip'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:shadow-neon'
                      : 'bg-gradient-to-r from-neon-purple to-purple-600 text-white hover:shadow-neon'
                  }`}
                >
                  {action.label}
                  {action.cost && !action.disabled && (
                    <span className="ml-2 text-xs">({formatMoney(action.cost)})</span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
            >
              Đóng
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

ActionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  square: PropTypes.object,
  player: PropTypes.object,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      cost: PropTypes.number,
      disabled: PropTypes.bool,
    })
  ),
  onAction: PropTypes.func,
};

export default ActionModal;
