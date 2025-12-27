/**
 * Level.js - Level data structure and example
 * Phase 2: Level Builder
 */

// Level structure definition
export const levelStructure = {
    id: 'number',           // Level ID (1-1 = 1, 1-2 = 2, etc.)
    world: 'string',        // 'village', 'pole', 'sky', 'castle'
    name: 'string',         // Display name
    duration: 'number',     // Target time in seconds

    // Background layers (parallax)
    background: [
        { asset: 'string', speed: 'number' }  // speed: 0.1 to 1.0
    ],

    // Platforms
    platforms: [
        { x: 'number', y: 'number', type: 'string', width: 'number' }
    ],

    // Obstacles
    obstacles: [
        { x: 'number', y: 'number', type: 'string' }
    ],

    // Collectibles (coins, hearts, stars)
    collectibles: [
        { x: 'number', y: 'number', type: 'string' }
    ],

    // Power-ups
    powerups: [
        { x: 'number', y: 'number', type: 'string' }
    ],

    // Goal/Finish
    finish: {
        x: 'number',
        y: 'number'
    },

    // Level objectives for stars
    objectives: {
        timeLimit: 'number',    // 3 stars
        heartsNeeded: 'number', // Minimum to complete
        coinsBonus: 'number'    // Bonus for collecting all
    }
};

// ===== LEVEL 1-1: Rooftop Run (Tutorial) =====
export const level1_1 = {
    id: 1,
    world: 'village',
    name: 'Rooftop Run',
    duration: 300, // 5 minutes

    background: [
        { asset: 'bg-village-sky', speed: 0.1 },
        { asset: 'bg-village-mountains', speed: 0.3 },
        { asset: 'bg-village-houses', speed: 0.5 },
        { asset: 'bg-village-trees', speed: 0.7 },
        { asset: 'bg-village-snow', speed: 1.0 },
    ],

    // Tutorial level with progressive difficulty
    platforms: [
        // Starting section - safe zone
        { x: 0, y: 500, type: 'wooden', width: 500 },

        // First jump - easy (gap: 150px)
        { x: 650, y: 500, type: 'wooden', width: 350 },

        // Second jump - medium (gap: 200px)
        { x: 1200, y: 500, type: 'wooden', width: 300 },

        // Staircase up - teach vertical movement
        { x: 1650, y: 450, type: 'wooden', width: 250 },
        { x: 2050, y: 400, type: 'wooden', width: 250 },
        { x: 2450, y: 350, type: 'wooden', width: 300 },

        // High platform - main section with collectibles
        { x: 2900, y: 350, type: 'wooden', width: 700 },

        // Gap with collectibles in air (gap: 250px - requires jump)
        { x: 3850, y: 350, type: 'wooden', width: 300 },

        // Down staircase 
        { x: 4300, y: 400, type: 'wooden', width: 250 },
        { x: 4700, y: 450, type: 'wooden', width: 250 },

        // Final long platform to finish
        { x: 5100, y: 500, type: 'wooden', width: 900 },
    ],

    obstacles: [
        // Chimneys - positioned ON platforms using algorithm: y = platform.y - height
        { x: 2200, y: 300, type: 'chimney' },  // On stair platform (y:400 - 100 = 300)
        { x: 3300, y: 250, type: 'chimney' },  // On high platform (y:350 - 100 = 250)
        { x: 5500, y: 400, type: 'chimney' },  // On final platform (y:500 - 100 = 400)
    ],

    collectibles: [
        // Hearts - on platforms (easy to collect)
        { x: 250, y: 400, type: 'heart' },      // Starting platform
        { x: 800, y: 400, type: 'heart' },      // After first jump
        { x: 1350, y: 400, type: 'heart' },     // After second jump
        { x: 1800, y: 350, type: 'heart' },     // On stairs
        { x: 2200, y: 300, type: 'heart' },     // On stairs
        { x: 3200, y: 250, type: 'heart' },     // On high platform
        { x: 4000, y: 250, type: 'heart' },     // After gap
        { x: 4450, y: 300, type: 'heart' },     // Down stairs
        { x: 5400, y: 400, type: 'heart' },     // Final platform
        { x: 5800, y: 400, type: 'heart' },     // Final platform

        // Coins - in the air (requires jumping to collect)
        { x: 750, y: 350, type: 'coin' },       // Above first gap
        { x: 800, y: 350, type: 'coin' },
        { x: 850, y: 350, type: 'coin' },

        { x: 3650, y: 250, type: 'coin' },      // Above big gap
        { x: 3700, y: 200, type: 'coin' },
        { x: 3750, y: 250, type: 'coin' },

        { x: 5250, y: 350, type: 'coin' },      // Before finish
        { x: 5300, y: 350, type: 'coin' },
        { x: 5350, y: 350, type: 'coin' },
    ],

    powerups: [
        // Shield for protection
        { x: 1100, y: 400, type: 'shield' },

        // Magnet to collect coins easier
        { x: 2800, y: 400, type: 'magnet' },
    ],

    // Checkpoint at halfway
    checkpoints: [
        { x: 2000, y: 400 }
    ],

    finish: {
        x: 5900,  // End of final platform
        y: 460    // On final platform (platform y:500 - finish height:240 = 260, but we want it visible so 460)
    },

    objectives: {
        timeLimit: 240,      // 4 minutes for 3 stars
        heartsNeeded: 50,    // Must collect at least 8 hearts
        coinsBonus: 9        // Bonus for collecting all 9 coins
    }
};

// Helper function to get level by ID
export const getLevelById = (id) => {
    const levels = {
        1: level1_1,
        // More levels will be added here
    };

    return levels[id] || null;
};

// Helper to get all levels for a world
export const getLevelsByWorld = (world) => {
    const allLevels = [level1_1]; // Will expand
    return allLevels.filter(level => level.world === world);
};

export default {
    level1_1,
    getLevelById,
    getLevelsByWorld
};
