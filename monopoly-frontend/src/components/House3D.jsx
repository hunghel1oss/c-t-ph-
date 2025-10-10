import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import PropTypes from 'prop-types';

/**
 * Component 3D House - nhà trên property
 * Level 1-3: nhà thường, Level 4: hotel
 */
const House3D = ({ level = 1, position = [0, 0, 0], color = '#00F0FF' }) => {
  const meshRef = useRef();
  
  // Hotel có animation glow
  useFrame((state) => {
    if (level === 4 && meshRef.current) {
      const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      meshRef.current.children.forEach(child => {
        if (child.material) {
          child.material.emissiveIntensity = intensity;
        }
      });
    }
  });
  
  const renderHouse = () => {
    if (level === 4) {
      // Hotel: đặc biệt với mái cong và đèn neon
      return (
        <group ref={meshRef} position={position}>
          {/* Base */}
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.4, 0.3, 0.4]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
          </mesh>
          {/* Floor 2 */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.35, 0.2, 0.35]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
          </mesh>
          {/* Roof */}
          <mesh position={[0, 0.6, 0]}>
            <coneGeometry args={[0.25, 0.2, 4]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} />
          </mesh>
          {/* Neon sign */}
          <mesh position={[0, 0.75, 0]}>
                        <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={1} />
          </mesh>
        </group>
      );
    } else {
      // House level 1-3: simple house
      const houseSize = 0.15 + (level * 0.05);
      return (
        <group ref={meshRef} position={position}>
          {/* Base */}
          <mesh position={[0, houseSize / 2, 0]}>
            <boxGeometry args={[houseSize, houseSize, houseSize]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Roof */}
          <mesh position={[0, houseSize, 0]}>
            <coneGeometry args={[houseSize * 0.7, houseSize * 0.5, 4]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
        </group>
      );
    }
  };
  
  return renderHouse();
};

House3D.propTypes = {
  level: PropTypes.number,
  position: PropTypes.arrayOf(PropTypes.number),
  color: PropTypes.string,
};

export default House3D;

