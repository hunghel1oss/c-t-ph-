import React from 'react'

const Token = ({ 
  player, 
  size = 30, 
  showName = false, 
  onClick = null,
  style = {},
  className = ''
}) => {
  if (!player) return null

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const tokenStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: player.color || '#666',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${Math.max(8, size * 0.4)}px`,
    fontWeight: 'bold',
    border: '2px solid rgba(255,255,255,0.8)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    position: 'relative',
    ...style
  }

  const hoverStyle = onClick ? {
    ':hover': {
      transform: 'scale(1.1)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
    }
  } : {}

  const nameStyle = {
    position: 'absolute',
    bottom: `-${size * 0.8}px`,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: `${Math.max(8, size * 0.25)}px`,
    color: player.color || '#666',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
    pointerEvents: 'none'
  }

  return (
    <div className={className}>
      <div
        style={tokenStyle}
        onClick={onClick}
        onMouseEnter={(e) => {
          if (onClick) {
            e.target.style.transform = 'scale(1.1)'
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.target.style.transform = 'scale(1)'
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
          }
        }}
        title={player.name}
        aria-label={`Player token for ${player.name}`}
      >
        {getInitials(player.name)}
        
        {/* Status indicators */}
        {player.isInJail && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: `${size * 0.3}px`,
            height: `${size * 0.3}px`,
            backgroundColor: '#f44336',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${size * 0.2}px`,
            border: '1px solid white'
          }}>
            🔒
          </div>
        )}
        
        {player.isBot && (
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: `${size * 0.25}px`,
            height: `${size * 0.25}px`,
            backgroundColor: '#2196f3',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${size * 0.15}px`,
            border: '1px solid white'
          }}>
            🤖
          </div>
        )}
      </div>
      
      {showName && (
        <div style={nameStyle}>
          {player.name}
        </div>
      )}
    </div>
  )
}

export default Token
