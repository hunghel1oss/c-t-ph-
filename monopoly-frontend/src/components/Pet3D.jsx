import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PET_COLORS } from '../config/constants';
import PropTypes from 'prop-types';

/**
 * Component 3D Pet - linh vật của người chơi
 * Tạo bằng primitives (không cần external assets)
 */
const Pet3D = ({ petType, position = [0, 0, 0], scale = 1 }) => {
  const meshRef = useRef();
  const color = PET_COLORS[petType] || '#FFFFFF';
  
  // Animation: float lên xuống
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.rotation.y += 0.01;
    }
  });
  
  // Render different shapes for different pets
  const renderPet = () => {
    switch (petType) {
      case 'lion':
        // Lion: sphere + small spheres for mane
        return (
          <group ref={meshRef} position={position} scale={scale}>
            {/* Body */}
            <mesh>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
            </mesh>
            {/* Mane */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(angle) * 0.25, 0, Math.sin(angle) * 0.25]}>
                  <sphereGeometry args={[0.1, 8, 8]} />
                  <meshStandardMaterial color={color} />
                </mesh>
              );
            })}
          </group>
        );
      
      case 'dragon':
        // Dragon: elongated body with spikes
        return (
          <group ref={meshRef} position={position} scale={scale}>
            {/* Body */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.15, 0.6, 8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
            {/* Head */}
            <mesh position={[0.35, 0, 0]}>
              <coneGeometry args={[0.15, 0.3, 8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            {/* Spikes */}
            {[-0.2, 0, 0.2].map((z, i) => (
              <mesh key={i} position={[0, 0.25, z]}>
                <coneGeometry args={[0.05, 0.15, 4]} />
                <meshStandardMaterial color={color} />
              </mesh>
            ))}
          </group>
        );
      
      case 'unicorn':
        // Unicorn: body + horn
        return (
          <group ref={meshRef} position={position} scale={scale}>
            {/* Body */}
            <mesh>
              <capsuleGeometry args={[0.15, 0.4, 8, 16]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
            </mesh>
            {/* Horn */}
            <mesh position={[0, 0.4, 0]}>
              <coneGeometry args={[0.08, 0.4, 8]} />
              <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} />
            </mesh>
          </group>
        );
      
      case 'phoenix':
        // Phoenix: bird shape with wings
        return (
          <group ref={meshRef} position={position} scale={scale}>
            {/* Body */}
            <mesh>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
            </mesh>
            {/* Wings */}
            <mesh position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.1, 0.4, 0.05]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0.3, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <boxGeometry args={[0.1, 0.4, 0.05]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
            {/* Tail feathers */}
            <mesh position={[0, -0.3, 0]}>
              <coneGeometry args={[0.1, 0.3, 3]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
            </mesh>
          </group>
        );
      
      default:
        return (
          <mesh ref={meshRef} position={position} scale={scale}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
    }
  };
  
  return renderPet();
};

Pet3D.propTypes = {
  petType: PropTypes.string.isRequired,
  position: PropTypes.arrayOf(PropTypes.number),
  scale: PropTypes.number,
};

export default Pet3D;
