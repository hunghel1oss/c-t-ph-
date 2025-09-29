import React, { useEffect, useState, useCallback } from 'react';
import { gameService } from '../services/gameService';

function GameConnection() {
  // ===========================================
  // STATE MANAGEMENT
  // ===========================================
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    socket: false,
    api: false
  });

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================
  
  /**
   * Fetch games from server
   */
  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get games from API first
      const gamesData = await gameService.getRooms();
      
      if (gamesData && Array.isArray(gamesData)) {
        setGames(gamesData);
      } else {
        setGames([]);
      }
      
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Không thể kết nối đến server');
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle game updates from socket
   */
  const handleGameUpdate = useCallback((updatedGame) => {
    setGames(prevGames => {
      const gameIndex = prevGames.findIndex(game => game._id === updatedGame._id);
      
      if (gameIndex !== -1) {
        // Update existing game
        const newGames = [...prevGames];
        newGames[gameIndex] = updatedGame;
        return newGames;
      } else {
        // Add new game
        return [...prevGames, updatedGame];
      }
    });
  }, []);

  /**
   * Handle game removal
   */
  const handleGameRemoved = useCallback((gameId) => {
    setGames(prevGames => prevGames.filter(game => game._id !== gameId));
  }, []);

  /**
   * Update connection status
   */
  const updateConnectionStatus = useCallback(() => {
    const status = gameService.getConnectionStatus();
    setConnectionStatus(status);
  }, []);

  // ===========================================
  // EFFECTS
  // ===========================================
  
  useEffect(() => {
    let isComponentMounted = true;

    // Initialize game service
    const initializeConnection = async () => {
      try {
        // Initialize game service
        await gameService.initialize();
        
        // Update connection status
        updateConnectionStatus();
        
        // Fetch initial games data
        if (isComponentMounted) {
          await fetchGames();
        }
        
      } catch (err) {
        console.error('Failed to initialize game service:', err);
        if (isComponentMounted) {
          setError('Không thể khởi tạo kết nối');
          setLoading(false);
        }
      }
    };

    initializeConnection();

    // Set up periodic connection status checks
    const statusInterval = setInterval(updateConnectionStatus, 5000);

    // Cleanup function
    return () => {
      isComponentMounted = false;
      clearInterval(statusInterval);
      gameService.cleanup();
    };
  }, [fetchGames, updateConnectionStatus]);

  // Socket event listeners
  useEffect(() => {
    // Note: Assuming gameService handles socket events internally
    // If you need direct socket event handling, you can add it here
    
    // Example of how to handle socket events if gameService exposes them:
    /*
    const unsubscribeGameUpdate = gameService.onGameUpdate?.(handleGameUpdate);
    const unsubscribeGameRemoved = gameService.onGameRemoved?.(handleGameRemoved);
    
    return () => {
      unsubscribeGameUpdate?.();
      unsubscribeGameRemoved?.();
    };
    */
  }, [handleGameUpdate, handleGameRemoved]);

  // ===========================================
  // EVENT HANDLERS
  // ===========================================
  
  /**
   * Retry connection
   */
  const handleRetry = useCallback(async () => {
    setError(null);
    await fetchGames();
  }, [fetchGames]);

  /**
   * Join a game room
   */
  const handleJoinGame = useCallback(async (gameId) => {
    try {
      const result = await gameService.joinRoom(gameId);
      
      if (result.ok) {
        console.log('Successfully joined game:', gameId);
        // Handle successful join (e.g., navigate to game screen)
      } else {
        setError(`Không thể tham gia game: ${result.reason}`);
      }
    } catch (err) {
      console.error('Error joining game:', err);
      setError('Lỗi khi tham gia game');
    }
  }, []);

  /**
   * Create new game
   */
  const handleCreateGame = useCallback(async () => {
    try {
      const result = await gameService.createRoom({
        name: `Game ${Date.now()}`,
        maxPlayers: 4
      });
      
      if (result.ok) {
        console.log('Successfully created game:', result.roomId);
        // Refresh games list
        await fetchGames();
      } else {
        setError(`Không thể tạo game: ${result.reason}`);
      }
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Lỗi khi tạo game');
    }
  }, [fetchGames]);

  // ===========================================
  // RENDER HELPERS
  // ===========================================
  
  /**
   * Render connection status indicator
   */
  const renderConnectionStatus = () => (
    <div className="connection-status">
      <span className={`status-indicator ${connectionStatus.socket ? 'connected' : 'disconnected'}`}>
        Socket: {connectionStatus.socket ? '🟢 Kết nối' : '🔴 Mất kết nối'}
      </span>
      <span className={`status-indicator ${connectionStatus.api ? 'connected' : 'disconnected'}`}>
        API: {connectionStatus.api ? '🟢 Sẵn sàng' : '🔴 Lỗi'}
      </span>
    </div>
  );

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="game-connection loading">
        <h2>Danh sách game</h2>
        {renderConnectionStatus()}
        <div className="loading-spinner">
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="game-connection error">
        <h2>Danh sách game</h2>
        {renderConnectionStatus()}
        <div className="error-message">
          <p>❌ Lỗi: {error}</p>
          <button onClick={handleRetry} className="retry-button">
            🔄 Thử lại
          </button>
        </div>
      </div>
    );
  }

  // ===========================================
  // MAIN RENDER
  // ===========================================
  
  return (
    <div className="game-connection">
      <header className="game-connection-header">
        <h2>Danh sách game</h2>
        {renderConnectionStatus()}
        <button onClick={handleCreateGame} className="create-game-button">
          ➕ Tạo game mới
        </button>
      </header>

      <main className="games-list">
        {games.length === 0 ? (
          <div className="no-games">
            <p>🎮 Không có game nào</p>
            <p>Hãy tạo game mới để bắt đầu!</p>
          </div>
        ) : (
          <div className="games-grid">
            {games.map(game => (
              <div key={game._id || game.id} className="game-card">
                <div className="game-info">
                  <h3>{game.name || `Game ${game._id}`}</h3>
                  <p>👥 {game.players?.length || 0}/{game.maxPlayers || 4} người chơi</p>
                  <p>🎯 Trạng thái: {game.status || 'Đang chờ'}</p>
                </div>
                <div className="game-actions">
                  <button 
                    onClick={() => handleJoinGame(game._id || game.id)}
                    className="join-button"
                    disabled={game.players?.length >= (game.maxPlayers || 4)}
                  >
                    {game.players?.length >= (game.maxPlayers || 4) ? '🔒 Đầy' : '🚀 Tham gia'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="game-connection-footer">
        <button onClick={fetchGames} className="refresh-button">
          🔄 Làm mới
        </button>
      </footer>
    </div>
  );
}

export default GameConnection;