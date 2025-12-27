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
        <div className="fixed inset-0 z-[9999] bg-[#1e293b] flex flex-col items-center">
            {/* Header */}
            <div className="w-full p-6 bg-slate-900 border-b border-white/10 flex items-center justify-between">
                <button onClick={onBack} className="text-white hover:text-yellow-400 transition-colors flex items-center gap-2">
                    ⬅️ Worlds
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-white/50 text-xs uppercase tracking-widest">WORLD 1</span>
                    <h2 className="text-2xl font-bold text-white">Christmas Village</h2>
                </div>
                <div className="w-20"></div>
            </div>

            {/* Map Path UI */}
            <div className="flex-1 w-full max-w-4xl flex items-center justify-center relative">
                {/* Winding Path SVG Line (Decorative) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 800 400">
                    <path d="M100,300 Q250,100 400,300 T700,200" fill="none" stroke="white" strokeWidth="4" strokeDasharray="10 10" />
                </svg>

                <div className="grid grid-cols-3 md:grid-cols-4 gap-12 z-10 p-8">
                    {levels.map((level) => {
                        const isLocked = level.status === 'locked';
                        const isCompleted = level.status === 'completed';

                        return (
                            <div key={level.id} className="flex flex-col items-center gap-4">
                                <button
                                    disabled={false} // Enable click for locked too
                                    onClick={() => {
                                        if (isLocked) {
                                            const toast = document.createElement('div');
                                            toast.className = 'fixed top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl z-[100000] animate-bounce font-bold';
                                            toast.innerText = '🔒 عليك إنهاء المراحل السابقة لتصل إلى هنا';
                                            document.body.appendChild(toast);
                                            setTimeout(() => toast.remove(), 2000);
                                        } else {
                                            onPlayLevel(level.id);
                                        }
                                    }}
                                    className={`
                                        relative w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black shadow-xl transition-all duration-300
                                        ${isLocked
                                            ? 'bg-slate-800 text-slate-600 border-4 border-slate-700 cursor-not-allowed hover:bg-slate-700'
                                            : isCompleted
                                                ? 'bg-green-500 text-white border-4 border-green-400 hover:scale-110 hover:-translate-y-2'
                                                : 'bg-yellow-400 text-yellow-900 border-4 border-yellow-200 animate-pulse-slow hover:scale-110'
                                        }
                                    `}
                                >
                                    {isLocked ? (
                                        <img src="/images/game-santa/UI-Elements/Level-Locked-Icon.png" className="w-10 h-10 opacity-50" />
                                    ) : (
                                        <span>{level.id}</span>
                                    )}

                                    {/* Unlocked / Current Indicator */}
                                    {!isLocked && !isCompleted && (
                                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs animate-bounce">
                                            NEW
                                        </div>
                                    )}
                                </button>

                                {/* Info / Stars */}
                                <div className="flex flex-col items-center gap-1 min-h-[40px]">
                                    {!isLocked && (
                                        <>
                                            <div className="flex gap-1">
                                                {[1, 2, 3].map(star => (
                                                    <img
                                                        key={star}
                                                        src={star <= level.stars
                                                            ? "/images/game-santa/UI-Elements/Star-Filled.png"
                                                            : "/images/game-santa/UI-Elements/Star-Empty.png"
                                                        }
                                                        className="w-5 h-5 drop-shadow-sm"
                                                        alt="star"
                                                    />
                                                ))}
                                            </div>
                                            {level.score > 0 && (
                                                <span className="text-white/40 text-[10px] font-mono">HI: {level.score}</span>
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
