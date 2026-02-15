/**
 * LevelGenerator.js - Professional Procedural Generation Engine
 * Implements "Infinite Runner" logic with chunk-based generation, 
 * adaptive difficulty, and memory management.
 */

import { PLATFORMS, OBSTACLES, COLLECTIBLES } from './Constants';

// Difficulty Curves (0.0 to 1.0)
const DIFFICULTY_CURVES = {
    EASY: { gapMultiplier: 0.8, obstacleFreq: 0.3 },
    MEDIUM: { gapMultiplier: 1.0, obstacleFreq: 0.5 },
    HARD: { gapMultiplier: 1.2, obstacleFreq: 0.8 },
    INSANE: { gapMultiplier: 1.5, obstacleFreq: 1.0 }
};

// World Assets Configuration
const WORLD_CONFIG = {
    village: {
        ground: 'wooden',
        obstacle: 'chimney',
        backgrounds: ['bg-village-sky', 'bg-village-mountains', 'bg-village-houses']
    },
    pole: {
        ground: 'ice',
        obstacle: 'icicle',
        backgrounds: ['bg-pole-sky', 'bg-pole-mountains', 'bg-pole-ground']
    }
    // Add other worlds here
};

class LevelGenerator {
    constructor(worldTypeId = 'village', level = 1) {
        this.worldType = worldTypeId;
        this.level = level;
        this.config = WORLD_CONFIG[worldTypeId] || WORLD_CONFIG.village;

        this.currentX = 0;
        this.difficulty = 1.0; // Grows with time/distance
        this.generatedChunks = [];
        this.activeEntities = {
            platforms: [],
            obstacles: [],
            collectibles: [],
            powerups: []
        };

        // Initialize with safe zone
        this.generateSafeZone();
    }

    /**
     * Generate startup safe zone (flat ground)
     */
    generateSafeZone() {
        const safeLength = 1000;
        const groundY = 500;

        this.addPlatform({
            x: 0,
            y: groundY,
            width: safeLength,
            type: this.config.ground
        });

        this.currentX = safeLength;
    }

    /**
     * Core Generation Loop
     * Called every frame/tick to ensure content ahead
     * @param {number} playerX - Current player position
     * @param {number} viewWidth - Screen width to calculate "render distance"
     */
    /**
     * Core Generation Loop
     * Called every frame/tick to ensure content ahead
     * @param {number} playerX - Current player position
     * @param {number} viewWidth - Screen width to calculate "render distance"
     * @param {number} targetDist - Distance to spawn finish line (optional)
     * @param {GameState} gameState - Optional game state for smart cleanup
     */
    update(playerX, viewWidth, targetDist = Infinity, gameState = null) {
        // 1. Generate ahead (Buffer: 2 screens width)
        const renderDistance = playerX + (viewWidth * 2);

        // Stop generating if we've passed the target and spawned finish line
        if (this.finishLineSpawned) {
            return; // Stop generating
        }

        while (this.currentX < renderDistance) {
            if (targetDist && this.currentX >= targetDist) {
                this.generateFinishLine();
                break; // Stop generating after finish line
            } else {
                this.generateChunk();
            }
        }

        // 2. Cleanup behind (Optimization) - Memory Management
        const cleanupThreshold = playerX - (viewWidth * 2); // Increased buffer to avoid deleting visible back
        this.cleanupEntities(cleanupThreshold, gameState);
    }

    /**
     * Generate the final platform with finish line
     */
    generateFinishLine() {
        if (this.finishLineSpawned) return;

        const startX = this.currentX + 100; // Small gap
        const width = 1000; // Long victory runway
        const groundY = 500; // Force ground level (safe landing)

        // 1. Victory Platform
        this.addPlatform({
            x: startX,
            y: groundY,
            width: width,
            type: this.config.ground
        });

        // 2. Finish Line Flag (Collectible Type)
        // Positioned at the end of the runway
        const finishLine = {
            x: startX + 600,
            y: groundY - 120, // Height of flag
            type: 'collectible-finish', // Special type
            width: 80,
            height: 120,
            id: 'finish-line' // Fixed Unique ID
        };

        this.activeEntities.collectibles.push(finishLine);
        this.activeEntities.finish = finishLine; // Expose for specific renderer logic

        this.currentX = startX + width;
        this.finishLineSpawned = true;
        console.log("🏁 FINISH LINE SPAWNED at " + (startX + 600));
    }

    /**
     * Generate a single gameplay chunk based on current difficulty
     */
    generateChunk() {
        // Determine pattern based on difficulty
        const pattern = this.selectPattern();

        // ... (rest of function)
        const minGap = 100;
        const maxGap = 300 * this.difficulty;
        const gap = Math.floor(Math.min(maxGap, Math.random() * (maxGap - minGap) + minGap));

        // Start X for this chunk
        const startX = this.currentX + gap;
        let currentY = 500; // Base ground level (could vary)

        // Apply Pattern
        pattern.instructions.forEach(instr => {
            if (instr.type === 'platform') {
                this.addPlatform({
                    x: startX + instr.xOffset,
                    y: currentY - instr.yOffset,
                    width: instr.width,
                    type: this.config.ground
                });

                // Chance to add obstacles/collectibles on platform
                this.populatePlatform(startX + instr.xOffset, currentY - instr.yOffset, instr.width);

                // Update global X to end of this platform
                this.currentX = Math.max(this.currentX, startX + instr.xOffset + instr.width);
            }
        });
    }

    /**
     * Select a pattern using weighted random and difficulty
     */
    selectPattern() {
        // Simplified patterns for now - can be moved to separate file
        const patterns = [
            {
                name: 'Flat Run',
                difficulty: 1,
                instructions: [{ type: 'platform', xOffset: 0, yOffset: 0, width: 600 }]
            },
            {
                name: 'Double Jump',
                difficulty: 2,
                instructions: [
                    { type: 'platform', xOffset: 0, yOffset: 0, width: 300 },
                    { type: 'platform', xOffset: 400, yOffset: 100, width: 300 } // Higher
                ]
            },
            {
                name: 'Staircase',
                difficulty: 3,
                instructions: [
                    { type: 'platform', xOffset: 0, yOffset: 0, width: 200 },
                    { type: 'platform', xOffset: 250, yOffset: 100, width: 200 },
                    { type: 'platform', xOffset: 500, yOffset: 200, width: 200 }
                ]
            }
        ];

        // Filter valid patterns for current difficulty
        // For now just return random
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    /**
     * Add collectibles and obstacles to a platform
     */
    populatePlatform(x, y, width) {
        // Smart placement logic
        const slots = Math.floor(width / 50); // 50px slots
        const generateId = () => Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // 1. Obstacles (Chimneys/Ice)
        if (Math.random() < (0.3 * this.difficulty)) {
            const obstacleX = x + (width / 2); // Center
            // Fix: Calculate exact Y based on obstacle height to sit ON platform
            // Platform Y is the top surface. Obstacle needs to be drawn UP from there.
            // Adjust manually for visual fit (approx 60-80px)
            this.activeEntities.obstacles.push({
                x: obstacleX,
                y: y - 60, // Adjusted from 100 to 60 to sit on platform
                type: this.config.obstacle,
                id: generateId()
            });
        }

        // 2. Collectibles (Coins/Hearts)
        // Coin Arc
        if (Math.random() > 0.5) {
            for (let i = 0; i < 3; i++) {
                this.activeEntities.collectibles.push({
                    x: x + 50 + (i * 40),
                    y: y - 60 - (Math.sin(i) * 20), // Arc effect
                    type: 'coin',
                    id: generateId()
                });
            }
        }
    }

    /**
     * Data Management Helper: Add Platform
     */
    addPlatform(data) {
        this.activeEntities.platforms.push({
            ...data,
            id: Date.now() + Math.random()
        });
    }

    /**
     * Optimization: Remove entities that are far behind
     * @param {number} thresholdX - Position behind which entities can be removed
     * @param {GameState} gameState - Optional game state to check collected/hit items
     */
    cleanupEntities(thresholdX, gameState = null) {
        // Platforms can always be cleaned up
        this.activeEntities.platforms = this.activeEntities.platforms.filter(p => p.x + p.width > thresholdX);

        // DO NOT remove obstacles/collectibles if they've been interacted with
        // This prevents ID regeneration issues
        this.activeEntities.obstacles = this.activeEntities.obstacles.filter(o => {
            // Keep if still visible OR if it was hit (to preserve ID)
            if (o.x > thresholdX) return true;
            if (gameState && gameState.isHit(o.id)) return false; // Can safely remove hit obstacles
            return o.x > thresholdX;
        });

        this.activeEntities.collectibles = this.activeEntities.collectibles.filter(c => {
            // Keep if still visible OR if it was collected (to preserve ID)
            if (c.x > thresholdX) return true;
            if (gameState && gameState.isCollected(c.id)) return false; // Can safely remove collected items
            return c.x > thresholdX;
        });
    }

    /**
     * Get Current State for Renderer
     */
    getState() {
        return this.activeEntities;
    }

    /**
     * Increase difficulty over time
     */
    increaseDifficulty() {
        this.difficulty = Math.min(this.difficulty + 0.05, 3.0); // Cap at 3x
    }

    /**
     * Reset generator state
     */
    /**
     * Reset generator state
     */
    reset() {
        this.currentX = 0;
        this.difficulty = 1.0;
        this.generatedChunks = [];
        this.activeEntities = {
            platforms: [],
            obstacles: [],
            collectibles: [],
            powerups: []
        };
        this.finishLineSpawned = false; // Reset flag
        this.generateSafeZone();
    }
}

export default LevelGenerator;
