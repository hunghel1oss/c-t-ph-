import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import PropTypes from 'prop-types';

/**
 * Single Dice 3D
 */
const SingleDice = ({ value = 1, isRolling = false, position = [0, 0, 0] }) => {
  const meshRef = useRef();
  const [rotation, setRotation] = useState([0, 0, 0]);
  
  useFrame(() => {
    if (isRolling && meshRef.current) {
      meshRef.current.rotation.x += 0.2;
      meshRef.current.rotation.y += 0.2;
      meshRef.current.rotation.z += 0.1;
    }
  });
  
  useEffect(() => {
    if (!isRolling) {
      // Set rotation based on dice value
      const rotations = {
        1: [0, 0, 0],
        2: [0, Math.PI / 2, 0],
        3: [0, Math.PI, 0],
        4: [0, -Math.PI / 2, 0],
        5: [Math.PI / 2, 0, 0],
        6: [-Math.PI / 2, 0, 0],
      };
      setRotation(rotations[value] || [0, 0, 0]);
    }
  }, [value, isRolling]);
  
  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#FFFFFF" />
      
      {/* Dots on faces - simplified version */}
      {/* Face 1 (front): 1 dot */}
      <mesh position={[0, 0, 0.51]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* Face 6 (back): 6 dots */}
      {[-0.3, 0, 0.3].map((y) =>
        [-0.3, 0.3].map((x) => (
          <mesh key={`${x}-${y}`} position={[x, y, -0.51]}>
            <circleGeometry args={[0.1, 16]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        ))
      )}
    </mesh>
  );
};

SingleDice.propTypes = {
  value: PropTypes.number,
  isRolling: PropTypes.bool,
  position: PropTypes.arrayOf(PropTypes.number),
};

/**
 * Dice3D Component - 2 xúc xắc
 */
const Dice3D = ({ dice = [1, 1], isRolling = false, onRollComplete }) => {
  useEffect(() => {
    if (isRolling) {
      // Simulate roll duration
      const timer = setTimeout(() => {
        if (onRollComplete) {
          onRollComplete();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isRolling, onRollComplete]);
  
  return (
    <div className="w-full h-64 relative">
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Dice 1 */}
        <SingleDice value={dice[0]} isRolling={isRolling} position={[-1.2, 0, 0]} />
        
        {/* Dice 2 */}
        <SingleDice value={dice[1]} isRolling={isRolling} position={[1.2, 0, 0]} />
        
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
      
      {/* Overlay result */}
      {!isRolling && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-graffiti-dark bg-opacity-80 px-6 py-3 rounded-lg border-2 border-neon-yellow">
          <p className="text-neon-yellow text-2xl font-bold text-center">
            {dice[0]} + {dice[1]} = {dice[0] + dice[1]}
          </p>
        </div>
      )}
    </div>
  );
};

Dice3D.propTypes = {
  dice: PropTypes.arrayOf(PropTypes.number),
  isRolling: PropTypes.bool,
  onRollComplete: PropTypes.func,
};

export default Dice3D;
