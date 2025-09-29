import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import MonopolyBoard from '../components/MonopolyBoard'
import GameConnection from '../components/GameConnection'

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="orange" />
    </mesh>
  )
}

const MonopolyGame = () => {
  return (
    <div className="app-container">
      <GameConnection />
      <Canvas
        className="canvas-container"
        camera={{ position: [15, 20, 15], fov: 50 }}
        shadows
      >
        <Suspense fallback={<LoadingFallback />}>
          <Environment preset="city" />
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[20, 30, 20]}
            intensity={1.5}
            castShadow
          />
          <directionalLight
            position={[-10, 20, -10]}
            intensity={0.8}
            color="#87CEEB"
          />
          <spotLight
            position={[0, 40, 0]}
            intensity={1}
            angle={Math.PI / 4}
            penumbra={0.5}
            color="#FFD700"
            castShadow
          />
          <ContactShadows position={[0, -0.5, 0]} opacity={0.6} scale={50} />
          <MonopolyBoard />
          <OrbitControls enablePan enableZoom enableRotate />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default MonopolyGame
