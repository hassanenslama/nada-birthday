import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoveCounter = ({ startDate, isFrozen = false, frozenAt = null }) => {
    const [timeElapsed, setTimeElapsed] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const start = new Date(startDate).getTime();

        const calculateTime = (targetTime) => {
            const difference = targetTime - start;
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000)
            };
        };

        if (isFrozen) {
            // If frozen, show time AT the frozen moment (if provided) or now (if not)
            // Ideally frozenAt is provided by server context
            const frozenTime = frozenAt ? new Date(frozenAt).getTime() : new Date().getTime();
            setTimeElapsed(calculateTime(frozenTime));
            return;
        }

        // Live Counter
        const updateTimer = () => {
            setTimeElapsed(calculateTime(new Date().getTime()));
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, [startDate, isFrozen, frozenAt]);

    return (
        <div className="flex gap-3 sm:gap-6 justify-center" dir="ltr">
            <FlipCard value={timeElapsed.days} label="Days" isFrozen={isFrozen} />
            <FlipCard value={timeElapsed.hours} label="Hours" isFrozen={isFrozen} />
            <FlipCard value={timeElapsed.minutes} label="Minutes" isFrozen={isFrozen} />
            <FlipCard value={timeElapsed.seconds} label="Seconds" isFrozen={isFrozen} />
        </div>
    );
};

// Component for each digit block
const FlipCard = ({ value, label, isFrozen }) => (
    <div className="flex flex-col items-center">
        {/* Glassmorphic Container */}
        <div className={`relative group perspective ${isFrozen ? 'grayscale opacity-50' : ''}`}>
            <div className={`relative w-16 h-20 sm:w-24 sm:h-32 backdrop-blur-xl rounded-xl sm:rounded-2xl border flex items-center justify-center overflow-hidden transition-all duration-300 ${isFrozen ? 'bg-gray-900/50 border-gray-800' : 'bg-black/40 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] group-hover:border-gold/50 group-hover:shadow-[0_0_20px_rgba(255,215,0,0.2)]'}`}>

                {/* Background Details */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>

                {/* The Number */}
                <AnimatePresence mode="popLayout">
                    <motion.span
                        key={value}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className={`relative z-10 text-3xl sm:text-5xl font-bold font-mono tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isFrozen ? 'text-gray-400' : 'text-gold'}`}
                    >
                        {String(value).padStart(2, '0')}
                    </motion.span>
                </AnimatePresence>

                {/* Decorative Bottom Bar */}
                {!isFrozen && (
                    <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                )}
            </div>
        </div>

        {/* Label */}
        <span className={`mt-2 sm:mt-4 text-[10px] sm:text-sm font-medium uppercase tracking-widest font-cairo ${isFrozen ? 'text-gray-600' : 'text-gray-400'}`}>
            {label}
        </span>
    </div>
);

export default LoveCounter;
