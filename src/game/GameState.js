/**
 * GameState.js - Manages game state (score, lives, collectibles)
 */

class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.score = 0;
        this.hearts = 0;
        this.coins = 0;
        this.lives = 3;
        this.currentLevel = 1; // New Level Logic
        this.collectedItems = new Set(); // Track collected item IDs
        this.hitObstacles = new Set();   // Track hit obstacles
        this.isGameOver = false;        // Reset flag
        this.isVictory = false;
    }

    /**
     * Collect a heart
     */
    collectHeart() {
        this.hearts++;
        this.score += 10;
    }

    /**
     * Collect a coin
     */
    collectCoin() {
        this.coins++;
        this.score += 5;
    }

    /**
     * Hit an obstacle
     */
    hitObstacle() {
        this.lives--;
        // Prevent lives from going negative
        if (this.lives < 0) {
            this.lives = 0;
        }
        if (this.lives <= 0) {
            this.isGameOver = true;
        }
    }

    /**
     * Check if item was already collected
     */
    isCollected(itemId) {
        return this.collectedItems.has(itemId);
    }

    /**
     * Mark item as collected
     */
    markCollected(itemId) {
        this.collectedItems.add(itemId);
    }

    /**
     * Check if obstacle was hit (alias for compatibility)
     */
    isHit(obstacleId) {
        return this.wasHitRecently(obstacleId);
    }

    /**
     * Check if obstacle was hit recently
     */
    wasHitRecently(obstacleId) {
        return this.hitObstacles.has(obstacleId);
    }

    /**
     * Mark obstacle as hit (with cooldown)
     */
    markHit(obstacleId) {
        this.hitObstacles.add(obstacleId);

        // Remove after 2 seconds (invincibility period)
        setTimeout(() => {
            this.hitObstacles.delete(obstacleId);
        }, 2000);
    }

    /**
     * Victory condition
     */
    checkVictory(finishX, playerX) {
        if (playerX >= finishX && this.hearts >= 5) {
            this.isVictory = true;
            return true;
        }
        return false;
    }

    /**
     * Get stars based on performance
     */
    getStars(timeElapsed, targetTime) {
        if (this.hearts < 5) return 0;

        if (timeElapsed <= targetTime * 0.7 && this.coins >= 7) return 3;
        if (timeElapsed <= targetTime && this.coins >= 5) return 2;
        return 1;
    }
}

export default GameState;
