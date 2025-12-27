/**
 * LevelRenderer.js - Renders level elements (platforms, obstacles, collectibles)
 */

import { PLATFORMS, OBSTACLES, COLLECTIBLES } from './Constants.js';

class LevelRenderer {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.parallaxLayers = [];
        this.particles = []; // Particle system
    }

    /**
     * Add a particle effect
     */
    addParticle(x, y, type) {
        const particleCount = 10;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0, // 1 second
                type: type, // 'heart', 'coin', etc.
                size: Math.random() * 20 + 10
            });
        }
    }

    /**
     * Update and draw particles
     */
    updateAndDrawParticles(ctx) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            ctx.globalAlpha = p.life;

            // Map particle types to existing assets
            let particleAsset = 'particle-star'; // Default fallback
            if (p.type === 'heart') {
                particleAsset = 'particle-heart';
            } else if (p.type === 'coin') {
                particleAsset = 'particle-star'; // Gold stars for coins
            } else if (p.type === 'spark') {
                particleAsset = 'particle-spark';
            }

            const image = this.assetManager.get(particleAsset);

            if (image) {
                ctx.drawImage(image, p.x, p.y, p.size, p.size);
            } else {
                ctx.fillStyle = p.type === 'heart' ? '#ff6b9d' : '#ffd700';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }
    }

    /**
     * Load level data
     */
    loadLevel(levelData) {
        this.levelData = levelData;

        // Setup parallax background layers
        this.parallaxLayers = levelData.background.map(layer => ({
            image: this.assetManager.get(layer.asset),
            speed: layer.speed,
        }));
    }

    /**
     * Draw parallax backgrounds with professional seamless tiling
     */
    drawBackground(ctx, camera, canvasWidth, canvasHeight) {
        // SAVE CONTEXT STATE
        ctx.save();

        // SCROLL FIX: The context is already in Screen Space (Identity) when this is called
        // from drawDynamic. We DO NOT need to translate.
        // ctx.translate(camera.x, camera.y); // REMOVED - Caused black bar on left

        // STEP 1: Draw solid sky gradient (no transparency issues)
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        skyGradient.addColorStop(0, '#4a90e2');    // Top - bright blue
        skyGradient.addColorStop(0.5, '#87ceeb');  // Middle - sky blue
        skyGradient.addColorStop(1, '#b0e0f6');    // Bottom - light blue

        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // STEP 2: Draw parallax layers in order (back to front)
        this.parallaxLayers.forEach((layer, index) => {
            if (!layer.image) return;

            // Only draw non-sky layers (mountains, houses, trees, snow)
            // Skip first layer if it's sky (already drawn as gradient)
            if (layer.speed === 0.1) return; // Skip sky layer

            const imgWidth = layer.image.width;
            const imgHeight = layer.image.height;

            // Validate image dimensions
            if (!imgWidth || !imgHeight || imgWidth === 0 || imgHeight === 0) {
                console.warn('Invalid image dimensions for parallax layer', layer);
                return;
            }

            // Scale based on layer depth for perspective
            // Scale based on layer depth for perspective
            let scale = 1.0;
            if (layer.speed === 0.3) scale = 0.9;      // Mountains
            else if (layer.speed === 0.5) scale = 0.8;  // Houses (Increased from 0.6 to 0.8 to be visible)
            else if (layer.speed === 0.7) scale = 0.9; // Trees
            else if (layer.speed === 1.0) scale = 1.0;  // Foreground

            // Adjust scale to cover height if needed?
            // If scale is small, we align to bottom.
            // With 0.8, height is 864px (on 1080p). Y starts at 216px. Visible.

            const scaledHeight = canvasHeight * scale;
            const scaledWidth = imgWidth * (scaledHeight / imgHeight);

            // Vertical position - align to bottom
            const yPos = canvasHeight - scaledHeight;

            // INFINITE SCROLLING ALGORITHM (100% Robust)
            // Calculate how much the layer has scrolled in world space
            const worldScroll = camera.x * layer.speed;

            // Find offset within a single tile (this creates the seamlessloop)
            const tileOffset = worldScroll % scaledWidth;

            // Start drawing one full tile BEFORE the left edge
            // This ensures even during fast movement we never see gaps
            let xPos = -tileOffset - scaledWidth;

            // Draw tiles across entire screen + 2 tile buffer (left + right)
            const tilesNeeded = Math.ceil(canvasWidth / scaledWidth) + 3;

            // Set opacity for snow layer
            if (layer.speed === 1.0) {
                ctx.globalAlpha = 0.5;
            }

            for (let i = 0; i < tilesNeeded; i++) {
                ctx.drawImage(
                    layer.image,
                    xPos, yPos,
                    scaledWidth, scaledHeight
                );
                xPos += scaledWidth;
            }

            // Reset opacity after each layer
            ctx.globalAlpha = 1.0;
        });

        // CONTRAST OVERLAY (Fix for "Busy Background" Issue)
        // Draws a semi-transparent black layer over the background
        // but BEHIND the platforms/gameplay.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // 30% Dark dim
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // RESTORE CONTEXT STATE
        ctx.restore();
    }

    /**
     * Draw platforms
     */
    drawPlatforms(ctx) {
        if (!this.levelData) return;

        this.levelData.platforms.forEach(platform => {
            const platformConfig = PLATFORMS[platform.type.toUpperCase()];
            if (!platformConfig) return;

            const image = this.assetManager.get(platformConfig.sprite);
            if (!image) {
                // Fallback: draw rectangle
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(platform.x, platform.y, platform.width, platformConfig.height);
                return;
            }

            // Draw tiled platform
            const tileWidth = platformConfig.width;
            const tiles = Math.ceil(platform.width / tileWidth);

            for (let i = 0; i < tiles; i++) {
                const x = platform.x + (i * tileWidth);
                const w = Math.min(tileWidth, platform.width - (i * tileWidth));

                ctx.drawImage(
                    image,
                    0, 0, w, platformConfig.height,
                    x, platform.y, w, platformConfig.height
                );
            }
        });
    }

    /**
     * Draw obstacles
     */
    drawObstacles(ctx) {
        if (!this.levelData) return;

        this.levelData.obstacles.forEach(obstacle => {
            const obstacleConfig = OBSTACLES[obstacle.type.toUpperCase()];
            if (!obstacleConfig) return;

            const image = this.assetManager.get(obstacleConfig.sprite);
            if (!image) {
                // Fallback
                ctx.fillStyle = 'red';
                ctx.fillRect(obstacle.x, obstacle.y, obstacleConfig.width, obstacleConfig.height);
                return;
            }

            ctx.drawImage(
                image,
                obstacle.x,
                obstacle.y,
                obstacleConfig.width,
                obstacleConfig.height
            );
        });
    }

    /**
     * Draw collectibles with sprite sheet animation
     */
    drawCollectibles(ctx, gameState) {
        if (!this.levelData) return;

        // Initialize collectible animations if not done
        if (!this.collectibleAnims) {
            this.collectibleAnims = [];
            this.levelData.collectibles.forEach((item, index) => {
                const collectibleConfig = COLLECTIBLES[item.type.toUpperCase()];
                if (!collectibleConfig) return;

                const image = this.assetManager.get(collectibleConfig.sprite);
                if (image) {
                    // Create sprite animation (8 frames, 10 FPS)
                    this.collectibleAnims[index] = {
                        image: image,
                        frameCount: 8,
                        currentFrame: Math.floor(Math.random() * 8), // Random start
                        frameTimer: 0,
                        frameInterval: 1000 / 10, // 10 FPS
                    };
                }
            });
        }

        // Update and draw each collectible
        const deltaTime = 16.67; // Approximate frame time

        this.levelData.collectibles.forEach((item, index) => {
            const itemId = `collectible-${index}`;

            // SKIP IF COLLECTED
            if (gameState && gameState.isCollected(itemId)) return;

            const anim = this.collectibleAnims[index];
            if (!anim) return;

            // Update animation
            anim.frameTimer += deltaTime;
            if (anim.frameTimer >= anim.frameInterval) {
                anim.currentFrame = (anim.currentFrame + 1) % anim.frameCount;
                anim.frameTimer = 0;
            }

            // Calculate frame position in sprite sheet (4x2 grid)
            // Sprite sheet calculation (4x2 grid)
            // Sheet is 960x420 -> Frame is 240x210
            const cols = 4;
            const rows = 2;

            // Ensure we have valid image dimensions
            const imgWidth = anim.image.naturalWidth || anim.image.width;
            const imgHeight = anim.image.naturalHeight || anim.image.height;

            const frameWidth = imgWidth / cols;
            const frameHeight = imgHeight / rows;

            const col = anim.currentFrame % cols;
            const row = Math.floor(anim.currentFrame / cols);

            const sx = col * frameWidth;
            const sy = row * frameHeight;

            // Draw with slight bobbing effect
            const time = Date.now();
            const bobOffset = Math.sin(time / 200 + index) * 5;
            const size = 50;

            // Draw Centered
            ctx.drawImage(
                anim.image,
                sx, sy, frameWidth, frameHeight,
                item.x, item.y + bobOffset, size, size
            );
        });
    }

    /**
     * Draw finish line with sprite sheet animation
     */
    /**
     * Draw finish line with sprite sheet animation
     */
    drawFinish(ctx) {
        if (!this.levelData || !this.levelData.finish) return;

        const finish = this.levelData.finish;
        const image = this.assetManager.get('collectible-finish');

        // Dynamic Y calculation: Place on top of platform
        // Platform Y is the top surface. We want the finish gate's bottom to align with it.
        // We add a small offset (+15) so the poles look planted in the snow/ground.
        let finishY = finish.y;

        // Find platform under the finish line to auto-align
        const platform = this.levelData.platforms.find(p =>
            finish.x >= p.x && finish.x <= p.x + p.width
        );

        if (platform && image) {
            // 240 is the rendered height. platform.y is ground level.
            finishY = platform.y - 240 + 15;
        }

        if (image) {
            // Sprite Sheet Animation - 4x2 Grid Layout (8 frames total)
            const totalFrames = 8;
            const cols = 4;
            const rows = 2;
            const frameWidth = image.width / cols;
            const frameHeight = image.height / rows;

            // Calculate current frame based on time
            const fps = 10; // Animation speed
            const frameIndex = Math.floor(Date.now() / (1000 / fps)) % totalFrames;

            // Calculate row and column for this frame
            const col = frameIndex % cols;
            const row = Math.floor(frameIndex / cols);

            // Draw the specific frame
            ctx.drawImage(
                image,
                col * frameWidth, row * frameHeight,  // Source position
                frameWidth, frameHeight,              // Source size
                finish.x, finishY,                    // Destination position (use calculated Y)
                240, 240                               // Destination size (3x larger)
            );
        } else {
            // Fallback
            ctx.fillStyle = 'green';
            ctx.fillRect(finish.x, finishY, 240, 240);
            ctx.fillStyle = 'white';
            ctx.font = '40px Arial';
            ctx.fillText('FINISH', finish.x + 40, finishY + 130);
        }
    }

    /**
     * Draw dynamic world (Procedural Generation)
     */
    drawDynamic(ctx, camera, canvasWidth, canvasHeight, entities, gameState, player) {
        // Background (Parallax)
        ctx.save();
        this.drawBackground(ctx, camera, canvasWidth, canvasHeight);
        ctx.restore();

        // Save Context for camera transform
        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        // Draw Platforms
        entities.platforms.forEach(platform => {
            this.drawPlatform(ctx, platform);
        });

        // Draw Obstacles
        entities.obstacles.forEach(obstacle => {
            this.drawObstacle(ctx, obstacle);
        });

        // Draw Collectibles
        entities.collectibles.forEach(collectible => {
            this.drawCollectible(ctx, collectible, gameState);
        });

        // Draw Player (Render layer order: behind particles, in front of objects)
        if (player) {
            player.draw(ctx);
        }

        // Draw Particles
        this.updateAndDrawParticles(ctx);

        ctx.restore();
    }

    /**
     * Draw all level elements (Legacy/Static)
     */
    draw(ctx, camera, canvasWidth, canvasHeight, gameState) {
        ctx.save();
        this.drawBackground(ctx, camera, canvasWidth, canvasHeight);
        ctx.restore();

        // Note: Camera transform is applied in the game loop
        this.drawPlatforms(ctx);
        this.drawObstacles(ctx);
        this.drawCollectibles(ctx, gameState);
        this.drawFinish(ctx);

        this.updateAndDrawParticles(ctx);
    }

    // === SINGULAR DRAW METHODS (For Dynamic & Static Reuse) ===

    drawPlatform(ctx, platform) {
        const platformConfig = PLATFORMS[platform.type.toUpperCase()];
        const image = this.assetManager.get(platformConfig ? platformConfig.sprite : 'platform-wooden');

        if (image) {
            ctx.drawImage(image, platform.x, platform.y, platform.width, platformConfig ? platformConfig.height : 40);
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(platform.x, platform.y, platform.width, 40);
        }

        // DEBUG: Draw Platform Hitbox
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platformConfig ? platformConfig.height : 40);
    }

    drawObstacle(ctx, obstacle) {
        const obstacleConfig = OBSTACLES[obstacle.type.toUpperCase()];
        if (!obstacleConfig) return;

        const image = this.assetManager.get(obstacleConfig.sprite);
        if (image) {
            if (obstacleConfig.animated) {
                // Simple animation logic if needed, for now draw static frame
                // To animate, we'd need state or time passed.
                // We can use Date.now() for simple persistent animations
                const frameCount = 4;
                const frameIndex = Math.floor(Date.now() / 100) % frameCount;
                const frameWidth = image.naturalWidth / frameCount;

                ctx.drawImage(
                    image,
                    frameIndex * frameWidth, 0, frameWidth, image.naturalHeight,
                    obstacle.x, obstacle.y, obstacleConfig.width, obstacleConfig.height
                );
            } else {
                ctx.drawImage(image, obstacle.x, obstacle.y, obstacleConfig.width, obstacleConfig.height);
            }
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(obstacle.x, obstacle.y, obstacleConfig.width, obstacleConfig.height);
        }

        // DEBUG: Draw Obstacle Hitbox
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacleConfig.width, obstacleConfig.height);
    }

    drawCollectible(ctx, collectible, gameState) {
        const type = collectible.type.toUpperCase();
        let spriteName = '';
        let width = 40;
        let height = 40;
        const config = COLLECTIBLES[type];
        if (!config) return;

        const image = this.assetManager.get(config.sprite);

        if (image) {
            // Check if it's a COIN (Animated 4x2)
            if (collectible.type === 'coin') {
                const fps = 12;
                const totalFrames = 8;
                const cols = 4;
                const rows = 2;

                // Calculate frame based on global time
                const frameIndex = Math.floor(Date.now() / (1000 / fps)) % totalFrames;
                const col = frameIndex % cols;
                const row = Math.floor(frameIndex / cols);

                const frameWidth = image.width / cols;
                const frameHeight = image.height / rows;

                ctx.drawImage(
                    image,
                    col * frameWidth, row * frameHeight,
                    frameWidth, frameHeight,
                    collectible.x, collectible.y,
                    40, 40 // Fixed size for coin
                );
            } else {
                // Static collectibles (Heart, Star)
                ctx.drawImage(image, collectible.x, collectible.y, 40, 40);
            }
        } else {
            // Fallback
            ctx.fillStyle = type === 'COIN' ? 'gold' : 'red';
            ctx.beginPath();
            ctx.arc(collectible.x + 20, collectible.y + 20, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // === PLURAL DRAW METHODS (Wrapper for Static Levels) ===

    drawPlatforms(ctx) {
        if (!this.levelData) return;
        this.levelData.platforms.forEach(p => this.drawPlatform(ctx, p));
    }

    drawObstacles(ctx) {
        if (!this.levelData) return;
        this.levelData.obstacles.forEach(o => this.drawObstacle(ctx, o));
    }

    drawCollectibles(ctx, gameState) {
        if (!this.levelData) return;
        // Filter collected in static level logic usually handled by game state removing them
        this.levelData.collectibles.forEach(c => {
            if (!gameState.collectedItems.has(c.id)) {
                this.drawCollectible(ctx, c, gameState);
            }
        });
    }

    /**
     * Check platform collision
     */
    checkPlatformCollision(player) {
        if (!this.levelData) return null;

        for (const platform of this.levelData.platforms) {
            const platformConfig = PLATFORMS[platform.type.toUpperCase()];
            if (!platformConfig) continue;

            const platformHeight = platformConfig.height || 40;

            // Player bounding box
            const playerBottom = player.y + player.height;
            const playerTop = player.y;
            const playerLeft = player.x;
            const playerRight = player.x + player.width;

            // Platform bounding box
            const platformTop = platform.y;
            const platformBottom = platform.y + platformHeight;
            const platformLeft = platform.x;
            const platformRight = platform.x + platform.width;

            // FIX: Use narrower hitbox for feet to prevent floating
            // Only check the center 40% of the player's width
            const feetWidth = player.width * 0.4;
            const feetX = player.x + (player.width - feetWidth) / 2;

            const playerFeetLeft = feetX;
            const playerFeetRight = feetX + feetWidth;

            // Check if player's FEET are overlapping platform horizontally
            const isOverlappingX = playerFeetRight > platformLeft && playerFeetLeft < platformRight;

            // Check if player is landing on platform (from above)
            const isLandingOnTop =
                playerBottom >= platformTop && // Feet at or below platform top
                playerBottom <= platformTop + 40 && // Increased landing tolerance for high speeds
                player.vy >= 0; // Falling down

            if (isOverlappingX && isLandingOnTop) {
                return {
                    y: platform.y,
                    type: platform.type
                };
            }
        }

        return null;
    }

    /**
     * Check collectible collision (hearts, coins)
     */
    checkCollectibleCollision(player, gameState) {
        if (!this.levelData) return null;

        for (let i = 0; i < this.levelData.collectibles.length; i++) {
            const item = this.levelData.collectibles[i];
            const itemId = `collectible-${i}`;

            // Skip if already collected
            if (gameState.isCollected(itemId)) continue;

            const collectibleConfig = COLLECTIBLES[item.type.toUpperCase()];
            if (!collectibleConfig) return;

            const itemSize = 50; // Rendering size

            // Circle Collision Detection
            // Use center points for accuracy
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;

            // Item center (accounting for bobbing would be too expensive, static is fine)
            const itemCenterX = item.x + itemSize / 2;
            const itemCenterY = item.y + itemSize / 2;

            // Distance calculation
            const dx = playerCenterX - itemCenterX;
            const dy = playerCenterY - itemCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Collision Thresholds
            // Player radius ~40px, Item radius ~25px
            // Sum = 65px. Using 80px for VERY generous hit detection
            if (distance < 80) {
                // console.log('COLLISION!', itemId, distance); // Debug
                return { item, index: i, id: itemId, type: item.type };
            }
        }

        return null;
    }

    /**
     * Check obstacle collision (chimneys, spikes, etc.)
     */
    checkObstacleCollision(player, gameState) {
        if (!this.levelData) return null;

        for (let i = 0; i < this.levelData.obstacles.length; i++) {
            const obstacle = this.levelData.obstacles[i];
            const obstacleId = `obstacle-${i}`;

            // Skip if hit recently (invincibility)
            if (gameState.wasHitRecently(obstacleId)) continue;

            const obstacleConfig = OBSTACLES[obstacle.type.toUpperCase()];
            if (!obstacleConfig) continue;

            // AABB collision with slight padding for fairness
            const padding = 10;
            if (
                player.x + player.width - padding > obstacle.x &&
                player.x + padding < obstacle.x + obstacleConfig.width &&
                player.y + player.height - padding > obstacle.y &&
                player.y + padding < obstacle.y + obstacleConfig.height
            ) {
                return { obstacle, index: i, id: obstacleId, type: obstacle.type };
            }
        }

        return null;
    }
}

export default LevelRenderer;
