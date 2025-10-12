// monopoly-frontend/src/pages/Lobby.jsx (FINAL FIX)

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { gameAPI } from '../api/game.api';
import toast from 'react-hot-toast';
import { PET_TYPES } from '../config/constants';
import { useAuth } from '../hooks/useAuth'; 

const Lobby = () => {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();

    const [players, setPlayers] = useState([]);
    const [gameStatus, setGameStatus] = useState('waiting');
    const [isHost, setIsHost] = useState(false);
    const [currentPlayerStateId, setCurrentPlayerStateId] = useState(null);
    const [selectedPet, setSelectedPet] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [gameId, setGameId] = useState(null);
    const [isStarting, setIsStarting] = useState(false); // ✅ THÊM STATE CHẶN DOUBLE-CLICK

    const pets = PET_TYPES.map(pet => ({
        id: pet,
        name: pet.charAt(0).toUpperCase() + pet.slice(1),
        emoji: pet === 'lion' ? '🦁' : pet === 'dragon' ? '🐉' : pet === 'unicorn' ? '🦄' : '🔥'
    }));

    // ✅ FETCH GAME DATA BY ROOM CODE
    const fetchGameData = useCallback(async () => {
        if (!roomCode) return;

        try {
            const response = await gameAPI.getRoomInfo(roomCode);

            if (response.success) {
                const gameData = response.game;

                setPlayers(gameData.players || []);
                setGameStatus(gameData.status || 'waiting');
                setIsHost(response.isHost || false);
                setCurrentPlayerStateId(response.playerStateId);
                setGameId(gameData._id);

                const currentPlayer = gameData.players?.find(
                    p => p._id === response.playerStateId
                );

                if (currentPlayer) {
                    setSelectedPet(currentPlayer.pet || null);
                    setIsReady(currentPlayer.ready || false);
                }
            }
        } catch (error) {
            console.error('❌ [Lobby] Failed to load game:', error);
            toast.error(error.response?.data?.message || 'Không thể tải phòng');

            if (error.response?.status === 404 || error.response?.status === 403) {
                setTimeout(() => navigate('/'), 2000);
            }
        } finally {
            setLoading(false);
        }
    }, [roomCode, navigate]);

    // ✅ INITIAL LOAD
    useEffect(() => {
        setLoading(true); // Đặt lại trạng thái loading khi mount
        fetchGameData();
    }, [fetchGameData]);

    // ✅ SOCKET LISTENERS
    useEffect(() => {
        if (!roomCode || !socket || !isConnected) return;

        socket.emit('join_room', { roomCode });

        const handleRoomUpdate = (data) => {
            if (data.room) {
                fetchGameData();
            }
        };

        const handlePlayerReady = (data) => {
            setPlayers(prevPlayers =>
                prevPlayers.map(p =>
                    p._id === data.playerStateId
                        ? { ...p, pet: data.pet, ready: data.ready }
                        : p
                )
            );
        };

        const handleGameStarted = () => {
            toast.success('Game đã bắt đầu!');
            navigate(`/game/${roomCode}`);
        };

        socket.on('room:update', handleRoomUpdate);
        socket.on('player:ready', handlePlayerReady);
        socket.on('game:started', handleGameStarted);

        return () => {
            socket.off('room:update', handleRoomUpdate);
            socket.off('player:ready', handlePlayerReady);
            socket.off('game:started', handleGameStarted);
        };
    }, [roomCode, socket, isConnected, navigate, fetchGameData]);

    // ✅ CHỌN LINH VẬT
    const handleSelectPet = useCallback((petId) => {
        if (isReady) {
            toast.error('Hủy sẵn sàng để đổi linh vật');
            return;
        }

        const isPetTaken = players.some(
            p => p._id !== currentPlayerStateId && p.pet === petId
        );

        if (isPetTaken) {
            toast.error('Linh vật đã được chọn!');
            return;
        }

        setSelectedPet(petId);
        toast.success(`Đã chọn ${pets.find(p => p.id === petId)?.name}!`);
    }, [isReady, players, currentPlayerStateId, pets]);

    // ✅ TOGGLE READY
    const handleToggleReady = useCallback(async () => {
        if (!selectedPet) {
            toast.error('Chọn linh vật trước!');
            return;
        }

        try {
            const newReadyState = !isReady;

            const response = await gameAPI.setReady({
                roomCode,
                playerStateId: currentPlayerStateId,
                pet: selectedPet,
                ready: newReadyState
            });

            if (response.success) {
                setIsReady(newReadyState);
                toast.success(newReadyState ? 'Đã sẵn sàng!' : 'Đã hủy!');

                if (socket && isConnected) {
                    socket.emit('player:ready', {
                        roomCode,
                        playerStateId: currentPlayerStateId,
                        pet: selectedPet,
                        ready: newReadyState
                    });
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi cập nhật');
        }
    }, [selectedPet, isReady, roomCode, currentPlayerStateId, socket, isConnected]);

    // ✅ START GAME (HOST ONLY) - FINAL FIX
    const handleStartGame = useCallback(async () => {
        // ✅ CHẶN DOUBLE-CLICK
        if (isStarting) {
            console.log('⚠️ [Lobby] Game đang bắt đầu, bỏ qua click');
            return;
        }

        if (!gameId) {
            toast.error('Không tìm thấy game');
            return;
        }

        if (players.length < 2) {
            toast.error('Cần ít nhất 2 người chơi!');
            return;
        }

        if (!players.every(p => p.ready)) {
            toast.error('Tất cả phải sẵn sàng!');
            return;
        }

        try {
            // ✅ SET LOADING STATE NGAY LẬP TỨC
            setIsStarting(true);

            const response = await gameAPI.startGame({ gameId });

            if (response.success) {
                toast.success('Bắt đầu game...');

                // ✅ GỬI SOCKET EVENT CHO GUEST
                if (socket && isConnected) {
                    socket.emit('game:started', { roomCode });
                }

                // ✅ CHUYỂN HƯỚNG HOST NGAY LẬP TỨC (0ms delay)
                navigate(`/game/${roomCode}`);
            }
        } catch (error) {
            // ✅ NẾU LỖI, CHO PHÉP CLICK LẠI
            setIsStarting(false);
            toast.error(error.response?.data?.message || 'Không thể bắt đầu');
        }
    }, [isStarting, gameId, socket, isConnected, roomCode, players, navigate]);

    // ✅ COPY ROOM CODE
    const handleCopyRoomCode = useCallback(() => {
        navigator.clipboard.writeText(roomCode)
            .then(() => toast.success('Đã copy!'))
            .catch(() => toast.error('Lỗi copy'));
    }, [roomCode]);

    // ✅ LEAVE ROOM
    const handleLeaveRoom = useCallback(() => {
        if (socket && isConnected) {
            socket.emit('leave_room', { roomCode });
        }
        navigate('/');
    }, [socket, isConnected, roomCode, navigate]);

    const allPlayersReady = players.length >= 2 && players.every(p => p.ready);

    // ✅ LOADING STATE
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="text-white text-2xl">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mx-auto mb-4"></div>
                    <p>Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* HEADER SECTION */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">🎮 Phòng Chờ</h1>
                            <div className="flex items-center gap-4">
                                <span className="text-white/70">Mã phòng:</span>
                                <code className="bg-white/20 px-4 py-2 rounded-lg text-white font-mono text-xl">
                                    {roomCode}
                                </code>
                                <button
                                    onClick={handleCopyRoomCode}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    📋 Copy
                                </button>
                                {isHost && (
                                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                        👑 HOST
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleLeaveRoom}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                        >
                            🚪 Rời Phòng
                        </button>
                    </div>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT PANEL - PET SELECTION */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                            <h2 className="text-2xl font-bold text-white mb-4">🎭 Chọn Linh Vật</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {pets.map(pet => {
                                    const isPetTaken = players.some(
                                        p => p._id !== currentPlayerStateId && p.pet === pet.id
                                    );
                                    const isSelected = selectedPet === pet.id;

                                    return (
                                        <button
                                            key={pet.id}
                                            onClick={() => handleSelectPet(pet.id)}
                                            disabled={isPetTaken || isReady}
                                            className={`
                                                relative p-6 rounded-xl transition-all
                                                ${isSelected
                                                    ? 'bg-green-500 ring-4 ring-green-300'
                                                    : isPetTaken
                                                        ? 'bg-gray-500 opacity-50 cursor-not-allowed'
                                                        : 'bg-white/20 hover:bg-white/30'
                                                }
                                            `}
                                        >
                                            <div className="text-6xl mb-2">{pet.emoji}</div>
                                            <p className="text-white font-bold">{pet.name}</p>
                                            {isPetTaken && (
                                                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                                    ❌ Đã chọn
                                                </span>
                                            )}
                                            {isSelected && (
                                                <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                                    ✅
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={handleToggleReady}
                                disabled={!selectedPet}
                                className={`
                                    w-full mt-6 py-3 rounded-lg font-bold text-white transition-colors
                                    ${!selectedPet
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : isReady
                                            ? 'bg-red-500 hover:bg-red-600'
                                            : 'bg-green-500 hover:bg-green-600'
                                    }
                                `}
                            >
                                {!selectedPet
                                    ? '⚠️ Chọn linh vật'
                                    : isReady
                                        ? '❌ HỦY SẴN SÀNG'
                                        : '✅ SẴN SÀNG'
                                }
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANEL - PLAYERS LIST */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                            <h2 className="text-2xl font-bold text-white mb-4">
                                👥 Người Chơi ({players.length}/4)
                            </h2>

                            <div className="space-y-4 mb-6">
                                {players.map((player) => {
                                    const petData = pets.find(p => p.id === player.pet);
                                    const isCurrentPlayer = player._id === currentPlayerStateId;

                                    return (
                                        <div
                                            key={player._id}
                                            className={`
                                                flex items-center justify-between p-4 rounded-xl
                                                ${isCurrentPlayer
                                                    ? 'bg-blue-500/30 ring-2 ring-blue-400'
                                                    : 'bg-white/10'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                                                    {player.userId?.name?.charAt(0).toUpperCase() || '?'}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-white font-bold text-lg">
                                                            {player.userId?.name || 'Unknown'}
                                                        </p>
                                                        {isCurrentPlayer && (
                                                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                                                YOU
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-white/70 text-sm">
                                                        {player.userId?.email || 'No email'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {petData && (
                                                    <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                                                        <span className="text-3xl">{petData.emoji}</span>
                                                        <span className="text-white font-bold">
                                                            {petData.name}
                                                        </span>
                                                    </div>
                                                )}
                                                {player.ready ? (
                                                    <span className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold">
                                                        ✅ Sẵn sàng
                                                    </span>
                                                ) : (
                                                    <span className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold">
                                                        ⏳ Chờ...
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* EMPTY SLOTS */}
                                {[...Array(Math.max(0, 4 - players.length))].map((_, index) => (
                                    <div
                                        key={`empty-${index}`}
                                        className="flex items-center justify-center p-4 rounded-xl bg-white/5 border-2 border-dashed border-white/20"
                                    >
                                        <p className="text-white/50 font-bold">
                                            🔓 Chờ người chơi...
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* START BUTTON (HOST ONLY) */}
                            {isHost && (
                                <button
                                    onClick={handleStartGame}
                                    disabled={!allPlayersReady || isStarting}
                                    className={`
                                        w-full px-6 py-4 rounded-lg font-bold text-white text-xl transition-all
                                        ${allPlayersReady && !isStarting
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-gray-400 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {isStarting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                                            Đang bắt đầu...
                                        </span>
                                    ) : allPlayersReady ? (
                                        '🎮 BẮT ĐẦU GAME'
                                    ) : (
                                        `⏳ Chờ sẵn sàng (${players.filter(p => p.ready).length}/${players.length})`
                                    )}
                                </button>
                            )}

                            {/* WAITING MESSAGE (GUEST) */}
                            {!isHost && (
                                <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                                    <p className="text-white font-bold">
                                        ⏳ Chờ host bắt đầu...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Lobby;