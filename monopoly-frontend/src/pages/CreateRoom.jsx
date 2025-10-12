import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameAPI } from '../api/game.api';

const CreateRoom = () => {
  const [duration, setDuration] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🎮 Creating room with duration:', duration);
      
      const response = await gameAPI.createRoom({ duration });
      
      console.log('✅ Room created:', response);
      
      if (response.success) {
        // Lưu thông tin phòng vào localStorage hoặc context
        localStorage.setItem('currentRoom', JSON.stringify({
          roomCode: response.roomCode,
          gameId: response.gameId,
          playerStateId: response.playerStateId,
        }));
        
        // Chuyển đến trang phòng chờ
        navigate(`/room/${response.roomCode}`);
      }
      
    } catch (err) {
      console.error('❌ Create room failed:', err);
      setError(err.response?.data?.message || 'Không thể tạo phòng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Tạo phòng</h1>
      
      <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
        <option value={20}>20 phút</option>
        <option value={60}>60 phút</option>
      </select>
      
      <button onClick={handleCreateRoom} disabled={loading}>
        {loading ? 'Đang tạo...' : 'Tạo phòng'}
      </button>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default CreateRoom;
