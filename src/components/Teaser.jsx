import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { TARGET_DATE } from '../config';

const WHISPERS = [
    "كل ثانية بتعدي.. بتزيد غلاوتك ❤️",
    "مش مجرد يوم.. ده عيد ميلاد قلبي",
    "بجهزلك حاجة بسيطة.. بس من كل قلبي",
    "يا أجمل صدفة في عمري..",
    "وجودك هو الهدية الحقيقية 🌹",
    "كل سنة وانتي طيبة يا ندى..",
    "فاضل تكه.. وتشوفي اللي في قلبي",
    "بحبك اكتر مما تتخيلي.. ✨",
    "يا رب تعجبك.."
];

const Teaser = ({ onUnlock }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [whisperIndex, setWhisperIndex] = useState(0);

    // Prank Button State
    const [btnFixed, setBtnFixed] = useState(false);
    const [btnCoords, setBtnCoords] = useState({ x: 0, y: 0 });
    const btnRef = useRef(null);

    function calculateTimeLeft() {
        const difference = +TARGET_DATE - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
            timeLeft = null;
        }
        return timeLeft;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            const newTime = calculateTimeLeft();
            setTimeLeft(newTime);
            if (!newTime) {
                onUnlock();
            }
        }, 1000);
        return () => clearTimeout(timer);
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setWhisperIndex((prev) => (prev + 1) % WHISPERS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const moveButton = () => {
        if (!btnRef.current) return;
        const btnRect = btnRef.current.getBoundingClientRect();
        const btnW = btnRect.width;
        const btnH = btnRect.height;
        const padding = 20;

        const minX = padding;
        const maxX = window.innerWidth - btnW - padding;
        const minY = padding;
        const maxY = window.innerHeight - btnH - padding;

        const safeMaxX = Math.max(minX, maxX);
        const safeMaxY = Math.max(minY, maxY);

        const randomX = Math.random() * (safeMaxX - minX) + minX;
        const randomY = Math.random() * (safeMaxY - minY) + minY;

        setBtnFixed(true);
        setBtnCoords({ x: randomX, y: randomY });
    };

    if (!timeLeft) return null;

    return (
        <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-maroon via-[#2a0a12] to-black text-rosegold overflow-hidden selection:bg-gold selection:text-black touch-none">

            {/* 1. Gold Dust Particles */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-gold rounded-full opacity-40 animate-pulse"
                        style={{
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            width: Math.random() * 2 + 1 + 'px',
                            height: Math.random() * 2 + 1 + 'px',
                            animationDuration: Math.random() * 3 + 2 + 's'
                        }}
                    />
                ))}
            </div>

            {/* 2. Pulsing Heart Background */}
            <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.15, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute pointer-events-none z-0 flex items-center justify-center"
            >
                <Heart className="w-[80vw] h-[80vw] md:w-[600px] md:h-[600px]" fill="#800020" stroke="none" />
            </motion.div>

            {/* 3. Main Content */}
            <div className="z-10 flex flex-col items-center gap-6 md:gap-12 text-center relative w-full p-6">

                {/* Title: Signature Font */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                >
                    <Sparkles className="absolute -top-6 -right-12 text-gold opacity-70 animate-pulse w-8 h-8 md:w-12 md:h-12" />
                    <h1 className="text-7xl md:text-[8rem] bg-clip-text text-transparent bg-gradient-to-b from-[#F7E7CE] via-[#D4AF37] to-[#800020] drop-shadow-[0_0_30px_rgba(197,160,89,0.5)] font-signature pb-8 pt-4 leading-none transform -rotate-2">
                        Nada
                    </h1>
                    <Sparkles className="absolute -bottom-4 -left-12 text-gold opacity-70 animate-pulse w-6 h-6 md:w-10 md:h-10" />
                </motion.div>

                {/* Flip Clock Timer */}
                <div className="flex gap-3 md:gap-6 rtl:flex-row-reverse transform scale-90 md:scale-100 items-start justify-center">
                    <FlipUnit value={timeLeft.days} label="أيام" />
                    <FlipUnit value={timeLeft.hours} label="ساعات" />
                    <FlipUnit value={timeLeft.minutes} label="دقائق" />
                    <FlipUnit value={timeLeft.seconds} label="ثواني" />
                </div>

                {/* Elegant Whispers */}
                <div className="h-20 flex items-center justify-center w-full min-w-[300px] z-20">
                    <AnimatePresence mode='wait'>
                        <motion.p
                            key={whisperIndex}
                            initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -15, filter: "blur(8px)" }}
                            className="text-xl md:text-3xl font-bold text-[#F7E7CE] tracking-wide font-cairo leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        >
                            {WHISPERS[whisperIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>

                <div className="h-20 w-full" aria-hidden="true"></div>
            </div>

            {/* 4. Button */}
            <motion.button
                ref={btnRef}
                style={
                    btnFixed
                        ? { position: 'fixed', left: 0, top: 0, zIndex: 9999 }
                        : { position: 'absolute', bottom: '15%', zIndex: 50 }
                }
                animate={
                    btnFixed
                        ? { x: btnCoords.x, y: btnCoords.y }
                        : { y: 0 }
                }
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onMouseEnter={moveButton}
                onClick={moveButton}
                className="px-10 py-3 md:px-14 md:py-5 bg-gradient-to-r from-[#800020] to-[#4a0412] text-[#D4AF37] font-bold rounded-full border border-[#D4AF37]/40 shadow-[0_0_30px_rgba(128,0,32,0.6)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] text-lg md:text-2xl cursor-pointer whitespace-nowrap font-cairo select-none tracking-widest uppercase"
            >
                افتحي الهدية
            </motion.button>

            {/* Footer */}
            <div className="absolute bottom-6 opacity-80 text-lg md:text-xl tracking-[0.1em] text-[#D4AF37] font-signature z-0">
                صنع بكل الحب ❤️
            </div>
        </div>
    );
};

// Custom Hook to track previous value
function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
}

// Helper for rendering a half-card (Top or Bottom) without any transparency
const StaticHalf = ({ value, side, className = "" }) => {
    const isTop = side === 'top';
    return (
        <div
            className={`absolute left-0 w-full h-1/2 overflow-hidden bg-[#2a0a12] ${isTop ? 'top-0 rounded-t-xl border-b border-black/30' : 'bottom-0 rounded-b-xl border-t border-black/30'} ${className}`}
        >
            <div
                className={`absolute left-0 w-full h-[200%] flex items-center justify-center ${isTop ? 'top-0' : 'bottom-0'}`}
            >
                <span className="text-5xl md:text-8xl font-bold font-cairo text-[#F7E7CE] leading-none z-10 antialiased drop-shadow-sm">
                    {value}
                </span>
            </div>

            {/* Inner shadow for depth - kept subtle */}
            <div className={`absolute inset-0 z-20 pointer-events-none ${isTop ? 'bg-gradient-to-b from-black/40 to-transparent' : 'bg-gradient-to-t from-black/40 to-transparent'}`}></div>
        </div>
    );
};

const FlipUnit = ({ value, label }) => {
    const paddedValue = String(value).padStart(2, '0');
    const prevValue = usePrevious(value);
    const paddedPrev = String(prevValue !== undefined ? prevValue : value).padStart(2, '0');

    const isFlipping = paddedValue !== paddedPrev;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-24 md:w-32 md:h-44 bg-[#1a0509] rounded-xl shadow-2xl perspective-1000 border border-[#D4AF37]/20">

                {/* Static Top Half - Always shows the NEW number */}
                <StaticHalf side="top" value={paddedValue} className="z-0" />

                {/* Static Bottom Half - Shows OLD during flip, NEW otherwise */}
                <StaticHalf side="bottom" value={isFlipping ? paddedPrev : paddedValue} className="z-0" />

                {/* Animated Flap - Only visible during flip */}
                {isFlipping && (
                    <motion.div
                        key={value}
                        initial={{ rotateX: 0 }}
                        animate={{ rotateX: -180 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        style={{
                            transformStyle: 'preserve-3d',
                            transformOrigin: 'bottom',
                            backfaceVisibility: 'hidden'
                        }}
                        className="absolute top-0 left-0 w-full h-1/2 z-20"
                    >
                        {/* Front Face - Old Number Top Half */}
                        <div
                            className="absolute inset-0 w-full h-full overflow-hidden rounded-t-xl bg-[#2a0a12] border-b border-black/30"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <div className="absolute left-0 top-0 w-full h-[200%] flex items-center justify-center">
                                <span className="text-5xl md:text-8xl font-bold font-cairo text-[#F7E7CE] leading-none antialiased">
                                    {paddedPrev}
                                </span>
                            </div>
                            <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-b from-black/40 to-transparent"></div>
                        </div>

                        {/* Back Face - New Number Bottom Half */}
                        <div
                            className="absolute inset-0 w-full h-full overflow-hidden rounded-b-xl bg-[#2a0a12] border-t border-black/30"
                            style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateX(180deg)'
                            }}
                        >
                            <div className="absolute left-0 bottom-0 w-full h-[200%] flex items-center justify-center">
                                <span className="text-5xl md:text-8xl font-bold font-cairo text-[#F7E7CE] leading-none antialiased">
                                    {paddedValue}
                                </span>
                            </div>
                            <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-black/40 to-transparent"></div>
                        </div>
                    </motion.div>
                )}

                {/* Mechanical Hinge Line */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/80 z-30 shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
            </div>

            <span className="text-[10px] md:text-sm font-bold text-[#D4AF37] uppercase tracking-widest opacity-80 pt-2">
                {label}
            </span>
        </div>
    );
};

export default Teaser;
