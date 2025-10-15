import PropTypes from 'prop-types';
import { useState } from 'react';
import { SQUARE_TYPE_COLORS } from '../config/constants';
import SquareInfo from './SquareInfo';

/**
 * Default squares với tên thật như Monopoly
 */
const DEFAULT_SQUARES = [
  // Bottom row (0-7)
  { id: 'go', index: 0, type: 'corner', name: 'GO', price: 0, description: 'Nhận $200' },
  { id: 'brown1', index: 1, type: 'property', name: 'Đường Lê Lợi', price: 60, color: '#8B4513' },
  { id: 'community1', index: 2, type: 'community', name: 'Quỹ Cộng Đồng', price: 0 },
  { id: 'brown2', index: 3, type: 'property', name: 'Đường Nguyễn Huệ', price: 60, color: '#8B4513' },
  { id: 'tax1', index: 4, type: 'tax', name: 'Thuế Thu Nhập', price: 200 },
  { id: 'railroad1', index: 5, type: 'railroad', name: 'Ga Sài Gòn', price: 200 },
  { id: 'lightblue1', index: 6, type: 'property', name: 'Đường Đồng Khởi', price: 100, color: '#87CEEB' },
  { id: 'chance1', index: 7, type: 'chance', name: 'Cơ Hội', price: 0 },
  
  // Right column (8-15)
  { id: 'lightblue2', index: 8, type: 'property', name: 'Đường Nam Kỳ Khởi Nghĩa', price: 100, color: '#87CEEB' },
  { id: 'lightblue3', index: 9, type: 'property', name: 'Đường Hai Bà Trưng', price: 120, color: '#87CEEB' },
  { id: 'jail', index: 10, type: 'corner', name: 'TÙ', price: 0, description: 'Chỉ thăm' },
  { id: 'pink1', index: 11, type: 'property', name: 'Đường Trần Hưng Đạo', price: 140, color: '#FF1493' },
  { id: 'utility1', index: 12, type: 'utility', name: 'Công Ty Điện Lực', price: 150 },
  { id: 'pink2', index: 13, type: 'property', name: 'Đường Lý Tự Trọng', price: 140, color: '#FF1493' },
  { id: 'pink3', index: 14, type: 'property', name: 'Đường Pasteur', price: 160, color: '#FF1493' },
  { id: 'railroad2', index: 15, type: 'railroad', name: 'Ga Hà Nội', price: 200 },
  
  // Top row (16-23)
  { id: 'orange1', index: 16, type: 'property', name: 'Đường Cách Mạng Tháng 8', price: 180, color: '#FFA500' },
  { id: 'community2', index: 17, type: 'community', name: 'Quỹ Cộng Đồng', price: 0 },
  { id: 'orange2', index: 18, type: 'property', name: 'Đường Võ Văn Tần', price: 180, color: '#FFA500' },
  { id: 'orange3', index: 19, type: 'property', name: 'Đường Điện Biên Phủ', price: 200, color: '#FFA500' },
  { id: 'parking', index: 20, type: 'corner', name: 'ĐỖ XE MIỄN PHÍ', price: 0 },
  { id: 'red1', index: 21, type: 'property', name: 'Đường Lê Duẩn', price: 220, color: '#FF0000' },
  { id: 'chance2', index: 22, type: 'chance', name: 'Cơ Hội', price: 0 },
  { id: 'red2', index: 23, type: 'property', name: 'Đường Nguyễn Thị Minh Khai', price: 220, color: '#FF0000' },
  
  // Left column (24-31)
  { id: 'red3', index: 24, type: 'property', name: 'Đường Võ Thị Sáu', price: 240, color: '#FF0000' },
  { id: 'railroad3', index: 25, type: 'railroad', name: 'Ga Đà Nẵng', price: 200 },
  { id: 'yellow1', index: 26, type: 'property', name: 'Đường Nguyễn Du', price: 260, color: '#FFFF00' },
  { id: 'yellow2', index: 27, type: 'property', name: 'Đường Phan Đình Phùng', price: 260, color: '#FFFF00' },
  { id: 'utility2', index: 28, type: 'utility', name: 'Công Ty Nước', price: 150 },
  { id: 'yellow3', index: 29, type: 'property', name: 'Đường Lê Thánh Tôn', price: 280, color: '#FFFF00' },
  { id: 'gotojail', index: 30, type: 'corner', name: 'VÀO TÙ', price: 0, description: 'Đi thẳng vào tù' },
  { id: 'green1', index: 31, type: 'property', name: 'Đường Nguyễn Trãi', price: 300, color: '#008000' },
];

/**
 * Board 2D - Monopoly style với 32 ô
 */
const Board2D = ({ squareState = [], playerState = [], onSquareClick }) => {
  const [hoveredSquare, setHoveredSquare] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  
  // Sử dụng data thực hoặc fallback
  const squares = squareState.length > 0 ? squareState : DEFAULT_SQUARES;
  const players = playerState || [];
  
  /**
   * Render corner square (4 góc đặc biệt)
   */
  const renderCornerSquare = (square, index) => {
    const playersHere = players.filter(p => p.position === square.index);
    
    let cornerClass = '';
    let iconClass = '';
    
    switch(index) {
      case 0: // GO - Bottom Left
        cornerClass = 'rounded-bl-2xl';
        iconClass = '🏁';
        break;
      case 10: // JAIL - Bottom Right  
        cornerClass = 'rounded-br-2xl';
        iconClass = '🏛️';
        break;
      case 20: // FREE PARKING - Top Right
        cornerClass = 'rounded-tr-2xl';
        iconClass = '🅿️';
        break;
      case 30: // GO TO JAIL - Top Left
        cornerClass = 'rounded-tl-2xl';
        iconClass = '👮';
        break;
    }
    
    return (
      <div
        key={square.id}
        className={`relative bg-gradient-to-br from-neon-yellow/20 to-neon-cyan/20 border-2 border-neon-yellow cursor-pointer transition-all hover:scale-105 hover:shadow-lg hover:shadow-neon-yellow/50 ${cornerClass}`}
        style={{
          aspectRatio: '1/1',
        }}
        onMouseEnter={() => setHoveredSquare(index)}
        onMouseLeave={() => setHoveredSquare(null)}
        onClick={() => {
          setSelectedSquare(square);
          onSquareClick?.(square);
        }}
      >
        {/* Corner content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
          <div className="text-2xl mb-1">{iconClass}</div>
          <div className="text-white text-xs font-bold leading-tight">
            {square.name}
          </div>
          {square.description && (
            <div className="text-neon-cyan text-xs mt-1">
              {square.description}
            </div>
          )}
        </div>
        
        {/* Players */}
        {playersHere.length > 0 && (
          <div className="absolute -top-1 -right-1 flex flex-wrap">
            {playersHere.map((player, i) => (
              <div
                key={player.id}
                className="w-3 h-3 rounded-full border border-white text-xs flex items-center justify-center"
                style={{ 
                  backgroundColor: player.color || '#00F0FF',
                  fontSize: '8px'
                }}
                title={player.name}
              >
                {player.pet === 'lion' && '🦁'}
                {player.pet === 'dragon' && '🐉'}
                {player.pet === 'unicorn' && '🦄'}
                {player.pet === 'phoenix' && '🔥'}
                {!player.pet && '👤'}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  /**
   * Render regular square
   */
  const renderRegularSquare = (square, index) => {
    const owner = players.find(p => p.id === square.ownerId);
    const houseLevel = owner?.houses?.[square.index] || 0;
    const playersHere = players.filter(p => p.position === square.index);
    
    // Determine square orientation
    let isVertical = false;
    if ((index >= 8 && index < 16) || (index >= 24 && index < 32)) {
      isVertical = true;
    }
    
    const squareColor = square.color || SQUARE_TYPE_COLORS[square.type] || '#FFFFFF';
    
    return (
      <div
        key={square.id}
        className={`relative bg-graffiti-light border border-gray-600 cursor-pointer transition-all hover:scale-105 hover:border-neon-cyan hover:shadow-md hover:shadow-neon-cyan/30 ${
          isVertical ? 'flex flex-col' : 'flex flex-col'
        }`}
        style={{
          aspectRatio: isVertical ? '1/1.5' : '1.5/1',
        }}
        onMouseEnter={() => setHoveredSquare(index)}
        onMouseLeave={() => setHoveredSquare(null)}
        onClick={() => {
          setSelectedSquare(square);
          onSquareClick?.(square);
        }}
      >
        {/* Color bar */}
        <div 
          className={`${isVertical ? 'h-4 w-full' : 'w-4 h-full'} flex-shrink-0`}
          style={{ backgroundColor: squareColor }}
        />
        
        {/* Square content */}
        <div className="flex-1 p-1 flex flex-col justify-between text-center">
          <div>
            <div className="text-white text-xs font-bold leading-tight mb-1">
              {square.name}
            </div>
            
            {square.price > 0 && (
              <div className="text-neon-green text-xs font-bold">
                ${square.price}
              </div>
            )}
          </div>
          
          {/* Special icons */}
          <div className="text-lg">
            {square.type === 'chance' && '❓'}
            {square.type === 'community' && '💰'}
            {square.type === 'tax' && '💸'}
            {square.type === 'railroad' && '🚂'}
            {square.type === 'utility' && '⚡'}
          </div>
        </div>
        
        {/* Owner indicator */}
        {owner && (
          <div 
            className="absolute top-0 right-0 w-3 h-3 rounded-full border border-white"
            style={{ backgroundColor: owner.color || '#00F0FF' }}
            title={`Chủ: ${owner.name}`}
          />
        )}
        
        {/* House indicators */}
        {houseLevel > 0 && (
          <div className="absolute bottom-0 left-0 text-xs">
            {houseLevel === 5 ? '🏨' : '🏠'.repeat(houseLevel)}
          </div>
        )}
        
        {/* Players */}
        {playersHere.length > 0 && (
          <div className="absolute -top-1 -left-1 flex flex-wrap">
            {playersHere.map((player, i) => (
              <div
                key={player.id}
                className="w-3 h-3 rounded-full border border-white text-xs flex items-center justify-center"
                style={{ 
                  backgroundColor: player.color || '#00F0FF',
                  fontSize: '8px',
                  zIndex: i + 1,
                }}
                title={player.name}
              >
                {player.pet === 'lion' && '🦁'}
                {player.pet === 'dragon' && '🐉'}
                {player.pet === 'unicorn' && '🦄'}
                {player.pet === 'phoenix' && '🔥'}
                {!player.pet && '👤'}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {/* Main Board Container */}
      <div className="relative bg-graffiti-darker rounded-3xl p-4 shadow-2xl border-2 border-neon-cyan/30">
        {/* Board Grid */}
        <div className="monopoly-board relative">
          {/* Bottom Row */}
          <div className="board-row bottom-row">
            {squares.slice(0, 8).map((square, i) => 
              i === 0 ? renderCornerSquare(square, i) : renderRegularSquare(square, i)
            )}
          </div>
          
          {/* Right Column */}
          <div className="board-column right-column">
            {squares.slice(8, 15).map((square, i) => renderRegularSquare(square, i + 8))}
          </div>
          
          {/* Top Row */}
          <div className="board-row top-row">
            {squares.slice(15, 23).reverse().map((square, i) => {
              const realIndex = 22 - i;
              return realIndex === 20 ? renderCornerSquare(square, realIndex) : renderRegularSquare(square, realIndex);
            })}
          </div>
          
          {/* Left Column */}
          <div className="board-column left-column">
            {squares.slice(23, 31).reverse().map((square, i) => {
              const realIndex = 30 - i;
              return realIndex === 30 ? renderCornerSquare(square, realIndex) : renderRegularSquare(square, realIndex);
            })}
          </div>
          
          {/* Center Area */}
          <div className="board-center">
            <div className="text-center">
              <h2 className="text-neon-yellow text-3xl font-game neon-text mb-2">
                CỜ TỈ PHÚ
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                🎲 Monopoly Game
              </p>
              
              {/* Game Stats */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>Ô cờ: {squares.length}</div>
                <div>Người chơi: {players.length}</div>
                {hoveredSquare !== null && (
                  <div className="text-neon-cyan">
                    Hover: {squares[hoveredSquare]?.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Square Info Tooltip */}
      {hoveredSquare !== null && squares[hoveredSquare] && (
        <div className="absolute top-4 right-4 w-64 z-30">
          <SquareInfo 
            square={squares[hoveredSquare]}
            owner={players.find(p => p.id === squares[hoveredSquare].ownerId)}
            houseLevel={players.find(p => p.id === squares[hoveredSquare].ownerId)?.houses?.[hoveredSquare] || 0}
          />
        </div>
      )}
    </div>
  );
};

Board2D.propTypes = {
  squareState: PropTypes.array,
  playerState: PropTypes.array,
  onSquareClick: PropTypes.func,
};

export default Board2D;
