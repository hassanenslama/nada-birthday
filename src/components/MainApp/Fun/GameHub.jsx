import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Heart, Puzzle, Palette, X, ChevronRight, UserPlus, CheckCheck } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import MemoryPuzzle from './MemoryPuzzle';
// Placeholder imports for games we will build next
import TicTacToe from './games/TicTacToe';
import MatchQuiz from './games/MatchQuiz';
import LoveBoard from './games/LoveBoard';

const GAMES = [
    {
        id: 'xo',
        title: 'إكس أو (XO)',
        subtitle: 'تحدي الحب والذكاء',
        icon: X,
        color: 'from-pink-500 to-rose-600',
        component: TicTacToe,
        isMultiplayer: true
    },
    {
        id: 'quiz',
        title: 'اختبار التوافق',
        subtitle: 'يا ترى فاهمين بعض؟',
        icon: Heart,
        color: 'from-purple-500 to-indigo-600',
        component: MatchQuiz,
        isMultiplayer: true
    },
    {
        id: 'draw',
        title: 'سبورة الحب',
        subtitle: 'ارسم وأنا أشوف',
        icon: Palette,
        color: 'from-blue-500 to-cyan-500',
        component: LoveBoard,
        isMultiplayer: true
    },
    {
        id: 'memory',
        title: 'تجميع الصور',
        subtitle: 'اجمع ذكرياتنا سوا',
        icon: Puzzle,
        color: 'from-gold to-yellow-600',
        component: MemoryPuzzle,
        isMultiplayer: false
    }
];

const GameHub = () => {
    const { currentUser } = useAuth();
    const [selectedGame, setSelectedGame] = useState(null);
    const [inviting, setInviting] = useState(false);
    const [inviteSent, setInviteSent] = useState(false);
    const [isGuest, setIsGuest] = useState(false);

    // Auto-Join from Invite
    useEffect(() => {
        const pendingGameId = localStorage.getItem('pending_game');
        if (pendingGameId) {
            const game = GAMES.find(g => g.id === pendingGameId);
            if (game) {
                setIsGuest(true);
                setSelectedGame(game);
            }
            localStorage.removeItem('pending_game');
        }
    }, []);

    const handleSelectGame = (game) => {
        setIsGuest(false); // Manually selected -> Host
        setSelectedGame(game);
    };

    const sendInvite = async () => {
        if (!selectedGame || !currentUser) return;
        setInviting(true);

        try {
            // Determine Partner Email
            const myEmail = currentUser.email;
            const partnerEmail = myEmail.includes('hassanen') ? 'nada@love.com' : 'hassanen@love.com';

            // Get Partner ID
            const { data: partnerId, error: idError } = await supabase.rpc('get_user_id_by_email', { email: partnerEmail });
            if (idError || !partnerId) throw new Error("Partner not found");

            // Send Notification
            const { error } = await supabase.from('notifications').insert({
                recipient_id: partnerId,
                title: 'دعوة للعب 🎮',
                body: `تعالي نلعب ${selectedGame.title} سوا!`,
                type: 'info',
                created_by: currentUser.id,
                payload: {
                    type: 'game_invite',
                    gameId: selectedGame.id,
                    senderName: myEmail.includes('hassanen') ? 'حسانين' : 'ندى'
                }
            });

            if (error) throw error;

            setInviteSent(true);
            setTimeout(() => setInviteSent(false), 3000);

        } catch (err) {
            console.error("Invite failed:", err);
            // Optionally show toast error
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full" />
            </div>

            <AnimatePresence mode="wait">
                {!selectedGame ? (
                    // Game Selection Menu
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex-1 px-4 py-8 overflow-y-auto custom-scrollbar relative z-10"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white font-cairo mb-2">Game Center 🎮</h2>
                            <p className="text-gray-400 text-sm">ألعاب وتحديات عشان نتسلى سوا</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                            {GAMES.map((game, index) => (
                                <motion.button
                                    key={game.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handleSelectGame(game)}
                                    className="relative group overflow-hidden rounded-2xl border border-white/10 p-1"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-r ${game.color} opacity-10 group-hover:opacity-20 transition-opacity`} />

                                    <div className="relative bg-[#1a1a1a]/90 backdrop-blur-xl rounded-xl p-4 flex items-center gap-4 transition-transform group-hover:scale-[0.98]">
                                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${game.color} flex items-center justify-center text-white shadow-lg`}>
                                            <game.icon size={24} />
                                        </div>

                                        <div className="flex-1 text-right">
                                            <h3 className="text-white font-bold text-lg font-cairo">{game.title}</h3>
                                            <p className="text-gray-400 text-xs">{game.subtitle}</p>
                                        </div>

                                        {game.isMultiplayer && (
                                            <div className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
                                                <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    LIVE
                                                </span>
                                            </div>
                                        )}

                                        <ChevronRight className="text-gray-600 group-hover:text-white transition-colors rotate-180" />
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    // Active Game View
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="flex-1 flex flex-col h-full relative z-20"
                    >
                        {/* Back Button Header */}
                        <div className="pl-4 pr-14 py-4 flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedGame(null)}
                                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <h3 className="text-white font-bold font-cairo text-lg">{selectedGame.title}</h3>
                            </div>

                            {/* Invite Button */}
                            {selectedGame.isMultiplayer && (
                                <button
                                    onClick={sendInvite}
                                    disabled={inviting || inviteSent}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition ${inviteSent
                                        ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                                        : 'bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30'
                                        }`}
                                >
                                    {inviteSent ? <CheckCheck size={14} /> : <UserPlus size={14} />}
                                    {inviteSent ? 'تم الإرسال' : 'دعوة'}
                                </button>
                            )}
                        </div>

                        {/* Game Component */}
                        <div className="flex-1 overflow-hidden relative">
                            {React.createElement(selectedGame.component, { isGuest })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GameHub;
