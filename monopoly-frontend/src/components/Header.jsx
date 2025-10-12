// monopoly-frontend/src/components/Header.jsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// ✅ Thêm logoRef để tương thích với Home.jsx mới
const Header = ({ logoRef }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        // Không cần navigate ở đây nếu đã có logic trong useAuth/App.jsx
    };

    return (
        <header className="py-4 container mx-auto px-4">
            <div className="flex items-center justify-between">
                {/* ✅ LOGO MỚI (HUNG HUAN) */}
                <Link to="/" className="flex items-center space-x-3">
                    <h1 
                        ref={logoRef} 
                        className="text-4xl font-game text-white tracking-widest"
                    >
                        HUNG HUAN
                    </h1>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center space-x-6">
                    <Link to="/" className="text-white/80 hover:text-neon-yellow transition-colors text-sm font-bold">
                        Trang chủ
                    </Link>
                    <Link to="/history" className="text-white/80 hover:text-neon-yellow transition-colors text-sm font-bold">
                        Lịch sử
                    </Link>

                    {user && (
                        <div className="flex items-center space-x-4 bg-white/10 rounded-full px-4 py-2">
                            {/* ✅ FIX LOGIC: Dùng user.name */}
                            <p className="text-white text-sm font-medium hidden md:block">{user.name || user.email}</p>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-700 rounded-full text-white text-xs font-bold hover:opacity-80 transition-all"
                            >
                                ĐĂNG XUẤT
                            </button>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;