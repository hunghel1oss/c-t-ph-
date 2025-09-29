import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Box, Text } from '@react-three/drei'
import * as THREE from 'three'

// Individual 3D Die Component
const Die3D = ({ value, position, isRolling, rotationSpeed = 1 }) => {
  const meshRef = useRef()
  const [targetRotation, setTargetRotation] = useState([0, 0, 0])

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (isRolling) {
        // Spinning animation while rolling
        meshRef.current.rotation.x += rotationSpeed * delta * 10
        meshRef.current.rotation.y += rotationSpeed * delta * 8
        meshRef.current.rotation.z += rotationSpeed * delta * 6
      } else {
        // Settle to final rotation based on value
        const finalRotation = getDieRotationForValue(value)
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, finalRotation[0], delta * 5)
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, finalRotation[1], delta * 5)
        meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, finalRotation[2], delta * 5)
      }

      // Gentle floating effect
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05
    }
  })

  const getDieRotationForValue = (value) => {
    // Return rotation angles to show the correct face
    switch (value) {
      case 1: return [0, 0, 0]
      case 2: return [Math.PI / 2, 0, 0]
      case 3: return [0, 0, Math.PI / 2]
      case 4: return [0, 0, -Math.PI / 2]
      case 5: return [-Math.PI / 2, 0, 0]
      case 6: return [Math.PI, 0, 0]
      default: return [0, 0, 0]
    }
  }

  return (
    <group position={position}>
      <Box
        ref={meshRef}
        args={[1, 1, 1]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#f5f5f5" />
      </Box>

      {/* Die faces with numbers */}
      {[1, 2, 3, 4, 5, 6].map((face, index) => {
        const facePositions = [
          [0, 0, 0.51],   // 1 - front
          [0.51, 0, 0],   // 2 - right
          [0, 0.51, 0],   // 3 - top
          [0, -0.51, 0],  // 4 - bottom
          [-0.51, 0, 0],  // 5 - left
          [0, 0, -0.51]   // 6 - back
        ]

        return (
          <Text
            key={face}
            position={facePositions[index]}
            fontSize={0.3}
            color="black"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {face}
          </Text>
        )
      })}

      {/* Die dots pattern (alternative to numbers) */}
      {!isRolling && renderDieDots(value, position)}
    </group>
  )
}

// Render dots on die faces
const renderDieDots = (value, position) => {
  const dotPositions = {
    1: [[0, 0, 0.52]],
    2: [[-0.2, 0.2, 0.52], [0.2, -0.2, 0.52]],
    3: [[-0.2, 0.2, 0.52], [0, 0, 0.52], [0.2, -0.2, 0.52]],
    4: [[-0.2, 0.2, 0.52], [0.2, 0.2, 0.52], [-0.2, -0.2, 0.52], [0.2, -0.2, 0.52]],
    5: [[-0.2, 0.2, 0.52], [0.2, 0.2, 0.52], [0, 0, 0.52], [-0.2, -0.2, 0.52], [0.2, -0.2, 0.52]],
    6: [[-0.2, 0.3, 0.52], [0.2, 0.3, 0.52], [-0.2, 0, 0.52], [0.2, 0, 0.52], [-0.2, -0.3, 0.52], [0.2, -0.3, 0.52]]
  }

  return (
    <group>
      {dotPositions[value]?.map((dotPos, index) => (
        <mesh key={index} position={dotPos}>
          <sphereGeometry args={[0.05]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
    </group>
  )
}

// Main Dice Component
const Dice = forwardRef(({ 
  onAnimationComplete = () => {}, 
  size = 200,
  style = {},
  disabled = false 
}, ref) => {
  const [dice1, setDice1] = useState(1)
  const [dice2, setDice2] = useState(1)
  const [isRolling, setIsRolling] = useState(false)
  const [rollSpeed, setRollSpeed] = useState(1)
  
  const animationTimeoutRef = useRef()

  // Expose imperative methods to parent component
  useImperativeHandle(ref, () => ({
    animateTo: async (d1, d2) => {
      return new Promise((resolve) => {
        setIsRolling(true)
        setRollSpeed(Math.random() * 0.5 + 0.5) // Vary animation speed
        
        // Clear any existing timeout
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current)
        }

        // Animate for 2 seconds, then settle to final values
        animationTimeoutRef.current = setTimeout(() => {
          setDice1(d1)
          setDice2(d2)
          setIsRolling(false)
          
          // Call completion callback after a short delay for settling animation
          setTimeout(() => {
            onAnimationComplete({ dice1: d1, dice2: d2 })
            resolve({ dice1: d1, dice2: d2 })
          }, 500)
        }, 2000)
      })
    },
    
    getCurrentValues: () => ({ dice1, dice2 }),
    
    isAnimating: () => isRolling
  }))

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  const containerStyle = {
    width: `${size}px`,
    height: `${size * 0.6}px`,
    position: 'relative',
    cursor: disabled ? 'not-allowed' : 'default',
    opacity: disabled ? 0.6 : 1,
    ...style
  }

  return (
    <div style={containerStyle}>
      <Canvas
        camera={{ position: [0, 2, 4], fov: 50 }}
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent'
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[0, 2, 2]} intensity={0.4} />

        {/* Two dice */}
        <Die3D
          value={dice1}
          position={[-0.8, 0, 0]}
          isRolling={isRolling}
          rotationSpeed={rollSpeed}
        />
        
        <Die3D
          value={dice2}
          position={[0.8, 0, 0]}
          isRolling={isRolling}
          rotationSpeed={rollSpeed * 1.2}
        />

        {/* Rolling surface */}
        <Box args={[4, 0.1, 2]} position={[0, -0.6, 0]} receiveShadow>
          <meshStandardMaterial color="#4caf50" />
        </Box>
      </Canvas>

      {/* 2D Overlay showing current values */}
      <div style={{
        position: 'absolute',
        bottom: '5px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {isRolling ? 'Rolling...' : `${dice1} + ${dice2} = ${dice1 + dice2}`}
      </div>

      {/* Rolling indicator */}
      {isRolling && (
        <div style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          width: '20px',
          height: '20px',
          border: '2px solid #2196f3',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}

      {/* Add CSS animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})

Dice.displayName = 'Dice'

export default Dice
