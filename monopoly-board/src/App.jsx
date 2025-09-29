import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import MonopolyGame from "./pages/MonopolyGame";
import MonopolyBoard from "./components/MonopolyBoard";
import GameConnection from "./components/GameConnection";


import "./App.css";

// Fallback loader while models are loading
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="orange" />
    </mesh>
  );
}

function App() {
  return (
    <div className="app-container">
      {/* React Router for navigation */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/monopoly" element={<MonopolyGame />} />
      </Routes>

      {/* Connection test with backend */}
      <GameConnection />

      {/* 3D Scene */}
      <Canvas
        className="canvas-container"
        shadows
        camera={{
          position: [15, 20, 15],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Environment reflection */}
          <Environment preset="city" />

          {/* Ambient Light */}
          <ambientLight intensity={0.4} />

          {/* Key Light */}
          <directionalLight
            position={[20, 30, 20]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={100}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            shadow-bias={-0.0001}
          />

          {/* Fill Light */}
          <directionalLight
            position={[-10, 20, -10]}
            intensity={0.8}
            color="#87CEEB"
          />

          {/* Rim Light */}
          <spotLight
            position={[0, 40, 0]}
            intensity={1}
            angle={Math.PI / 4}
            penumbra={0.5}
            color="#FFD700"
            castShadow
          />

          {/* Contact Shadows for realism */}
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.6}
            scale={50}
            blur={2}
            far={20}
          />

          {/* Monopoly 3D Board (load from public/models/) */}
          <MonopolyBoard />

          {/* Camera Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={10}
            maxDistance={50}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
      
    </div>
  );
}

export default App;
