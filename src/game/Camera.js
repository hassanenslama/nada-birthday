/**
 * Camera.js
 * Handles viewport scrolling with professional smooth tracking and deadzones.
 */

class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;

        // Smoothness factor
        this.lerpFactor = 0.1;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * Update camera position to follow target (player)
     * @param {Object} target - The player object {x, y, width, height}
     * @param {number} viewWidth - The visible width in logical units
     * @param {number} viewHeight - The visible height in logical units
     */
    update(target, viewWidth, viewHeight) {
        // Validation: If inputs are bad, do nothing or reset
        if (!target || isNaN(target.x) || isNaN(target.y)) return;
        if (isNaN(viewWidth) || isNaN(viewHeight)) return;

        // Horizontal Follow
        // Keep player roughly at 30% of screen width
        const idealX = target.x - viewWidth * 0.3;

        if (!isNaN(idealX)) {
            this.x = Math.max(0, idealX);
        }

        // Vertical Follow - LOCKED
        // We lock Y to 0 to prevent "ground movement" effect during jumps. 
        // This ensures the ground behaves like a static platformer floor.
        this.y = 0;

        // Failsafe: Prevent Camera Y from drifting to Infinity if physics explodes
        if (Math.abs(this.y) > 10000) this.y = 0;
    }
}

export default Camera;
