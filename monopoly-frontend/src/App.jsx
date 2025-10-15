import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import { WebSocketProvider } from './providers/WebSocketProvider';
import ProtectedRoute from './components/ProtectedRoute'; 

// Lazy loading các pages để tối ưu hiệu suất
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Game = lazy(() => import('./pages/Game'));
const History = lazy(() => import('./pages/History'));
const PhotoBoothApp = lazy(() => import('./pages/PhotoBoothApp'));

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider> 
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes - SỬ DỤNG CÚ PHÁP CHILDREN */}
                <Route path="/" element={
                    <ProtectedRoute><Home /></ProtectedRoute>
                } />
                <Route path="/lobby/:roomCode" element={
                    <ProtectedRoute><Lobby /></ProtectedRoute>
                } />
                <Route path="/game/:roomCode" element={
                    <ProtectedRoute><Game /></ProtectedRoute>
                } />
                <Route path="/history" element={
                    <ProtectedRoute><History /></ProtectedRoute>
                } />

                {/* ✅ TÍCH HỢP: Route cho PhotoBooth */}
                <Route path="/photobooth" element={
                    <ProtectedRoute><PhotoBoothApp /></ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1a1a2e',
                  color: '#fff',
                  border: '2px solid #00f0ff',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)',
                },
                success: {
                  iconTheme: {
                    primary: '#00ff88',
                    secondary: '#1a1a2e',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ff1053',
                    secondary: '#1a1a2e',
                  },
                },
              }}
            />
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500 mx-auto mb-4"></div>
            Đang tải ứng dụng...
        </div>
    </div>
);

const NotFound = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <h1 className="text-4xl text-red-500">404 - Không tìm thấy trang</h1>
    </div>
);


export default App;