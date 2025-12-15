import React, { useState, useRef, useEffect } from 'react';
import { timelineData } from '../../../data/timeline';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import { Lock } from 'lucide-react';

const Timeline = () => {
    const { currentUser, userRole } = useAuth();
    const [activeIndex, setActiveIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [unlockedIds, setUnlockedIds] = useState([]); // List of unlocked IDs
    const [customMemories, setCustomMemories] = useState([]); // Dynamic memories
    const scrollRef = useRef(null);

    // 1. Listen to Unlocked Memories & Custom Memories from Supabase
    useEffect(() => {
        if (!currentUser) return;

        // A. Fetch initial data
        const fetchData = async () => {
            // Unlocks
            const { data: unlockData } = await supabase
                .from('unlocked_memories')
                .select('ids')
                .eq('user_id', currentUser.id)
                .single();
            if (unlockData) setUnlockedIds(unlockData.ids || []);

            // Custom Memories
            const { data: customData } = await supabase
                .from('custom_memories')
                .select('*')
                .order('date', { ascending: true });
            if (customData) setCustomMemories(customData);
        };
        fetchData();

        // B. Realtime Subscriptions
        const channel = supabase
            .channel('timeline_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'unlocked_memories', filter: `user_id=eq.${currentUser.id}` }, (payload) => {
                if (payload.new) setUnlockedIds(payload.new.ids || []);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_memories' }, (payload) => {
                // Refresh all custom memories on any change (simpler than merging)
                // Or append/update locally. For now, fetch generic re-fetch or manual update.
                // Let's just append new ones if INSERT
                if (payload.eventType === 'INSERT') {
                    setCustomMemories(prev => [...prev, payload.new].sort((a, b) => new Date(a.date) - new Date(b.date)));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    // Merge Static + Custom
    // Static IDs are 1..20. Custom IDs are large timestamps.
    const allMemories = [...timelineData, ...customMemories];

    // Auto-scroll to center active item
    useEffect(() => {
        if (scrollRef.current) {
            const container = scrollRef.current;
            const activeCard = container.children[activeIndex];
            if (activeCard) {
                const scrollLeft = activeCard.offsetLeft - (container.offsetWidth / 2) + (activeCard.offsetWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [activeIndex]);

    const activeMemory = allMemories[activeIndex] || timelineData[0]; // Fallback to safe default
    const isUnlocked = unlockedIds.includes(activeMemory?.id) || userRole === 'admin';

    // Handle case where we might be out of bounds after merging/updates
    useEffect(() => {
        if (activeIndex >= allMemories.length && allMemories.length > 0) {
            setActiveIndex(allMemories.length - 1);
        }
    }, [allMemories.length, activeIndex]);


    return (
        <div className="flex flex-col h-full animate-fadeIn">
            {/* Featured Memory View */}
            <div className="flex-1 relative overflow-hidden rounded-b-3xl shadow-2xl bg-black group">
                {/* Background (Always visible but styled based on lock state) */}
                <div
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${isUnlocked ? 'blur-xl opacity-50' : 'blur-3xl opacity-20 grayscale'}`}
                    style={{ backgroundImage: `url(${activeMemory?.image})` }}
                />

                {/* Main Content Area */}
                <div
                    className="absolute inset-0 z-10 flex items-center justify-center p-2 pb-24 transition-transform"
                    onClick={() => isUnlocked && setShowLightbox(true)}
                >
                    {isUnlocked ? (
                        // UNLOCKED STATE
                        <>
                            <img
                                src={activeMemory?.image}
                                alt={activeMemory?.title}
                                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-scaleIn drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] cursor-zoom-in active:scale-95 transition-transform"
                                key={`unlocked-${activeMemory?.id}`}
                            />
                            {/* Zoom Hint */}
                            <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                🔍 كبري الصورة
                            </div>
                        </>
                    ) : (
                        // LOCKED STATE
                        <div className="flex flex-col items-center justify-center text-center animate-pulse">
                            <div className="bg-white/10 p-6 rounded-full backdrop-blur-md border border-white/20 mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                <Lock size={48} className="text-gray-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-400 font-cairo mb-2">صورة مغلقة 🔒</h3>
                            <p className="text-gray-500 text-sm font-cairo max-w-xs">
                                الذاكرة دي لسه مقفولة.. العبي واكسبي عشان تجمعي المفاتيح وتفتحيها! 🗝️
                            </p>
                        </div>
                    )}
                </div>

                {/* Text Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pt-32 pointer-events-none">
                    <div className="animate-slideInUp">
                        <h2 className={`text-3xl font-bold font-cairo mb-1 drop-shadow-lg ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                            {activeMemory?.title}
                        </h2>
                        {isUnlocked && (
                            <p className="text-white/80 font-cairo text-lg leading-relaxed max-w-md">
                                {activeMemory?.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Overlay */}
            {showLightbox && isUnlocked && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => setShowLightbox(false)}
                >
                    <button
                        className="absolute top-6 right-6 text-white text-4xl hover:text-gold transition-colors z-50"
                        onClick={() => setShowLightbox(false)}
                    >
                        &times;
                    </button>
                    <img
                        src={activeMemory?.image}
                        alt={activeMemory?.title}
                        className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl animate-scaleIn"
                    />
                </div>
            )}

            {/* Horizontal Thumbnail Scroll */}
            <div className="h-40 py-4 relative">
                <div className="absolute top-4 left-4 z-10 bg-black/60 px-2 py-1 rounded-lg text-xs text-gold font-mono">
                    {activeIndex + 1} / {allMemories.length}
                </div>

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto px-4 pb-4 h-full snap-x snap-mandatory hide-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {allMemories.map((item, index) => {
                        const itemUnlocked = unlockedIds.includes(item.id) || userRole === 'admin';
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveIndex(index)}
                                className={`flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 transition-all duration-300 snap-center relative ${activeIndex === index
                                    ? 'border-gold scale-110 shadow-[0_0_15px_rgba(197,160,89,0.5)]'
                                    : 'border-white/10 opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className={`w-full h-full object-cover transition-all ${itemUnlocked ? '' : 'blur-sm grayscale'}`}
                                />
                                {!itemUnlocked && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <Lock size={16} className="text-white/80" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Timeline;
