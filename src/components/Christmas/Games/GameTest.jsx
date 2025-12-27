/**
 * GameTest - Component للاختبار
 * هنا نشوف لو كل الأنظمة شغالة
 */

import React, { useEffect, useRef, useState } from 'react';
import AssetManager from '../../../game/AssetManager';
import Player from '../../../game/Player';
import { GAME } from '../../../game/Constants';

const GameTest = () => {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const assetManagerRef = useRef(null);
    const playerRef = useRef(null);
    const inputRef = useRef({
        jump: false,
        jumpPressed: false,
        jumpHandled: false,
        up: false,
        down: false,
    });

    // Use callback ref to ensure canvas exists
    const canvasCallback = useRef(null);
    const setCanvasRef = (canvas) => {
        console.log('🎮 GameTest: Canvas callback called!', canvas);

        if (!canvas || canvasCallback.current) {
            console.log('⏭️ GameTest: Skipping (canvas null or already initialized)');
            return;
        }

        canvasCallback.current = canvas;
        console.log('✅ GameTest: Canvas found, initializing...');

        const ctx = canvas.getContext('2d');

        // Make canvas responsive to window size
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;
        const aspectRatio = GAME.CANVAS_WIDTH / GAME.CANVAS_HEIGHT; // 16:9

        let canvasWidth, canvasHeight;

        if (maxWidth / maxHeight > aspectRatio) {
            // Window is wider than game aspect ratio
            canvasHeight = maxHeight;
            canvasWidth = canvasHeight * aspectRatio;
        } else {
            // Window is taller than game aspect ratio
            canvasWidth = maxWidth;
            canvasHeight = canvasWidth / aspectRatio;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        console.log(`✅ GameTest: Canvas size: ${canvas.width}x${canvas.height}`);

        // Initialize asset manager
        console.log('📦 GameTest: Creating AssetManager...');
        assetManagerRef.current = new AssetManager();
        assetManagerRef.current.onProgress = (loaded, total) => {
            const pct = Math.floor((loaded / total) * 100);
            console.log(`📊 GameTest: Progress ${pct}% (${loaded}/${total})`);
            setProgress(pct);
        };

        console.log('🚀 GameTest: Starting asset loading...');
        // Load assets
        assetManagerRef.current.loadAll()
            .then(() => {
                console.log('✅ GameTest: All assets loaded successfully!');

                // Initialize player
                console.log('👨 GameTest: Creating player...');
                playerRef.current = new Player(assetManagerRef.current, 'mr-santa');
                playerRef.current.y = GAME.CANVAS_HEIGHT - 300; // Start in air
                console.log('✅ GameTest: Player created!');

                setLoading(false);
                console.log('🎮 GameTest: Starting game loop...');
                startGame(canvas, ctx);
            })
            .catch(err => {
                console.error('❌ GameTest: Failed to load assets:', err);
                setError(err.message);
            });
    };

    useEffect(() => {
        console.log('🎮 GameTest: Component mounted!');
        // The canvas initialization logic is now handled by the callback ref.
        // This useEffect can be used for other side effects or cleanup not directly tied to canvas init.
        // The cleanup for game loop event listeners is handled within startGame's return.
        return () => {
            console.log('🎮 GameTest: Component unmounted!');
            // Any global cleanup not handled by startGame's return can go here.
        };
    }, []);

    const startGame = (canvas, ctx) => {
        let lastTime = Date.now();
        const groundY = canvas.height - 100;

        // Camera - follows player
        const camera = {
            x: 0,
            y: 0,
            follow: function (player, canvas) {
                // Keep player centered horizontally (at 1/3 from left)
                this.x = player.x - canvas.width / 3;

                // Keep camera above ground
                this.y = 0;
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
            if (playerRef.current) {
                playerRef.current.update(deltaTime, inputRef.current, groundY);
            }

            // Update camera to follow player
            camera.follow(playerRef.current, canvas);

            // Save context and apply camera transform
            ctx.save();
            ctx.translate(-camera.x, -camera.y);

            // Clear (with transform applied)
            ctx.fillStyle = '#87CEEB'; // Sky blue
            ctx.fillRect(camera.x, camera.y, canvas.width, canvas.height);

            // Draw ground (extends infinitely)
            ctx.fillStyle = '#8B4513'; // Brown
            ctx.fillRect(camera.x, groundY, canvas.width + 1000, canvas.height - groundY);

            // Draw player (at world position)
            if (playerRef.current) {
                playerRef.current.draw(ctx);
            }

            // Restore context (remove camera transform)
            ctx.restore();

            // Debug info (in screen space, not world space)
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText(`State: ${playerRef.current.state}`, 20, 30);
            ctx.fillText(`Position: ${Math.floor(playerRef.current.x)}, ${Math.floor(playerRef.current.y)}`, 20, 55);
            ctx.fillText(`Velocity: ${Math.floor(playerRef.current.vx)}, ${Math.floor(playerRef.current.vy)}`, 20, 80);
            ctx.fillText(`Grounded: ${playerRef.current.grounded}`, 20, 105);
            ctx.fillText(`Camera: ${Math.floor(camera.x)}`, 20, 130);

            requestAnimationFrame(gameLoop);
        };

        gameLoop();

        // Cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
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

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center">
            {/* Canvas - Always rendered */}
            <div className="relative">
                <canvas
                    ref={setCanvasRef}
                    className="border-4 border-white"
                />

                {/* Controls - Only show when loaded */}
                {!loading && (
                    <div className="absolute top-4 right-4 bg-black/70 text-white p-4 rounded">
                        <h3 className="font-bold mb-2">🎮 Controls:</h3>
                        <p>SPACE: Jump / Double Jump</p>
                        <p>Hold SPACE: Glide</p>
                        <p>↑/↓: Fly (with Wings power-up)</p>
                    </div>
                )}
            </div>

            {/* Loading Overlay - On top of canvas */}
            {loading && (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900 text-white pointer-events-none">
                    <h1 className="text-5xl font-bold mb-8">🎮 Love Delivery</h1>
                    <div className="w-96 h-8 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-4 text-2xl">Loading... {progress}%</p>
                    <p className="mt-2 text-sm text-gray-400">Preparing assets...</p>
                </div>
            )}
        </div>
    );
};

export default GameTest;
