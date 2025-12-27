import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetPath } from '../../../utils/assets';
import { Heart, Gift, X, Trophy, Medal, RotateCcw, Zap } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';

const LoveDelivery = ({ onExit }) => {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [started, setStarted] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboard, setLeaderboard] = useState({ admin: [], user: [] });
    const [playerY, setPlayerY] = useState(0); // For DOM rendering based on Physics
    const [level, setLevel] = useState(1);

    // Auth context
    const { userRole } = useAuth();

    // Game Constants
    const VICTORY_SCORE = 100; // Harder target
    const BASE_JUMP_FORCE = -12; // Slightly higher jump
    const GRAVITY = 0.6;
    const BASE_SPEED = 6;

    // Manage Music State (Hide/Pause when playing)
    // Manage Music State (Hide Controls when playing)
    useEffect(() => {
        // Dispatch event to hide music controls
        const timer = setTimeout(() => {
            const event = new CustomEvent('christmas_game_mode', { detail: { active: true } });
            window.dispatchEvent(event);
        }, 100);

        return () => {
            clearTimeout(timer);
            // Restore music controls when exiting
            const exitEvent = new CustomEvent('christmas_game_mode', { detail: { active: false } });
            window.dispatchEvent(exitEvent);
        };
    }, []);

    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // ... (resetGame, etc - kept as is, just ensuring context)

    // ... (rest of file until render)


    const resetGame = () => {
        setGameOver(false);
        setGameWon(false);
        setScore(0);
        setLevel(1);
        setStarted(false);
        // Small delay to allow re-render if needed, but not strictly necessary for Canvas restart if we handle it right.
        setTimeout(() => setStarted(true), 50);
    };

    const handleExitRequest = () => {
        setShowExitConfirm(true);
    };

    const confirmExit = () => {
        onExit();
    };

    const cancelExit = () => {
        setShowExitConfirm(false);
    };

    // Handle "Enter" key for exit request (as requested)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') handleExitRequest();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Load Leaderboard
    useEffect(() => {
        if (showLeaderboard) fetchLeaderboard();
    }, [showLeaderboard]);

    const fetchLeaderboard = async () => {
        const { data } = await supabase
            .from('game_scores')
            .select('*')
            .eq('game_name', 'love_delivery')
            .order('score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(100);

        if (data) {
            // Group by role and take top 5
            const adminScores = data.filter(s => s.user_role === 'admin').slice(0, 5);
            const userScores = data.filter(s => s.user_role === 'user').slice(0, 5);
            setLeaderboard({ admin: adminScores, user: userScores });
        }
    };

    const saveScore = async (finalScore) => {
        if (!userRole) return;
        await supabase.from('game_scores').insert([
            { user_role: userRole, score: finalScore, game_name: 'love_delivery' }
        ]);
    };

    useEffect(() => {
        if (!started) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Physics State
        // Increased size for better visibility
        let player = { x: 50, y: window.innerHeight - 150, width: 120, height: 80, dy: 0, grounded: false };
        let obstacles = [];
        let particles = [];
        let backgroundStars = [];
        let frameCount = 0;
        let currentScore = 0;
        let gameSpeed = BASE_SPEED;
        let spawnRate = 60; // Frames between spawns (decreases as diff increases)

        // Initialize Background Stars
        for (let i = 0; i < 50; i++) {
            backgroundStars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.1
            });
        }

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            player.y = canvas.height - 120; // Reset position on resize
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const createExplosion = (x, y, color) => {
            for (let i = 0; i < 8; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    life: 1.0,
                    color
                });
            }
        };

        const update = () => {
            // Difficulty Scaling
            const newLevel = Math.floor(currentScore / 10) + 1;
            if (newLevel > level) setLevel(newLevel);

            gameSpeed = BASE_SPEED + (currentScore * 0.15); // Progressive speed
            spawnRate = Math.max(30, 60 - (currentScore * 0.5)); // Spawn faster

            // Player Physics
            player.dy += GRAVITY;
            player.y += player.dy;

            // Ground Collision
            const groundY = canvas.height - 80;
            if (player.y + player.height > groundY) {
                player.y = groundY - player.height;
                player.dy = 0;
                player.grounded = true;
            } else {
                player.grounded = false;
            }

            // Sync React State for DOM rendering
            setPlayerY(player.y);

            // Update Background (Parallax)
            backgroundStars.forEach(star => {
                star.x -= star.speed;
                if (star.x < 0) star.x = canvas.width;
            });

            // Spawn Obstacles
            if (frameCount % Math.floor(spawnRate) === 0) {
                const type = Math.random() > 0.4 ? 'heart' : (Math.random() > 0.6 ? 'gift' : 'snowball');
                // Snowballs stay low, rewards drift
                const startY = type === 'snowball'
                    ? canvas.height - 120
                    : (canvas.height - 200 - Math.random() * 150);

                obstacles.push({
                    x: canvas.width,
                    y: startY,
                    width: 40,
                    height: 40,
                    type,
                    oscillation: Math.random() * Math.PI, // For bobbing effect
                    collected: false
                });
            }

            // Move & Logic
            obstacles.forEach(obs => {
                obs.x -= gameSpeed;
                // Bobbing effect for floating items
                if (obs.type !== 'snowball') {
                    obs.y += Math.sin(frameCount * 0.1 + obs.oscillation) * 1;
                }

                // Draw Logic is separate

                // Collision
                // Use a smaller hitbox for fairness
                const hitboxPadding = 10;
                if (!obs.collected &&
                    player.x + hitboxPadding < obs.x + obs.width - hitboxPadding &&
                    player.x + player.width - hitboxPadding > obs.x + hitboxPadding &&
                    player.y + hitboxPadding < obs.y + obs.height - hitboxPadding &&
                    player.y + player.height - hitboxPadding > obs.y + hitboxPadding) {

                    if (obs.type === 'snowball') {
                        setGameOver(true);
                        saveScore(currentScore);
                        cancelAnimationFrame(animationFrameId);
                    } else {
                        obs.collected = true;
                        currentScore++;
                        setScore(currentScore);
                        createExplosion(obs.x, obs.y, obs.type === 'heart' ? '#ef4444' : '#fbbf24'); // Red or Gold particles

                        if (currentScore >= VICTORY_SCORE) {
                            setGameWon(true); // Can continue if infinite? Let's cap at victory for "Mission" feel
                            saveScore(currentScore);
                            cancelAnimationFrame(animationFrameId);
                        }
                    }
                }
            });

            // Update Particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.05;
            });
            particles = particles.filter(p => p.life > 0);

            // Cleanup
            obstacles = obstacles.filter(obs => obs.x > -50 && !obs.collected);
            frameCount++;
        };

        const draw = () => {
            if (gameOver || gameWon) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw Sky Gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#0f172a'); // Slate 900
            gradient.addColorStop(1, '#1e293b'); // Slate 800
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 2. Draw Stars
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            backgroundStars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // 3. Draw Moon (Fixed)
            ctx.fillStyle = "#fbbf24";
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#fbbf24";
            ctx.beginPath();
            ctx.arc(canvas.width - 100, 100, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // 4. Draw Mountains (Parallax Layer)
            ctx.fillStyle = "#1e1e2e";
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            for (let i = 0; i <= canvas.width; i += 100) {
                ctx.lineTo(i, canvas.height - 100 - Math.sin(i * 0.01 + frameCount * 0.002) * 50);
            }
            ctx.lineTo(canvas.width, canvas.height);
            ctx.fill();

            // 5. Draw Ground
            ctx.fillStyle = "#fff"; // Snow
            ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

            // Ground Texture (Subtle lines)
            ctx.strokeStyle = "#e2e8f0";
            ctx.beginPath();
            ctx.moveTo(0, canvas.height - 80);
            ctx.lineTo(canvas.width, canvas.height - 80);
            ctx.stroke();

            // 6. Draw Particles
            particles.forEach(p => {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            });

            // 7. Draw Obstacles/Rewards
            obstacles.forEach(obs => {
                // Glow effect
                ctx.shadowBlur = 10;
                ctx.shadowColor = obs.type === 'snowball' ? 'white' : (obs.type === 'heart' ? 'red' : 'gold');

                ctx.font = "36px Arial";
                if (obs.type === 'heart') ctx.fillText("❤️", obs.x, obs.y + 30);
                else if (obs.type === 'gift') ctx.fillText("🎁", obs.x, obs.y + 30);
                else ctx.fillText("❄️", obs.x, obs.y + 30);

                ctx.shadowBlur = 0;
            });

            // Note: Player is drawn via DOM now

            update();
            animationFrameId = requestAnimationFrame(draw);
        };

        const handleJump = () => {
            if (player.grounded) {
                player.dy = BASE_JUMP_FORCE;
            }
        };

        // Inputs
        window.addEventListener('touchstart', handleJump);
        window.addEventListener('keydown', (e) => { if (e.code === 'Space') handleJump(); });
        canvas.addEventListener('mousedown', handleJump);

        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('touchstart', handleJump);
            window.removeEventListener('keydown', handleJump); // cleanup properly
            canvas.removeEventListener('mousedown', handleJump);
            cancelAnimationFrame(animationFrameId);
        };
    }, [started]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] overflow-hidden font-cairo bg-black"
        >
            <canvas ref={canvasRef} className="block w-full h-full z-0" />

            {/* Player (GIF) Layer */}
            {started && !gameOver && !gameWon && (
                <motion.div
                    className="absolute z-20"
                    style={{
                        left: playerPosition.x,
                        top: playerPosition.y,
                        width: 100,
                        height: 100,
                        transform: 'scaleX(-1)' // Face right
                    }}
                >
                    <img src={getAssetPath("/images/santa_flying1.gif")} alt="Santa" className="w-full h-full object-contain" />
                </motion.div>
            )}

            {/* HUD */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-4">
                <button onClick={handleExitRequest} className="p-2 bg-black/30 backdrop-blur text-white rounded-full hover:bg-white/10 transition"><X /></button>
                <div className="text-white font-bold text-xl flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full border border-white/10 backdrop-blur">
                    <Heart className="text-red-500 fill-red-500" />
                    <span>{score}</span>
                    <span className="text-white/30">|</span>
                    <span className="text-yellow-400 text-sm">مستوى {Math.floor(score / 10) + 1}</span>
                </div>
            </div>

            {/* Leaderboard Button */}
            <div className="absolute top-4 right-4 z-20">
                <button
                    onClick={() => setShowLeaderboard(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gold/20 backdrop-blur border border-gold/50 rounded-full text-white hover:bg-gold/30 transition shadow-lg hover:shadow-gold/20"
                >
                    <Trophy size={18} className="text-gold" />
                    <span className="text-sm font-bold">المتصدرين</span>
                </button>
            </div>

            {/* Start Screen */}
            {!started && !gameOver && !gameWon && !showLeaderboard && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/70 backdrop-blur-sm z-30 p-4 text-center animate-fade-in">
                    <div className="w-32 h-32 mb-4 relative">
                        <div className="absolute inset-0 bg-gold/20 rounded-full blur-2xl animate-pulse"></div>
                        <img src={getAssetPath("/images/santa_flying1.gif")} className="w-full h-full object-contain relative z-10" />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black mb-4 font-cairo text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-gold drop-shadow-sm">
                        مهمة توصيل الحب ❤️
                    </h2>
                    <p className="mb-8 font-cairo text-gray-300 text-lg max-w-md leading-relaxed">
                        ساعد سانتا يجمع الحب والهدايا لندى!
                        <br />
                        <span className="text-sm text-white/50">كل ما تجمع أكتر، السرعة هتزيد! 😉</span>
                    </p>

                    <button
                        onClick={() => setStarted(true)}
                        className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl font-bold text-2xl animate-bounce hover:scale-105 transition shadow-xl shadow-red-600/20 group border-b-4 border-red-800 active:border-b-0 active:translate-y-1"
                    >
                        ابـدأ اللعب 🚀
                    </button>

                    <p className="mt-8 text-sm opacity-50 bg-white/5 px-6 py-2 rounded-full border border-white/5">اضغط "المسطرة" أو المس الشاشة للقفز</p>
                </div>
            )}

            {/* Game Over Screen */}
            <AnimatePresence>
                {gameOver && (
                    <motion.div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="text-center p-8 border-4 border-red-600 rounded-3xl bg-red-950 relative overflow-hidden max-w-md w-full mx-4 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />

                            <div className="w-32 h-32 mx-auto mb-6 relative">
                                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                                <img src={getAssetPath("/images/santa_flying1.gif")} className="w-full h-full object-contain relative z-10" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2 text-red-500 font-cairo">خبطت في التلج! ❄️</h2>
                            <div className="text-7xl font-black mb-2 text-white drop-shadow-md font-mono">{score}</div>
                            <p className="mb-6 text-gray-400 text-sm">مستوى {Math.floor(score / 10) + 1}</p>

                            <div className="flex flex-col gap-3">
                                <button onClick={resetGame} className="w-full py-3 bg-red-600 rounded-xl hover:bg-red-500 flex items-center justify-center gap-2 font-bold shadow-lg transition transform hover:scale-[1.02]">
                                    <RotateCcw size={20} /> حاول تاني
                                </button>
                                <button onClick={() => setShowLeaderboard(true)} className="w-full py-3 bg-white/5 rounded-xl hover:bg-white/10 flex items-center justify-center gap-2 border border-white/10 transition">
                                    <Trophy size={20} className="text-gold" /> الترتيب
                                </button>
                                <button onClick={handleExitRequest} className="w-full py-2 text-white/30 hover:text-white text-xs mt-2 transition">
                                    خروج
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Win Screen (Harder to reach now) */}
            {gameWon && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-red-900/95 z-30 text-center p-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                    >
                        <Trophy size={100} className="text-gold mb-6 animate-pulse drop-shadow-xl" />
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-black mb-4 font-cairo">أنت أسطورة! 🏆❤️</h2>
                    <p className="text-xl opacity-90 mb-8 max-w-lg leading-relaxed">
                        وصلت لـ {VICTORY_SCORE} قلب! حبك أقوى من أي عقبات في الدنيا.
                    </p>
                    <button onClick={onExit} className="px-10 py-4 bg-white text-red-600 rounded-2xl font-bold text-xl hover:bg-gray-100 shadow-2xl transition transform hover:-translate-y-1">
                        استلام الجائزة 🎉
                    </button>
                </div>
            )}

            {/* Exit Confirmation Modal */}
            <AnimatePresence>
                {showExitConfirm && (
                    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a1a2e] border border-red-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
                        >
                            <h3 className="text-2xl font-bold text-white mb-4">آكيد عايز تخرج؟ 😢</h3>
                            <p className="text-white/60 mb-6">لو خرجت دلوقتي، أي تقدم هيروح عليك!</p>
                            <div className="flex gap-4">
                                <button onClick={confirmExit} className="flex-1 py-3 bg-red-600/20 text-red-400 border border-red-500/50 rounded-xl hover:bg-red-600 hover:text-white transition">
                                    أيوه خرجني
                                </button>
                                <button onClick={cancelExit} className="flex-1 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition">
                                    لا خليك
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Leaderboard Modal */}
            <AnimatePresence>
                {showLeaderboard && (
                    <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a1a2e] border border-gold/30 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-purple-900/50 to-blue-900/50">
                                <div className="flex items-center gap-3">
                                    <Trophy className="text-gold w-8 h-8" />
                                    <h2 className="text-2xl font-bold text-white">أبطال الحب 🏆</h2>
                                </div>
                                <button onClick={() => setShowLeaderboard(false)} className="p-2 hover:bg-white/10 rounded-full text-white transition">
                                    <X />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Hassanen Column */}
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-xl shadow-lg shadow-blue-600/30">🤴</div>
                                            <h3 className="font-bold text-lg text-blue-300">حسانين</h3>
                                        </div>
                                        <div className="space-y-2">
                                            {leaderboard.admin.length === 0 ? (
                                                <p className="text-center text-white/30 py-4 text-sm">بانتظار اللعب...</p>
                                            ) : (
                                                leaderboard.admin.map((entry, idx) => (
                                                    <div key={idx} className={`flex justify-between items-center p-3 rounded-xl transition hover:bg-white/10 ${idx === 0 ? 'bg-gradient-to-r from-gold/20 to-transparent border border-gold/30' : 'bg-white/5'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-gold text-black shadow-lg shadow-gold/50' : 'bg-white/10 text-white'}`}>
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-xs opacity-50 font-mono">{entry.score} pts</span>
                                                        </div>
                                                        <span className="text-[10px] opacity-30">
                                                            {new Date(entry.created_at).toLocaleDateString('ar-EG', {
                                                                year: 'numeric', month: 'numeric', day: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Nada Column */}
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
                                            <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center text-xl shadow-lg shadow-pink-600/30">👸</div>
                                            <h3 className="font-bold text-lg text-pink-300">ندى</h3>
                                        </div>
                                        <div className="space-y-2">
                                            {leaderboard.user.length === 0 ? (
                                                <p className="text-center text-white/30 py-4 text-sm">بانتظار اللعب...</p>
                                            ) : (
                                                leaderboard.user.map((entry, idx) => (
                                                    <div key={idx} className={`flex justify-between items-center p-3 rounded-xl transition hover:bg-white/10 ${idx === 0 ? 'bg-gradient-to-r from-gold/20 to-transparent border border-gold/30' : 'bg-white/5'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-gold text-black shadow-lg shadow-gold/50' : 'bg-white/10 text-white'}`}>
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-xs opacity-50 font-mono">{entry.score} pts</span>
                                                        </div>
                                                        <span className="text-[10px] opacity-30">
                                                            {new Date(entry.created_at).toLocaleDateString('ar-EG', {
                                                                year: 'numeric', month: 'numeric', day: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LoveDelivery;
