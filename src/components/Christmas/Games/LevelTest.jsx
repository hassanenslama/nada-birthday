/**
 * LevelTest - Component لاختبار Level 1-1
 */

import React, { useEffect, useRef, useState } from 'react';
import AssetManager from '../../../game/AssetManager';
import Player from '../../../game/Player';
import LevelRenderer from '../../../game/LevelRenderer';
import GameState from '../../../game/GameState';
import { level1_1 } from '../../../game/levels/Level';
import { GAME } from '../../../game/Constants';

const LevelTest = () => {
    const [selectedCharacter, setSelectedCharacter] = useState(null); // 'santa' or 'mrs-santa'

    // ... refs ...

    const setCanvasRef = (canvas) => {
        // Only start if character is selected
        if (!selectedCharacter || !canvas || canvasCallback.current) return;

        canvasCallback.current = canvas;
        const ctx = canvas.getContext('2d');
        // ... rest of init logic ...

        // Initialize player with selected character
        playerRef.current = new Player(assetManagerRef.current, selectedCharacter === 'santa' ? 'mr-santa' : 'mrs-santa');
        // ...

        startGame(canvas, ctx);
    };

    // Trigger game start when character is selected (and canvas is potentially ready)
    useEffect(() => {
        if (selectedCharacter && canvasCallback.current) {
            // Reset cleanup if needed or just force start
            // Actually, the ref callback handles start. 
            // We just need to make sure we show the canvas ONLY after selection.
        }
    }, [selectedCharacter]);

    // ...


    useEffect(() => {
        console.log('🎮 LevelTest: Component mounted!');
        return () => {
            console.log('🎮 LevelTest: Component unmounted!');
        };
    }, []);

    const startGame = (canvas, ctx) => {
        let lastTime = Date.now();

        // Camera
        const camera = {
            x: 0,
            y: 0,
            follow: function (player, canvas) {
                this.x = player.x - canvas.width / 3;
                this.y = 0;

                // Clamp camera to level bounds
                if (this.x < 0) this.x = 0;
            }
        };

        // Input handlers
        const handleKeyDown = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                if (!inputRef.current.jump) {
                    inputRef.current.jumpPressed = true;
                    inputRef.current.jumpHandled = false;
                }
                inputRef.current.jump = true;
                e.preventDefault();
            }
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                inputRef.current.left = true;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                inputRef.current.right = true;
            }
            if (e.code === 'ArrowUp') {
                inputRef.current.up = true;
            }
            if (e.code === 'ArrowDown') {
                inputRef.current.down = true;
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
            if (e.code === 'ArrowUp') {
                inputRef.current.up = false;
            }
            if (e.code === 'ArrowDown') {
                inputRef.current.down = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Game loop
        const gameLoop = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            // Update player
            if (playerRef.current && !gameStateRef.current.isGameOver) {
                const platform = levelRendererRef.current.checkPlatformCollision(playerRef.current);
                // IF on platform, use its Y. IF NOT, allowed to fall to death (2000)
                const groundY = platform ? platform.y : 2000;
                playerRef.current.update(deltaTime, inputRef.current, groundY);

                // Death zone - falls below screen
                if (playerRef.current.y > 1000) {
                    gameStateRef.current.hitObstacle(); // Lose a life
                    setLives(gameStateRef.current.lives);

                    if (gameStateRef.current.lives <= 0) {
                        gameStateRef.current.isGameOver = true;
                        console.log('💀 GAME OVER!');
                    } else {
                        // Respawn at start
                        playerRef.current.x = 100;
                        playerRef.current.y = 340;
                        playerRef.current.vx = 0;
                        playerRef.current.vy = 0;
                        console.log(`💀 Fell to death! Lives: ${gameStateRef.current.lives}`);
                    }
                }
            }

            // Check collectible collisions
            if (gameStateRef.current && levelRendererRef.current) {
                const collectible = levelRendererRef.current.checkCollectibleCollision(
                    playerRef.current,
                    gameStateRef.current
                );

                if (collectible) {
                    gameStateRef.current.markCollected(collectible.id);

                    if (collectible.type === 'heart') {
                        gameStateRef.current.collectHeart();
                        setHearts(gameStateRef.current.hearts);
                    } else if (collectible.type === 'coin') {
                        gameStateRef.current.collectCoin();
                        setCoins(gameStateRef.current.coins);
                    }

                    setScore(gameStateRef.current.score);
                    console.log(`✅ Collected ${collectible.type}! Score: ${gameStateRef.current.score}`);
                }
            }

            // Check obstacle collisions
            if (gameStateRef.current && levelRendererRef.current) {
                const obstacle = levelRendererRef.current.checkObstacleCollision(
                    playerRef.current,
                    gameStateRef.current
                );

                if (obstacle) {
                    gameStateRef.current.markHit(obstacle.id);
                    gameStateRef.current.hitObstacle();
                    // Force update React state for UI
                    setLives(gameStateRef.current.lives);

                    console.log(`❌ Hit ${obstacle.type}! Lives: ${gameStateRef.current.lives}`);

                    // Visual feedback - flash screen red
                    playerRef.current.invincible = true;
                    playerRef.current.invincibleTimer = 1000;

                    // Simple shake effect
                    camera.x += (Math.random() - 0.5) * 20;
                    camera.y += (Math.random() - 0.5) * 20;
                }
            }

            // Render Red Flash if recently hit
            if (playerRef.current && playerRef.current.invincible) {
                ctx.fillStyle = `rgba(255, 0, 0, ${Math.abs(Math.sin(Date.now() / 100)) * 0.3})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Update camera
            camera.follow(playerRef.current, canvas);

            // Draw background FIRST (in screen space, no camera transform)
            if (levelRendererRef.current) {
                ctx.save();
                levelRendererRef.current.drawBackground(ctx, camera, canvas.width, canvas.height);
                ctx.restore();
            }

            // Apply camera transform for world objects
            ctx.save();
            ctx.translate(-camera.x, -camera.y);

            // Draw level elements (platforms, obstacles, collectibles)
            if (levelRendererRef.current) {
                levelRendererRef.current.drawPlatforms(ctx);
                levelRendererRef.current.drawObstacles(ctx);
                levelRendererRef.current.drawCollectibles(ctx);
                levelRendererRef.current.drawFinish(ctx);
            }

            // Draw player
            if (playerRef.current) {
                playerRef.current.draw(ctx);
            }

            ctx.restore();

            // HUD (screen space)
            const gs = gameStateRef.current; // DIRECT ACCESS for latest values

            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.font = 'bold 24px Arial';

            // Score
            const scoreText = `🏆 Score: ${gs.score}`; // Use ref, not state
            ctx.strokeText(scoreText, 10, 30);
            ctx.fillText(scoreText, 10, 30);

            // Hearts
            const heartsText = `❤️ Hearts: ${gs.hearts}`;
            ctx.strokeText(heartsText, 10, 60);
            ctx.fillText(heartsText, 10, 60);

            // Coins
            const coinsText = `💰 Coins: ${gs.coins}`;
            ctx.strokeText(coinsText, 10, 90);
            ctx.fillText(coinsText, 10, 90);

            // Lives
            const livesText = `💙 Lives: ${gs.lives}`;
            ctx.strokeText(livesText, 10, 120);
            ctx.fillText(livesText, 10, 120);

            // Controls hint
            ctx.font = '16px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText('← → Arrow Keys: Move | SPACE: Jump/Glide', canvas.width - 350, 30);

            // DEBUG: Draw Hitboxes if in dev mode (Toggleable, currently ON for debugging)
            // Uncomment to see why collisions miss
            /*
            ctx.save();
            ctx.translate(-camera.x, -camera.y);
            
            // Player Box
            ctx.strokeStyle = 'lime';
            ctx.strokeRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
            
            // Collectible Boxes
            if (levelRendererRef.current && levelRendererRef.current.levelData) {
                 levelRendererRef.current.levelData.collectibles.forEach((c, i) => {
                     if (!gs.isCollected(`collectible-${i}`)) {
                         ctx.strokeStyle = 'yellow';
                         ctx.strokeRect(c.x, c.y, 50, 50);
                         
                         // Center Dot
                         ctx.fillStyle = 'red';
                         ctx.fillRect(c.x + 25 - 2, c.y + 25 - 2, 4, 4);
                     }
                 });
            }
            ctx.restore();
            */

            // Game Over Overlay
            if (gs.isGameOver) {
                // Dim background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Game Over Text
                ctx.fillStyle = '#ff4444';
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.font = 'bold 72px Arial';
                const gameOverText = 'GAME OVER';
                const textWidth = ctx.measureText(gameOverText).width;
                ctx.fillText(gameOverText, (canvas.width - textWidth) / 2, canvas.height / 2 - 50);

                // Final Score
                ctx.fillStyle = 'white';
                ctx.font = '32px Arial';
                const scoreInfo = `Final Score: ${gs.score}`;
                const scoreWidth = ctx.measureText(scoreInfo).width;
                ctx.fillText(scoreInfo, (canvas.width - scoreWidth) / 2, canvas.height / 2 + 20);

                // Helper Text for Restart
                ctx.fillStyle = '#AAAAAA';
                ctx.font = '20px Arial';
                const helpText = 'Press SPACE or Click RESTART below';

                return; // Stop loop
            }

            requestAnimationFrame(gameLoop);
        };

        gameLoop();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    };

    // Restart Handler
    const handleRestart = () => {
        // Reset local state
        setLoading(true);
        setError(null);
        setScore(0);
        setHearts(0);
        setCoins(0);
        setLives(3);

        // Reset GameState
        if (gameStateRef.current) {
            gameStateRef.current.reset();
            gameStateRef.current.isGameOver = false; // Ensure this is false
        }

        // Reset Player Position
        if (playerRef.current) {
            playerRef.current.x = 100;
            playerRef.current.y = 340;
            playerRef.current.vx = 0;
            playerRef.current.vy = 0;
            playerRef.current.invincible = false;
        }

        // Slight delay to allow UI to update then restart game
        setTimeout(() => {
            setLoading(false);
            // The game loop in useEffect/startGame will continue running
            // checking !isGameOver, so it should resume automatically.
            // If the loop was exited, we might need to re-trigger it.

            // Re-mount logic by forcing a re-render or re-calling startGame
            if (canvasCallback.current) {
                // Clear previous loop if any (optional, but good practice)
                // Then restart
                const ctx = canvasCallback.current.getContext('2d');
                startGame(canvasCallback.current, ctx);
            }
        }, 100);
    };

    if (error) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-red-900 text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">❌ Error</h1>
                    <p className="text-xl">{error}</p>
                </div>
            </div>
        );
    }

    // Character Selection Screen
    if (!selectedCharacter) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-red-900 text-white p-8">
                <h1 className="text-6xl font-bold mb-12 animate-bounce text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-white filter drop-shadow-lg">
                    🎅 Christmas Adventure 🎄
                </h1>

                <h2 className="text-2xl mb-8 text-blue-200">Choose Your Hero:</h2>

                <div className="flex gap-12">
                    {/* Santa Option */}
                    <div
                        onClick={() => setSelectedCharacter('santa')}
                        className="group relative cursor-pointer transform hover:scale-110 transition-all duration-300"
                    >
                        <div className="w-64 h-80 bg-red-800/50 rounded-2xl border-4 border-red-500 flex flex-col items-center justify-center backdrop-blur hover:bg-red-700/60 shadow-[0_0_30px_rgba(255,0,0,0.5)]">
                            <div className="text-8xl mb-4 transform group-hover:rotate-12 transition-transform">🎅</div>
                            <h3 className="text-3xl font-bold">Santa</h3>
                            <p className="text-gray-300 mt-2">The Classic Hero</p>
                        </div>
                    </div>

                    {/* Mrs. Santa Option */}
                    <div
                        onClick={() => setSelectedCharacter('mrs-santa')}
                        className="group relative cursor-pointer transform hover:scale-110 transition-all duration-300"
                    >
                        <div className="w-64 h-80 bg-pink-800/50 rounded-2xl border-4 border-pink-500 flex flex-col items-center justify-center backdrop-blur hover:bg-pink-700/60 shadow-[0_0_30px_rgba(255,100,200,0.5)]">
                            <div className="text-8xl mb-4 transform group-hover:-rotate-12 transition-transform">🤶</div>
                            <h3 className="text-3xl font-bold">Mrs. Santa</h3>
                            <p className="text-gray-300 mt-2">The Christmas Queen</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-gray-400 text-sm">
                    🎮 Use Arrow Keys to Move | SPACE to Jump
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center">
            {/* Canvas */}
            <div className="relative">
                <canvas
                    ref={setCanvasRef}
                    className="border-4 border-white shadow-2xl"
                />

                {/* Mobile/Touch Controls overlay could go here */}
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900 text-white pointer-events-none z-50">
                    <h1 className="text-5xl font-bold mb-8">🎮 Preparing Level...</h1>
                    <div className="w-96 h-8 bg-gray-700 rounded-full overflow-hidden border-2 border-white/50">
                        <div
                            className="h-full bg-gradient-to-r from-green-400 to-yellow-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-4 text-2xl font-mono">{progress}%</p>
                </div>
            )}

            {/* Game Over UI Overlay */}
            {!loading && lives <= 0 && ( // This 'lives' state might be stale, but game loop handles drawing
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 mt-40">
                    <button
                        onClick={handleRestart}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg text-xl transition-all hover:scale-105 border-2 border-white"
                    >
                        🔄 Play Again
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg text-xl transition-all hover:scale-105 border-2 border-white"
                    >
                        🚪 Selection Menu
                    </button>
                </div>
            )}
        </div>
    );
};

export default LevelTest;
