import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import PropTypes from 'prop-types';
import { SQUARE_TYPE_COLORS } from '../config/constants';
import Pet3D from './Pet3D';
import House3D from './House3D';
import { useState } from 'react';
import SquareInfo from './SquareInfo';

/**
 * Board 2D - bàn cờ 32 ô (11x11 grid với center rỗng)
 * Layout: 8 ô mỗi cạnh (8x4 = 32)
 */
const Board2D = ({ squareState = [], playerState = [], onSquareClick }) => {
  const [hoveredSquare, setHoveredSquare] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  
  /**
   * Map 32 squares vào grid 11x11
   * Bottom: 0-7 (left to right)
   * Right: 8-15 (bottom to top)
   * Top: 16-23 (right to left)
   * Left: 24-31 (top to bottom)
   */
  const getSquarePosition = (index) => {
    if (index < 8) {
      // Bottom row
      return { row: 10, col: index };
    } else if (index < 16) {
      // Right column
      return { row: 10 - (index - 7), col: 10 };
    } else if (index < 24) {
      // Top row
      return { row: 0, col: 10 - (index - 16) };
    } else {
      // Left column
      return { row: index - 23, col: 0 };
    }
  };
  
  /**
   * Render single square
   */
  const renderSquare = (square, index) => {
    const { row, col } = getSquarePosition(index);
    const typeColor = SQUARE_TYPE_COLORS[square.type] || '#FFFFFF';
    const owner = playerState.find(p => p.id === square.ownerId);
    const houseLevel = owner?.houses?.[square.index] || 0;
    
    // Check if any player is on this square
    const playersHere = playerState.filter(p => p.position === square.index);
    
    return (
      <div
        key={square.id || index}
        className="square-hover relative bg-graffiti-light border-2 rounded-lg p-2 cursor-pointer"
        style={{
          gridRow: row + 1,
          gridColumn: col + 1,
          borderColor: typeColor,
          boxShadow: hoveredSquare === index ? `0 0 15px ${typeColor}` : 'none',
        }}
        onMouseEnter={() => setHoveredSquare(index)}
        onMouseLeave={() => setHoveredSquare(null)}
        onClick={() => {
          setSelectedSquare(square);
          if (onSquareClick) {
            onSquareClick(square);
          }
        }}
      >
        {/* Square name */}
        <p className="text-white text-xs font-bold truncate mb-1">
          {square.name}
        </p>
        
        {/* Square type indicator */}
        <div 
          className="w-full h-1 rounded mb-1"
          style={{ backgroundColor: typeColor }}
        />
        
        {/* Price */}
        {square.price && (
          <p className="text-neon-green text-xs">
            ${square.price}
          </p>
        )}
        
        {/* Owner indicator */}
        {owner && (
          <div className="absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white"
            style={{ backgroundColor: owner.pet ? '#FF10F0' : '#00F0FF' }}
          />
        )}
        
        {/* House level indicator */}
        {houseLevel > 0 && (
          <div className="absolute bottom-1 right-1 text-xs">
            {houseLevel === 4 ? '🏨' : `🏠${houseLevel}`}
          </div>
        )}
        
        {/* Players on this square */}
        {playersHere.length > 0 && (
          <div className="absolute -top-2 -left-2 flex space-x-1">
            {playersHere.map((player, i) => (
              <div
                key={player.id}
                className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center                 text-xs"
                style={{ 
                  backgroundColor: player.pet ? '#FF10F0' : '#00F0FF',
                  zIndex: i + 1,
                }}
                title={player.name}
              >
                {player.pet === 'lion' && '🦁'}
                {player.pet === 'dragon' && '🐉'}
                {player.pet === 'unicorn' && '🦄'}
                {player.pet === 'phoenix' && '🔥'}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="relative w-full h-full">
      {/* 2D Board Grid */}
      <div className="board-grid w-full h-full">
        {squareState.map((square, index) => renderSquare(square, index))}
        
        {/* Center area - logo or 3D view */}
        <div 
          className="bg-graffiti-darker rounded-lg flex items-center justify-center"
          style={{
            gridRow: '2 / 11',
            gridColumn: '2 / 11',
          }}
        >
          <div className="text-center">
            <h2 className="text-neon-yellow text-2xl font-game neon-text mb-2">
              CỜ TỈ PHÚ
            </h2>
            <p className="text-gray-400 text-xs">
              🎲 Monopoly Game
            </p>
          </div>
        </div>
      </div>
      
      {/* Square Info Tooltip */}
      {hoveredSquare !== null && squareState[hoveredSquare] && (
        <div className="absolute top-4 right-4 w-64 z-20">
          <SquareInfo 
            square={squareState[hoveredSquare]}
            owner={playerState.find(p => p.id === squareState[hoveredSquare].ownerId)}
            houseLevel={playerState.find(p => p.id === squareState[hoveredSquare].ownerId)?.houses?.[hoveredSquare] || 0}
          />
        </div>
      )}
    </div>
  );
};

Board2D.propTypes = {
  squareState: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      index: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.number,
      ownerId: PropTypes.string,
    })
  ),
  playerState: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      pet: PropTypes.string.isRequired,
      position: PropTypes.number.isRequired,
      properties: PropTypes.array,
      houses: PropTypes.object,
    })
  ),
  onSquareClick: PropTypes.func,
};

export default Board2D;

