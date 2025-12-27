import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, SkipForward, Music, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetPath } from '../../utils/assets';

const ChristmasMusic = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [trackIndex, setTrackIndex] = useState(0);
    const [volume, setVolume] = useState(0.3); // Default 30%
    const [showControls, setShowControls] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default
    const audioRef = useRef(null);

    const tracks = [
        getAssetPath('/music/cresmas/christmas_bg1.mp3'),
        getAssetPath('/music/cresmas/christmas_bg2.mp3')
    ];

    // Initialize random track & Auto-Play
    useEffect(() => {
        setTrackIndex(Math.floor(Math.random() * tracks.length));

        // Attempt Auto-Play
        const timer = setTimeout(() => {
            if (audioRef.current) {
                // Notify Main Player to stop (if applicable)
                window.dispatchEvent(new Event('christmas_music_start'));

                audioRef.current.play()
                    .then(() => {
                        setIsPlaying(true);
                        // Ensure main player is definitely paused if it started
                        window.dispatchEvent(new Event('christmas_music_start'));
                    })
                    .catch(e => console.log("Auto-play blocked by browser policy (user interaction needed):", e));
            }
        }, 1000); // Small delay to allow page load

        return () => clearTimeout(timer);
    }, []);

    // Volume Control
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Game Mode Listener (Hide Controls Only)
    useEffect(() => {
        const handleGameMode = (e) => {
            const { active } = e.detail;
            setShowControls(!active); // Hide controls if game is active

            if (active && isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
            }
        };

        window.addEventListener('christmas_game_mode', handleGameMode);
        return () => window.removeEventListener('christmas_game_mode', handleGameMode);
    }, [isPlaying]);

    // Mutex Logic: Listen for Main Player start
    useEffect(() => {
        const handleMainMusicPlay = () => {
            if (isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
            }
        };

        window.addEventListener('main_music_start', handleMainMusicPlay);
        return () => window.removeEventListener('main_music_start', handleMainMusicPlay);
    }, [isPlaying]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            // Stop Main Player
            window.dispatchEvent(new Event('christmas_music_start'));

            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(e => {
                    console.error("Playback failed:", e);
                    alert("خطأ في تشغيل الموسيقى: تأكد من وجود ملفات الصوت في مجلد public/music");
                });
        }
    };

    const nextTrack = (e) => {
        if (e) e.stopPropagation();
        const next = (trackIndex + 1) % tracks.length;
        setTrackIndex(next);
        if (isPlaying) {
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.play().catch(e => console.error(e));
                }
            }, 100);
        }
    };

    return (
        <>
            <audio
                ref={audioRef}
                src={tracks[trackIndex]}
                loop
                preload="auto"
                onEnded={() => nextTrack()}
            />

            {/* Controls - Collapsible */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="fixed top-20 right-4 z-[60] flex flex-col items-end gap-2"
                    >
                        {/* Main Toggle Button */}
                        <motion.button
                            layout
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`flex items-center justify-center gap-2 rounded-full backdrop-blur-md border shadow-xl transition-all ${isExpanded
                                ? 'px-4 py-2 bg-black/80 border-white/20 text-white' // Expanded Style
                                : `w-10 h-10 ${isPlaying ? 'bg-green-600 border-green-400 animate-pulse' : 'bg-black/40 border-white/10 text-white/70 hover:bg-black/60'}` // Collapsed Style
                                }`}
                        >
                            {isExpanded ? (
                                <>
                                    <span className="text-xs font-bold whitespace-nowrap">موسيقى الكريسماس</span>
                                    {/* Close Icon Indicator */}
                                    <div className="bg-white/10 rounded-full p-0.5">
                                        <VolumeX size={12} />
                                    </div>
                                </>
                            ) : (
                                <Headphones size={20} />
                            )}
                        </motion.button>

                        {/* Expanded Controls Panel */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                    className="bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 p-3 shadow-2xl flex flex-col gap-3 min-w-[200px]"
                                >
                                    {/* Play/Next Controls */}
                                    <div className="flex items-center justify-between gap-2">
                                        <button
                                            onClick={togglePlay}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${isPlaying ? 'bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                        >
                                            {isPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                            {isPlaying ? 'شغال' : 'تشغيل'}
                                        </button>
                                        <button onClick={nextTrack} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition">
                                            <SkipForward size={14} />
                                        </button>
                                    </div>

                                    {/* Volume Slider */}
                                    <div className="flex items-center gap-2 px-1">
                                        <Volume2 size={12} className="text-gray-400 shrink-0" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={volume}
                                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                                            dir="ltr"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChristmasMusic;
