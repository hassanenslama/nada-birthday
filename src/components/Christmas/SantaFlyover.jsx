import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteStatus } from '../../context/SiteStatusContext';
import { Volume2 } from 'lucide-react';
import { getAssetPath } from '../../utils/assets';

const SantaFlyover = ({ zIndex = 'z-[100]' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [flyConfig, setFlyConfig] = useState({ direction: 'ltr', gif: 0 });
    const [showUnmute, setShowUnmute] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('santa_sound_enabled') !== 'false');
    const { isShutdown } = useSiteStatus();

    // Assets: 1 and 2
    const santaGifs = [
        getAssetPath('/images/santa_flying1.gif'),
        getAssetPath('/images/santa_flying2.gif')
    ];

    // Persistent Audio Ref
    const santaSoundRef = useRef(new Audio(getAssetPath('/sounds/santa_laugh.mp3')));

    // Listen for sound toggle from settings
    useEffect(() => {
        const handleSoundToggle = (event) => {
            setSoundEnabled(event.detail.enabled);
        };

        window.addEventListener('santa-sound-toggle', handleSoundToggle);
        return () => window.removeEventListener('santa-sound-toggle', handleSoundToggle);
    }, []);

    useEffect(() => {
        // Try to unlock on any interaction
        const unlockAudio = () => {
            const audio = santaSoundRef.current;
            if (audio.paused && !showUnmute) { // Optimize: only if needed
                audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }).catch(() => { });
            }
        };

        window.addEventListener('click', unlockAudio, { once: true });
        return () => window.removeEventListener('click', unlockAudio);
    }, []);

    useEffect(() => {
        if (isShutdown) return;

        const initialTimer = setTimeout(() => {
            triggerFlyover();
            scheduleNextFlyover();
        }, 5000);

        function scheduleNextFlyover() {
            const delay = Math.random() * (120000 - 60000) + 60000;
            return setTimeout(() => {
                triggerFlyover();
                scheduleNextFlyover();
            }, delay);
        }

        return () => clearTimeout(initialTimer);
    }, [isShutdown]);

    const triggerFlyover = () => {
        const randomGif = Math.floor(Math.random() * santaGifs.length);
        const randomDirection = Math.random() > 0.5 ? 'ltr' : 'rtl';

        setFlyConfig({ direction: randomDirection, gif: randomGif });
        setIsVisible(true);

        // Try Playing only if sound is enabled
        if (soundEnabled) {
            const audio = santaSoundRef.current;
            audio.currentTime = 0;
            audio.volume = 0.6;

            audio.play().catch(e => {
                console.warn("Autoplay Blocked - Showing Unmute Button");
                setShowUnmute(true);
            });
        }

        setTimeout(() => {
            setIsVisible(false);
        }, 4000);
    };

    const handleUnmute = () => {
        const audio = santaSoundRef.current;
        audio.play().catch(e => console.error(e));
        setShowUnmute(false);
    };

    return (
        <>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{
                            x: flyConfig.direction === 'ltr' ? -300 : window.innerWidth + 300,
                            y: 100
                        }}
                        animate={{
                            x: flyConfig.direction === 'ltr' ? window.innerWidth + 300 : -300,
                            y: [100, 50, 150, 100] // Wavy path
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 4,
                            ease: "linear",
                            times: [0, 0.25, 0.75, 1]
                        }}
                        className={`fixed top-20 pointer-events-none ${zIndex}`}
                        style={{
                            scaleX: flyConfig.direction === 'ltr' ? -1 : 1
                        }}
                    >
                        <img
                            src={santaGifs[flyConfig.gif]}
                            alt="Flying Santa"
                            className="h-32 md:h-48 object-contain drop-shadow-2xl filter brightness-110"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fallback Unmute Button */}
            <AnimatePresence>
                {showUnmute && (
                    <motion.button
                        initial={{ opacity: 0, y: 50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={handleUnmute}
                        className={`fixed bottom-32 right-6 bg-red-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white hover:bg-red-700 hover:scale-105 transition-all ${zIndex}`}
                    >
                        <Volume2 size={20} className="animate-pulse" />
                        <span className="font-bold">تفعيل صوت سانتا 🎅</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
};

export default SantaFlyover;
