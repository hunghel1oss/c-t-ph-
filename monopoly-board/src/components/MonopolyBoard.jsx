import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Box, Cylinder, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import Token from './Token'

// Board square component with 3D effects
const BoardSquare = ({ 
  square, 
  position, 
  index, 
  isHighlighted, 
  onClick,
  playersOnSquare = []
}) => {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation for highlighted squares
      if (isHighlighted) {
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.1
      } else {
        meshRef.current.position.y = 0
      }
      
      // Hover effect
      if (hovered) {
        meshRef.current.scale.setScalar(1.05)
      } else {
        meshRef.current.scale.setScalar(1)
      }
    }
  })

  const getSquareColor = (square) => {
    if (square.type === 'property') {
      return square.color || '#4caf50'
    } else if (square.type === 'railroad') {
      return '#333'
    } else if (square.type === 'utility') {
      return '#ffeb3b'
    } else if (square.type === 'tax') {
      return '#f44336'
    } else if (square.type === 'chance' || square.type === 'community_chest') {
      return '#2196f3'
    } else if (square.type === 'jail') {
      return '#ff5722'
    } else if (square.type === 'go') {
      return '#4caf50'
    } else if (square.type === 'free_parking') {
      return '#9c27b0'
    } else if (square.type === 'go_to_jail') {
      return '#f44336'
    }
    return '#ddd'
  }

  const squareColor = getSquareColor(square)
  const highlightColor = isHighlighted ? '#ffeb3b' : squareColor

  return (
    <group position={position}>
      {/* Main square */}
      <Box
        ref={meshRef}
        args={[1.8, 0.2, 1.8]}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation()
          onClick && onClick(index)
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={highlightColor}
          transparent={isHighlighted}
          opacity={isHighlighted ? 0.8 : 1}
        />
      </Box>

      {/* Property color bar for property squares */}
      {square.type === 'property' && square.color && (
        <Box
          args={[1.8, 0.21, 0.3]}
          position={[0, 0.01, 0.75]}
        >
          <meshStandardMaterial color={square.color} />
        </Box>
      )}

      {/* Square text */}
      <Text
        position={[0, 0.15, 0]}
        fontSize={0.12}
        color="black"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.6}
        textAlign="center"
      >
        {square.name}
      </Text>

      {/* Price text for purchasable properties */}
      {square.price && (
        <Text
          position={[0, 0.12, -0.6]}
          fontSize={0.08}
          color="#666"
          anchorX="center"
          anchorY="middle"
        >
          ${square.price}
        </Text>
      )}

      {/* Player tokens on this square */}
      {playersOnSquare.map((player, playerIndex) => (
        <PlayerToken3D
          key={player.id}
          player={player}
          position={getTokenPosition(playerIndex, playersOnSquare.length)}
        />
      ))}

      {/* Property improvements (houses/hotels) */}
      {square.houses > 0 && (
        <group>
          {Array.from({ length: Math.min(square.houses, 4) }).map((_, i) => (
            <Box
              key={i}
              args={[0.15, 0.3, 0.15]}
              position={[-0.6 + i * 0.3, 0.25, 0.4]}
            >
              <meshStandardMaterial color="#4caf50" />
            </Box>
          ))}
        </group>
      )}

      {square.hotels > 0 && (
        <Box
          args={[0.4, 0.4, 0.3]}
          position={[0, 0.3, 0.4]}
        >
          <meshStandardMaterial color="#f44336" />
        </Box>
      )}

      {/* Mortgage indicator */}
      {square.isMortgaged && (
        <Box
          args={[1.8, 0.05, 1.8]}
          position={[0, 0.11, 0]}
        >
          <meshStandardMaterial color="#666" transparent opacity={0.7} />
        </Box>
      )}
    </group>
  )
}

// 3D Player Token Component
const PlayerToken3D = ({ player, position }) => {
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle bobbing animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3 + player.id) * 0.02
      // Subtle rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  return (
    <group position={position}>
      <Cylinder
        ref={meshRef}
        args={[0.15, 0.15, 0.3]}
        position={[0, 0.25, 0]}
      >
        <meshStandardMaterial color={player.color || '#666'} />
      </Cylinder>
      
      {/* Player initial on token */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {player.name?.charAt(0)?.toUpperCase() || 'P'}
      </Text>

      {/* Status indicators */}
      {player.isInJail && (
        <Sphere
          args={[0.08]}
          position={[0.2, 0.4, 0]}
        >
          <meshStandardMaterial color="#f44336" />
        </Sphere>
      )}

      {player.isBot && (
        <Box
          args={[0.1, 0.1, 0.1]}
          position={[-0.2, 0.4, 0]}
        >
          <meshStandardMaterial color="#2196f3" />
        </Box>
      )}
    </group>
  )
}

// Calculate token positions when multiple players are on same square
const getTokenPosition = (index, totalPlayers) => {
  if (totalPlayers === 1) {
    return [0, 0, 0]
  }
  
  const radius = 0.4
  const angle = (index / totalPlayers) * Math.PI * 2
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  
  return [x, 0, z]
}

// Camera controller for better board viewing
const CameraController = () => {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(0, 12, 8)
    camera.lookAt(0, 0, 0)
  }, [camera])
  
  return null
}

// Main Monopoly Board Component
const MonopolyBoard = ({ 
  board = [], 
  players = [], 
  onTileClick = () => {}, 
  highlight = null 
}) => {
  // Generate board positions in a square layout
  const getBoardPositions = () => {
    const positions = []
    const boardSize = 10 // 10x10 grid for classic Monopoly
    const spacing = 2.2
    
    // Bottom row (0-9): left to right
    for (let i = 0; i < 10; i++) {
      positions.push([
        (i - 4.5) * spacing,
        0,
        4.5 * spacing
      ])
    }
    
    // Right column (10-19): bottom to top
    for (let i = 1; i < 10; i++) {
      positions.push([
        4.5 * spacing,
        0,
        (4.5 - i) * spacing
      ])
    }
    
    // Top row (20-29): right to left
    for (let i = 1; i < 10; i++) {
      positions.push([
        (4.5 - i) * spacing,
        0,
        -4.5 * spacing
      ])
    }
    
    // Left column (30-39): top to bottom
    for (let i = 1; i < 10; i++) {
      positions.push([
        -4.5 * spacing,
        0,
        (-4.5 + i) * spacing
      ])
    }
    
    return positions
  }

  // Group players by their current position
  const getPlayersOnSquare = (squareIndex) => {
    return players.filter(player => player.position === squareIndex)
  }

  const boardPositions = getBoardPositions()

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 12, 8], fov: 60 }}
        style={{ background: '#f0f8ff' }}
      >
        <CameraController />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[0, 8, 0]} intensity={0.4} />

        {/* Board base */}
        <Box args={[22, 0.1, 22]} position={[0, -0.1, 0]}>
          <meshStandardMaterial color="#2d5a27" />
        </Box>

        {/* Center logo area */}
        <Box args={[8, 0.15, 8]} position={[0, 0.05, 0]}>
          <meshStandardMaterial color="#fff" />
        </Box>
        
        <Text
          position={[0, 0.2, 0]}
          fontSize={0.8}
          color="#2d5a27"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          MONOPOLY
        </Text>

        {/* Board squares */}
        {board.map((square, index) => {
          const position = boardPositions[index]
          if (!position) return null

          return (
            <BoardSquare
              key={square.id || index}
              square={square}
              position={position}
              index={index}
              isHighlighted={highlight === index}
              onClick={onTileClick}
              playersOnSquare={getPlayersOnSquare(index)}
            />
          )
        })}

        {/* Orbit controls for camera manipulation */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={8}
          maxDistance={20}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* 2D Overlay for additional UI elements */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(255,255,255,0.9)',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <div><strong>Board Info</strong></div>
        <div>Squares: {board.length}</div>
        <div>Players: {players.length}</div>
        {highlight !== null && (
          <div style={{ color: '#f57c00' }}>
            Highlighted: Square {highlight}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '11px'
      }}>
        <div>🖱️ Click & drag to rotate</div>
        <div>🔍 Scroll to zoom</div>
        <div>🎯 Click squares to select</div>
      </div>
    </div>
  )
}

export default MonopolyBoard
