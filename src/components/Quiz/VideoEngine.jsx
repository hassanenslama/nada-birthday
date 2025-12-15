import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const VideoEngine = ({ videoSrc, onVideoEnd, autoPlay = true, className = '' }) => {
    const videoRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);
    const [needsManualPlay, setNeedsManualPlay] = useState(false);
    const playAttempted = useRef(false);

    // Reset state on new videoSrc
    useEffect(() => {
        setIsReady(false);
        setError(null);
        setNeedsManualPlay(false);
        playAttempted.current = false;
    }, [videoSrc]);

    // Attempt to play video after it's ready
    useEffect(() => {
        if (!isReady || !autoPlay || playAttempted.current) return;

        const video = videoRef.current;
        if (!video) return;

        playAttempted.current = true;

        // Small delay to ensure DOM is fully ready
        const timer = setTimeout(() => {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('✅ Video playing successfully');
                        setNeedsManualPlay(false);
                    })
                    .catch(e => {
                        console.warn('⚠️ AutoPlay blocked:', e.message);
                        setNeedsManualPlay(true);
                    });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [isReady, autoPlay]);

    const handleCanPlay = () => {
        console.log('🎬 Video ready to play');
        setIsReady(true);
    };

    const handleEnded = () => {
        console.log('🏁 Video ended');
        if (onVideoEnd) onVideoEnd();
    };

    const handleError = (e) => {
        const v = videoRef.current;
        console.error('❌ Video Error:', v && v.error);
        if (v && v.error) {
            setError(`Error ${v.error.code}: ${v.error.message || 'Unknown'}`);
        } else {
            setError('Unknown Video Error');
        }
    };

    const handleManualPlay = () => {
        const video = videoRef.current;
        if (video) {
            video.play()
                .then(() => {
                    setNeedsManualPlay(false);
                })
                .catch(e => console.error('Manual play failed:', e));
        }
    };

    return (
        <div className={`absolute inset-0 w-full h-full bg-black overflow-hidden z-0 ${className}`}>
            <video
                ref={videoRef}
                key={videoSrc}
                src={videoSrc}
                className="w-full h-full object-cover"
                playsInline
                muted={false}
                preload="auto"
                onCanPlay={handleCanPlay}
                onEnded={handleEnded}
                onError={handleError}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

            {/* Loading Indicator */}
            {!isReady && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                        <span className="text-gold font-cairo font-bold">جاري تجهيز الفيديو...</span>
                    </div>
                </div>
            )}

            {/* Manual Play Button (if autoPlay blocked) */}
            {needsManualPlay && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleManualPlay}
                        className="flex flex-col items-center gap-4 bg-gold/20 border-2 border-gold rounded-2xl px-8 py-6 hover:bg-gold/30 transition-colors"
                    >
                        <div className="text-6xl">▶️</div>
                        <span className="text-xl text-white font-cairo font-bold">اضغط لبدء الفيديو</span>
                    </motion.button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 p-4">
                    <div className="text-red-500 font-bold p-6 border-2 border-red-500 rounded-xl bg-red-900/20 max-w-md text-center">
                        <p className="text-xl mb-2">⚠️ عذرًا، حدث خطأ</p>
                        <p className="text-sm opacity-80 mb-4 font-mono">{error}</p>
                        <p className="text-xs text-gray-500 break-all">{videoSrc}</p>
                        <button
                            onClick={() => {
                                setIsReady(false);
                                setError(null);
                                playAttempted.current = false;
                                const v = videoRef.current;
                                if (v) {
                                    v.load();
                                }
                            }}
                            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                        >
                            إعادة المحاولة
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoEngine;
