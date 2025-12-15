import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../../supabase';
import { useAuth } from '../../../../context/AuthContext';
import { Heart, Star, RefreshCw, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import LobbyOverlay from './LobbyOverlay';

const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontal
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Vertical
    [0, 4, 8], [2, 4, 6]             // Diagonal
];

const TicTacToe = ({ isGuest }) => {
    const { currentUser } = useAuth();
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isOpponentReady, setIsOpponentReady] = useState(false);
    const [winner, setWinner] = useState(null); // 'me', 'opponent', 'draw'
    const [round, setRound] = useState(0);

    // Determine Host vs Guest
    // isGuest prop comes from GameHub. 
    // myRole: 'guest' or 'host'
    const myRole = isGuest ? 'guest' : 'host';

    // Symbols
    // Host = Star (Gold), Guest = Heart (Red) - or vice versa?
    // User: "Hassanen = Heart". 
    // Let's stick to: Host = Heart, Guest = Star? 
    // Or just Keep: Hassanen = Heart.
    const isHassanen = currentUser.email?.includes('hassanen');
    const mySymbol = isHassanen ? 'heart' : 'star';
    const opponentSymbol = isHassanen ? 'star' : 'heart';

    // Turn Logic
    // Round 0 (First Game): Host starts.
    // Round 1: Guest starts.
    // Round N: Even = Host, Odd = Guest.
    const starterRole = round % 2 === 0 ? 'host' : 'guest';
    const amIStarter = myRole === starterRole;

    const movesCount = board.filter(Boolean).length;

    // Whose turn is it now?
    // If I started, I play on even moves (0, 2, 4...)
    // If I didn't start, I play on odd moves (1, 3, 5...)
    const isMyTurn = amIStarter
        ? movesCount % 2 === 0
        : movesCount % 2 !== 0;

    useEffect(() => {
        const channel = supabase.channel('xo_room')
            .on('broadcast', { event: 'move' }, ({ payload }) => {
                if (payload.userId !== currentUser.id) {
                    handleOpponentMove(payload.index, payload.symbol);
                }
            })
            .on('broadcast', { event: 'reset' }, ({ payload }) => {
                resetGame(false, payload.nextRound);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser.id]);

    const handleOpponentMove = (index, symbol) => {
        setBoard(prev => {
            const newBoard = [...prev];
            newBoard[index] = symbol;
            return newBoard;
        });
    };

    const handleMove = (index) => {
        if (board[index] || winner || !isMyTurn) return;

        // Optimistic update
        setBoard(prev => {
            const newBoard = [...prev];
            newBoard[index] = mySymbol;
            return newBoard;
        });

        // Broadcast
        supabase.channel('xo_room').send({
            type: 'broadcast',
            event: 'move',
            payload: { userId: currentUser.id, index, symbol: mySymbol }
        });
    };

    const checkWinner = (squares) => {
        for (let combo of WINNING_COMBINATIONS) {
            const [a, b, c] = combo;
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    };

    useEffect(() => {
        const winSymbol = checkWinner(board);
        if (winSymbol) {
            setWinner(winSymbol === mySymbol ? 'me' : 'opponent');
            if (winSymbol === mySymbol) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        } else if (board.every(Boolean)) {
            setWinner('draw');
        }
    }, [board, mySymbol]);

    const handleReset = () => {
        const nextRound = round + 1;
        resetGame(true, nextRound);

        supabase.channel('xo_room').send({
            type: 'broadcast',
            event: 'reset',
            payload: { nextRound }
        });
    };

    const resetGame = (localOnly = true, nextRound = 0) => {
        setBoard(Array(9).fill(null));
        setWinner(null);
        setRound(nextRound);
    };

    // Render Tile
    const renderTile = (i) => {
        const value = board[i];
        const Icon = value === 'heart' ? Heart : value === 'star' ? Star : null;
        const color = value === 'heart' ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]';

        return (
            <motion.button
                whileHover={{ scale: !value && !winner && isMyTurn ? 0.95 : 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleMove(i)}
                className={`w-full aspect-square bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-4xl relative overflow-hidden ${!value && !winner && isMyTurn ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default'}`}
            >
                {/* Available Move Hint (Ghost Icon) */}
                {!value && isMyTurn && !winner && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-20 transition-opacity">
                        {mySymbol === 'heart' ? <Heart size={40} /> : <Star size={40} />}
                    </div>
                )}

                <AnimatePresence>
                    {value && (
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            className={`${color}`}
                        >
                            <Icon size={48} fill={value === 'heart' ? 'currentColor' : 'none'} className={value === 'heart' ? '' : 'stroke-[3px]'} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto p-4 relative">
            <LobbyOverlay gameId="xo" onReady={() => setIsOpponentReady(true)} />

            <div className={`w-full transition-all duration-500 ${!isOpponentReady ? 'blur-sm grayscale opacity-50 pointer-events-none' : ''}`}>

                {/* Header / Status */}
                <div className="mb-8 text-center bg-[#1a1a1a] rounded-2xl p-4 border border-white/10 w-full shadow-xl">
                    {winner ? (
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                            {winner === 'draw' ? (
                                <span className="text-gray-400 font-bold font-cairo text-xl">تعادل! 🤝</span>
                            ) : (
                                <>
                                    <Trophy className="text-gold mb-2" size={32} />
                                    <span className="text-white font-bold font-cairo text-xl">
                                        {winner === 'me' ? 'أنت كسبت! 🎉' : 'حظ أوفر المرة الجاية 😜'}
                                    </span>
                                </>
                            )}
                            <button
                                onClick={handleReset}
                                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold flex items-center gap-2 transition"
                            >
                                <RefreshCw size={14} /> العب تاني
                            </button>
                        </motion.div>
                    ) : (
                        <div className="flex items-center justify-between px-4">
                            <div className={`flex flex-col items-center ${isMyTurn ? 'opacity-100 scale-110' : 'opacity-40 scale-90'} transition-all`}>
                                <span className="text-xs text-gray-400 mb-1">أنت</span>
                                {mySymbol === 'heart' ? <Heart className="text-red-500 fill-red-500" /> : <Star className="text-gold" />}
                            </div>

                            <div className="text-sm font-mono text-gray-500">
                                VS
                            </div>

                            <div className={`flex flex-col items-center ${!isMyTurn ? 'opacity-100 scale-110' : 'opacity-40 scale-90'} transition-all`}>
                                <span className="text-xs text-gray-400 mb-1">الطرف التاني</span>
                                {opponentSymbol === 'heart' ? <Heart className="text-red-500 fill-red-500" /> : <Star className="text-gold" />}
                            </div>
                        </div>
                    )}
                </div>

                {/* Board */}
                <div className="grid grid-cols-3 gap-3 w-full relative">
                    {/* Connecting Lines for winners could go here */}
                    {board.map((_, i) => (
                        <div key={i}>{renderTile(i)}</div>
                    ))}
                </div>

                {/* Turn Indicator */}
                {!winner && (
                    <div className="mt-8 text-center">
                        <p className={`text-sm font-cairo font-bold ${isMyTurn ? 'text-green-400 animate-pulse' : 'text-gray-500'}`}>
                            {isMyTurn
                                ? 'دورك دلوقتي 🎮'
                                : `الدور على ${starterRole === myRole ? 'الخصم' : 'الخصم'}... ⏳`
                            }
                        </p>
                        {round > 0 && (
                            <p className="text-[10px] text-gray-600 mt-2">
                                الجولة {round + 1}: البداية عند {starterRole === 'host' ? 'صاحب الدعوة' : 'الضيف'}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicTacToe;
