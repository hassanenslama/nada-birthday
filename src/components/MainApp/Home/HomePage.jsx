import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import LoveCounter from './LoveCounter';
import HeartbeatAnimation from './HeartbeatAnimation';
import { useSiteStatus } from '../../../context/SiteStatusContext';
import { Power, AlertTriangle, ShieldAlert, Lock, HeartCrack, RotateCw } from 'lucide-react';

// Default start date (User can change this)
const START_DATE = '2024-11-30T19:30:00';

const HomePage = () => {
    console.log("🚀 HomePage Rendering. Shutdown State:", useSiteStatus().isShutdown);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const { isShutdown, shutdownStage, shutdownTime, restorationUsed, updateStage, restoreSite } = useSiteStatus();
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

    // Sync local stage with global stage initially or when reset
    useEffect(() => {
        if (shutdownStage > 0) setLocalStage(shutdownStage);
        else setLocalStage(0);
    }, [shutdownStage]);

    // Handle Shutdown Flow
    const handleShutdownClick = () => {
        if (localStage === 0) setLocalStage(1);
    };

    const handleConfirmShutdown = () => {
        if (localStage === 1) {
            setLocalStage(2);
            updateStage(1, false);
        } else if (localStage === 2) {
            setLocalStage(3);
            updateStage(2, false);
        } else if (localStage === 3) {
            updateStage(3, true);
        }
    };

    const handleCancelShutdown = () => {
        setLocalStage(0);
        updateStage(0);
    };

    // Calculate time paused if shutdown (optional visual effect)
    // For now, we rely on the visual greyscale and "locked" state.

    return (
        <div className={`relative min-h-screen w-full overflow-hidden transition-colors duration-1000 ${isShutdown ? 'bg-[#000000]' : 'bg-[#0A0A0A]'} text-white`}>
            {/* 1. Animated Background Canvas */}
            <BackgroundEffect isShutdown={isShutdown} />

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

            {/* Main Content Container */}
            <div className="relative z-50 flex flex-col items-center pt-12 px-4 pb-32 min-h-screen justify-between">

                {/* --- TOP SECTION: COUNTER --- */}
                <div className="flex flex-col items-center w-full mt-4">
                    {/* Counter Title - Now at TOP */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center mb-6"
                    >
                        <p className={`font-cairo text-xs uppercase tracking-[0.2em] mb-2 ${isShutdown ? 'text-gray-400' : 'text-gold/60'}`}>Together For</p>
                        <h2 className={`text-2xl font-bold font-cairo ${isShutdown ? 'text-gray-300' : 'text-white'}`}>
                            {isShutdown ? "كنا مع بعض لمدة" : "بقالنا مع بعض"}
                        </h2>
                        {!isShutdown && <div className="w-16 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-4 rounded-full" />}
                    </motion.div>

                    {/* Love Counter - Prominent at TOP */}
                    <div className={`${isShutdown ? 'opacity-80' : ''} transition-all duration-1000`}>
                        <LoveCounter startDate={START_DATE} isFrozen={isShutdown} frozenAt={shutdownTime} />
                    </div>
                </div>


                {/* --- MIDDLE SECTION: HEART & SHUTDOWN BUTTON --- */}
                <div className="flex flex-col items-center gap-8 my-8 w-full max-w-lg">
                    {/* Heart Centerpiece */}
                    <motion.div style={{ y: y1 }} className="relative">
                        {isShutdown ? (
                            <HeartCrack size={120} className="text-[#050505] mx-auto drop-shadow-[0_0_5px_rgba(255,255,255,0.1)] stroke-gray-800" strokeWidth={1} />
                        ) : (
                            <HeartbeatAnimation />
                        )}
                    </motion.div>

                    {/* SHUTDOWN CONTROL */}
                    {!isShutdown ? (
                        <div className="relative group">
                            <button
                                onClick={handleShutdownClick}
                                className="relative z-10 flex items-center gap-3 px-8 py-4 bg-red-950/30 border border-red-900/50 rounded-full text-red-200 hover:bg-red-900/50 hover:text-white hover:border-red-500 transition-all duration-500 group-hover:scale-105"
                            >
                                <Power size={20} className="animate-pulse-slow" />
                                <span className="font-cairo font-bold">إيقاف العداد</span>
                            </button>
                            {/* Warning text below button */}
                            <p className="absolute top-full left-0 right-0 text-center text-[10px] text-red-900 mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                                إنهاء كل شيء
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-1000">
                            <div className="w-16 h-16 rounded-full bg-gray-900/30 text-gray-500 flex items-center justify-center border border-gray-800">
                                <Lock size={32} />
                            </div>
                            <p className="text-gray-500 font-cairo font-bold tracking-widest text-sm text-center">تم إيقاف الزمن</p>

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


                {/* --- BOTTOM SECTION: TITLE & QUOTE --- */}
                <div className="w-full max-w-2xl text-center mt-auto">
                    {/* Greeting - Now at BOTTOM */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="mb-8 relative"
                    >
                        {!isShutdown && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gold/5 blur-[60px] rounded-full pointer-events-none" />
                        )}

                        {isShutdown ? (
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <h1 className="text-2xl md:text-3xl font-signature text-gray-200 mb-2 drop-shadow-md">
                                    انا بحبك ولازلت بحبك وهفضل احبك
                                </h1>
                                <div className="text-base md:text-lg font-cairo font-light text-gray-300 space-y-2 leading-relaxed">
                                    <p>بتمنالك الخير يا ندي</p>
                                    <p>يا رب اشوفك ديما سعيده</p>
                                    <p className="pt-2 text-gray-400 font-medium">واه كنتي وحشاني جدا 💔</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="relative text-4xl md:text-6xl font-signature mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.2)] text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 animate-pulse">
                                    نورتي دنيتي يا ندى
                                </h1>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.5, duration: 1 }}
                                    className="text-lg md:text-xl font-cairo font-light tracking-wide text-blue-100"
                                >
                                    وجودك هو أعظم نعمة في حياتي ❤️
                                </motion.p>
                            </>
                        )}
                    </motion.div>

                    {/* Quote Card */}
                    {!isShutdown && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 0.8 }}
                            className="relative group perspective"
                        >
                            <div className="relative bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden mx-auto max-w-xl hover:bg-white/10 transition-colors">
                                <div className="absolute top-2 right-4 text-gold/20 text-6xl font-serif">"</div>
                                <p className="text-lg text-white/90 font-cairo leading-loose font-medium">
                                    والسيف في الغمد لا أخشى مضاربه<br />
                                    <span className="text-gold">وسيف عيني "ندى" في الحالتين بتار ❤️</span>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>

            </div>


            {/* --- CONFIRMATION MODALS (AnimatePresence) --- */}
            <AnimatePresence>
                {localStage > 0 && localStage <= 3 && !isShutdown && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`p-8 rounded-3xl max-w-md w-full text-center relative overflow-hidden shadow-2xl transition-colors duration-500 ${restorationUsed && localStage >= 2 ? 'bg-[#2a0505] border-2 border-red-600 shadow-red-900/40' : 'bg-[#1a0505] border-2 border-red-900/50'}`}
                        >
                            {/* Warning Glow */}
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r animate-pulse ${restorationUsed && localStage >= 2 ? 'from-red-600 via-white to-red-600' : 'from-red-900 via-red-600 to-red-900'}`} />

                            <div className="mb-6 flex justify-center">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center border transition-all duration-500 ${restorationUsed && localStage >= 2 ? 'bg-red-600/20 border-red-500 animate-bounce' : 'bg-red-900/20 border-red-500/30 animate-pulse'}`}>
                                    {localStage === 1 && <AlertTriangle size={40} className="text-red-500" />}
                                    {localStage === 2 && (restorationUsed ? <ShieldAlert size={40} className="text-red-500" /> : <ShieldAlert size={40} className="text-red-500" />)}
                                    {localStage === 3 && (restorationUsed ? <HeartCrack size={40} className="text-red-600" /> : <Power size={40} className="text-red-500" />)}
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-red-100 mb-4 font-cairo">
                                {localStage === 1 && "هل أنتي متأكدة أن كل شيء قد انتهى؟"}
                                {localStage === 2 && (restorationUsed ? "تحذير: قرار لا يمكن الرجوع فيه!" : "لربما هذا آخر ما تبقى من الأمل بيننا.. فلا تقطعيه 💔")}
                                {localStage === 3 && (restorationUsed ? "المرة دي مفيش رجوع نهائياً!" : "قرار نهائي وخطير!")}
                            </h3>

                            <div className="text-red-200/80 mb-8 font-cairo leading-relaxed space-y-4">
                                <p>
                                    {localStage === 1 && "هذا الزر ليس مجرد إيقاف لعداد.. إنه إعلان للنهاية."}
                                    {localStage === 2 && (restorationUsed
                                        ? "انتي استهلكتي الفرصة التانية للاستعادة قبل كده. لو أكدتي المرة دي، الموقع هيتقفل للأبد ومش هيظهرلك زرار الرجوع تاني."
                                        : "في حالة دوستي تأكيد، سوف يتم إيقاف الأجزاء الحيوية في الموقع مثل الكوبونات ومشاعرنا ورحلتنا.. وسيتحول كل شيء للرمادي.")}
                                    {localStage === 3 && (restorationUsed
                                        ? "دوستك الجاية هتنهي كل ذرات الأمل.. الموقع هيتحول لذكرى رمادية للأبد. هل فعلاً ده اللي عاوزاه؟"
                                        : "هل أنتي متأكدة تماماً من قرارك؟ لن يكون هناك مجال للتراجع بعد هذه الخطوة.")}
                                </p>

                                {restorationUsed && localStage >= 2 && (
                                    <div className="p-3 bg-red-600/10 border border-red-600/30 rounded-xl">
                                        <p className="text-red-500 font-bold text-sm">
                                            ⚠️ تنبيه: تم استخدام فرصة الاستعادة مسبقاً. الإيقاف الآن سيكون دائماً.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleConfirmShutdown}
                                    className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group ${restorationUsed && localStage >= 2 ? 'bg-red-700 hover:bg-red-600 shadow-red-900/50' : 'bg-red-900 hover:bg-red-800 shadow-red-900/30'}`}
                                >
                                    <span>
                                        {localStage === 1 && "نعم، أنا متأكدة"}
                                        {localStage === 2 && "استمرار"}
                                        {localStage === 3 && (restorationUsed ? "أنا متأكدة.. اقفله للأبد" : "تأكيد النهاية وإيقاف كل شيء")}
                                    </span>
                                    {localStage >= 2 && <Power size={18} className="group-hover:rotate-180 transition-transform" />}
                                </button>
                                <button
                                    onClick={handleCancelShutdown}
                                    className="w-full py-4 bg-transparent border border-white/10 hover:bg-white/5 text-gray-400 font-bold rounded-xl transition-all"
                                >
                                    تراجع (لم ينتهي الأمل)
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

// Background Effect Component (Stars/Particles)
const BackgroundEffect = ({ isShutdown }) => {
    return (
        <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${isShutdown ? 'opacity-40' : 'opacity-100'}`}>
            {/* Deep Space Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#110f1e]" />

            {/* Simulated Stars */}
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="absolute bg-white rounded-full opacity-20 animate-pulse"
                    style={{
                        width: Math.random() * 2 + 1 + 'px',
                        height: Math.random() * 2 + 1 + 'px',
                        top: Math.random() * 100 + '%',
                        left: Math.random() * 100 + '%',
                        animationDuration: Math.random() * 3 + 2 + 's'
                    }}
                />
            ))}

            {/* Floating Gold Dust (Hidden on shutdown) */}
            {!isShutdown && [...Array(10)].map((_, i) => (
                <motion.div
                    key={`dust-${i}`}
                    className="absolute bg-gold rounded-full blur-[1px]"
                    style={{
                        width: Math.random() * 3 + 'px',
                        height: Math.random() * 3 + 'px',
                        top: Math.random() * 100 + '%',
                        left: Math.random() * 100 + '%',
                    }}
                    animate={{
                        y: [-20, -100],
                        opacity: [0, 0.4, 0],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            ))}
        </div>
    );
};

export default HomePage;
