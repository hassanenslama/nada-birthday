import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../supabase';
import { useAuth } from '../../../../context/AuthContext';

const LevelMap = ({ worldId, onBack, onPlayLevel }) => {
    const { user } = useAuth();
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);

    // Hardcoded config for now - usually fetched from DB or Config
    const TOTAL_LEVELS = worldId === 'village' ? 3 : 5;

    useEffect(() => {
        const fetchLevels = async () => {
            let data = null;

            if (user) {
                // Fetch progress for this world
                const { data: dbData, error } = await supabase
                    .from('game_progress')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('world_id', worldId);
                if (dbData) data = dbData;
            }

            const levelsMap = {};
            if (data) {
                data.forEach(row => {
                    levelsMap[row.level_id] = row;
                });
            }

            // Generate Level Grid
            const generated = [];
            for (let i = 1; i <= TOTAL_LEVELS; i++) {
                // Level 1 is always unlocked if no data
                const status = levelsMap[i]?.status || (i === 1 ? 'unlocked' : 'locked');
                generated.push({
                    id: i,
                    status: status,
                    stars: levelsMap[i]?.stars || 0,
                    score: levelsMap[i]?.score || 0
                });

                // Unlock next level if current is completed (Local logic check)
                if (status === 'completed' && i < TOTAL_LEVELS) {
                    // Next one should be unlocked if not already in DB
                    // This is handled by DB triggers or previous save, 
                    // but for display we assume user can play next.
                }
            }

            // Fix: If Level 1 is completed, Level 2 should be unlocked.
            // Loop again or handle chain
            for (let i = 0; i < generated.length - 1; i++) {
                if (generated[i].status === 'completed' && generated[i + 1].status === 'locked') {
                    generated[i + 1].status = 'unlocked';
                }
            }

            setLevels(generated);
            setLoading(false);
        };
        fetchLevels();
    }, [user, worldId]);

    return (
        <div className="fixed inset-0 z-[9999] bg-[#1e293b] flex flex-col items-center p-4">
            {/* Header */}
            <div className="w-full flex items-center justify-between z-10 mb-2 lg:mb-8 px-2 lg:px-8 border-b border-white/5 pb-2">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-3 py-1 lg:px-4 lg:py-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
                >
                    <span className="text-lg lg:text-2xl">⬅️</span>
                    <span className="hidden lg:inline text-base font-bold">Back</span>
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-white/30 text-[8px] lg:text-xs uppercase tracking-[0.2em] lg:tracking-widest">WORLD 1</span>
                    <h2 className="text-xl lg:text-4xl font-bold text-white drop-shadow-md">Christmas Village</h2>
                </div>
                <div className="w-10 lg:w-24"></div> {/* Spacer */}
            </div>

            {/* Map Path UI */}
            <div className="flex-1 w-full max-w-5xl flex items-center justify-center relative">
                {/* Winding Path SVG Line (Decorative) - Adjusted opacity and stroke */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 800 400" preserveAspectRatio="none">
                    <path d="M100,200 Q250,50 400,200 T700,200" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5 5" />
                </svg>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 lg:gap-16 z-10 p-4">
                    {levels.map((level) => {
                        const isLocked = level.status === 'locked';
                        const isCompleted = level.status === 'completed';

                        return (
                            <div key={level.id} className="flex flex-col items-center gap-2 lg:gap-4 group">
                                <button
                                    disabled={false}
                                    onClick={() => {
                                        if (isLocked) {
                                            const toast = document.createElement('div');
                                            toast.className = 'fixed top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-full shadow-xl z-[100000] animate-bounce font-bold text-xs lg:text-base';
                                            toast.innerText = '🔒 عليك إنهاء المراحل السابقة لتصل إلى هنا';
                                            document.body.appendChild(toast);
                                            setTimeout(() => toast.remove(), 2000);
                                        } else {
                                            onPlayLevel(level.id);
                                        }
                                    }}
                                    className={`
                                        relative w-16 h-16 lg:w-28 lg:h-28 rounded-2xl lg:rounded-3xl flex items-center justify-center text-xl lg:text-4xl font-black shadow-lg transition-all duration-300
                                        ${isLocked
                                            ? 'bg-slate-800 text-slate-600 border-2 lg:border-4 border-slate-700 cursor-not-allowed group-hover:bg-slate-750'
                                            : isCompleted
                                                ? 'bg-green-500 text-white border-2 lg:border-4 border-green-400 hover:scale-110 hover:-translate-y-1 lg:hover:-translate-y-2'
                                                : 'bg-yellow-400 text-yellow-900 border-2 lg:border-4 border-yellow-200 animate-pulse-slow hover:scale-110'
                                        }
                                    `}
                                >
                                    {isLocked ? (
                                        <img src={`${import.meta.env.BASE_URL}images/game-santa/UI-Elements/Level-Locked-Icon.png`} className="w-6 h-6 lg:w-10 lg:h-10 opacity-50" alt="Locked" />
                                    ) : (
                                        <span>{level.id}</span>
                                    )}

                                    {/* Unlocked / Current Indicator */}
                                    {!isLocked && !isCompleted && (
                                        <div className="absolute -top-2 -right-2 lg:-top-3 lg:-right-3 w-5 h-5 lg:w-8 lg:h-8 bg-red-500 rounded-full border border-white flex items-center justify-center text-white text-[8px] lg:text-xs animate-bounce shadow-sm">
                                            NEW
                                        </div>
                                    )}
                                </button>

                                {/* Info / Stars */}
                                <div className="flex flex-col items-center gap-0.5 lg:gap-1 min-h-[20px] lg:min-h-[40px]">
                                    {!isLocked && (
                                        <>
                                            <div className="flex gap-0.5 lg:gap-1">
                                                {[1, 2, 3].map(star => (
                                                    <img
                                                        key={star}
                                                        src={star <= level.stars
                                                            ? `${import.meta.env.BASE_URL}images/game-santa/UI-Elements/Star-Filled.png`
                                                            : `${import.meta.env.BASE_URL}images/game-santa/UI-Elements/Star-Empty.png`
                                                        }
                                                        className="w-3 h-3 lg:w-6 lg:h-6 drop-shadow-sm"
                                                        alt="star"
                                                    />
                                                ))}
                                            </div>
                                            {level.score > 0 && (
                                                <span className="text-white/30 text-[8px] lg:text-xs font-mono tracking-tighter">HI: {level.score}</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LevelMap;
