import PropTypes from 'prop-types';
import { PET_COLORS } from '../config/constants';
import { formatMoney } from '../utils/gameCalculations';

/**
 * Component hiển thị avatar người chơi (4 góc màn hình game)
 */
const PlayerAvatar = ({ player, position = 'top-left', isCurrentTurn = false }) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };
  
  const petColor = PET_COLORS[player.pet] || '#FFFFFF';
  
  return (
    <div 
      className={`absolute ${positionClasses[position]} z-10`}
      style={{
        animation: isCurrentTurn ? 'pulse-neon 1s ease-in-out infinite' : 'none',
      }}
    >
      <div 
        className={`bg-graffiti-light rounded-lg p-3 border-2 ${
          isCurrentTurn ? 'border-neon-yellow shadow-neon-strong' : 'border-gray-600'
        }`}
        style={{ minWidth: '150px' }}
      >
        {/* Pet icon */}
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center mb-2 mx-auto"
          style={{ 
            backgroundColor: petColor,
            boxShadow: `0 0 20px ${petColor}`,
          }}
        >
          <span className="text-2xl">
            {player.pet === 'lion' && '🦁'}
            {player.pet === 'dragon' && '🐉'}
            {player.pet === 'unicorn' && '🦄'}
            {player.pet === 'phoenix' && '🔥'}
          </span>
        </div>
        
        {/* Player info */}
        <div className="text-center">
          <p className="text-white text-xs font-bold truncate">{player.name}</p>
          <p className="text-neon-green text-sm font-bold mt-1">
            {formatMoney(player.money)}
          </p>
          
          {/* Properties count */}
          <p className="text-gray-400 text-xs mt-1">
            🏠 {player.properties?.length || 0}
          </p>
          
          {/* Status indicators */}
          {player.inJail && (
            <span className="inline-block mt-1 px-2 py-1 bg-red-600 rounded text-xs">
              ⛓️ Tù
            </span>
          )}
          {player.isBankrupt && (
            <span className="inline-block mt-1 px-2 py-1 bg-gray-600 rounded text-xs">
              💸 Phá sản
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

PlayerAvatar.propTypes = {
  player: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    pet: PropTypes.string.isRequired,
    money: PropTypes.number.isRequired,
    properties: PropTypes.array,
    inJail: PropTypes.bool,
    isBankrupt: PropTypes.bool,
  }).isRequired,
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  isCurrentTurn: PropTypes.bool,
};

export default PlayerAvatar;
