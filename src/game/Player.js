/**
 * Player - نظام اللاعب الكامل مع State Machine
 */

import { PHYSICS, PLAYER, CHARACTERS } from './Constants.js';

class Sprite {
    constructor(image, frameCount = 8, fps = 12) {
        this.image = image;
        this.frameCount = frameCount;
        this.frameInterval = 1000 / fps;
        this.frameTimer = 0;
        this.currentFrame = 0;
    }

    // CRITICAL FIX: Reset animation to frame 0
    reset() {
        this.currentFrame = 0;
        this.frameTimer = 0;
    }

    update(deltaTime) {
        this.frameTimer += deltaTime;
        if (this.frameTimer >= this.frameInterval) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.frameTimer = 0;
        }
    }

    draw(ctx, x, y, width, height, facingLeft = false) {
        if (!this.image) return;

        const imgWidth = this.image.naturalWidth || this.image.width;
        const imgHeight = this.image.naturalHeight || this.image.height;

        // Verify if image is loaded
        if (imgWidth === 0 || imgHeight === 0) return;

        // 4x2 grid (8 frames: 4 columns, 2 rows)
        const cols = 4;
        const rows = 2;
        const frameWidth = imgWidth / cols;
        const frameHeight = imgHeight / rows;

        // Calculate current frame position in the grid
        const col = this.currentFrame % cols;
        const row = Math.floor(this.currentFrame / cols);

        const sx = col * frameWidth;
        const sy = row * frameHeight;

        ctx.save();
        if (facingLeft) {
            ctx.translate(x + width, y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.image,
                sx, sy, frameWidth, frameHeight,
                0, 0, width, height
            );
        } else {
            ctx.drawImage(
                this.image,
                sx, sy, frameWidth, frameHeight,
                x, y, width, height
            );
        }
        ctx.restore();
    }
}

class Player {
    constructor(assetManager, character = 'mr-santa') {
        // Position & Physics
        this.x = 100;
        this.y = 0;
        // USE NEW PHYSICS HITBOX
        this.width = PLAYER.HITBOX_WIDTH;
        this.height = PLAYER.HITBOX_HEIGHT;
        this.vx = 0;
        this.vy = 0;

        // State
        this.state = PLAYER.STATES.IDLE;
        this.previousState = PLAYER.STATES.IDLE; // Track for state change detection
        this.facingLeft = false;
        this.grounded = false;
        this.jumpCount = 0;
        this.lastJumpPressed = false;  // For double jump detection

        // Game Stats
        this.lives = PLAYER.MAX_LIVES;
        this.score = 0;
        this.coins = 0;

        // Power-ups
        this.activePowerUps = {
            shield: 0,
            magnet: 0,
            wings: 0,
            speed: 0,
            clock: 0,
        };

        // Invincibility (after hit)
        this.invincible = false;
        this.invincibleTimer = 0;

        // Character
        console.log('🎅 Creating Player with character:', character);
        this.character = CHARACTERS[character.toUpperCase().replace('-', '_')];
        console.log('🎅 Resolved character object:', this.character);

        // Sprites
        this.sprites = {};
        this.loadSprites(assetManager);
    }

    loadSprites(assetManager) {
        console.log('🎨 ========================================');
        console.log('🎨 LOADING SPRITES FOR CHARACTER');
        console.log('🎨 ========================================');
        console.log('🎨 Character Object:', this.character);
        console.log('🎨 Character ID:', this.character?.id);
        console.log('🎨 Character Name:', this.character?.name);

        if (!this.character) {
            console.error('❌❌❌ CRITICAL: Character object is NULL or UNDEFINED!');
            return;
        }

        const charSprites = this.character.sprites;
        console.log('🎨 Character Sprites Config:', charSprites);

        let successCount = 0;
        let failCount = 0;

        Object.keys(PLAYER.STATES).forEach(stateKey => {
            const state = PLAYER.STATES[stateKey];
            const spriteName = charSprites[state];
            const image = assetManager.get(spriteName);

            console.log(`\n🎨 Loading sprite for state: ${state}`);
            console.log(`   📝 Sprite Name: ${spriteName}`);
            console.log(`   🖼️  Image Found: ${image ? '✅ YES' : '❌ NO'}`);

            if (image) {
                // Use slower FPS for idle state
                const fps = state === 'idle' ? PLAYER.IDLE_FPS : PLAYER.FPS;
                this.sprites[state] = new Sprite(image, PLAYER.FRAME_COUNT, fps);
                console.log(`   ✅ Sprite loaded successfully (${PLAYER.FRAME_COUNT} frames @ ${fps} FPS)`);
                successCount++;
            } else {
                console.error(`   ❌❌❌ SPRITE NOT FOUND!`);
                console.error(`   ❌ State: ${state}`);
                console.error(`   ❌ Sprite Name: ${spriteName}`);
                failCount++;
            }
        });

        console.log('\n🎨 ========================================');
        console.log(`🎨 SPRITE LOADING SUMMARY`);
        console.log(`🎨 ✅ Success: ${successCount}`);
        console.log(`🎨 ❌ Failed: ${failCount}`);
        console.log(`🎨 📊 Total: ${successCount + failCount}`);
        console.log('🎨 ========================================\n');
    }

    // CRITICAL FIX: Proper state setter that resets animations
    setState(newState) {
        if (this.state !== newState) {
            console.log(`🎬 STATE CHANGE: ${this.state} → ${newState}`);
            this.previousState = this.state;
            this.state = newState;
            // Reset animation to frame 0 when changing states
            if (this.sprites[newState]) {
                this.sprites[newState].reset();
                console.log(`   ✅ Animation reset to frame 0`);
            } else {
                console.error(`   ❌ NO SPRITE FOUND for state: ${newState}`);
            }
        }
    }

    update(deltaTime, input, groundY) {
        // Convert deltaTime to seconds for physics calculations
        // CRITICAL FIX: Cap deltaTime to 100ms (0.1s) to prevent huge jumps during lag spikes
        const safeDelta = Math.min(deltaTime, 100);
        const dt = safeDelta / 1000;

        // Update power-up timers
        Object.keys(this.activePowerUps).forEach(key => {
            if (this.activePowerUps[key] > 0) {
                this.activePowerUps[key] -= deltaTime;
                if (this.activePowerUps[key] < 0) {
                    this.activePowerUps[key] = 0;
                }
            }
        });

        // Update invincibility
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // === HORIZONTAL MOVEMENT ===
        const speedMultiplier = this.activePowerUps.speed > 0 ? 1.5 : 1;

        if (input.left) {
            this.vx = -PLAYER.BASE_SPEED * speedMultiplier;
            this.facingLeft = true;
        } else if (input.right) {
            this.vx = PLAYER.BASE_SPEED * speedMultiplier;
            this.facingLeft = false;
        } else {
            // Apply friction
            this.vx *= PHYSICS.FRICTION;
            if (Math.abs(this.vx) < 10) {
                this.vx = 0;
            }
        }

        // === VERTICAL MOVEMENT (PHYSICS) ===

        // Flying mode (wings power-up)
        if (this.activePowerUps.wings > 0) {
            if (input.up) {
                this.vy = -300;
            } else if (input.down) {
                this.vy = 300;
            } else {
                this.vy *= 0.9; // Slow down
            }
            this.setState(PLAYER.STATES.FLYING);
        } else {
            // Normal gravity physics

            // Jump (detect NEW press only)
            if (input.jumpPressed && !this.lastJumpPressed) {
                if (this.grounded) {
                    // First jump
                    this.vy = PHYSICS.JUMP_FORCE;
                    this.grounded = false;
                    this.jumpCount = 1;
                    this.setState(PLAYER.STATES.JUMPING);
                } else if (this.jumpCount === 1) {
                    // Double jump!
                    this.vy = PHYSICS.DOUBLE_JUMP_FORCE;
                    this.jumpCount = 2;
                    this.setState(PLAYER.STATES.JUMPING);
                }
            }

            // Track jump state for next frame
            this.lastJumpPressed = input.jumpPressed;

            // Apply gravity
            if (!this.grounded) {
                // Gliding (hold jump while falling)
                // FIX: Check input.jump (HOLD) AND falling logic.
                // If button released, exit gliding immediately.
                if (input.jump && this.vy > 0) {
                    // Apply reduced gravity
                    this.vy += PHYSICS.GLIDE_GRAVITY * dt;
                    // Cap at glide fall speed
                    if (this.vy > PHYSICS.GLIDE_FALL_SPEED) {
                        this.vy = PHYSICS.GLIDE_FALL_SPEED;
                    }
                    this.setState(PLAYER.STATES.GLIDING);
                } else {
                    // Normal gravity
                    this.vy += PHYSICS.GRAVITY * dt;

                    // Terminal velocity
                    if (this.vy > PHYSICS.TERMINAL_VELOCITY) {
                        this.vy = PHYSICS.TERMINAL_VELOCITY;
                    }

                    // Exit GLIDING state if we were gliding but released jump
                    if (this.state === PLAYER.STATES.GLIDING) {
                        this.setState(PLAYER.STATES.JUMPING); // Or FALLING if we had one
                    }
                }
            }
        }

        // === UPDATE POSITION ===
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // === GROUND COLLISION ===
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.vy = 0;
            this.grounded = true;
            this.jumpCount = 0;

            // Update state based on movement (ONLY if on ground and not in special state)
            if (this.state !== PLAYER.STATES.HIT && this.state !== PLAYER.STATES.CELEBRATING) {
                if (Math.abs(this.vx) > 10) {
                    this.setState(PLAYER.STATES.RUNNING);
                } else {
                    this.setState(PLAYER.STATES.IDLE);
                }
            }
        } else {
            this.grounded = false;

            // ✅ CRITICAL FIX: If player is in a grounded state (IDLE/RUNNING) while in the air,
            // transition them to an appropriate airborne state (JUMPING/GLIDING)
            // This handles cases where player falls off platforms or starts the game in the air
            if (this.state === PLAYER.STATES.IDLE || this.state === PLAYER.STATES.RUNNING) {
                // Only transition if we're not in a special state
                if (this.state !== PLAYER.STATES.HIT && this.state !== PLAYER.STATES.CELEBRATING) {
                    this.setState(PLAYER.STATES.JUMPING);
                }
            }
        }

        // Keep player on screen (left boundary)
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        }

        // Update sprite animation
        if (this.sprites[this.state]) {
            this.sprites[this.state].update(deltaTime);
        }
    }


    draw(ctx) {
        // Flash if invincible
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw current sprite
        if (this.sprites[this.state]) {
            // Debug log every 60 frames (once per second at 60 FPS)
            if (Math.random() < 0.016) { // ~1% chance = roughly once per second
                console.log(`🎨 Drawing sprite - State: ${this.state}, Frame: ${this.sprites[this.state].currentFrame}`);
            }
            // **FIXED VISUAL OFFSET LOGIC**
            // Goal: Draw the LARGE sprite (114x100) so the SMALL hitbox (50x70) appears centered within it.
            // The sprite should be drawn "around" the hitbox, not displaced away from it.

            const visualWidth = PLAYER.VISUAL_WIDTH;   // 114
            const visualHeight = PLAYER.VISUAL_HEIGHT; // 100

            // Calculate how much bigger the sprite is than the hitbox
            const widthDiff = visualWidth - this.width;   // 114 - 50 = 64
            const heightDiff = visualHeight - this.height; // 100 - 70 = 30

            // To center horizontally: move sprite LEFT by half the difference
            // To align bottom: move sprite UP by height difference, but add small offset to ground feet
            const spriteX = this.x - (widthDiff / 2);
            const spriteY = this.y - heightDiff + 15; // +15px to lower sprite and align feet with ground

            // Draw the sprite at the calculated position
            this.sprites[this.state].draw(
                ctx,
                spriteX,
                spriteY,
                visualWidth,
                visualHeight,
                this.facingLeft
            );
        } else {
            // Fallback: draw colored rectangle
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.globalAlpha = 1.0;

        // DEBUG: Draw Physics Hitbox (Semi-transparent red)
        // Shows the actual collision area
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    hit() {
        if (this.invincible) return false;

        if (this.activePowerUps.shield > 0) {
            this.activePowerUps.shield = 0;
            return false;
        }

        this.lives--;
        this.setState(PLAYER.STATES.HIT);
        this.invincible = true;
        this.invincibleTimer = 1000; // 1 second

        setTimeout(() => {
            if (this.lives > 0) {
                this.setState(PLAYER.STATES.RUNNING);
            }
        }, 500);

        return this.lives <= 0;
    }

    collectCoin(value = 10) {
        this.coins += value;
        this.score += value;
    }

    collectHeart(value = 50) {
        this.score += value;
    }

    activatePowerUp(type, duration) {
        this.activePowerUps[type] = duration;
    }

    celebrate() {
        this.setState(PLAYER.STATES.CELEBRATING);
        this.vx = 0;
        this.vy = 0;
    }

    reset() {
        this.x = 100;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.setState(PLAYER.STATES.IDLE);
        this.grounded = false;
        this.jumpCount = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
    }
}

export default Player;
