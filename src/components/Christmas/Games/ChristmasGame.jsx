/**
 * 🎄 Christmas Adventure Game - COMPLETE VERSION 🎅
 */

import { useState, useRef, useEffect } from 'react';
import AssetManager from '../../../game/AssetManager';
import Player from '../../../game/Player';
import LevelRenderer from '../../../game/LevelRenderer';
import LevelGenerator from '../../../game/LevelGenerator'; // NEW
import { getCharacterAsset } from '../../../game/Characters';
import GameState from '../../../game/GameState';
import ScoreManager from '../../../game/ScoreManager';
import { GAME, CHARACTERS, OBSTACLES } from '../../../game/Constants';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../supabase';
import { FaPlay, FaShoppingCart, FaMapMarkedAlt, FaCoins, FaMobileAlt } from 'react-icons/fa';

// New Game Components
import MainMenu from './components/MainMenu';
import WorldSelect from './components/WorldSelect';
import LevelMap from './components/LevelMap';

// Helper utility
const checkCollision = (rect1, rect2) => {
    // Basic AABB
    // Note: rect2 might just be {x, y, type} so we need size lookup if not provided
    // But currently collectibles/obstacles don't have w/h attached in entity list efficiently?
    // They are just {x, y, type}.
    // So the main loop logic above is better.
    // This helper is kept for Collectibles which are less strict.

    // Fallback size if not present
    const r2w = rect2.width || 40;
    const r2h = rect2.height || 40;

    return (
        rect1.x < rect2.x + r2w &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + r2h &&
        rect1.y + rect1.height > rect2.y
    );
};
import { level1_1 } from '../../../game/levels/Level';
import { useImmersiveMode } from '../../../context/ImmersiveModeContext.jsx';

const ChristmasGame = () => {
    const { setIsImmersive } = useImmersiveMode();
    const { currentUser } = useAuth(); // Get logged in user

    // Mobile Orientation Check
    const [isLandscape, setIsLandscape] = useState(true);

    useEffect(() => {
        setIsImmersive(true);

        const checkOrientation = () => {
            // Check if on mobile (screen width < 768px) and in portrait mode
            if (window.innerWidth < 768 && window.innerHeight > window.innerWidth) {
                setIsLandscape(false);
            } else {
                setIsLandscape(true);
            }
        };

        // Initial check
        checkOrientation();

        // Listen for resize/orientation change
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        // Load scores from Supabase
        const loadScores = async () => {
            try {
                if (scoreManagerRef.current) {
                    const scores = await scoreManagerRef.current.getScores();
                    setLeaderboardScores(scores);
                }
            } catch (e) {
                console.error("Failed to load scores", e);
            }
        };
        loadScores();

        return () => {
            setIsImmersive(false);
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    const [gamePhase, setGamePhase] = useState('MENU'); // MENU, PLAYING, PAUSED, GAME_OVER, VICTORY, LEVEL_COMPLETE, WORLDS, LEVELS
    const [leaderboardScores, setLeaderboardScores] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState(null);

    // UI State
    const [selectedWorld, setSelectedWorld] = useState(null);
    const [selectedCharacter, setSelectedCharacter] = useState('mr-santa');

    const assetManagerRef = useRef(null);
    const playerRef = useRef(null);
    const scoreManagerRef = useRef(new ScoreManager());
    const levelGeneratorRef = useRef(null); // NEW
    const levelRendererRef = useRef(null);
    const gameStateRef = useRef(null);
    const canvasRef = useRef(null);
    const gameLoopRef = useRef(null);

    const inputRef = useRef({
        left: false,
        right: false,
        jump: false,
        jumpPressed: false,
        jumpHandled: false,
        up: false,
        down: false,
    });

    const touchControlsRef = useRef({
        left: false,
        right: false,
        jump: false
    });

    const handleCharacterSelect = (character) => {
        setSelectedCharacter(character);
        setGamePhase('LOADING');
        initializeGame(character);
    };

    const initializeGame = async (character) => {
        try {
            assetManagerRef.current = new AssetManager();
            assetManagerRef.current.onProgress = (loaded, total) => {
                setLoadingProgress(Math.floor((loaded / total) * 100));
            };

            await assetManagerRef.current.loadAll();

            // Initialize Generator & Renderer
            levelGeneratorRef.current = new LevelGenerator('village'); // Start with Village
            levelRendererRef.current = new LevelRenderer(assetManagerRef.current);

            // LOAD LEVEL ASSETS (Critical for Backgrounds)
            // We need to pass the level data (backgrounds) to the renderer
            // We can get this from WORLDS const or Generator config
            // Let's import WORLDS
            const { WORLDS } = await import('../../../game/Constants');
            levelRendererRef.current.loadLevel({
                background: [
                    { asset: 'bg-village-sky', speed: 0.1 },
                    { asset: 'bg-village-mountains', speed: 0.3 },
                    { asset: 'bg-village-houses', speed: 0.5 },
                    { asset: 'bg-village-trees', speed: 0.7 },
                    { asset: 'bg-village-snow', speed: 1.0 }
                ]
            });

            gameStateRef.current = new GameState();

            // Initialize Player
            playerRef.current = new Player(assetManagerRef.current, character);
            playerRef.current.x = 100;
            playerRef.current.y = 300;

            setGamePhase('PLAYING');
        } catch (err) {
            setError(err.message);
            setGamePhase('CHARACTER_SELECT');
        }
    };

    useEffect(() => {
        if (gamePhase === 'PLAYING' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            const maxWidth = window.innerWidth;
            const maxHeight = window.innerHeight;
            const aspectRatio = GAME.CANVAS_WIDTH / GAME.CANVAS_HEIGHT;

            if (maxWidth / maxHeight > aspectRatio) {
                canvas.height = maxHeight;
                canvas.width = canvas.height * aspectRatio;
            } else {
                canvas.width = maxWidth;
                canvas.height = canvas.width / aspectRatio;
            }

            startGameLoop(canvas, ctx);
        }
    }, [gamePhase]);

    const startGameLoop = (canvas, ctx) => {
        let lastTime = Date.now();
        const camera = { x: 0, y: 0 };
        const generator = levelGeneratorRef.current; // Access from ref
        const renderer = levelRendererRef.current;   // Access from ref

        const loop = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            const player = playerRef.current;
            const gameState = gameStateRef.current;

            if (!player || !renderer || !gameState || !generator) return;

            // === LEVEL SYSTEM CONFIGURATION ===
            const LEVELS = [
                { id: 1, duration: 45, dist: 13500, color: '#48bb78' },
                { id: 2, duration: 60, dist: 18000, color: '#ed8936' },
                { id: 3, duration: 90, dist: 27000, color: '#e53e3e' }
            ];
            const currentLvlConfig = LEVELS[gameState.currentLevel - 1] || LEVELS[LEVELS.length - 1];

            // 1. Generate/Cleanup Levels dynamically
            generator.update(player.x, canvas.width, currentLvlConfig.dist); // Pass Target Dist
            const worldEntities = generator.getState();

            // === DEATH & RESPAWN (Falling) ===
            const killY = canvas.height + 150; // Death plane

            // Check if player fell off world
            if (player.y > killY) {
                const isDead = player.hit(); // Decrement lives
                if (isDead) {
                    setGamePhase('GAME_OVER');
                    return;
                } else {
                    // Respawn logic
                    player.y = -100; // Drop from sky
                    player.x -= 200; // Set back a bit
                    if (player.x < 100) player.x = 100; // Don't go behind start
                    player.vy = 0;
                }
            }

            player.update(deltaTime, inputRef.current, killY + 500); // Update physics

            // Handle Platform Collision
            // Reset grounded status if we are in the air (Player detects groundY, but platforms are custom)
            if (player.y + player.height < killY) {
                // We only check platforms if we are above the death plane
                let onPlatform = false;
                worldEntities.platforms.forEach(platform => {
                    // Simple Feet Check: specific to platformer physics
                    // Check if player is within horizontal bounds of platform
                    if (player.x + player.width > platform.x && player.x < platform.x + platform.width) {
                        // Check vertical collision (feet touching top of platform)
                        // Allow small tolerance (e.g., 20px) for high velocity landings
                        // Check if we were previously above or currently intersecting the top
                        const platformTop = platform.y;
                        const feetPos = player.y + player.height;

                        // If feet are near platform top and we are falling (vy >= 0)
                        if (player.vy >= 0 && feetPos >= platformTop && feetPos <= platformTop + 25) {
                            player.y = platformTop - player.height;
                            player.vy = 0;
                            player.grounded = true;
                            player.jumpCount = 0;
                            onPlatform = true;
                        }
                    }
                });
            }

            // Check Obstacles (Harmful)
            worldEntities.obstacles.forEach((obs) => {
                if (checkCollision(player, obs)) {
                    const isDead = player.hit();
                    if (isDead) {
                        setGamePhase('GAME_OVER');
                    } else {
                        // Knockback?
                        player.vy = -300;
                        player.vx = -300;
                    }
                }
            });

            // Check Collectibles & Finish Line
            worldEntities.collectibles.forEach((col, index) => {
                // If it's the Finish Line, use a larger hitbox detection
                if (col.type === 'collectible-finish') {
                    // Simple distance check or AABB
                    if (player.x > col.x && player.x < col.x + 200) {
                        // TRIGGER LEVEL COMPLETE
                        setGamePhase('LEVEL_COMPLETE');
                        return;
                    }
                } else if (checkCollision(player, col)) {
                    // Remove collected
                    worldEntities.collectibles.splice(index, 1);
                    if (col.type === 'coin') player.collectCoin();
                    if (col.type === 'heart') player.collectHeart();
                    renderer.addParticle(col.x, col.y, 'spark');
                }
            });

            // Camera Follow
            // Simple camera logic: Keep player centered-ish
            camera.x = player.x - 150;

            // Render World
            if (renderer && renderer.drawDynamic) {
                // drawDynamic(ctx, camera, canvasWidth, canvasHeight, entities, gameState, player)
                renderer.drawDynamic(ctx, camera, canvas.width, canvas.height, worldEntities, gameState, player);
            }

            // Draw HUD
            drawHUD(ctx, canvas, gameState, currentLvlConfig);

            gameLoopRef.current = requestAnimationFrame(loop);
        };

        loop();
    };

    const drawHUD = (ctx, canvas, gameState, levelDuration) => {
        // Safe area padding
        const padding = 20;

        // 1. Lives (Blue Hearts)
        // Draw 3 slots, filled or empty
        for (let i = 0; i < 3; i++) {
            const hasHeart = i < gameState.lives;
            ctx.fillStyle = hasHeart ? '#4fd1c5' : 'rgba(0,0,0,0.3)'; // Blue or gray
            ctx.shadowBlur = hasHeart ? 10 : 0;
            ctx.shadowColor = '#4fd1c5';

            // Heart Shape
            const hx = padding + (i * 40);
            const hy = padding + 10;
            const size = 15;

            ctx.beginPath();
            ctx.moveTo(hx, hy + size / 4);
            ctx.quadraticCurveTo(hx, hy, hx + size / 2, hy);
            ctx.quadraticCurveTo(hx + size, hy, hx + size, hy + size / 2);
            ctx.quadraticCurveTo(hx + size, hy + size, hx, hy + size * 1.5);
            ctx.quadraticCurveTo(hx - size, hy + size, hx - size, hy + size / 2);
            ctx.quadraticCurveTo(hx - size, hy, hx - size / 2, hy);
            ctx.quadraticCurveTo(hx, hy, hx, hy + size / 4);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // 2. Coins
        ctx.fillStyle = '#ffd700'; // Gold
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`$ ${gameState.coins} `, padding, padding + 70);

        // 3. Progress Bar & Level Info
        const lvlConfig = levelDuration; // This is the level config object passed from loop
        const targetDist = lvlConfig.dist;
        const currentProgress = Math.min(1, Math.max(0, playerRef.current ? (playerRef.current.x / targetDist) : 0));

        const barWidth = 400; // Wider bar
        const barHeight = 25;
        const barX = (canvas.width - barWidth) / 2;
        const barY = padding + 10;

        // Level Info Text (Centered above bar)
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(`World 1: Village  •  Level ${gameState.currentLevel} `, canvas.width / 2, barY - 10);
        ctx.shadowBlur = 0;

        // Bar Background
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 10);
        ctx.fill();
        ctx.stroke();

        // Bar Fill
        if (currentProgress > 0) {
            ctx.fillStyle = lvlConfig.color || '#48bb78';
            ctx.beginPath();
            // Clamp radius ensuring it doesn't exceed width
            const fillWidth = Math.max(12, barWidth * currentProgress);
            ctx.roundRect(barX + 2, barY + 2, fillWidth - 4, barHeight - 4, 8);
            ctx.fill();
        }

        // Percentage Text inside bar
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`${Math.floor(currentProgress * 100)}% `, canvas.width / 2, barY + 19);

        // Icon at end
        ctx.textAlign = 'left';
        ctx.font = '24px Arial';
        ctx.fillText('🏁', barX + barWidth + 10, barY + 22);

        const livesText = `💙 ${gameState.lives} `;
        // Draw lives on the right side
        ctx.textAlign = 'right';
        ctx.font = 'bold 28px Arial';
        ctx.strokeText(livesText, canvas.width - padding, 40);
        ctx.fillText(livesText, canvas.width - padding, 40);

        ctx.textAlign = 'left'; // Reset alignment
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Escape' && gamePhase === 'PLAYING') {
                setGamePhase('PAUSED');
                return;
            }

            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                inputRef.current.jump = true;
                inputRef.current.jumpPressed = true;
            }
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') inputRef.current.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') inputRef.current.right = true;
        };

        const handleKeyUp = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                inputRef.current.jump = false;
                inputRef.current.jumpPressed = false;
            }
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') inputRef.current.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') inputRef.current.right = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [gamePhase]);

    // Save scores when reaching GAME_OVER or VICTORY (CRITICAL: must be outside conditional renders)
    // Save scores/progress when reaching LEVEL_COMPLETE, GAME_OVER or VICTORY
    useEffect(() => {
        const handleGameCompletion = async () => {
            if (!gameStateRef.current) return;

            const finalScore = gameStateRef.current.score || 0;
            const finalCoins = gameStateRef.current.coins || 0;
            const currentLevel = gameStateRef.current.currentLevel;

            // 1. LEVEL COMPLETE - Save Progress
            if (gamePhase === 'LEVEL_COMPLETE') {
                if (currentUser) {
                    const stars = finalScore > 1000 ? 3 : finalScore > 500 ? 2 : 1;
                    const worldId = 'village';

                    try {
                        // Save Current Level
                        await supabase.from('game_progress').upsert({
                            user_id: currentUser.id,
                            world_id: worldId,
                            level_id: currentLevel,
                            stars: stars,
                            score: finalScore,
                            status: 'completed'
                        }, { onConflict: 'user_id, world_id, level_id' });

                        // Unlock Next Level
                        const nextLvl = currentLevel + 1;
                        if (nextLvl <= 3) {
                            await supabase.from('game_progress').upsert({
                                user_id: currentUser.id,
                                world_id: worldId,
                                level_id: nextLvl,
                                status: 'unlocked'
                            }, { onConflict: 'user_id, world_id, level_id', ignoreDuplicates: true });
                        }
                    } catch (err) {
                        console.error("Error saving progress:", err);
                    }
                }
            }

            // 2. GAME OVE / VICTORY - Save High Score to Leaderboard
            if (gamePhase === 'GAME_OVER' || gamePhase === 'VICTORY') {
                const finalHearts = gameStateRef.current.hearts || 0;
                const playerName = selectedCharacter === 'mr-santa' ? 'حسانين' : 'ندى';

                // Save to Supabase
                if (scoreManagerRef.current) {
                    await scoreManagerRef.current.saveScore(playerName, finalScore, {
                        coins: finalCoins,
                        hearts: finalHearts,
                        character: selectedCharacter
                    });

                    // Reload leaderboard
                    const updatedScores = await scoreManagerRef.current.getScores();
                    setLeaderboardScores(updatedScores);
                }
            }
        };
        handleGameCompletion();
    }, [gamePhase, selectedCharacter, currentUser]);

    const handleRestart = () => {
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
        }

        // Clean Reset: Re-initialize specific components to avoid stale state
        // 1. Reset Game State
        if (gameStateRef.current) gameStateRef.current.reset();

        // 2. Reset Player Position & Velocity
        if (playerRef.current) {
            playerRef.current.reset();
            playerRef.current.x = 100;
            playerRef.current.y = 300; // Drop from sky
            playerRef.current.lives = 3; // Ensure player has lives
        }

        // 3. Reset Level Generator (CRITICAL)
        if (levelGeneratorRef.current) {
            levelGeneratorRef.current.reset();
            // Force generate initial content
            levelGeneratorRef.current.update(100, GAME.CANVAS_WIDTH);
        }

        // 4. Reload Level Assets into Renderer (Fixes Black Screen on Restart)
        if (levelRendererRef.current) {
            levelRendererRef.current.particles = [];
            // Re-load world config to ensure layers are present
            import('../../../game/Constants').then(({ WORLDS }) => {
                levelRendererRef.current.loadLevel({
                    background: [
                        { asset: 'bg-village-sky', speed: 0.1 },
                        { asset: 'bg-village-mountains', speed: 0.3 },
                        { asset: 'bg-village-houses', speed: 0.5 },
                        { asset: 'bg-village-trees', speed: 0.7 },
                        { asset: 'bg-village-snow', speed: 1.0 }
                    ]
                });
            });
        }

        // 5. Restart Loop
        // Small timeout to allow state to clear?
        requestAnimationFrame(() => {
            setGamePhase('PLAYING');
        });
    };

    const handleBackToMenu = () => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        setGamePhase('MAIN_MENU');
        setSelectedCharacter(null);
    };

    // === MOBILE LANDSCAPE WARNING ===
    if (!isLandscape) {
        return (
            <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center text-white p-8 text-center">
                <FaMobileAlt className="text-6xl text-yellow-400 mb-4 animate-pulse" style={{ transform: 'rotate(90deg)' }} />
                <h1 className="text-2xl font-bold mb-2">يرجى تدوير الهاتف</h1>
                <p className="text-gray-400">للحصول على أفضل تجربة، يرجى اللعب في الوضع العرضي</p>
            </div>
        );
    }

    // === MAIN MENU ===
    if (gamePhase === 'MAIN_MENU') {
        return (
            <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#1a0b2e] to-[#2d1b4e] flex flex-col items-center justify-center overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute inset-0 bg-[url('/images/game-santa/bg-village-sky.png')] bg-cover opacity-30"></div>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

                {/* Header */}
                <div className="relative z-10 text-center mb-12">
                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-red-500 to-yellow-300 animate-pulse drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                        Christmas Adventure
                    </h1>
                    <p className="text-xl text-yellow-100 mt-4 tracking-widest uppercase">The Ultimate Holiday Journey</p>
                </div>

                {/* Menu Grid */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full px-4">

                    {/* Store Button */}
                    <button className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-3xl p-6 border-2 border-white/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        <div className="absolute -top-6 -right-6 bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce">
                            New
                        </div>
                        <FaShoppingCart className="text-5xl text-purple-400 mb-4 mx-auto group-hover:scale-110 transition-transform" />
                        <h2 className="text-2xl font-bold text-white mb-2">المتجر</h2>
                        <p className="text-gray-300 text-sm">شراء أزياء وقدرات جديدة</p>
                    </button>

                    {/* Play Button (Center) */}
                    <button
                        onClick={() => setGamePhase('CHARACTER_SELECT')}
                        className="group relative bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-8 transform scale-110 border-4 border-yellow-400 shadow-[0_0_50px_rgba(255,0,0,0.5)] hover:scale-125 transition-all duration-300 hover:shadow-[0_0_80px_rgba(255,0,0,0.8)]"
                    >
                        <FaPlay className="text-6xl text-white ml-2 mx-auto filter drop-shadow-lg" />
                        <h2 className="text-3xl font-black text-white mt-4 uppercase">Play</h2>
                    </button>

                    {/* Levels Button */}
                    <button className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-3xl p-6 border-2 border-white/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        <div className="absolute -top-3 -left-3 bg-yellow-500 text-black px-3 py-1 rounded-full font-bold text-xs shadow-lg">
                            Lvl 1
                        </div>
                        <FaMapMarkedAlt className="text-5xl text-green-400 mb-4 mx-auto group-hover:scale-110 transition-transform" />
                        <h2 className="text-2xl font-bold text-white mb-2">المراحل</h2>
                        <p className="text-gray-300 text-sm">اختر مغامرتك التالية</p>
                    </button>

                </div>

                {/* Footer Stats */}
                <div className="absolute bottom-8 flex gap-8">
                    <div className="flex items-center gap-3 bg-black/60 px-6 py-3 rounded-full border border-yellow-500/50">
                        <FaCoins className="text-yellow-400 text-2xl" />
                        <span className="text-2xl font-bold text-white">0</span>
                    </div>
                </div>

                {/* Logged in User */}
                <div className="absolute top-8 right-8 text-right">
                    <p className="text-gray-400 text-sm">Playing as</p>
                    <p className="text-white font-bold text-lg">{currentUser?.email?.split('@')[0] || 'Guest'}</p>
                </div>
            </div>
        );
    }

    // CHARACTER SELECT
    // === MOBILE LANDSCAPE WARNING ===
    if (!isLandscape) {
        return (
            <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center text-white p-8 text-center">
                <FaMobileAlt className="text-6xl text-yellow-400 mb-4 animate-pulse" style={{ transform: 'rotate(90deg)' }} />
                <h1 className="text-2xl font-bold mb-2">يرجى تدوير الهاتف</h1>
                <p className="text-gray-400">للحصول على أفضل تجربة، يرجى اللعب في الوضع العرضي</p>
            </div>
        );
    }

    // === MAIN MENU ===
    if (gamePhase === 'MAIN_MENU') {
        return (
            <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#1a0b2e] to-[#2d1b4e] flex flex-col items-center justify-center overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute inset-0 bg-[url('/images/game-santa/bg-village-sky.png')] bg-cover opacity-30"></div>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

                {/* Header */}
                <div className="relative z-10 text-center mb-12">
                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-red-500 to-yellow-300 animate-pulse drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                        Christmas Adventure
                    </h1>
                    <p className="text-xl text-yellow-100 mt-4 tracking-widest uppercase">The Ultimate Holiday Journey</p>
                </div>

                {/* Menu Grid */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full px-4">

                    {/* Store Button */}
                    <button className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-3xl p-6 border-2 border-white/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        <div className="absolute -top-6 -right-6 bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce">
                            New
                        </div>
                        <FaShoppingCart className="text-5xl text-purple-400 mb-4 mx-auto group-hover:scale-110 transition-transform" />
                        <h2 className="text-2xl font-bold text-white mb-2">المتجر</h2>
                        <p className="text-gray-300 text-sm">شراء أزياء وقدرات جديدة</p>
                    </button>

                    {/* Play Button (Center) */}
                    <button
                        onClick={() => setGamePhase('CHARACTER_SELECT')}
                        className="group relative bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-8 transform scale-110 border-4 border-yellow-400 shadow-[0_0_50px_rgba(255,0,0,0.5)] hover:scale-125 transition-all duration-300 hover:shadow-[0_0_80px_rgba(255,0,0,0.8)]"
                    >
                        <FaPlay className="text-6xl text-white ml-2 mx-auto filter drop-shadow-lg" />
                        <h2 className="text-3xl font-black text-white mt-4 uppercase">Play</h2>
                    </button>

                    {/* Levels Button */}
                    <button className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-3xl p-6 border-2 border-white/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        <div className="absolute -top-3 -left-3 bg-yellow-500 text-black px-3 py-1 rounded-full font-bold text-xs shadow-lg">
                            Lvl 1
                        </div>
                        <FaMapMarkedAlt className="text-5xl text-green-400 mb-4 mx-auto group-hover:scale-110 transition-transform" />
                        <h2 className="text-2xl font-bold text-white mb-2">المراحل</h2>
                        <p className="text-gray-300 text-sm">اختر مغامرتك التالية</p>
                    </button>

                </div>

                {/* Footer Stats */}
                <div className="absolute bottom-8 flex gap-8">
                    <div className="flex items-center gap-3 bg-black/60 px-6 py-3 rounded-full border border-yellow-500/50">
                        <FaCoins className="text-yellow-400 text-2xl" />
                        <span className="text-2xl font-bold text-white">0</span>
                    </div>
                </div>

                {/* Logged in User */}
                <div className="absolute top-8 right-8 text-right">
                    <p className="text-gray-400 text-sm">Playing as</p>
                    <p className="text-white font-bold text-lg">{currentUser?.email?.split('@')[0] || 'Guest'}</p>
                </div>
            </div>
        );
    }

    // === RENDER UI PHASES ===

    // 1. MAIN MENU (New Professional UI)
    if (gamePhase === 'MENU') {
        return (
            <MainMenu
                onPlay={() => setGamePhase('WORLDS')}  // Go to World Select
                onStore={() => alert("Store coming soon!")}
                onSettings={() => console.log("Settings")}
            />
        );
    }

    // 2. WORLD SELECTION
    if (gamePhase === 'WORLDS') {
        return (
            <WorldSelect
                onBack={() => setGamePhase('MENU')}
                onSelectWorld={(worldId) => {
                    setSelectedWorld(worldId);
                    setGamePhase('LEVELS');
                }}
            />
        );
    }

    // 3. LEVEL MAP
    if (gamePhase === 'LEVELS') {
        return (
            <LevelMap
                worldId={selectedWorld}
                onBack={() => setGamePhase('WORLDS')}
                onPlayLevel={(levelId) => {
                    // Start Game Logic
                    if (!gameStateRef.current) {
                        gameStateRef.current = new GameState();
                    }
                    gameStateRef.current.currentLevel = levelId;

                    // Trigger Loading
                    setGamePhase('LOADING');

                    // Simulate Load & Start
                    initializeGame(selectedCharacter); // Use initializeGame
                }}
            />
        );
    }

    // FALLBACK: OLD CHARACTER SELECT (Just in case, or removed)
    // Removed.



    // LEVEL COMPLETE MODAL
    if (gamePhase === 'LEVEL_COMPLETE') {
        const currentLevel = gameStateRef.current.currentLevel;
        const score = gameStateRef.current.score;
        // Don't calculate saving logic here, just render
        // Note: Stars calculation can be done here for display or passed from state
        const stars = score > 1000 ? 3 : score > 500 ? 2 : 1;

        const handleNextLevel = () => {
            // Define max levels
            const MAX_LEVELS = 3;

            if (gameStateRef.current.currentLevel < MAX_LEVELS) {
                // Increment Level
                gameStateRef.current.currentLevel += 1;

                // IMPORTANT: Force a full reset for the new level
                setGamePhase('LOADING');

                setTimeout(() => {
                    handleRestart();
                    setGamePhase('PLAYING');
                }, 100);
            } else {
                // Victory!
                setGamePhase('VICTORY');
            }
        };

        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
                <canvas ref={canvasRef} className="absolute inset-0 blur-sm brightness-50" />
                <div className="relative z-10 bg-gradient-to-br from-green-800 to-green-900 rounded-3xl border-4 border-yellow-400 p-12 max-w-2xl mx-auto shadow-2xl transform scale-100 animate-slide-up">
                    <h1 className="text-6xl font-black text-yellow-300 text-center mb-8 drop-shadow-lg">
                        LEVEL {gameStateRef.current.currentLevel} COMPLETE!
                    </h1>

                    <div className="flex justify-center gap-4 mb-8">
                        {/* Star Rating Logic */}
                        {[1, 2, 3].map(star => (
                            <div key={star} className={`text-6xl transform transition-all delay-${star * 100} duration-500 ${star <= (gameStateRef.current.coins > 50 ? 3 : 2) ? 'scale-110 text-yellow-400' : 'text-gray-600'}`}>
                                ⭐
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/10 rounded-xl p-6 mb-8 backdrop-blur-sm">
                        <div className="flex justify-between items-center text-2xl text-white mb-4 border-b border-white/20 pb-2">
                            <span>Coins Collected:</span>
                            <span className="font-bold text-yellow-300">{gameStateRef.current.coins} 💰</span>
                        </div>
                        <div className="flex justify-between items-center text-2xl text-white">
                            <span>Hearts Remaining:</span>
                            <span className="font-bold text-red-400">{gameStateRef.current.lives} ❤️</span>
                        </div>
                    </div>

                    <button onClick={handleNextLevel} className="w-full py-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-3xl rounded-2xl shadow-xl hover:scale-105 transition-transform hover:shadow-orange-500/50">
                        NEXT LEVEL ⏭️
                    </button>
                    <p className="text-center text-green-200 mt-4 text-sm uppercase tracking-widest">Village World • Progress Saved</p>
                </div>
            </div>
        );
    }

    // PAUSED
    if (gamePhase === 'PAUSED') {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
                <canvas ref={canvasRef} className="absolute inset-0 blur-sm brightness-50" />
                <div className="relative z-10 bg-black/90 backdrop-blur-xl rounded-3xl border-4 border-blue-500 p-12 max-w-xl mx-auto">
                    <h1 className="text-7xl font-bold text-blue-400 text-center mb-8">⏸️ PAUSED</h1>
                    <div className="flex flex-col gap-4">
                        <button onClick={() => setGamePhase('PLAYING')} className="px-12 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-2xl rounded-xl">
                            ▶️ Resume
                        </button>
                        <button onClick={handleBackToMenu} className="px-12 py-5 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-2xl rounded-xl">
                            🏠 Main Menu
                        </button>
                    </div>
                    <p className="text-center text-gray-400 mt-6 text-sm">Press ESC to resume</p>
                </div>
            </div>
        );
    }

    // GAME OVER
    if (gamePhase === 'GAME_OVER') {
        const finalScore = gameStateRef.current?.score || 0;
        const finalCoins = gameStateRef.current?.coins || 0;
        const finalHearts = gameStateRef.current?.hearts || 0;

        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
                <canvas ref={canvasRef} className="absolute inset-0 blur-sm brightness-50" />
                <div className="relative z-10 bg-black/90 backdrop-blur-xl rounded-3xl border-4 border-red-500 p-12 max-w-2xl mx-auto">
                    <h1 className="text-7xl font-bold text-red-500 text-center mb-8 animate-pulse">GAME OVER</h1>
                    <div className="bg-gray-900/50 rounded-xl p-8 mb-8 border-2 border-gray-700">
                        <h2 className="text-3xl font-bold text-white mb-6 text-center">Final Stats</h2>
                        <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                                <div className="text-5xl mb-2">🏆</div>
                                <div className="text-2xl font-bold text-yellow-400">{finalScore}</div>
                                <div className="text-sm text-gray-400">Score</div>
                            </div>
                            <div>
                                <div className="text-5xl mb-2">💰</div>
                                <div className="text-2xl font-bold text-yellow-400">{finalCoins}</div>
                                <div className="text-sm text-gray-400">Coins</div>
                            </div>
                            <div>
                                <div className="text-5xl mb-2">❤️</div>
                                <div className="text-2xl font-bold text-red-400">{finalHearts}</div>
                                <div className="text-sm text-gray-400">Hearts</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button onClick={handleRestart} className="px-10 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-xl rounded-xl">🔄 Try Again</button>
                        <button onClick={handleBackToMenu} className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-xl rounded-xl">🏠 Main Menu</button>
                    </div>
                </div>
            </div>
        );
    }

    // LOADING
    if (gamePhase === 'LOADING') {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 via-purple-900 to-indigo-900 text-white">
                <div className="text-8xl mb-8 animate-bounce">{selectedCharacter === 'mr-santa' ? '🎅' : '🤶'}</div>
                <h1 className="text-5xl font-bold mb-12">Loading Christmas Magic...</h1>
                <div className="w-[500px] h-10 bg-gray-800 rounded-full overflow-hidden border-4 border-white/50">
                    <div className="h-full bg-gradient-to-r from-green-400 via-yellow-500 to-red-500 flex items-center justify-center" style={{ width: `${loadingProgress}% ` }}>
                        <span className="text-white font-bold text-lg">{loadingProgress}%</span>
                    </div>
                </div>
            </div>
        );
    }

    // VICTORY
    if (gamePhase === 'VICTORY') {
        const finalScore = gameStateRef.current?.score || 0;
        const finalCoins = gameStateRef.current?.coins || 0;
        const finalHearts = gameStateRef.current?.hearts || 0;

        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
                <canvas ref={canvasRef} className="absolute inset-0 blur-sm brightness-75" />
                <div className="relative z-10 bg-black/90 backdrop-blur-xl rounded-3xl border-4 border-green-500 p-12 max-w-2xl mx-auto">
                    <h1 className="text-7xl font-bold text-green-400 text-center mb-8 animate-bounce">🎉 VICTORY! 🎉</h1>
                    <div className="bg-gray-900/50 rounded-xl p-8 mb-8 border-2 border-gray-700">
                        <h2 className="text-3xl font-bold text-white mb-6 text-center">Level Complete!</h2>
                        <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                                <div className="text-5xl mb-2">🏆</div>
                                <div className="text-2xl font-bold text-yellow-400">{finalScore}</div>
                                <div className="text-sm text-gray-400">Score</div>
                            </div>
                            <div>
                                <div className="text-5xl mb-2">💰</div>
                                <div className="text-2xl font-bold text-yellow-400">{finalCoins}</div>
                                <div className="text-sm text-gray-400">Coins</div>
                            </div>
                            <div>
                                <div className="text-5xl mb-2">❤️</div>
                                <div className="text-2xl font-bold text-red-400">{finalHearts}</div>
                                <div className="text-sm text-gray-400">Hearts</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button onClick={handleRestart} className="px-10 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-xl rounded-xl">🔄 Play Again</button>
                        <button onClick={handleBackToMenu} className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-xl rounded-xl">🏠 Main Menu</button>
                    </div>
                </div>
            </div>
        );
    }

    // PLAYING (Default Fallback)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    const handleTouchButton = (button, pressed) => {
        touchControlsRef.current[button] = pressed;
    };

    console.log("RENDER PHASE:", gamePhase); // DEBUG

    if (gamePhase === 'PLAYING') {
        return (
            <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
                <canvas ref={canvasRef} className="border-4 border-white shadow-[0_0_50px_rgba(255,255,255,0.5)]" />

                <button onClick={() => setGamePhase('PAUSED')} className="absolute top-4 right-4 w-14 h-14 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-3xl">
                    ⏸️
                </button>

                {isMobile && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute bottom-4 left-4 flex gap-2 pointer-events-auto">
                            <button onTouchStart={() => handleTouchButton('left', true)} onTouchEnd={() => handleTouchButton('left', false)} className="w-16 h-16 bg-white/30 active:bg-white/70 rounded-xl flex items-center justify-center text-3xl">⬅️</button>
                            <button onTouchStart={() => handleTouchButton('right', true)} onTouchEnd={() => handleTouchButton('right', false)} className="w-16 h-16 bg-white/30 active:bg-white/70 rounded-xl flex items-center justify-center text-3xl">➡️</button>
                        </div>
                        <div className="absolute bottom-4 right-4 pointer-events-auto">
                            <button onTouchStart={() => handleTouchButton('jump', true)} onTouchEnd={() => handleTouchButton('jump', false)} className="w-20 h-20 bg-white/30 active:bg-white/70 rounded-xl flex items-center justify-center text-4xl">⬆️</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return <div className="text-white bg-red-600 p-4 fixed top-0 left-0 z-[99999]">UNKNOWN PHASE: {gamePhase}</div>;
};



export default ChristmasGame;
