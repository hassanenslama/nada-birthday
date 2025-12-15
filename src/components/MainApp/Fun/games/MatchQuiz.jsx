import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../../supabase';
import { useAuth } from '../../../../context/AuthContext';
import { COUPLE_QUESTIONS } from './data/questions';
import { Heart, Check, X as XIcon, Loader2, Trophy, Send } from 'lucide-react';
import confetti from 'canvas-confetti';
import LobbyOverlay from './LobbyOverlay';

// Game Constants
const QUESTIONS_PER_ROUND = 10;

const MatchQuiz = ({ isGuest }) => {
    const { currentUser } = useAuth();
    const [gameState, setGameState] = useState('lobby'); // lobby, playing, result
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [myAnswer, setMyAnswer] = useState('');
    const [isAnswerSent, setIsAnswerSent] = useState(false);
    const [opponentAnswer, setOpponentAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [isOpponentReady, setIsOpponentReady] = useState(false);
    const [processingResult, setProcessingResult] = useState(false);

    // Judgment State
    const [isJudging, setIsJudging] = useState(false);
    // Role Logic: Host (Inviter/Not Guest) is the Judge.
    const isJudge = !isGuest;

    // Select random questions on mount
    const sessionQuestions = useMemo(() => {
        const today = new Date();
        const startSeed = (today.getDate() + today.getMonth() * 31) * 7;
        const shuffled = [...COUPLE_QUESTIONS].sort((a, b) => {
            const seedA = (a.id * 17 + startSeed) % 1000;
            const seedB = (b.id * 17 + startSeed) % 1000;
            return seedA - seedB;
        });
        return shuffled.slice(0, QUESTIONS_PER_ROUND);
    }, []);

    // Realtime Channel
    useEffect(() => {
        const channel = supabase.channel('match_quiz_room')
            .on('broadcast', { event: 'answer' }, ({ payload }) => {
                if (payload.userId !== currentUser.id) {
                    console.log("Opponent answered");
                    setOpponentAnswer(payload.answer);
                }
            })
            .on('broadcast', { event: 'judgment' }, ({ payload }) => {
                // Determine result from Host's judgment
                handleJudgmentResult(payload.isCorrect, false);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser.id]);

    const handleSendAnswer = async () => {
        if (!myAnswer.trim()) return;
        setIsAnswerSent(true);

        await supabase.channel('match_quiz_room').send({
            type: 'broadcast',
            event: 'answer',
            payload: { userId: currentUser.id, answer: myAnswer }
        });
    };

    // Auto-enter judging phase when both have answered
    useEffect(() => {
        if (isAnswerSent && opponentAnswer) {
            setIsJudging(true);
        }
    }, [isAnswerSent, opponentAnswer]);

    const submitJudgment = async (isCorrect) => {
        // Only Host/Judge calls this
        if (processingResult) return;
        setProcessingResult(true);

        handleJudgmentResult(isCorrect, true);

        await supabase.channel('match_quiz_room').send({
            type: 'broadcast',
            event: 'judgment',
            payload: { isCorrect }
        });
    };

    const handleJudgmentResult = (isCorrect, isInitiator) => {
        if (isCorrect) {
            confetti({
                particleCount: 80,
                spread: 70,
                colors: ['#FFD700', '#FF69B4', '#EF4444']
            });
            setScore(s => s + 1);
        }

        // Wait a moment then allow next question logic
        // Actually, let's just show the result visuals for 2 seconds then "Next Question" button activates?
        // Or Auto-next? User asked for manual next button previously ("السؤال اللي بعده")
        // But "Judge" button replaces "Next"?

        // Logic: Judge clicks Correct/Wrong -> Visual Feedback -> Transition after delay OR button.
        // Let's do: Visual feedback immediately. Then "Next" button appears for Host?
        // Or simplified: Judge Click -> 1.5s delay -> Next Question Auto.

        setTimeout(() => {
            handleNextQuestion(isInitiator);
        }, 2000);
    };

    const handleNextQuestion = (isInitiator) => {
        // Reset Round State
        if (currentQuestionIndex < QUESTIONS_PER_ROUND - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setMyAnswer('');
            setIsAnswerSent(false);
            setOpponentAnswer(null);
            setIsJudging(false);
            setProcessingResult(false);
        } else {
            setGameState('result');
        }
    };

    // Render Logic
    const currentQ = sessionQuestions[currentQuestionIndex];

    if (gameState === 'result') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-32 h-32 bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-gold/30"
                >
                    <Trophy size={64} className="text-black" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white font-cairo mb-2">النتيجة النهائية</h2>
                <div className="text-6xl font-black text-gold mb-8">
                    {score} <span className="text-2xl text-gray-500">/ {QUESTIONS_PER_ROUND}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-lg mx-auto p-4 relative">
            <LobbyOverlay gameId="quiz" onReady={() => setIsOpponentReady(true)} />

            <div className={`flex-1 flex flex-col h-full transition-all duration-500 ${!isOpponentReady ? 'blur-sm grayscale opacity-50 pointer-events-none' : ''}`}>
                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8">
                    <span className="text-gold font-mono text-sm">Q {currentQuestionIndex + 1}/{QUESTIONS_PER_ROUND}</span>
                    <div className="flex gap-1">
                        {[...Array(score)].map((_, i) => (
                            <Heart key={i} size={12} className="text-red-500 fill-red-500" />
                        ))}
                    </div>
                </div>

                {/* Question Card */}
                <div className="flex-1 flex flex-col justify-center">
                    <motion.div
                        key={currentQ.id}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl text-center mb-8 relative"
                    >
                        <span className="inline-block px-3 py-1 bg-gold/10 text-gold text-xs rounded-full mb-4 border border-gold/20">
                            {currentQ.category}
                        </span>
                        <h3 className="text-2xl md:text-3xl font-bold text-white font-cairo leading-relaxed">
                            {currentQ.text}
                        </h3>
                    </motion.div>

                    {/* Interaction Area */}
                    <div className="space-y-4">
                        {!isJudging ? (
                            // Input Phase
                            <div className="flex flex-col gap-4">
                                {!isAnswerSent ? (
                                    <>
                                        <input
                                            type="text"
                                            value={myAnswer}
                                            onChange={(e) => setMyAnswer(e.target.value)}
                                            placeholder="اكتب إجابتك هنا..."
                                            className="w-full bg-[#111] border border-white/20 rounded-xl p-4 text-center text-white text-lg focus:border-gold focus:outline-none transition font-cairo"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSendAnswer();
                                            }}
                                        />
                                        <button
                                            onClick={handleSendAnswer}
                                            className="w-full py-3 bg-gold text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-400 transition"
                                        >
                                            <Send size={18} /> إرسال الإجابة
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="inline-block p-4 rounded-full bg-white/5 mb-4 animate-pulse">
                                            <Loader2 className="animate-spin text-gray-400" size={32} />
                                        </div>
                                        <p className="text-gray-400 font-cairo">
                                            {opponentAnswer ? "جاهزين! في انتظار كشف الإجابات..." : "مستنيين الطرف التاني يجاوب..."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Judging Phase
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6"
                            >
                                <h4 className="text-center text-gold font-bold mb-6 font-cairo">كشف الإجابات</h4>

                                <div className="space-y-4 mb-8">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-500 mr-2">إجابتك:</span>
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-white font-bold">
                                            {myAnswer}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-500 mr-2">إجابة الطرف التاني:</span>
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-white font-bold">
                                            {opponentAnswer}
                                        </div>
                                    </div>
                                </div>

                                {/* Judgment Buttons (Only for Judge) */}
                                {isJudge ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => submitJudgment(false)}
                                            className="py-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/20 font-bold flex items-center justify-center gap-2"
                                        >
                                            <XIcon size={20} /> مختلفة 😢
                                        </button>
                                        <button
                                            onClick={() => submitJudgment(true)}
                                            className="py-3 bg-green-500/10 border border-green-500/30 text-green-500 rounded-xl hover:bg-green-500/20 font-bold flex items-center justify-center gap-2"
                                        >
                                            <Check size={20} /> زي بعض 😍
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 animate-pulse font-cairo">
                                        مستنيين الحكم... (صاحب الدعوة بيقرر)
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchQuiz;
