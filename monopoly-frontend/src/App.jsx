import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import { WebSocketProvider } from './providers/WebSocketProvider';
import { SocketProvider } from './contexts/SocketContext'; // ✅ THÊM DÒNG NÀY
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import History from './pages/History';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <SocketProvider> {/* ✅ THÊM SOCKETPROVIDER */}
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lobby/:roomCode"
                element={
                  <ProtectedRoute>
                    <Lobby />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game/:roomCode"
                element={
                  <ProtectedRoute>
                    <Game />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

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
          </SocketProvider> {/* ✅ ĐÓNG SOCKETPROVIDER */}
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
