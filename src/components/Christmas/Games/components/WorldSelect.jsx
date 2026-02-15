import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../supabase';
import { useAuth } from '../../../../context/AuthContext';

const WORLDS = [
    {
        id: 'village',
        name: 'Christmas Village',
        desc: 'بداية الرحلة في القرية الثلجية',
        icon: '/images/game-santa/World-Selection-Icons/Village-World-Icon.png',
        totalLevels: 3,
        color: 'from-green-600 to-green-900'
    },
    {
        id: 'sky',
        name: 'Sky Route',
        desc: 'حلق فوق السحاب مع الرنة',
        icon: '/images/game-santa/World-Selection-Icons/Sky-Route-World-Icon.png',
        totalLevels: 4,
        color: 'from-blue-600 to-blue-900',
        locked: true // For now hardcoded, will fetch from DB
    },
    {
        id: 'pole',
        name: 'North Pole',
        desc: 'مصنع الألعاب وورشة سانتا',
        icon: '/images/game-santa/World-Selection-Icons/North-Pole-World-Icon.png',
        totalLevels: 5,
        color: 'from-indigo-600 to-indigo-900',
        locked: true
    },
    {
        id: 'castle',
        name: 'Ice Castle',
        desc: 'المواجهة الأخيرة',
        icon: '/images/game-santa/World-Selection-Icons/Castle-World-Icon.png',
        totalLevels: 1,
        color: 'from-purple-600 to-purple-900',
        locked: true
    }
];

const WorldSelect = ({ onSelectWorld, onBack }) => {
    const { user } = useAuth();
    const [progress, setProgress] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch User Progress
        const fetchProgress = async () => {
            if (!user) return;

            // Get unlocked levels count per world
            const { data, error } = await supabase
                .from('game_progress')
                .select('world_id, level_id, status')
                .eq('user_id', user.id);

            if (data) {
                // Process data to count unlocked levels
                // Structure: { 'village': { unlocked: 3, total: 3 } }
                const prog = {};
                data.forEach(row => {
                    if (!prog[row.world_id]) prog[row.world_id] = 0;
                    if (row.status === 'completed' || row.status === 'unlocked') {
                        prog[row.world_id] = Math.max(prog[row.world_id], row.level_id);
                    }
                });
                setProgress(prog);
            }
            setLoading(false);
        };

        fetchProgress();
    }, [user]);

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0f172a] flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="w-full flex items-center justify-between z-10 mb-4 lg:mb-8 px-4 lg:px-12">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-3 py-1 lg:px-4 lg:py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                    <span className="text-lg lg:text-2xl">⬅️</span>
                    <span className="hidden lg:inline text-lg font-bold">Back</span>
                </button>
                <h1 className="text-2xl lg:text-5xl font-black text-white uppercase tracking-widest drop-shadow-lg">
                    Select World
                </h1>
                <div className="w-10 lg:w-28"></div> {/* Spacer for alignment */}
            </div>

            {/* Worlds Scroll Container - Compact & Centered */}
            <div className="w-full max-w-7xl flex-1 flex items-center justify-start lg:justify-center overflow-x-auto gap-4 lg:gap-8 px-4 lg:px-12 pb-4 snap-x snap-mandatory custom-scrollbar">
                {WORLDS.map((world, index) => {
                    const isLocked = world.id !== 'village' && !progress[world.id];

                    return (
                        <div
                            key={world.id}
                            onClick={() => !isLocked && onSelectWorld(world.id)}
                            className={`
                                relative flex-shrink-0 snap-center
                                w-56 h-80 lg:w-80 lg:h-[500px] 
                                rounded-2xl lg:rounded-3xl overflow-hidden cursor-pointer transition-transform duration-300 border border-white/10
                                ${isLocked ? 'grayscale opacity-70 scale-95' : 'hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]'}
                            `}
                        >
                            {/* Card Background */}
                            <div className={`absolute inset-0 bg-gradient-to-b ${world.color}`}></div>

                            {/* Image - Scaled */}
                            <div className="absolute top-6 lg:top-10 left-1/2 -translate-x-1/2 w-32 h-32 lg:w-48 lg:h-48">
                                <img
                                    src={world.icon}
                                    alt={world.name}
                                    className={`w-full h-full object-contain drop-shadow-2xl ${isLocked ? '' : 'animate-float'}`}
                                />
                            </div>

                            {/* Content - Compact Layout */}
                            <div className="absolute bottom-0 inset-x-0 p-4 lg:p-8 pt-16 lg:pt-24 bg-gradient-to-t from-black via-black/80 to-transparent">
                                <h2 className="text-xl lg:text-3xl font-bold text-white mb-1 lg:mb-2 leading-tight">{world.name}</h2>
                                <p className="text-white/60 text-[10px] lg:text-sm mb-3 lg:mb-6 line-clamp-2">{world.desc}</p>

                                {isLocked ? (
                                    <div className="flex items-center gap-2 text-white/50 bg-white/10 p-2 lg:p-3 rounded-lg lg:rounded-xl justify-center">
                                        <img src={`${import.meta.env.BASE_URL}images/game-santa/UI-Elements/Level-Locked-Icon.png`} className="w-4 h-4 lg:w-6 lg:h-6 opacity-70" alt="Locked" />
                                        <span className="text-xs lg:text-base font-bold tracking-wider">LOCKED</span>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between text-yellow-400 font-bold mb-1 text-[10px] lg:text-sm">
                                            <span>Progress</span>
                                            <span>{progress[world.id] || 0} / {world.totalLevels}</span>
                                        </div>
                                        <div className="h-1.5 lg:h-2 bg-gray-700 rounded-full overflow-hidden mb-3 lg:mb-6">
                                            <div
                                                className="h-full bg-yellow-400 transition-all duration-1000"
                                                style={{ width: `${((progress[world.id] || 0) / world.totalLevels) * 100}%` }}
                                            ></div>
                                        </div>
                                        <button className="w-full py-2 lg:py-3 bg-yellow-400 hover:bg-yellow-300 text-black text-xs lg:text-base font-bold rounded-lg lg:rounded-xl shadow-lg transition-colors">
                                            EXPLORE
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WorldSelect;
