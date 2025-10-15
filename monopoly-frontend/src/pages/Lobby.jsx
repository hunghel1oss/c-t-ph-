import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../providers/WebSocketProvider'; 
import { gameAPI } from '../api/game.api';
import toast from 'react-hot-toast';
import { PET_TYPES } from '../config/constants';
import { useAuth } from '../hooks/useAuth'; 

const Lobby = () => {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const { socket, connected, gameState, setGameState, emit, chatMessages, on, off } = useWebSocket(); 
    const { user } = useAuth();

    const [isHost, setIsHost] = useState(false);
    const [currentPlayerStateId, setCurrentPlayerStateId] = useState(null);
    const [selectedPet, setSelectedPet] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [gameId, setGameId] = useState(null);
    const [isStarting, setIsStarting] = useState(false); 
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);

    const players = gameState?.players || [];
    const gameStatus = gameState?.status || 'waiting';

    const pets = PET_TYPES.map(pet => ({
        id: pet,
        name: pet.charAt(0).toUpperCase() + pet.slice(1),
        emoji: pet === 'lion' ? '🦁' : pet === 'dragon' ? '🐉' : pet === 'unicorn' ? '🦄' : '🔥'
    }));

    // Scroll to bottom khi tin nhắn mới đến
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [chatMessages]);


    // ✅ FETCH GAME DATA BY ROOM CODE (Tải ban đầu)
    const fetchGameData = useCallback(async () => {
        if (!roomCode) return;

        try {
            const response = await gameAPI.getRoomInfo(roomCode);

            if (response.success) {
                const gameData = response.game;

                setGameState(gameData);

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
                
                // Gửi sự kiện Socket sau khi tải data thành công
                if (socket && connected) {
                    emit('AUTHENTICATE_GAME', { roomCode });
                }
            }
        } catch (error) {
            console.error('❌ [Lobby] Failed to load game:', error);
            toast.error(error.response?.data?.message || 'Không thể tải phòng');
            
            // FIX: Vô hiệu hóa lệnh chuyển hướng dự phòng
            if (error.response?.status === 404 || error.response?.status === 403) {
                console.warn("⚠️ [Lobby] Navigation suppressed. Check Network tab for real error.");
            }
        } finally {
            setLoading(false);
        }
    }, [roomCode, navigate, socket, connected, setGameState, emit]);

    // ✅ INITIAL LOAD
    useEffect(() => {
        setLoading(true);
        fetchGameData();
    }, [fetchGameData]);
    
    // ✅ SOCKET LISTENERS (Bắt sự kiện GAME_STARTED và game:leftRoom)
    useEffect(() => {
        if (!socket || !connected) return;

        const handleGameStarted = (data) => {
            if (data.game?.status === 'in_progress') {
                toast.success('Game đã bắt đầu!');
                navigate(`/game/${roomCode}`);
            }
        };
        
        // FIX: Xử lý sự kiện Rời phòng thành công (chuyển hướng an toàn)
        const handleLeftRoom = (data) => {
            if (data.success) {
                toast.success('Đã rời phòng an toàn.');
                navigate('/');
            }
        };

        socket.on('GAME_STARTED', handleGameStarted);
        socket.on('game:leftRoom', handleLeftRoom); 

        return () => {
            socket.off('GAME_STARTED', handleGameStarted);
            socket.off('game:leftRoom', handleLeftRoom);
        };
    }, [socket, connected, navigate, roomCode]);
    
    // ✅ CẬP NHẬT TRẠNG THÁI CỤC BỘ TỪ gameState (Khi Context thay đổi)
    useEffect(() => {
        if (gameState && currentPlayerStateId) {
            if (gameState.status === 'in_progress') {
                 navigate(`/game/${roomCode}`);
                 return;
            }

            const currentPlayer = gameState.players?.find(
                p => p._id === currentPlayerStateId
            );

            if (currentPlayer) {
                setSelectedPet(currentPlayer.pet || null);
                setIsReady(currentPlayer.ready || false);
            }
            
            setGameId(gameState._id);
            setIsHost(gameState.host?._id === currentPlayerStateId);

        }
    }, [gameState, currentPlayerStateId, navigate, roomCode]);


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
                // Backend sẽ emit GAME_UPDATED, Context sẽ lo phần cập nhật UI
                toast.success(newReadyState ? 'Đã sẵn sàng!' : 'Đã hủy!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi cập nhật');
        }
    }, [selectedPet, isReady, roomCode, currentPlayerStateId]);

    // ✅ START GAME (HOST ONLY) - Chỉ gọi API HTTP
    const handleStartGame = useCallback(async () => {
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
            setIsStarting(true);

            const response = await gameAPI.startGame({ gameId });

            if (response.success) {
                toast.success('Bắt đầu game...');
                // Backend sẽ emit GAME_STARTED, listener trong Context sẽ chuyển hướng
            }
        } catch (error) {
            setIsStarting(false);
            toast.error(error.response?.data?.message || 'Không thể bắt đầu');
        }
    }, [isStarting, gameId, roomCode, players, navigate]);

    // 🔥 CHAT FIX: Gửi tin nhắn
    const handleSendMessage = useCallback((e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !user || !connected) return;

        const currentUserInfo = {
            id: user.id,
            // Đảm bảo lấy tên người dùng hiện tại (user.name từ useAuth)
            name: user.name || 'Người chơi', 
            avatar: user.avatar 
        };

        emit('chat:message', {
            user: currentUserInfo,
            message: inputMessage.trim()
        });

        setInputMessage('');
    }, [inputMessage, user, connected, emit]);


    // ✅ COPY ROOM CODE
    const handleCopyRoomCode = useCallback(() => {
        navigator.clipboard.writeText(roomCode)
            .then(() => toast.success('Đã copy!'))
            .catch(() => toast.error('Lỗi copy'));
    }, [roomCode]);

    // ✅ LEAVE ROOM - Chỉ emit và chờ Listener chuyển hướng
    const handleLeaveRoom = useCallback(() => {
        if (socket && connected) {
            emit('game:leaveRoom', { roomCode, userId: user.id }); 
        } else {
            // Nếu không kết nối socket, chuyển hướng an toàn
            navigate('/');
        }
    }, [connected, roomCode, navigate, emit, user.id, socket]);

    const allPlayersReady = players.length >= 2 && players.every(p => p.ready);

    // ✅ LOADING STATE
    if (loading || !gameState) {
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
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                                            disabled={isPetTaken || isReady || gameStatus !== 'waiting'}
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
                                disabled={!selectedPet || gameStatus !== 'waiting'}
                                className={`
                                    w-full mt-6 py-3 rounded-lg font-bold text-white transition-colors
                                    ${!selectedPet || gameStatus !== 'waiting'
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : isReady
                                            ? 'bg-red-500 hover:bg-red-600'
                                            : 'bg-green-500 hover:bg-green-600'
                                    }
                                `}
                            >
                                {gameStatus !== 'waiting'
                                    ? '⛔ Game đã bắt đầu'
                                    : !selectedPet
                                        ? '⚠️ Chọn linh vật'
                                        : isReady
                                            ? '❌ HỦY SẴN DÀNG'
                                            : '✅ SẴN DÀNG'
                                }
                            </button>
                        </div>
                    </div>

                    {/* PLAYER LIST & CHAT */}
                    <div className="lg:col-span-3 grid grid-cols-2 gap-8">
                        {/* PLAYERS LIST */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 col-span-2 md:col-span-1">
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

                        {/* CHAT BOX */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 col-span-2 md:col-span-1 flex flex-col h-[600px] lg:h-auto">
                            <h2 className="text-2xl font-bold text-white mb-4">💬 Chat</h2>
                            
                            {/* Message Display Area */}
                            <div className="flex-grow overflow-y-auto space-y-3 p-2 bg-black/10 rounded-lg mb-4" style={{ maxHeight: '450px' }}>
                                {chatMessages.length === 0 ? (
                                    <p className="text-white/50 text-center pt-10">Bắt đầu trò chuyện!</p>
                                ) : (
                                    chatMessages.map((msg, index) => (
                                        <div key={index} className="flex flex-col">
                                            <div className={`text-sm ${msg.user.id === user.id ? 'text-blue-300' : 'text-yellow-300'} font-bold`}>
                                                {msg.user.name}:
                                            </div>
                                            <p className="text-white break-words text-base">
                                                {msg.message}
                                            </p>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input Form */}
                            <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder={connected ? "Nhập tin nhắn..." : "Đang kết nối..."}
                                    disabled={!connected}
                                    className="flex-grow p-3 rounded-lg bg-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:bg-white/30 transition duration-150"
                                />
                                <button
                                    type="submit"
                                    disabled={!connected || !inputMessage.trim()}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-bold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    Gửi
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Lobby;
