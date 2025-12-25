import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Power, AlertTriangle, ShieldAlert, Lock } from 'lucide-react';
import { TARGET_DATE } from '../config';
import PrankButton from './PrankButton';
import CharacterReveal from './CharacterReveal';
import { useSiteStatus } from '../context/SiteStatusContext';

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
    const { isShutdown, shutdownStage, restorationUsed, updateStage, restoreSite } = useSiteStatus();
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [whisperIndex, setWhisperIndex] = useState(0);
    const [direction, setDirection] = useState('ltr');
    const [showShutdownModal, setShowShutdownModal] = useState(false);
    const [localStage, setLocalStage] = useState(0);
    const [toast, setToast] = useState(null);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 5000);
    };

    const handleRestore = async () => {
        try {
            await restoreSite();
            showToast("كل حاجه رجعت تاني في الموقع زي ما كانت ويارب لو متخانقين نتصالح ❤️");
        } catch (err) {
            console.error("Restore failed:", err);
        }
    };

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
        // If shutdown, we stop the timer locally or just show 00:00:00? 
        // User said "Stop the counter". So we can just clear it or freeze it.
        if (isShutdown) return;

        let rafId;
        let lastUpdate = Date.now();

        const tick = () => {
            const now = Date.now();
            if (now - lastUpdate >= 1000) {
                lastUpdate = now;
                const newTime = calculateTimeLeft();
                setTimeLeft(newTime);
                if (!newTime) {
                    onUnlock();
                    return;
                }
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [onUnlock, isShutdown]);

    useEffect(() => {
        const interval = setInterval(() => {
            setWhisperIndex((prev) => (prev + 1) % WHISPERS.length);
            setDirection(prev => prev === 'ltr' ? 'rtl' : 'ltr');
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleStopClick = () => {
        if (isShutdown) return;
        setLocalStage(1);
        setShowShutdownModal(true);
    };

    const handleConfirmShutdown = async () => {
        if (localStage === 1) {
            setLocalStage(2);
            // We can optionally update server stage here to track "She clicked stage 1"
            updateStage(1, false);
        } else if (localStage === 2) {
            setLocalStage(3);
            updateStage(2, false);
        } else if (localStage === 3) {
            setShowShutdownModal(false);
            // Final Blow
            updateStage(3, true);
        }
    };

    if (!timeLeft && !isShutdown) return null;

    return (
        <div className={`fixed inset-0 w-full h-full flex flex-col items-center justify-between bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-maroon via-[#2a0a12] to-black text-rosegold overflow-hidden selection:bg-gold selection:text-black touch-none py-10 ${isShutdown ? 'grayscale-[100%] brightness-50' : ''}`}>

            {/* Background Effects */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                {!isShutdown && [...Array(30)].map((_, i) => (
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

            {/* Pulsing Heart (Hidden if Shutdown or Stopped?) User said "Stop Counter", didn't say kill bg, but gray filter does it. */}
            {!isShutdown && (
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute pointer-events-none z-0 flex items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                    <Heart className="w-[80vw] h-[80vw] md:w-[600px] md:h-[600px]" fill="#800020" stroke="none" />
                </motion.div>
            )}


            {/* --- TOP SECTION: Counter & Label --- */}
            <div className="z-10 flex flex-col items-center gap-4 pt-4 md:pt-10 w-full">
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-gold/80 font-cairo text-lg md:text-2xl tracking-widest font-bold"
                >
                    بقالنا مع بعض
                </motion.h2>

                {/* Flip Clock Timer */}
                <div className="flex gap-3 md:gap-6 rtl:flex-row-reverse transform scale-90 md:scale-100 items-start justify-center mt-2">
                    <FlipUnit value={isShutdown ? 0 : timeLeft?.days || 0} label="أيام" isFrozen={isShutdown} />
                    <FlipUnit value={isShutdown ? 0 : timeLeft?.hours || 0} label="ساعات" isFrozen={isShutdown} />
                    <FlipUnit value={isShutdown ? 0 : timeLeft?.minutes || 0} label="دقائق" isFrozen={isShutdown} />
                    <FlipUnit value={isShutdown ? 0 : timeLeft?.seconds || 0} label="ثواني" isFrozen={isShutdown} />
                </div>
            </div>


            {/* --- REFRESH BUTTON (Top Left) --- */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => window.location.reload()}
                className="fixed top-6 left-6 z-[60] p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all backdrop-blur-md"
                title="تحديث الصفحة"
            >
                <RotateCw size={18} />
            </motion.button>

            {/* --- MIDDLE SECTION: Stop Button --- */}
            <div className="z-20 flex flex-col items-center justify-center gap-6">
                {!isShutdown ? (
                    <button
                        onClick={handleStopClick}
                        className="group relative px-6 py-3 bg-red-900/20 border border-red-500/30 rounded-full hover:bg-red-900/40 hover:border-red-500/60 transition-all duration-500 flex items-center gap-3 backdrop-blur-sm"
                    >
                        <Power size={20} className="text-red-500 group-hover:text-red-400 group-hover:scale-110 transition-transform" />
                        <span className="text-red-400 font-bold text-sm tracking-wide">إيقاف العداد</span>
                        <span className="absolute -right-2 -top-2 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>

                        <div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                            <Lock size={32} />
                            <span className="font-mono text-xs tracking-widest">SYSTEM HALTED</span>
                        </div>

                        {/* Restoration Button (Show if not used yet) */}
                        {!restorationUsed && (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRestore}
                                className="group px-8 py-4 bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 hover:from-gold/30 hover:to-gold/30 border border-gold/30 rounded-2xl shadow-[0_0_30px_rgba(197,160,89,0.1)] backdrop-blur-md transition-all flex flex-col items-center gap-1"
                            >
                                <span className="text-gold font-bold text-lg">تقدري ترجعي كل حاجه من تاني من هنا ❤️</span>
                                <span className="text-[10px] text-gold/40 font-medium">اضغطي هنا لاستعادة الموقع فوراً</span>
                            </motion.button>
                        )}
                    </div>
                )}
            </div>

            {/* Prank Button (Keeping it but maybe suppressed if shutdown?) */}
            {!isShutdown && <PrankButton />}


            {/* --- BOTTOM SECTION: Titles --- */}
            <div className="z-10 flex flex-col items-center text-center pb-8 md:pb-12 px-6 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative flex flex-col items-center gap-2"
                >
                    <h1 className="text-5xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-[#F7E7CE] via-[#D4AF37] to-[#800020] drop-shadow-[0_0_30px_rgba(197,160,89,0.3)] font-signature leading-tight">
                        نورتي دنيتي يا ندى
                    </h1>
                    <p className="text-sm md:text-lg text-white/60 font-medium flex items-center gap-2">
                        <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
                        وجودك هو أعظم نعمة في حياتي
                    </p>
                </motion.div>

                {/* Character Reveal Wrapper */}
                {!isShutdown && (
                    <div className="h-12 mt-6 flex items-center justify-center w-full min-w-[300px] max-w-[90vw] overflow-hidden opacity-80">
                        <AnimatePresence mode='wait'>
                            <CharacterReveal
                                key={whisperIndex}
                                text={WHISPERS[whisperIndex]}
                                direction={direction}
                            />
                        </AnimatePresence>
                    </div>
                )}
            </div>


            {/* --- MODALS --- */}
            <AnimatePresence>
                {showShutdownModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                            onClick={() => setShowShutdownModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a0505] border border-red-900/50 rounded-2xl p-8 max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(255,0,0,0.1)] text-center"
                        >
                            <div className="mb-6 flex justify-center">
                                <div className="p-4 bg-red-500/10 rounded-full ring-1 ring-red-500/30">
                                    {localStage === 1 && <Power size={32} className="text-red-500" />}
                                    {localStage === 2 && (restorationUsed ? <ShieldAlert size={32} className="text-red-600 animate-bounce" /> : <ShieldAlert size={32} className="text-red-500" />)}
                                    {localStage === 3 && (restorationUsed ? <AlertTriangle size={32} className="text-red-600 animate-pulse" /> : <AlertTriangle size={32} className="text-red-500 animate-pulse" />)}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-red-100 mb-2">
                                {localStage === 1 && "هل أنتي متأكدة؟"}
                                {localStage === 2 && (restorationUsed ? "تحذير: قرار لا يمكن الرجوع فيه!" : "لحظة من فضلك..")}
                                {localStage === 3 && (restorationUsed ? "المرة دي مفيش رجوع نهائياً!" : "قرار نهائي وخطير!")}
                            </h3>

                            <div className="text-red-200/70 text-sm leading-relaxed mb-8 space-y-4">
                                <p>
                                    {localStage === 1 && "هل أنتي متأكدة أن كل شيء قد انتهى؟ الضغط هنا سيبدأ في إيقاف الموقع."}
                                    {localStage === 2 && (restorationUsed
                                        ? "انتي استهلكتي الفرصة التانية للاستعادة قبل كده. لو أكدتي المرة دي، الموقع هيتقفل للأبد ومش هيظهرلك زرار الرجوع تاني."
                                        : "لربما هذا آخر ما تبقى من الأمل بيننا.. فلا تقطعيه 💔")}
                                    {localStage === 3 && (restorationUsed
                                        ? "دوستك الجاية هتنهي كل ذرات الأمل.. الموقع هيتحول لذكرى رمادية للأبد. هل فعلاً ده اللي عاوزاه؟"
                                        : "في حالة دوستي تأكيد، سوف يتم إيقاف الأجزاء الحيوية في الموقع مثل الكوبونات ومشاعرنا ورحلتنا.. وسيتحول كل شيء للرمادي.")}
                                </p>

                                {restorationUsed && localStage >= 2 && (
                                    <div className="py-2 px-3 bg-red-600/10 border border-red-600/30 rounded-xl">
                                        <p className="text-red-500 font-bold text-[11px]">
                                            ⚠️ تنبيه: تم استخدام فرصة الاستعادة مسبقاً. الإيقاف الآن سيكون دائماً ولن تظهر أي خيارات للرجوع.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowShutdownModal(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold transition-colors"
                                >
                                    تراجع
                                </button>
                                <button
                                    onClick={handleConfirmShutdown}
                                    className="flex-1 py-3 bg-red-900 hover:bg-red-800 text-red-100 rounded-xl font-bold border border-red-700 shadow-lg shadow-red-900/20 transition-all active:scale-95"
                                >
                                    {localStage === 3 ? (restorationUsed ? "أنا متأكدة.. اقفله للأبد" : "أنا متأكدة من قراري") : "نعم، متأكدة"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Success Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 bg-green-500 text-white rounded-2xl shadow-2xl font-bold text-center border-2 border-green-400/50 backdrop-blur-xl"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

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

// MEMOIZED StaticHalf - Prevents unnecessary re-renders
const StaticHalf = React.memo(({ value, side, className = "" }) => {
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
            <div className={`absolute inset-0 z-20 pointer-events-none ${isTop ? 'bg-gradient-to-b from-black/40 to-transparent' : 'bg-gradient-to-t from-black/40 to-transparent'}`}></div>
        </div>
    );
});

// MEMOIZED FlipUnit - Only re-renders when value changes
const FlipUnit = React.memo(({ value, label }) => {
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
});

export default Teaser;
