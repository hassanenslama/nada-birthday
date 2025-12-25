import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Music, Volume2, Volume1, VolumeX, SkipForward, SkipBack, Pause, Play, ListMusic, X, User } from 'lucide-react';
import { useMusic } from '../../../context/MusicContext';
import { useAuth } from '../../../context/AuthContext';
import { useSiteStatus } from '../../../context/SiteStatusContext';

const FloatingDisc = () => {
    const {
        isPlaying,
        togglePlay,
        currentTrack,
        playlist,
        playTrack,
        volume,
        setVolume,
        currentTime,
        duration,
        seekTo,
        isPermanentlyDisabled,
        showPlayer
    } = useMusic();

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const { isShutdown } = useSiteStatus();

    const [showMenu, setShowMenu] = useState(false);
    const longPressTimerRef = useRef(null);
    const isLongPress = useRef(false);
    const isDragging = useRef(false); // Track dragging state

    const { currentUser } = useAuth(); // Get user auth state
    if (!currentUser || isPermanentlyDisabled || !showPlayer) return null;

    const handleMouseDown = () => {
        isLongPress.current = false;
        longPressTimerRef.current = setTimeout(() => {
            if (!isDragging.current) { // Only trigger long press if NOT dragging
                isLongPress.current = true;
                setShowMenu(true);
            }
        }, 600); // 600ms for long press
    };

    const handleMouseUp = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

        // Prevent click if dragging or if long press happened
        if (!isDragging.current && !isLongPress.current) {
            togglePlay();
        }
    };

    return (
        <>
            {/* The Floating Disc */}
            {/* The Floating Disc */}
            <motion.div
                className={`fixed bottom-24 left-4 z-[50] cursor-pointer group ${isShutdown ? 'grayscale' : ''}`}

                // Unified Pointer Events (Handles Touch & Mouse better)
                onPointerDown={handleMouseDown}
                onPointerUp={handleMouseUp}

                // Drag Logic
                onDragStart={() => {
                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                    isLongPress.current = false;
                    isDragging.current = true; // Start Drag
                }}
                onDragEnd={() => {
                    // Slight delay to prevent 'click' from firing immediately after drag release
                    setTimeout(() => {
                        isDragging.current = false;
                    }, 100);
                }}

                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                drag
                dragConstraints={{ left: 0, right: 300, top: -500, bottom: 0 }}
            >
                {/* Vinyl Effect */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                    <motion.div
                        animate={{ rotate: isPlaying ? 360 : 0 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className={`w-full h-full rounded-full border-4 ${isPlaying ? 'border-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]' : 'border-gray-600'} bg-black overflow-hidden flex items-center justify-center relative ring-2 ring-black`}
                        style={{
                            background: "conic-gradient(from 0deg, #111 0%, #333 10%, #111 20%, #333 30%, #111 40%, #555 50%, #111 60%, #333 70%, #111 80%, #333 90%, #111 100%)"
                        }}
                    >
                        {/* Center Label */}
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-gold/80 to-yellow-600 rounded-full flex items-center justify-center shadow-inner">
                            <div className="w-2 h-2 bg-black rounded-full text-center"></div>
                        </div>
                    </motion.div>

                    {/* Status Icon Overlay (Pause/Play hint) */}
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-[1px]">
                            <Play size={20} className="text-white fill-white ml-1" />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Expanded Menu (Playlist & Volume) */}
            <AnimatePresence>
                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-[55]" onClick={() => setShowMenu(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: -50, y: 50 }}
                            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -50, y: 50 }}
                            className={`fixed bottom-48 left-4 z-[60] w-72 bg-[#1a1a1a]/95 backdrop-blur-xl border border-gold/20 rounded-2xl shadow-2xl overflow-hidden p-4 ${isShutdown ? 'grayscale' : ''}`}
                        >
                            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                <h3 className="text-gold font-bold flex items-center gap-2">
                                    <Music size={16} /> الموسيقى <span className="text-xs font-normal text-gray-500">({playlist.length})</span>
                                </h3>
                                <button onClick={() => setShowMenu(false)} className="text-gray-400 hover:text-white"><X size={16} /></button>
                            </div>

                            {/* Professional Seekbar / Progress Control */}
                            <div className="space-y-1 mb-4" dir="ltr">
                                <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-0.5">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                                <div
                                    className="relative h-2 bg-gray-700 rounded-full cursor-pointer group/progress"
                                    onPointerDown={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                                        const seekToTime = (x / rect.width) * duration;
                                        seekTo(seekToTime);
                                        e.currentTarget.setPointerCapture(e.pointerId);
                                    }}
                                    onPointerMove={(e) => {
                                        if (e.buttons === 1) {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                                            const seekToTime = (x / rect.width) * duration;
                                            seekTo(seekToTime);
                                        }
                                    }}
                                >
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gold rounded-full transition-all duration-75"
                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                    ></div>
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
                                        style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Professional Volume Control - Custom Physical Implementation */}
                            <div className="flex items-center gap-3 mb-4 bg-black/50 p-3 rounded-xl border border-white/5 shadow-inner" dir="ltr">
                                <button
                                    onClick={() => setVolume(volume > 0 ? 0 : 0.5)}
                                    className="text-gold hover:text-white transition-colors"
                                >
                                    {volume === 0 ? <VolumeX size={20} /> : volume < 0.5 ? <Volume1 size={20} /> : <Volume2 size={20} />}
                                </button>

                                <div
                                    className="relative flex-1 h-3 bg-gray-700 rounded-full cursor-pointer touch-none select-none"
                                    onPointerDown={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                                        const newVal = x / rect.width;
                                        setVolume(newVal);
                                        e.currentTarget.setPointerCapture(e.pointerId);
                                    }}
                                    onPointerMove={(e) => {
                                        if (e.buttons === 1) { // Left click or touch
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                                            const newVal = x / rect.width;
                                            setVolume(newVal);
                                        }
                                    }}
                                >
                                    {/* Track Fill - Force LTR visual */}
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 to-gold rounded-full pointer-events-none transition-all duration-75"
                                        style={{ width: `${volume * 100}%` }}
                                    ></div>

                                    {/* Thumb - Force LTR visual */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] pointer-events-none transition-all duration-75"
                                        style={{ left: `calc(${volume * 100}% - 8px)` }}
                                    ></div>
                                </div>
                                <span className="text-xs font-mono text-gray-400 w-8 text-left">{Math.round(volume * 100)}%</span>
                            </div>

                            {/* Playlist */}
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {playlist.map((track, index) => (
                                    <div
                                        key={index}
                                        onClick={() => { playTrack(index); }}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${currentTrack === track ? 'bg-gold/10 border border-gold/20' : 'hover:bg-white/5'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-white/10 text-xs text-gray-400 font-mono">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-bold truncate ${currentTrack === track ? 'text-gold' : 'text-gray-200'}`}>
                                                {track.title}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">{track.artist}</div>
                                        </div>
                                        {currentTrack === track && isPlaying && (
                                            <div className="flex gap-0.5 items-end h-3">
                                                <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-0.5 bg-gold rounded-full"></motion.div>
                                                <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.1 }} className="w-0.5 bg-gold rounded-full"></motion.div>
                                                <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-0.5 bg-gold rounded-full"></motion.div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingDisc;
