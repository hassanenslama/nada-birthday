import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import VideoEngine from './Quiz/VideoEngine';
import GameUI from './Quiz/GameUI';
import EffectsController from './Quiz/EffectsController';
import { QUESTIONS } from '../data/questions';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

import { useMusic } from '../context/MusicContext';

const STORAGE_KEY = 'nada_quiz_progress';

const Quiz = ({ onComplete }) => {
    const { setShowPlayer } = useMusic(); // Music control
    const { currentUser, userRole } = useAuth();
    const [started, setStarted] = useState(true); // 🚀 SKIP: Auto start
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Hide Player on Mount, Show on Unmount
    useEffect(() => {
        setShowPlayer(false);
        return () => setShowPlayer(true);
    }, []);
    const [phase, setPhase] = useState('message'); // 🚀 SKIP: Start directly at message
    const [totalScore, setTotalScore] = useState(30); // 🏆 SKIP: Give full score automatically
    const [currentEffect, setCurrentEffect] = useState(null);
    const [answersHistory, setAnswersHistory] = useState({});
    const [retryCount, setRetryCount] = useState(0);

    const audioRef = useRef(null);
    const videoEndHandled = useRef(false);

    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const maxScore = QUESTIONS.reduce((sum, q) => sum + q.points.correct, 0);
    const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;

    // Save Result to Supabase
    const saveToSupabase = async (finalScore, history) => {
        if (!currentUser) {
            console.error("❌ Cannot save: No user logged in");
            return;
        }

        console.log("📤 Attempting to save quiz results to Supabase...");
        console.log("User ID:", currentUser.id);
        console.log("Score:", finalScore);
        console.log("History:", history);

        try {
            // STEP 1: Delete any existing result for this user
            console.log("🗑️ Deleting any existing quiz result...");
            const { error: deleteError } = await supabase
                .from('quiz_results')
                .delete()
                .eq('user_id', currentUser.id);

            if (deleteError) {
                console.warn("⚠️ Delete error (might be empty):", deleteError);
                // Don't throw - table might just be empty
            }

            // STEP 2: Insert new result
            console.log("💾 Inserting new quiz result...");
            const { data, error: insertError } = await supabase
                .from('quiz_results')
                .insert({
                    user_id: currentUser.id,
                    score: finalScore,
                    answers: history,
                    completed_at: new Date().toISOString()
                })
                .select();

            if (insertError) {
                console.error("❌ Insert error:", insertError);
                throw insertError;
            }

            console.log("✅ Result saved to Supabase successfully");
            console.log("Saved data:", data);
            return true;
        } catch (e) {
            console.error("❌ Failed to save result:", e);
            console.error("Error details:", e.message, e.hint, e.details);
            throw e; // Re-throw to let caller know it failed
        }
    };

    // Admin Skip Function
    const handleAdminSkip = async () => {
        const fullScore = maxScore;
        const fakeHistory = {};
        QUESTIONS.forEach((_, idx) => fakeHistory[idx] = 'correct');

        setTotalScore(fullScore);
        setAnswersHistory(fakeHistory);

        await saveToSupabase(fullScore, fakeHistory);
        onComplete({ score: fullScore, maxScore });
    };

    // Reset videoEndHandled when question changes
    useEffect(() => {
        videoEndHandled.current = false;
        console.log(`📍 Question ${currentQuestionIndex + 1} loaded, phase: ${phase}`);
    }, [currentQuestionIndex]);

    // 🚀 SKIP MODE: Ignore saved progress and force clear
    useEffect(() => {
        console.log("🚀 Skip Mode Active: Clearing old progress");
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    // Save progress
    useEffect(() => {
        if (started && phase !== 'celebration' && phase !== 'message') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                questionIndex: currentQuestionIndex,
                score: totalScore,
                history: answersHistory
            }));
        }
    }, [currentQuestionIndex, totalScore, answersHistory, started, phase]);

    const handleStart = () => {
        console.log('🎬 Starting quiz fresh');
        localStorage.removeItem(STORAGE_KEY); // Clear any old state
        setStarted(true);
        setCurrentQuestionIndex(0);
        setTotalScore(0);
        setAnswersHistory({});
        setPhase('question');
        setRetryCount(0);
        videoEndHandled.current = false;
    };

    const handleRestart = () => {
        localStorage.removeItem(STORAGE_KEY);
        setCurrentQuestionIndex(0);
        setTotalScore(0);
        setAnswersHistory({});
        setPhase('question');
        setCurrentEffect(null);
        videoEndHandled.current = false;
        setRetryCount(prev => prev + 1);
    };

    const handleRetry = () => {
        setPhase('question');
        setCurrentEffect(null);
        videoEndHandled.current = false;
        setRetryCount(prev => prev + 1);
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            const currentQuestionId = currentQuestionIndex;
            if (answersHistory[currentQuestionId]) {
                const oldAnswer = answersHistory[currentQuestionId];
                const oldPoints = QUESTIONS[currentQuestionId].points[oldAnswer];
                setTotalScore(prev => prev - oldPoints);

                setAnswersHistory(prev => {
                    const newHistory = { ...prev };
                    delete newHistory[currentQuestionId];
                    return newHistory;
                });
            }

            setCurrentQuestionIndex(prev => prev - 1);
            setPhase('question');
            setCurrentEffect(null);
            videoEndHandled.current = false;
            setRetryCount(prev => prev + 1);
        }
    };

    const handleQuestionVideoEnd = () => {
        if (videoEndHandled.current) {
            console.log('⚠️ Video end already handled, ignoring');
            return;
        }

        videoEndHandled.current = true;
        console.log('🎬 Video ended, showing buttons. Current phase:', phase);
        setPhase('buttons');
    };

    const handleAnswer = (type) => {
        const questionId = currentQuestionIndex;
        const newPoints = currentQuestion.points[type];

        if (answersHistory[questionId]) {
            const oldAnswer = answersHistory[questionId];
            const oldPoints = currentQuestion.points[oldAnswer];
            setTotalScore(prev => prev - oldPoints);
        }

        setTotalScore(prev => prev + newPoints);

        setAnswersHistory(prev => ({
            ...prev,
            [questionId]: type
        }));

        try {
            if (audioRef.current) {
                audioRef.current.src = currentQuestion.sounds[type];
                audioRef.current.play().catch(console.error);
            }
        } catch (err) {
            console.error(err);
        }

        setCurrentEffect(type);

        setTimeout(() => {
            setCurrentEffect(null);

            if (isLastQuestion) {
                setPhase('celebration');
                localStorage.removeItem(STORAGE_KEY);
            } else {
                setCurrentQuestionIndex(prev => prev + 1);
                setPhase('question');
                videoEndHandled.current = false;
            }
        }, 1500);
    };

    const handleCelebrationComplete = () => {
        setPhase('message');
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleMessageVideoEnd = async () => {
        setIsSaving(true);
        console.log("💾 Starting to save results...");
        console.log("Total Score:", totalScore);
        console.log("Max Score:", maxScore);
        console.log("Answers History:", answersHistory);

        try {
            // Attempt to save with timeout protection
            const savePromise = saveToSupabase(totalScore, answersHistory);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Save timeout')), 10000)
            );

            await Promise.race([savePromise, timeoutPromise]);
            console.log("✅ Results saved successfully!");
        } catch (err) {
            console.error("⚠️ Save failed:", err);
            console.error("Will proceed anyway to avoid blocking user");
        } finally {
            console.log("🔄 Calling onComplete and redirecting to main app...");
            setIsSaving(false);
            // This will trigger App.jsx to re-check quiz status
            onComplete({ score: totalScore, maxScore });
        }
    };

    const getCurrentVideo = () => {
        if (phase === 'message') {
            return `${import.meta.env.BASE_URL}videos/massage.mp4`;
        }
        return currentQuestion.questionVideo;
    };

    if (!started) {
        return (
            <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-black via-maroon/30 to-black flex flex-col items-center justify-center z-50 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-gold rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [-20, 20],
                                opacity: [0.2, 0.8, 0.2],
                                scale: [1, 1.5, 1]
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2
                            }}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative text-center px-4"
                >
                    <div className="relative mb-12">
                        <div className="absolute inset-0 blur-3xl bg-gold/30 animate-pulse" />
                        <h1 className="relative text-5xl md:text-7xl lg:text-8xl text-gold font-signature drop-shadow-[0_0_30px_rgba(197,160,89,0.9)] tracking-wide">
                            من سيربح القلب؟
                        </h1>
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="mt-4 text-2xl md:text-3xl text-gold/80 font-cairo"
                        >
                            ❤️
                        </motion.div>
                    </div>

                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        whileHover={{
                            scale: 1.05,
                            boxShadow: "0 0 40px rgba(197,160,89,0.6)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStart}
                        className="group relative px-12 py-6 bg-gradient-to-r from-gold via-yellow-500 to-gold text-black font-bold font-cairo text-2xl md:text-3xl rounded-full overflow-hidden shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                        <span className="relative z-10 flex items-center gap-3">
                            <span>ابدأ المسابقة</span>
                            <motion.span
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                🎬
                            </motion.span>
                        </span>
                    </motion.button>

                    {/* Admin Skip Button */}
                    {userRole === 'admin' && (
                        <button
                            onClick={handleAdminSkip}
                            className="block mx-auto mt-6 text-red-500/50 hover:text-red-500 font-cairo text-sm border border-red-900/30 rounded-full px-4 py-1 transition-colors"
                        >
                            (Admin Skip ⏩)
                        </button>
                    )}

                </motion.div>
            </div>
        );
    }

    if (phase === 'celebration') {
        const getScoreMessage = () => {
            if (totalScore >= 26 && totalScore <= 30) {
                return {
                    title: 'عشان تعرفي اني حافظك',
                    emoji: '🥰',
                    color: 'from-pink-500 via-rose-400 to-pink-500',
                    glow: 'rgba(236, 72, 153, 0.8)',
                    borderColor: 'border-pink-400'
                };
            } else if (totalScore >= 21 && totalScore <= 25) {
                return {
                    title: 'سيكا بس وكنت هجيب الامتياز',
                    emoji: '😎',
                    color: 'from-purple-500 via-violet-400 to-purple-500',
                    glow: 'rgba(139, 92, 246, 0.8)',
                    borderColor: 'border-purple-400'
                };
            } else if (totalScore >= 16 && totalScore <= 20) {
                return {
                    title: 'الحمد لله جت سليمه',
                    emoji: '😌',
                    color: 'from-blue-500 via-cyan-400 to-blue-500',
                    glow: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'border-blue-400'
                };
            } else if (totalScore >= 11 && totalScore <= 15) {
                return {
                    title: 'ينهار كسوف',
                    emoji: '😳',
                    color: 'from-orange-500 via-amber-400 to-orange-500',
                    glow: 'rgba(249, 115, 22, 0.8)',
                    borderColor: 'border-orange-400'
                };
            } else {
                return {
                    title: 'يليله نكد',
                    emoji: '😱',
                    color: 'from-red-500 via-rose-400 to-red-500',
                    glow: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'border-red-400'
                };
            }
        };

        const scoreMessage = getScoreMessage();

        return (
            <div className="fixed inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_#1a0e1e_0%,_#0a0a0a_50%,_#000000_100%)] flex items-center justify-center z-50 overflow-hidden">
                {/* Premium Animated Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(197,160,89,0.03)_0%,_transparent_50%)]" />

                {/* Luxury Particle System - Reduced for mobile */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                x: Math.random() * window.innerWidth,
                                y: Math.random() * window.innerHeight,
                                scale: 0,
                                opacity: 0
                            }}
                            animate={{
                                y: [null, Math.random() * window.innerHeight],
                                scale: [0, Math.random() * 1.2 + 0.4, 0],
                                opacity: [0, Math.random() * 0.5 + 0.15, 0]
                            }}
                            transition={{
                                duration: Math.random() * 4 + 3,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                                ease: "easeInOut"
                            }}
                            className="absolute rounded-full"
                            style={{
                                background: i % 3 === 0
                                    ? 'radial-gradient(circle, #FFD700 0%, transparent 70%)'
                                    : i % 3 === 1
                                        ? 'radial-gradient(circle, #FFA500 0%, transparent 70%)'
                                        : 'radial-gradient(circle, #FF6B6B 0%, transparent 70%)',
                                width: Math.random() * 5 + 2,
                                height: Math.random() * 5 + 2,
                                filter: 'blur(1px)',
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`
                            }}
                        />
                    ))}
                </div>

                {/* Elegant Rotating Ornaments */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        className="w-[500px] h-[500px] md:w-[800px] md:h-[800px] border-[2px] md:border-[3px] border-gold/30 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, transparent 60%, rgba(197,160,89,0.05) 100%)'
                        }}
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] border-[1px] md:border-[2px] border-gold/20 rounded-full"
                    />
                </div>

                <div className="relative z-10 text-center px-3 sm:px-4 md:px-6 w-full max-w-6xl mx-auto flex flex-col items-center justify-center py-4">
                    {/* Majestic Title */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotateX: -20 }}
                        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                        className="mb-4 sm:mb-6 md:mb-8"
                        style={{ perspective: '1000px' }}
                    >
                        <div className="relative inline-block">
                            {/* Multi-layer Glow */}
                            <div className="absolute inset-0 bg-gold/20 blur-[100px] animate-pulse" />
                            <div className="absolute inset-0 bg-yellow-400/10 blur-[60px]" />

                            <motion.h1
                                animate={{
                                    textShadow: [
                                        '0 0 80px rgba(255,215,0,0.8), 0 0 120px rgba(255,215,0,0.4)',
                                        '0 0 100px rgba(255,215,0,1), 0 0 140px rgba(255,215,0,0.6)',
                                        '0 0 80px rgba(255,215,0,0.8), 0 0 120px rgba(255,215,0,0.4)'
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-signature bg-gradient-to-b from-yellow-200 via-gold to-yellow-600 bg-clip-text text-transparent px-2 sm:px-4"
                                style={{
                                    filter: 'drop-shadow(0 10px 30px rgba(197,160,89,0.5))',
                                    WebkitTextStroke: '1px rgba(255,215,0,0.3)'
                                }}
                            >
                                مبروك! 🎊
                            </motion.h1>
                        </div>
                    </motion.div>

                    {/* Ultra-Premium Message Card */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                        className="mb-4 sm:mb-6 md:mb-8 w-full"
                    >
                        <motion.div
                            whileHover={{ scale: 1.02, rotateY: 2 }}
                            className="relative group"
                            style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                        >
                            {/* Dramatic Outer Glow */}
                            <motion.div
                                animate={{
                                    opacity: [0.3, 0.6, 0.3],
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -inset-6 blur-[120px] rounded-[3rem]"
                                style={{ background: scoreMessage.glow }}
                            />

                            {/* Glassmorphism Card */}
                            <div className={`relative bg-gradient-to-br ${scoreMessage.color} p-[3px] rounded-[2.5rem] overflow-hidden`}>
                                {/* Animated Border Shimmer */}
                                <motion.div
                                    animate={{
                                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 opacity-50"
                                    style={{
                                        background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)`,
                                        backgroundSize: '200% 100%'
                                    }}
                                />

                                <div className="relative bg-gradient-to-b from-black/80 via-black/70 to-black/90 backdrop-blur-2xl rounded-[2.4rem] px-8 sm:px-12 md:px-16 lg:px-20 py-10 sm:py-12 md:py-16 overflow-hidden">
                                    {/* Top/Bottom Accent Lines */}
                                    <div className="absolute top-0 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                                    <div className="absolute bottom-0 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

                                    {/* Floating Orbs Inside Card */}
                                    <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-3xl" />
                                    <div className="absolute bottom-4 left-4 w-40 h-40 bg-gradient-to-tr from-yellow-500/10 to-transparent rounded-full blur-3xl" />

                                    <div className="flex flex-col items-center gap-6 md:gap-8 relative z-10">
                                        {/* 3D Floating Emoji */}
                                        <motion.div
                                            animate={{
                                                y: [0, -15, 0],
                                                rotateZ: [0, 5, 0, -5, 0]
                                            }}
                                            transition={{
                                                duration: 4,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="relative"
                                        >
                                            <div className={`absolute inset-0 blur-3xl ${scoreMessage.color.replace('from-', 'bg-').split(' ')[0]}/60`} />
                                            <div
                                                className="relative text-6xl sm:text-7xl md:text-8xl lg:text-9xl"
                                                style={{
                                                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 60px currentColor)',
                                                    transform: 'translateZ(50px)'
                                                }}
                                            >
                                                {scoreMessage.emoji}
                                            </div>
                                        </motion.div>

                                        {/* Elegant Message Text */}
                                        <div className="relative w-full">
                                            <motion.div
                                                animate={{
                                                    opacity: [0.4, 0.7, 0.4]
                                                }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className={`absolute inset-0 blur-2xl bg-gradient-to-r ${scoreMessage.color}`}
                                            />
                                            <p
                                                className={`relative text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black bg-gradient-to-r ${scoreMessage.color} bg-clip-text text-transparent font-cairo leading-tight tracking-wide px-2 sm:px-4`}
                                                style={{
                                                    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                                    WebkitTextStroke: '0.5px rgba(255,255,255,0.1)'
                                                }}
                                            >
                                                {scoreMessage.title}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Spectacular Score Display */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                        className="mb-4 sm:mb-6 md:mb-10 w-full"
                    >
                        <motion.div
                            whileHover={{ scale: 1.03, y: -5 }}
                            className="relative group"
                        >
                            {/* Radial Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-gold/20 via-yellow-500/20 to-gold/20 blur-[100px] rounded-full" />

                            {/* Spinning Diamond Background */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 flex items-center justify-center opacity-10"
                            >
                                <div className="text-[120px] sm:text-[150px] md:text-[200px]">💎</div>
                            </motion.div>

                            <div className="relative bg-gradient-to-br from-black/60 via-zinc-900/50 to-black/70 backdrop-blur-xl border-2 sm:border-3 md:border-4 border-gold/40 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-10 lg:p-14 overflow-hidden group-hover:border-gold/60 transition-all duration-500"
                                style={{
                                    boxShadow: '0 0 100px rgba(197,160,89,0.3), inset 0 0 80px rgba(197,160,89,0.05)'
                                }}
                            >
                                {/* Corner Accents - Hidden on mobile */}
                                <div className="hidden sm:block absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-t-2 border-l-2 sm:border-t-3 sm:border-l-3 md:border-t-4 md:border-l-4 border-gold/60 rounded-tl-3xl" />
                                <div className="hidden sm:block absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-b-2 border-r-2 sm:border-b-3 sm:border-r-3 md:border-b-4 md:border-r-4 border-gold/60 rounded-br-3xl" />

                                <motion.p
                                    animate={{
                                        opacity: [0.7, 1, 0.7]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-sm sm:text-base md:text-xl lg:text-2xl bg-gradient-to-r from-gold via-yellow-200 to-gold bg-clip-text text-transparent font-cairo mb-3 sm:mb-4 md:mb-6 tracking-[0.1em] sm:tracking-[0.2em] uppercase font-bold"
                                >
                                    نتيجتك النهائية
                                </motion.p>

                                <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-10 flex-wrap">
                                    <motion.div
                                        animate={{
                                            y: [0, -10, 0],
                                            rotate: [0, 10, 0, -10, 0]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="flex-shrink-0"
                                    >
                                        <span
                                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
                                            style={{
                                                filter: 'drop-shadow(0 0 30px rgba(59,130,246,1)) drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
                                            }}
                                        >
                                            💎
                                        </span>
                                    </motion.div>

                                    <div className="relative">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                opacity: [0.3, 0.6, 0.3]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-0 bg-gold/40 blur-[80px]"
                                        />
                                        <motion.p
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                duration: 1,
                                                delay: 0.6,
                                                type: "spring",
                                                stiffness: 200
                                            }}
                                            className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black bg-gradient-to-br from-yellow-200 via-gold to-yellow-600 bg-clip-text text-transparent font-cairo"
                                            style={{
                                                filter: 'drop-shadow(0 10px 40px rgba(197,160,89,0.8))',
                                                WebkitTextStroke: '1px rgba(255,215,0,0.2)'
                                            }}
                                        >
                                            {totalScore}
                                        </motion.p>
                                    </div>

                                    <span
                                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-400/80 font-cairo font-bold flex-shrink-0"
                                        style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                                    >
                                        / {maxScore}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Magnificent CTA Button */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.6, type: "spring", stiffness: 150 }}
                    >
                        <motion.button
                            onClick={handleCelebrationComplete}
                            whileHover={{ scale: 1.08, y: -3 }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative px-6 sm:px-10 md:px-16 lg:px-20 py-3 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-yellow-400 via-gold to-yellow-600 text-black font-cairo font-black text-base sm:text-xl md:text-2xl lg:text-3xl rounded-full overflow-hidden transition-all duration-300"
                            style={{
                                boxShadow: '0 20px 60px rgba(197,160,89,0.6), 0 0 0 3px rgba(255,215,0,0.3), inset 0 -10px 20px rgba(0,0,0,0.2)'
                            }}
                        >
                            {/* Liquid Gold Background */}
                            <motion.div
                                animate={{
                                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                    background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 25%, #FFD700 50%, #FFA500 75%, #FFD700 100%)',
                                    backgroundSize: '200% 100%'
                                }}
                            />

                            {/* Shimmer Waves */}
                            <motion.div
                                animate={{ x: ['-200%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 group-hover:opacity-100"
                                style={{ transform: 'skewX(-20deg)' }}
                            />

                            {/* Radial Pulse on Hover */}
                            <motion.div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100"
                                animate={{
                                    scale: [1, 1.5],
                                    opacity: [0.5, 0]
                                }}
                                transition={{ duration: 1, repeat: Infinity }}
                                style={{
                                    background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)'
                                }}
                            />

                            <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                                <motion.span
                                    animate={{
                                        textShadow: [
                                            '0 2px 10px rgba(0,0,0,0.3)',
                                            '0 4px 20px rgba(0,0,0,0.5)',
                                            '0 2px 10px rgba(0,0,0,0.3)'
                                        ]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="drop-shadow-lg"
                                >
                                    استمر للرسالة النهائية
                                </motion.span>
                                <motion.span
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 10, 0, -10, 0]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl"
                                    style={{
                                        filter: 'drop-shadow(0 0 10px rgba(255,0,0,0.5))'
                                    }}
                                >
                                    ❤️
                                </motion.span>
                            </span>
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (phase === 'message') {
        return (
            <div className="fixed inset-0 w-full h-full bg-black">
                <VideoEngine
                    key="message-video"
                    videoSrc="/videos/massage.mp4"
                    onVideoEnd={handleMessageVideoEnd}
                    autoPlay={true}
                    className=""
                />

                {isSaving && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[60]">
                        <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gold font-cairo text-xl animate-pulse">جاري حفظ النتيجة... 💾</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 w-full h-full bg-charcoal overflow-hidden font-cairo">

            <VideoEngine
                key={`question-${currentQuestionIndex}-retry-${retryCount}`}
                videoSrc={getCurrentVideo()}
                onVideoEnd={phase === 'question' ? handleQuestionVideoEnd : () => { }}
                autoPlay={phase === 'question'}
                className={`transition-all duration-1000 ${phase === 'buttons' ? 'blur-md scale-105 brightness-50' : ''}`}
            />

            <div className={`absolute inset-0 bg-black/40 transition-opacity duration-1000 pointer-events-none ${phase === 'buttons' ? 'opacity-100' : 'opacity-0'}`} />

            <div className="fixed top-4 right-4 md:top-6 md:right-6 z-30 flex flex-col gap-3">
                <div className="bg-gradient-to-br from-black/70 to-maroon/50 backdrop-blur-xl border-2 border-gold/40 rounded-2xl px-4 py-3 md:px-6 md:py-4 shadow-[0_0_30px_rgba(197,160,89,0.3)] hover:scale-105 transition-transform">
                    <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-2xl md:text-3xl animate-pulse">💎</span>
                        <div className="text-right">
                            <p className="text-xs md:text-sm text-gold/70 font-cairo">النقاط</p>
                            <p dir="rtl" className="text-xl md:text-3xl font-bold text-gold font-cairo">
                                {totalScore} <span className="text-sm md:text-base text-gray-400">/ {maxScore}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRestart}
                    className="bg-red-900/70 backdrop-blur-md border border-red-500/40 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-red-800/80 transition-colors shadow-lg"
                >
                    <svg className="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-xs md:text-sm text-red-300 font-cairo font-bold">إعادة البداية</span>
                </motion.button>
            </div>

            {/* BUTTONS UI - Instant show/hide (no animation delay) */}
            {phase === 'buttons' && (
                <GameUI
                    onAnswer={handleAnswer}
                    currentQuestion={currentQuestionIndex + 1}
                    totalQuestions={QUESTIONS.length}
                    onRetry={handleRetry}
                    onPrevious={currentQuestionIndex > 0 ? handlePrevious : null}
                />
            )}

            {currentEffect && (
                <EffectsController
                    effect={currentEffect}
                    onComplete={() => { }}
                />
            )}

            <audio ref={audioRef} />
        </div>
    );
};

export default Quiz;
