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
        <div className="fixed inset-0 z-[9999] bg-[#0f172a] flex flex-col">
            {/* Header */}
            <div className="p-8 flex items-center justify-between z-10">
                <button onClick={onBack} className="text-white text-2xl hover:bg-white/10 p-2 rounded-full">
                    ⬅️ Back
                </button>
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider">
                    Select World
                </h1>
                <div className="w-20"></div> {/* Spacer */}
            </div>

            {/* Worlds Scroll Container */}
            <div className="flex-1 overflow-x-auto flex items-center gap-8 px-12 pb-12 snap-x snap-mandatory">
                {WORLDS.map((world, index) => {
                    // Check locked status from DB or default
                    // Logic: World is locked if previous world not completed? 
                    // For now, let's unlock Village for everyone, others based on progress

                    // Simple logic: Village always open. Others check if user has reached them.
                    // Or follow the 'locked' property for MVP.
                    const isLocked = world.id !== 'village' && !progress[world.id];
                    // Actually, let's keep it simple: Village is unlocked. Sky unlocks if Village completed.
                    // For MVP Demo: Village Unlocked, Others Locked.

                    return (
                        <div
                            key={world.id}
                            onClick={() => !isLocked && onSelectWorld(world.id)}
                            className={`
                                relative flex-shrink-0 w-80 h-[500px] snap-center rounded-3xl overflow-hidden cursor-pointer transition-transform duration-300
                                ${isLocked ? 'grayscale opacity-70 scale-95' : 'hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)]'}
                            `}
                        >
                            {/* Card Background */}
                            <div className={`absolute inset-0 bg-gradient-to-b ${world.color}`}></div>

                            {/* Image */}
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-48">
                                <img
                                    src={world.icon}
                                    alt={world.name}
                                    className={`w-full h-full object-contain drop-shadow-2xl ${isLocked ? '' : 'animate-float'}`}
                                />
                            </div>

                            {/* Content */}
                            <div className="absolute bottom-0 inset-x-0 p-8 pt-24 bg-gradient-to-t from-black via-black/80 to-transparent">
                                <h2 className="text-3xl font-bold text-white mb-2">{world.name}</h2>
                                <p className="text-white/60 text-sm mb-6">{world.desc}</p>

                                {isLocked ? (
                                    <div className="flex items-center gap-2 text-white/50 bg-white/10 p-3 rounded-xl justify-center">
                                        <img src="/images/game-santa/UI-Elements/Level-Locked-Icon.png" className="w-6 h-6" alt="Locked" />
                                        <span>LOCKED</span>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between text-yellow-400 font-bold mb-1 text-sm">
                                            <span>Progress</span>
                                            <span>{progress[world.id] || 0} / {world.totalLevels}</span>
                                        </div>
                                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400 transition-all duration-1000"
                                                style={{ width: `${((progress[world.id] || 0) / world.totalLevels) * 100}%` }}
                                            ></div>
                                        </div>
                                        <button className="mt-6 w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl shadow-lg transition-colors">
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
