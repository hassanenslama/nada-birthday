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
        this.width = PLAYER.WIDTH;
        this.height = PLAYER.HEIGHT;
        this.vx = 0;
        this.vy = 0;

        // State
        this.state = PLAYER.STATES.IDLE;
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
        this.character = CHARACTERS[character.toUpperCase().replace('-', '_')];

        // Sprites
        this.sprites = {};
        this.loadSprites(assetManager);
    }

    loadSprites(assetManager) {
        const charSprites = this.character.sprites;

        Object.keys(PLAYER.STATES).forEach(stateKey => {
            const state = PLAYER.STATES[stateKey];
            const spriteName = charSprites[state];
            const image = assetManager.get(spriteName);

            if (image) {
                // Use slower FPS for idle state
                const fps = state === 'idle' ? PLAYER.IDLE_FPS : PLAYER.FPS;
                this.sprites[state] = new Sprite(image, PLAYER.FRAME_COUNT, fps);
            } else {
                console.warn(`Sprite for ${state} not found!`);
            }
        });
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
            this.state = PLAYER.STATES.FLYING;
        } else {
            // Normal gravity physics

            // Jump (detect NEW press only)
            if (input.jumpPressed && !this.lastJumpPressed) {
                if (this.grounded) {
                    // First jump
                    this.vy = PHYSICS.JUMP_FORCE;
                    this.grounded = false;
                    this.jumpCount = 1;
                    this.state = PLAYER.STATES.JUMPING;
                } else if (this.jumpCount === 1) {
                    // Double jump!
                    this.vy = PHYSICS.DOUBLE_JUMP_FORCE;
                    this.jumpCount = 2;
                    this.state = PLAYER.STATES.JUMPING;
                }
            }

            // Track jump state for next frame
            this.lastJumpPressed = input.jumpPressed;

            // Apply gravity
            if (!this.grounded) {
                // Gliding (hold jump while falling)
                if (input.jump && this.vy > 0) {
                    // Apply reduced gravity
                    this.vy += PHYSICS.GLIDE_GRAVITY * dt;
                    // Cap at glide fall speed
                    if (this.vy > PHYSICS.GLIDE_FALL_SPEED) {
                        this.vy = PHYSICS.GLIDE_FALL_SPEED;
                    }
                    this.state = PLAYER.STATES.GLIDING;
                } else {
                    // Normal gravity
                    this.vy += PHYSICS.GRAVITY * dt;

                    // Terminal velocity
                    if (this.vy > PHYSICS.TERMINAL_VELOCITY) {
                        this.vy = PHYSICS.TERMINAL_VELOCITY;
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

            // Update state based on movement
            if (this.state !== PLAYER.STATES.HIT) {
                if (Math.abs(this.vx) > 10) {
                    this.state = PLAYER.STATES.RUNNING;
                } else {
                    this.state = PLAYER.STATES.IDLE;
                }
            }
        } else {
            this.grounded = false;
            // Update jump/fall state
            if (this.state !== PLAYER.STATES.GLIDING && this.state !== PLAYER.STATES.FLYING) {
                this.state = PLAYER.STATES.JUMPING;
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
            // Visual Offset for Mr. Santa (Backpack was protruding)
            const visualXOffset = this.character.id === 'mr-santa' ? 15 : 0;

            this.sprites[this.state].draw(
                ctx,
                this.x + visualXOffset,
                this.y,
                this.width,
                this.height,
                this.facingLeft
            );
        } else {
            // Fallback: draw colored rectangle
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.globalAlpha = 1.0;

        // DEBUG: Draw Physics Hitbox
        // This helps the user visualize why they fall or stand
        const footOffset = 20;
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.x + footOffset,
            this.y,
            this.width - (footOffset * 2),
            this.height
        );
    }

    hit() {
        if (this.invincible) return false;

        if (this.activePowerUps.shield > 0) {
            this.activePowerUps.shield = 0;
            return false;
        }

        this.lives--;
        this.state = PLAYER.STATES.HIT;
        this.invincible = true;
        this.invincibleTimer = 1000; // 1 second

        setTimeout(() => {
            if (this.lives > 0) {
                this.state = PLAYER.STATES.RUNNING;
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
        this.state = PLAYER.STATES.CELEBRATING;
        this.vx = 0;
        this.vy = 0;
    }

    reset() {
        this.x = 100;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.state = PLAYER.STATES.IDLE;
        this.grounded = false;
        this.jumpCount = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
    }
}

export default Player;
