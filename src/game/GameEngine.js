/**
 * GameEngine.js
 * The core controller for the Christmas Adventure game.
 * Separates game logic from React UI.
 */

import GameState from './GameState';
import ScoreManager from './ScoreManager';
import Player from './Player';
import LevelGenerator from './LevelGenerator';
import LevelRenderer from './LevelRenderer';
import Camera from './Camera';
import { GAME } from './Constants'; // Ensure constants are imported

class GameEngine {
    constructor(canvas, assetManager, existingGameState = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on canvas background
        this.assetManager = assetManager;

        // Core Systems
        // Preserve GameState if passed (e.g., across React re-renders or resets if intended)
        this.gameState = existingGameState || new GameState();
        this.scoreManager = new ScoreManager();
        this.camera = new Camera(canvas.width, canvas.height);

        // Entities
        this.player = null;
        this.levelGenerator = null;
        this.levelRenderer = null;

        // Loop Control
        this.isRunning = false;
        this.lastTime = 0;
        this.animationFrameId = null;

        // Input State
        this.input = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            jumpPressed: false // Single frame trigger
        };

        // Configuration
        this.config = {
            debug: false,
            logicalHeight: 720, // Base resolution height
        };

        // Bindings
        this.loop = this.loop.bind(this);
    }

    /**
     * Initialize the game session
     * @param {string} characterId - The selected character ID
     * @param {string} worldId - The selected world/level ID
     */
    init(characterId, worldId = 'village', level = 1) {
        console.log(`⚙️ Engine Init: ${characterId} in ${worldId} (Level ${level})`);

        // 1. Setup Renderer & Generator
        this.levelGenerator = new LevelGenerator(worldId, level);
        this.levelRenderer = new LevelRenderer(this.assetManager);

        // Load Level Assets (Backgrounds)
        this.levelRenderer.loadLevel({
            background: [
                { asset: 'bg-village-sky', speed: 0.1 },
                { asset: 'bg-village-mountains', speed: 0.3 },
                { asset: 'bg-village-houses', speed: 0.5 },
                { asset: 'bg-village-trees', speed: 0.7 },
                { asset: 'bg-village-snow', speed: 1.0 }
            ],
            // Initial static platforms can be loaded here if generator doesn't do it
            platforms: [],
            obstacles: [],
            collectibles: []
        });

        // 2. Setup Player
        this.player = new Player(this.assetManager, characterId);
        this.resetPlayer();

        // 3. Reset State for new level/game
        // Note: If we are just restarting a level, we might want to keep coins?
        // For now, full reset on init.
        this.gameState.reset();

        // 4. Set Camera to Player
        this.camera.x = 0;
        this.camera.y = 0; // Will snap in first update
    }

    reset() {
        if (this.levelGenerator) {
            this.levelGenerator.reset();
            // Force generate initial content
            this.levelGenerator.update(100, GAME.CANVAS_WIDTH || 800);
        }
        if (this.gameState) this.gameState.reset();

        // CRITICAL FIX: Sticky Input Reset
        this.input = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            jumpPressed: false
        };

        this.resetPlayer();
    }

    resetPlayer() {
        if (!this.player) return;
        this.player.reset();
        this.player.x = 100;
        this.player.y = 300; // Drop in
        this.player.lives = 3;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.loop);
        console.log("▶️ Engine Started");
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        console.log("⏹️ Engine Stopped");
    }

    handleInput(inputData) {
        // Merge external input (Touch/React) with internal input state
        this.input = { ...this.input, ...inputData };
    }

    resize(width, height) {
        console.log(`🔧 Resize Called: ${width}x${height}`);

        // Ensure we're using integer values for crisp rendering
        this.canvas.width = Math.floor(width);
        this.canvas.height = Math.floor(height);

        // Update camera dimensions
        this.camera.resize(width, height);

        // Recalculate scale factor immediately
        const { logicalHeight } = this.config;
        this.scaleFactor = height / logicalHeight;

        console.log(`✅ Canvas resized to: ${this.canvas.width}x${this.canvas.height}, Scale: ${this.scaleFactor.toFixed(2)}`);
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        // Calculate Delta Time
        const deltaTime = Math.min(timestamp - this.lastTime, 50);
        this.lastTime = timestamp;

        try {
            this.update(deltaTime);
            this.draw();
        } catch (e) {
            console.error("Game Loop Error:", e);
            // Optionally stop engine or show visual error
            this.isRunning = false;
            // Draw error on canvas if possible
            this.ctx.fillStyle = 'red';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("ENGINE ERROR: " + e.message, this.canvas.width / 2, this.canvas.height / 2);
            cancelAnimationFrame(this.animationFrameId);
            return;
        }

        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    update(deltaTime) {
        if (!this.player || !this.gameState) return;

        const { logicalHeight } = this.config;
        const width = this.canvas.width;
        const height = this.canvas.height; // Use actual canvas height

        // 1. Calculate Scale Factor based on Height
        const scaleFactor = height / logicalHeight;
        const logicalWidth = width / scaleFactor;

        // Store for rendering
        this.scaleFactor = scaleFactor;

        // 2. Update Generator (Procedural Content)
        // We look ahead based on logical width
        const currentDistTarget = 13500;
        this.levelGenerator.update(this.player.x, logicalWidth, currentDistTarget, this.gameState);

        const worldEntities = this.levelGenerator.getState();

        // 3. Resolve Ground / Platforms Collision Logic
        // Determine "Effective Ground" BEFORE updating physics
        const killY = logicalHeight + 200; // Death plane
        let effectiveGroundY = Infinity; // Default: No ground (Void), so player falls if not on platform

        if (this.levelRenderer) {
            // SYNC RENDERER DATA for collision checks
            this.levelRenderer.levelData = worldEntities;

            // Check Platform Collision (Robust "feet" check from Renderer)
            const platformHit = this.levelRenderer.checkPlatformCollision(this.player);
            if (platformHit) {
                effectiveGroundY = platformHit.y;
            }
        }

        // 4. Update Player Physics
        this.player.update(deltaTime, this.input, effectiveGroundY);

        // 5. Update Camera
        // We update camera logic here (physics step) to ensure smooth tracking before draw
        // Re-calculate logical width here just to be safe, or use the one from top of function
        // (It's already available as 'logicalWidth' in this scope from line 185)
        this.camera.update(this.player, logicalWidth, logicalHeight);


        // 6. Check Game State Events (Death, Win)
        this.checkGameEvents(killY, worldEntities);
    }

    checkGameEvents(killY, worldEntities) {
        // Falling Death
        if (this.player.y > killY) {
            // CRITICAL FIX: Sync GameState lives with Player lives
            if (!this.player.invincible) {
                this.gameState.hitObstacle();
            }
            const isDead = this.player.hit();

            if (isDead) {
                this.gameState.isGameOver = true;
                // Callback to UI would happen here via a listener if we had one
            } else {
                // Smart Respawn: Find nearest safe platform behind player
                let safeX = 100;
                let safeY = 300;

                if (this.levelRenderer && this.levelRenderer.levelData) {
                    const platforms = this.levelRenderer.levelData.platforms || [];
                    const obstacles = this.levelRenderer.levelData.obstacles || []; // Correct source

                    // Find a platform that is behind the player (safe zone)
                    // We look for the closest one that is strictly behind current x
                    const candidates = platforms
                        .filter(p => p.x < this.player.x - 100 && p.x > this.player.x - 2000 && p.type !== 'gap') // Look back up to 2 screens
                        .sort((a, b) => b.x - a.x); // Sort by X descending (closest to player)

                    for (const platform of candidates) {
                        const centerX = platform.x + (platform.width / 2);

                        // Check if this spot has an obstacle (WIDER CHECK)
                        const hasObstacle = obstacles.some(o =>
                            Math.abs(o.x - centerX) < 100 // Increased safety radius
                        );

                        if (!hasObstacle) {
                            safeX = centerX;
                            safeY = platform.y - 100;
                            // Found a safe spot, stop searching
                            break;
                        }
                        // If center has obstacle, try edges? For now strict safety.
                    }
                }

                // Apply Respawn
                this.player.x = safeX;
                this.player.y = safeY;
                this.player.vx = 0;
                this.player.vy = 0;

                // Clear any sticky inputs
                this.input.left = false;
                this.input.right = false;
                this.input.jump = false;

                // Add penalty? small Invincibility
                this.player.invincible = true;
                this.player.invincibleTimer = 1000;
            }
        }

        // Collectibles Collision
        // Note: LevelRenderer had the collision check logic in previous code. 
        // Ideally, Logic belongs in Engine/Systems, Renderer just renders.
        // For now, we reuse the helper in LevelRenderer or move it here.
        // Moving collision logic to Engine or a PhysicsSystem is cleaner.
        // Let's use the Renderer's helper for now to avoid rewriting it all, 
        // BUT calling a "checkCollision" method on a "Renderer" is bad architecture.
        // Refactoring: We should pull `checkCollectibleCollision` OUT of Renderer.
        // For this step, I will Access the collision helper via the renderer instance 
        // because it parses the internal level data structures efficiently.
        if (this.levelRenderer) {
            // Needed: Inject current world entities into renderer temporarily or 
            // pass them to the check function.
            // The original LevelRenderer.checkCollectibleCollision uses `this.levelData`.
            // We need to keep `this.levelRenderer.levelData` in sync with `worldEntities`.
            this.levelRenderer.levelData = worldEntities;

            const collected = this.levelRenderer.checkCollectibleCollision(this.player, this.gameState);
            if (collected) {
                console.log(`✨ Collected Item: ${collected.type} (${collected.id})`);
                this.gameState.markCollected(collected.id);
                if (collected.type === 'coin') this.gameState.collectCoin();
                if (collected.type === 'heart') this.gameState.collectHeart();

                // CRITICAL FIX: Trigger Victory
                if (collected.type === 'collectible-finish') {
                    console.log('🏁 PLAYER REACHED FINISH LINE!');
                    this.gameState.isVictory = true;
                    this.stop(); // Stop the engine loop
                }

                // Add particle effect?
                this.levelRenderer.addParticle(collected.item.x, collected.item.y, collected.type);
            }

            const obstacleHit = this.levelRenderer.checkObstacleCollision(this.player, this.gameState);
            if (obstacleHit) {
                this.gameState.markHit(obstacleHit.id);
                this.gameState.hitObstacle(); // Updates lives
                this.player.hit(); // Animation trigger
            }
        }
    }

    draw() {
        if (!this.levelRenderer || !this.player) return;

        const { width, height } = this.canvas;
        // FAILSAFE: Ensure scale is valid, default to 1
        const scale = (this.scaleFactor && isFinite(this.scaleFactor) && this.scaleFactor > 0) ? this.scaleFactor : 1;

        // ABSOLUTE RESET: Ensure we are drawing to the full canvas in screen pixels
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, width, height);

        // Update Camera
        // Validate inputs to avoid NaN propagation
        const viewW = width / scale;
        const viewH = height / scale;
        if (isFinite(viewW) && isFinite(viewH)) {
            this.camera.update(this.player, viewW, viewH);
        }

        // Render Level (Backgrounds, Parallax)
        // Backgrounds draw directly to screen space
        this.levelRenderer.drawBackground(this.ctx, this.camera, width, height);

        // GAMEPLAY LAYER SCALING
        this.ctx.save();
        this.ctx.scale(scale, scale);

        // Render Dynamic Elements relative to Camera
        const worldEntities = this.levelGenerator.getState();
        this.levelRenderer.drawDynamic(this.ctx, this.camera, worldEntities, this.gameState, this.player);

        this.ctx.restore();
    }

    drawDebugOverlay() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 300, 100);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${Math.round(1000 / (performance.now() - this.lastTime))}`, 20, 30);
        ctx.fillText(`Player: ${Math.floor(this.player.x)}, ${Math.floor(this.player.y)}`, 20, 50);
        ctx.fillText(`Cam: ${Math.floor(this.camera.x)}, ${Math.floor(this.camera.y)}`, 20, 70);
        ctx.fillText(`State: ${this.player.state}`, 20, 90);
    }
}

export default GameEngine;
