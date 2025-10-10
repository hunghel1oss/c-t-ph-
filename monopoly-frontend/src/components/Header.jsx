import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGameSocket } from '../hooks/useGameSocket';

const Header = () => {
  const { user, logout } = useAuth();
  const { disconnect } = useGameSocket();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    disconnect();
    navigate('/login');
  };
  
  return (
    <header className="bg-graffiti-dark border-b-4 border-neon-pink shadow-neon">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-pink to-neon-blue rounded-lg flex items-center justify-center animate-pulse-neon">
              <span className="text-2xl">🎲</span>
            </div>
            <h1 className="text-xl font-game text-neon-yellow neon-text hidden md:block">
              CỜ TỈ PHÚ
            </h1>
          </Link>
          
          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-white hover:text-neon-blue transition-colors text-sm"
            >
              Trang chủ
            </Link>
            <Link 
              to="/history" 
              className="text-white hover:text-neon-green transition-colors text-sm"
            >
              Lịch sử
            </Link>
            
            {/* User info */}
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-right hidden md:block">
                  <p className="text-xs text-neon-pink">{user.name}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 rounded-lg text-white text-sm hover:shadow-neon transition-all"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
