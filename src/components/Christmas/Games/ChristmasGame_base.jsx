/**
 * ðŸŽ„ Christmas Adventure Game - FINAL VERSION ðŸŽ…
 * 
 * A complete platformer game with:
 * - Character Selection (Santa / Mrs. Santa)
 * - Full Physics Engine
 * - Multiple Levels
 * - Collectibles & Power-ups
 * - Boss Battles
 * - Responsive Design
 */

import { useState, useRef, useEffect } from 'react';
import AssetManager from '../../../game/AssetManager';
import Player from '../../../game/Player';
import LevelRenderer from '../../../game/LevelRenderer';
import GameState from '../../../game/GameState';
import ScoreManager from '../../../game/ScoreManager';
import { GAME, PLAYER } from '../../../game/Constants';
import { level1_1 } from '../../../game/levels/Level';
import { useImmersiveMode } from '../../../context/ImmersiveModeContext.jsx';

const ChristmasGame = () => {
    const { setIsImmersive } = useImmersiveMode();

    useEffect(() => {
        // Enable Immersive Mode (Hide Hub UI)
        setIsImmersive(true);

        // Load leaderboard scores
        setLeaderboardScores(scoreManagerRef.current.getScores());

        return () => {
            // Disable Immersive Mode (Show Hub UI)
            setIsImmersive(false);
        };
    }, []);

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // GAME STATES
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const [gamePhase, setGamePhase] = useState('CHARACTER_SELECT'); // CHARACTER_SELECT, LOADING, PLAYING, PAUSED, GAME_OVER, VICTORY
    const [leaderboardScores, setLeaderboardScores] = useState([]);
    const [selectedCharacter, setSelectedCharacter] = useState(null); // 'mr-santa' or 'mrs-santa'
    const [currentLevel, setCurrentLevel] = useState(1);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState(null);

    // Game Refs (not React state to avoid re-render loops)
    const assetManagerRef = useRef(null);
    const playerRef = useRef(null);
    const scoreManagerRef = useRef(new ScoreManager());
    const levelRendererRef = useRef(null);
    const gameStateRef = useRef(null);
    const canvasRef = useRef(null);
    const gameLoopRef = useRef(null); // Store RAF ID for cleanup

    const inputRef = useRef({
        left: false,
        right: false,
        jump: false,
        jumpPressed: false,
        jumpHandled: false,
        up: false,
        down: false,
    });

    // Touch controls for mobile
    const touchControlsRef = useRef({
        left: false,
        right: false,
        jump: false
    });

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // CHARACTER SELECTION HANDLER
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const handleCharacterSelect = (character) => {
        setSelectedCharacter(character);
        setGamePhase('LOADING');
        initializeGame(character);
    };

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // GAME INITIALIZATION
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // GAME INITIALIZATION
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const initializeGame = async (character) => {
        try {
            console.log('ðŸŽ® Loading assets for character:', character);

            // Load Assets
            assetManagerRef.current = new AssetManager();
            assetManagerRef.current.onProgress = (loaded, total) => {
                setLoadingProgress(Math.floor((loaded / total) * 100));
            };

            await assetManagerRef.current.loadAll();
            console.log('âœ… Assets loaded!');

            // Initialize Game Logic (Non-Canvas dependent)
            levelRendererRef.current = new LevelRenderer(assetManagerRef.current);
            levelRendererRef.current.loadLevel(level1_1);

            gameStateRef.current = new GameState();

            playerRef.current = new Player(assetManagerRef.current, character);
            playerRef.current.x = 100;
            playerRef.current.y = 300;

            // Ready to play - this triggers render of Canvas
            setGamePhase('PLAYING');

        } catch (err) {
            console.error('âŒ Game initialization failed:', err);
            setError(err.message);
            setGamePhase('CHARACTER_SELECT');
        }
    };

    // Effect to start game loop ONCE canvas is ready
    useEffect(() => {
        if (gamePhase === 'PLAYING' && canvasRef.current) {
            console.log('ðŸŽ¬ Starting Game Loop...');
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Responsive sizing
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

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // GAME LOOP
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const startGameLoop = (canvas, ctx) => {
        let lastTime = Date.now();
        const camera = { x: 0, y: 0 };

        const loop = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            const player = playerRef.current;
            const levelRenderer = levelRendererRef.current;
            const gameState = gameStateRef.current;

            if (!player || !levelRenderer || !gameState) return;

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // UPDATE PHASE
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

            // Player Physics
            const platform = levelRenderer.checkPlatformCollision(player);
            const groundY = platform ? platform.y : 2000;

            // Merge keyboard and touch inputs
            const mergedInput = {
                left: inputRef.current.left || touchControlsRef.current.left,
                right: inputRef.current.right || touchControlsRef.current.right,
                jump: inputRef.current.jump || touchControlsRef.current.jump,
                jumpPressed: inputRef.current.jumpPressed || touchControlsRef.current.jump,
                jumpHandled: inputRef.current.jumpHandled,
                up: inputRef.current.up,
                down: inputRef.current.down,
            };

            player.update(deltaTime, mergedInput, groundY);

            // Death Zone
            if (player.y > 1000) {
                gameState.hitObstacle();
                if (gameState.lives <= 0) {
                    gameState.isGameOver = true;
                    setGamePhase('GAME_OVER');
                    return; // Stop loop
                } else {
                    // Respawn
                    player.x = 100;
                    player.y = 300;
                    player.vx = 0;
                    player.vy = 0;
                }
            }

            // Collectibles
            const collectible = levelRenderer.checkCollectibleCollision(player, gameState);
            if (collectible) {
                gameState.markCollected(collectible.id);

                // Add particle effect
                levelRenderer.addParticle(collectible.item.x + 25, collectible.item.y + 25, collectible.type);

                if (collectible.type === 'heart') {
                    gameState.collectHeart();
                } else if (collectible.type === 'coin') {
                    gameState.collectCoin();
                }
            }

            // Obstacles
            const obstacle = levelRenderer.checkObstacleCollision(player, gameState);
            if (obstacle) {
                gameState.markHit(obstacle.id);
                gameState.hitObstacle();
                player.invincible = true;
                player.invincibleTimer = 1000;

                // Particle effect for hit
                levelRenderer.addParticle(player.x + 50, player.y + 50, 'spark');

                // Camera shake
                camera.x += (Math.random() - 0.5) * 20;
                camera.y += (Math.random() - 0.5) * 20;

                // Check if game over after hit
                if (gameState.isGameOver) {
                    setGamePhase('GAME_OVER');
                    return; // Stop loop immediately
                }
            }

            // Update Camera (Follow Player)
            const targetCameraX = player.x - canvas.width / 3;
            camera.x += (targetCameraX - camera.x) * 0.1;
            camera.x = Math.max(0, camera.x);

            // Check Finish Line Victory
            if (levelRenderer.levelData && levelRenderer.levelData.finish) {
                const finishLine = levelRenderer.levelData.finish;
                const finishDistance = 240; // Width of finish line (3x size)

                // Check if player reached finish
                if (player.x + player.width >= finishLine.x &&
                    player.x <= finishLine.x + finishDistance) {

                    // Victory particles
                    for (let i = 0; i < 20; i++) {
                        levelRenderer.addParticle(
                            finishLine.x + Math.random() * finishDistance,
                            finishLine.y + Math.random() * 240,
                            'coin'
                        );
                    }

                    // Trigger Victory
                    gameState.isVictory = true;
                    setGamePhase('VICTORY');
                    return; // Stop loop
                }
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // RENDER PHASE
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // World Space (with camera)
            ctx.save();
            ctx.translate(-camera.x, -camera.y);

            levelRenderer.draw(ctx, camera, canvas.width, canvas.height, gameState);
            player.draw(ctx);

            ctx.restore();

            // Screen Space (HUD)
            drawHUD(ctx, canvas, gameState);

            // Damage Flash
            if (player.invincible) {
                ctx.fillStyle = `rgba(255, 0, 0, ${Math.abs(Math.sin(Date.now() / 100)) * 0.3})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Continue Loop
            gameLoopRef.current = requestAnimationFrame(loop);
        };

        loop();
    };

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // HUD RENDERING
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const drawHUD = (ctx, canvas, gameState) => {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 24px Arial';

        // Score
        const scoreText = `ðŸ† ${gameState.score}`;
        ctx.strokeText(scoreText, 10, 30);
        ctx.fillText(scoreText, 10, 30);

        // Hearts
        const heartsText = `â¤ï¸ ${gameState.hearts}`;
        ctx.strokeText(heartsText, 10, 60);
        ctx.fillText(heartsText, 10, 60);

        // Coins
        const coinsText = `ðŸ’° ${gameState.coins}`;
        ctx.strokeText(coinsText, 10, 90);
        ctx.fillText(coinsText, 10, 90);

        // Lives
        const livesText = `ðŸ’™ ${gameState.lives}`;
        ctx.strokeText(livesText, 10, 120);
        ctx.fillText(livesText, 10, 120);

        // Controls
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('â† â†’ Move | SPACE Jump', canvas.width - 200, 30);
    };

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // INPUT HANDLING
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    useEffect(() => {
        const handleKeyDown = (e) => {
            // ESC to pause
            if (e.code === 'Escape') {
                if (gamePhase === 'PLAYING') {
                    setGamePhase('PAUSED');
                }
                return;
            }

            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                inputRef.current.jump = true;
                inputRef.current.jumpPressed = true;
            }
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                inputRef.current.left = true;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                inputRef.current.right = true;
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                inputRef.current.jump = false;
                inputRef.current.jumpPressed = false;
            }
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                inputRef.current.left = false;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                inputRef.current.right = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, []);

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // RESTART HANDLER
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const handleRestart = () => {
        // CRITICAL: Cancel existing loop to prevent double speed bug
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
        }

        // Reset game state
        if (gameStateRef.current) {
            gameStateRef.current.reset();
        }
        if (playerRef.current) {
            playerRef.current.x = 100;
            playerRef.current.y = 300;
            playerRef.current.vx = 0;
            playerRef.current.vy = 0;
        }

        // Trigger PLAYING phase - useEffect will auto-start the game loop
        setGamePhase('PLAYING');
    };

    const handleBackToMenu = () => {
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
        }
        setGamePhase('CHARACTER_SELECT');
        setSelectedCharacter(null);
    };

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // RENDER UI BASED ON GAME PHASE
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    // CHARACTER SELECTION SCREEN
    if (gamePhase === 'CHARACTER_SELECT') {
        return (
