import PropTypes from 'prop-types';
import { SQUARE_TYPE_COLORS } from '../config/constants';
import { formatMoney, calculateRent } from '../utils/gameCalculations';

/**
 * Component hiển thị thông tin chi tiết của ô đất
 * Hiển thị khi hover hoặc click vào square
 */
const SquareInfo = ({ square, owner, houseLevel = 0 }) => {
  if (!square) return null;
  
  const typeColor = SQUARE_TYPE_COLORS[square.type] || '#FFFFFF';
  
  const renderContent = () => {
    switch (square.type) {
      case 'property':
      case 'railroad':
      case 'utility':
        return (
          <>
            {/* Price */}
            {square.price && (
              <div className="mb-3">
                <p className="text-gray-400 text-xs">Giá mua</p>
                <p className="text-neon-green text-lg font-bold">
                  {formatMoney(square.price)}
                </p>
              </div>
            )}
            
            {/* Rent */}
            {square.rent && (
              <div className="mb-3">
                <p className="text-gray-400 text-xs">Tiền thuê</p>
                <div className="space-y-1">
                  <p className="text-white text-sm">
                    Cơ bản: <span className="text-neon-blue">{formatMoney(square.rent[0])}</span>
                  </p>
                  {square.rent.length > 1 && (
                    <>
                      <p className="text-white text-sm">
                        1 nhà: <span className="text-neon-blue">{formatMoney(square.rent[1])}</span>
                      </p>
                      <p className="text-white text-sm">
                        2 nhà: <span className="text-neon-blue">{formatMoney(square.rent[2])}</span>
                      </p>
                      <p className="text-white text-sm">
                        3 nhà: <span className="text-neon-blue">{formatMoney(square.rent[3])}</span>
                      </p>
                      <p className="text-white text-sm">
                        Hotel: <span className="text-neon-yellow">{formatMoney(square.rent[4])}</span>
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Build cost */}
            {square.buildCost && (
              <div className="mb-3">
                <p className="text-gray-400 text-xs">Giá xây nhà</p>
                <p className="text-neon-orange text-sm font-bold">
                  {formatMoney(square.buildCost)}
                </p>
              </div>
            )}
            
            {/* Owner */}
            {owner && (
              <div className="mb-3 p-2 bg-graffiti-dark rounded">
                <p className="text-gray-400 text-xs">Chủ sở hữu</p>
                <p className="text-neon-pink text-sm font-bold">{owner.name}</p>
                {houseLevel > 0 && (
                  <p className="text-neon-yellow text-xs mt-1">
                    {houseLevel === 4 ? '🏨 Hotel' : `🏠 ${houseLevel} nhà`}
                  </p>
                )}
              </div>
            )}
            
            {/* Group */}
            {square.group && (
              <div>
                <p className="text-gray-400 text-xs">Nhóm màu</p>
                <div 
                  className="w-full h-2 rounded mt-1"
                  style={{ backgroundColor: square.group }}
                />
              </div>
            )}
          </>
        );
      
      case 'tax':
        return (
          <div>
            <p className="text-gray-400 text-xs">Thuế phải trả</p>
            <p className="text-red-500 text-xl font-bold">
              {formatMoney(square.taxAmount || 200)}
            </p>
          </div>
        );
      
      case 'chance':
      case 'community':
        return (
          <div className="text-center">
            <p className="text-neon-purple text-lg">🎴</p>
            <p className="text-gray-400 text-sm mt-2">
              Rút thẻ ngẫu nhiên
            </p>
          </div>
        );
      
      case 'jail':
        return (
          <div className="text-center">
            <p className="text-gray-400 text-lg">⛓️</p>
            <p className="text-gray-400 text-sm mt-2">
              Chỉ đến thăm / Ngồi tù
            </p>
            <p className="text-red-500 text-sm mt-1">
              Phạt: {formatMoney(50)}
            </p>
          </div>
        );
      
      case 'plane':
        return (
          <div className="text-center">
            <p className="text-red-500 text-lg">✈️</p>
            <p className="text-gray-400 text-sm mt-2">
              Đi thẳng vào tù!
            </p>
          </div>
        );
      
      case 'festival':
        return (
          <div className="text-center">
            <p className="text-neon-green text-lg">🎉</p>
            <p className="text-gray-400 text-sm mt-2">
              Lễ hội - Nhận quà!
            </p>
          </div>
        );
      
      case 'free_parking':
        return (
          <div className="text-center">
            <p className="text-neon-yellow text-lg">🅿️</p>
            <p className="text-gray-400 text-sm mt-2">
              Đỗ xe miễn phí
            </p>
          </div>
        );
      
      case 'start':
        return (
          <div className="text-center">
            <p className="text-neon-green text-lg">🏁</p>
            <p className="text-gray-400 text-sm mt-2">
              Điểm xuất phát
            </p>
            <p className="text-neon-green text-sm mt-1">
              Nhận {formatMoney(300)} khi đi qua
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div 
      className="bg-graffiti-light rounded-lg p-4 border-2 shadow-lg"
      style={{ 
        borderColor: typeColor,
        boxShadow: `0 0 20px ${typeColor}40`,
      }}
    >
      {/* Header */}
      <div className="mb-3 pb-3 border-b border-gray-600">
        <h3 className="text-white font-bold text-sm mb-1">{square.name}</h3>
        <span 
          className="inline-block px-2 py-1 rounded text-xs"
          style={{ 
            backgroundColor: typeColor + '40',
            color: typeColor,
          }}
        >
          {square.type}
        </span>
      </div>
      
      {/* Content */}
      {renderContent()}
    </div>
  );
};

SquareInfo.propTypes = {
  square: PropTypes.shape({
    id: PropTypes.string,
    index: PropTypes.number,
    type: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number,
    rent: PropTypes.arrayOf(PropTypes.number),
    buildCost: PropTypes.number,
    group: PropTypes.string,
    taxAmount: PropTypes.number,
  }),
  owner: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  houseLevel: PropTypes.number,
};

export default SquareInfo;
