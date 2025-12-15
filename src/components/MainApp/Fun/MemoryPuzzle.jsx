import React, { useState, useEffect } from 'react';
import { timelineData } from '../../../data/timeline';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import { Unlock, Infinity, Trophy, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Shuffle utility
const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

const MemoryPuzzle = () => {
    const { currentUser } = useAuth();
    const [difficulty, setDifficulty] = useState(null);
    const [cards, setCards] = useState([]);
    const [turns, setTurns] = useState(0);
    const [choiceOne, setChoiceOne] = useState(null);
    const [choiceTwo, setChoiceTwo] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [matches, setMatches] = useState(0);
    const [showUnlockNotif, setShowUnlockNotif] = useState(false);

    const levels = {
        easy: { label: 'سهل (6 كروت)', count: 3, grid: 'grid-cols-3' },
        medium: { label: 'متوسط (12 كارت)', count: 6, grid: 'grid-cols-4' },
        hard: { label: 'صعب (18 كارت)', count: 9, grid: 'grid-cols-6' }
    };

    const startGame = (level) => {
        const count = levels[level].count;
        const shuffledTimeline = shuffle(timelineData); // Randomize pool
        const selectedImages = shuffledTimeline.slice(0, count); // Select N random images

        // Create pairs
        const gameCards = [...selectedImages, ...selectedImages]
            .map(card => ({ ...card, uid: Math.random(), matched: false }))
            .sort(() => Math.random() - 0.5);

        setCards(gameCards);
        setDifficulty(level);
        setTurns(0);
        setMatches(0);
        setChoiceOne(null);
        setChoiceTwo(null);
        setDisabled(false);
    };

    const handleChoice = (card) => {
        if (choiceOne && choiceOne.uid === card.uid) return; // Prevent clicking same card
        choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
    };

    useEffect(() => {
        if (choiceOne && choiceTwo) {
            setDisabled(true);
            if (choiceOne.id === choiceTwo.id) {
                setCards(prevCards => {
                    return prevCards.map(card => {
                        if (card.id === choiceOne.id) {
                            return { ...card, matched: true };
                        }
                        return card;
                    });
                });
                setMatches(prev => prev + 1);
                unlockMemory(choiceOne.id);
                resetTurn();
            } else {
                setTimeout(() => resetTurn(), 1000);
            }
        }
    }, [choiceOne, choiceTwo]);

    const unlockMemory = async (id) => {
        const memoryId = Number(id); // Ensure Number
        console.log("Attempting to unlock memory:", memoryId);
        if (!currentUser) {
            console.error("User not logged in, cannot unlock.");
            return;
        }

        try {
            // Fetch current unlocked list
            const { data: current, error: fetchError } = await supabase
                .from('unlocked_memories')
                .select('ids')
                .eq('user_id', currentUser.id)
                .maybeSingle();

            if (fetchError) {
                console.error("Error fetching current unlocks:", fetchError);
                return;
            }

            // Ensure all loaded IDs are numbers
            const currentIds = (current?.ids || []).map(Number);
            console.log("Current unlocked IDs:", currentIds);

            // Check if already unlocked
            if (currentIds.includes(memoryId)) {
                console.log("Memory already unlocked:", memoryId);
                return;
            }

            // Append and Upsert
            const newIds = [...currentIds, memoryId];
            console.log("Saving new unlocked list:", newIds);

            const { error: upsertError } = await supabase
                .from('unlocked_memories')
                .upsert({
                    user_id: currentUser.id,
                    ids: newIds,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (upsertError) {
                console.error("❌ UPSERT FAILED:", upsertError);
                console.error("Error code:", upsertError.code);
                console.error("Error message:", upsertError.message);
                console.error("Error details:", upsertError.details);
                console.error("Error hint:", upsertError.hint);
                alert(`فشل الحفظ في قاعدة البيانات!\n${upsertError.message}\n\nتأكد من تشغيل fix_unlocked_memories_rls.sql في Supabase Dashboard`);
            } else {
                console.log("✅ Memory unlocked successfully in DB!");
            }
        } catch (e) {
            console.error("Exception in unlockMemory:", e);
        }
    };

    const resetTurn = () => {
        setChoiceOne(null);
        setChoiceTwo(null);
        setTurns(prev => prev + 1);
        setDisabled(false);
    };

    // Win Logic
    useEffect(() => {
        if (difficulty && matches === levels[difficulty].count) {
            handleWin();
        }
    }, [matches]);

    const handleWin = async () => {
        console.log("Winner! Handling win...");
        setShowUnlockNotif(true);

        if (currentUser) {
            const gameIds = [...new Set(cards.map(c => Number(c.id)))];
            console.log("Unlocking all cards for win:", gameIds);
            for (const id of gameIds) {
                await unlockMemory(id);
            }
        }
    };

    const handleRestart = () => {
        setShowUnlockNotif(false);
        setDifficulty(null);
    };

    const handlePlayAgain = () => {
        setShowUnlockNotif(false);
        startGame(difficulty); // Restart same level
    };

    return (
        <div className="max-w-4xl mx-auto px-4 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center mb-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gold/10 blur-[80px] rounded-full -z-10" />
                <h2 className="text-4xl font-bold text-white mb-2 font-cairo drop-shadow-md">
                    <span className="text-gold">🧩</span> تجميع الصور
                </h2>
                <p className="text-white/60 font-cairo">جمعي الذكريات ببعضها عشان تفتحيها للابد 🔓</p>
            </div>

            {/* Victory Notification Modal */}
            <AnimatePresence>
                {showUnlockNotif && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#1a1a1a] border border-gold rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(255,215,0,0.5)] max-w-sm w-full relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowUnlockNotif(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white"
                            >
                                ✕
                            </button>

                            <Trophy className="w-24 h-24 text-gold mx-auto mb-6 animate-bounce drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]" />

                            <h3 className="text-3xl font-bold text-white mb-2 font-cairo">مبروووك! 🎉</h3>
                            <p className="text-gray-300 font-cairo mb-6">فتحتِ مجموعة جديدة من الذكريات!</p>

                            <div className="bg-white/5 rounded-xl p-4 mb-8">
                                <div className="text-sm text-gray-400 font-cairo mb-1">عدد المحاولات</div>
                                <div className="text-gold font-mono text-2xl font-bold">{turns}</div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handlePlayAgain}
                                    className="w-full bg-gold text-black font-bold py-3 rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={20} />
                                    العب تاني
                                </button>
                                <button
                                    onClick={handleRestart}
                                    className="w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors"
                                >
                                    القائمة الرئيسية
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Level Selection */}
            {!difficulty && (
                <div className="grid gap-4 max-w-md mx-auto">
                    {Object.entries(levels).map(([key, info]) => (
                        <motion.button
                            key={key}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => startGame(key)}
                            className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] border border-white/10 p-6 rounded-2xl flex items-center justify-between group hover:border-gold/50 transition-all font-cairo"
                        >
                            <span className="text-xl font-bold text-white group-hover:text-gold transition-colors">{info.label}</span>
                            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center border border-white/10 group-hover:border-gold/50 group-hover:bg-gold/10">
                                <span className="text-lg">🎮</span>
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}

            {/* Game Board */}
            {difficulty && (
                <div className="flex flex-col h-full">
                    {/* Stats Bar */}
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm mb-6">
                        <button
                            onClick={() => setDifficulty(null)}
                            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-cairo text-sm"
                        >
                            <RefreshCw size={16} />
                            إنهاء
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-[10px] text-gray-500 font-cairo mb-0.5">محاولات</div>
                                <div className="font-mono text-gold font-bold">{turns}</div>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="text-center">
                                <div className="text-[10px] text-gray-500 font-cairo mb-0.5">تطابق</div>
                                <div className="font-mono text-green-400 font-bold">{matches} / {levels[difficulty].count}</div>
                            </div>
                        </div>
                    </div>

                    {/* Cards Grid - Constrained Size */}
                    <div className="flex-1 flex items-center justify-center min-h-0">
                        <div className={`grid ${levels[difficulty].grid} gap-2 sm:gap-3 w-full max-w-[400px] aspect-[4/5] mx-auto`}>
                            {cards.map(card => {
                                const isFlipped = card === choiceOne || card === choiceTwo || card.matched;
                                return (
                                    <div key={card.uid} className="relative w-full h-full perspective-1000" onClick={() => !disabled && !card.matched && handleChoice(card)}>
                                        <motion.div
                                            className="w-full h-full relative preserve-3d cursor-pointer"
                                            initial={false}
                                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                                            transition={{ duration: 0.4, type: 'tween', ease: 'easeInOut' }}
                                            style={{ transformStyle: 'preserve-3d' }}
                                        >
                                            {/* Front (Cover) - Question Mark */}
                                            <div
                                                className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-xl flex items-center justify-center shadow-lg group hover:border-gold/30 transition-colors"
                                                style={{ backfaceVisibility: 'hidden', zIndex: isFlipped ? 0 : 1 }}
                                            >
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gold/5 flex items-center justify-center border border-gold/10 group-hover:scale-110 transition-transform">
                                                    <span className="text-xl opacity-50 font-bold text-gold">?</span>
                                                </div>
                                                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
                                            </div>

                                            {/* Back (Image) */}
                                            <div
                                                className="absolute inset-0 backface-hidden bg-black rounded-xl overflow-hidden border-2 border-gold shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                                                style={{
                                                    transform: 'rotateY(180deg)',
                                                    backfaceVisibility: 'hidden',
                                                    zIndex: isFlipped ? 1 : 0
                                                }}
                                            >
                                                <img src={card.image} alt="memory" className="w-full h-full object-contain" />
                                                {card.matched && (
                                                    <div className="absolute bottom-2 right-2 flex animate-in zoom-in duration-300">
                                                        <div className="bg-green-500 rounded-full p-1.5 shadow-lg border border-white">
                                                            <Unlock size={14} className="text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemoryPuzzle;
