/**
 * Constants - كل القيم الثابتة للعبة
 */

// === PHYSICS ===
// All values optimized for 60 FPS gameplay
export const PHYSICS = {
    // Gravity (pixels per second squared)
    GRAVITY: 1500,              // Moderate gravity for platformer feel
    TERMINAL_VELOCITY: 800,     // Max fall speed

    // Jump forces (pixels per second)
    JUMP_FORCE: -600,           // Initial jump velocity
    DOUBLE_JUMP_FORCE: -500,    // Second jump velocity

    // Gliding
    GLIDE_GRAVITY: 300,         // Reduced gravity while gliding
    GLIDE_FALL_SPEED: 200,      // Max fall speed while gliding

    // Friction
    FRICTION: 0.85,             // Ground friction for horizontal movement
};

// === PLAYER ===
export const PLAYER = {
    // New Sprite Sheet is 960x420 (4 cols x 2 rows)
    // Frame size: 240x210
    // Aspect Ratio: 1.14 : 1
    // Visual Size: Reduced by ~30% from original 160
    WIDTH: 114,             // 100 * 1.14
    HEIGHT: 100,            // Base height
    BASE_SPEED: 300,        // Pixels per second (horizontal)
    RUN_SPEED: 450,         // Running speed
    MAX_LIVES: 3,

    // States
    STATES: {
        IDLE: 'idle',
        RUNNING: 'running',
        JUMPING: 'jumping',
        FLYING: 'flying',
        GLIDING: 'gliding',
        HIT: 'hit',
        CELEBRATING: 'celebrating',
    },

    // Sprite Animation
    FRAME_COUNT: 8,         // 8 frames in 4x2 grid (4 columns, 2 rows)
    FPS: 12,                // Animation speed
    IDLE_FPS: 4,           // Slower animation for idle
};

// === CHARACTERS ===
export const CHARACTERS = {
    MR_SANTA: {
        id: 'mr-santa',
        name: 'Mr. Santa',
        unlocked: true,
        cost: 0,
        ability: 'Default',
        sprites: {
            idle: 'mr-santa-idle',
            running: 'mr-santa-running',
            jumping: 'mr-santa-jumping',
            flying: 'mr-santa-flying',
            gliding: 'mr-santa-gliding',
            hit: 'mr-santa-hit',
            celebrating: 'mr-santa-celebrating',
        }
    },
    MRS_SANTA: {
        id: 'mrs-santa',
        name: 'Mrs. Santa',
        unlocked: true,
        cost: 0,
        ability: '+5% Heart Collection',
        sprites: {
            idle: 'mrs-santa-idle',
            running: 'mrs-santa-running',
            jumping: 'mrs-santa-jumping',
            flying: 'mrs-santa-flying',
            gliding: 'mrs-santa-gliding',
            hit: 'mrs-santa-hit',
            celebrating: 'mrs-santa-celebrating',
        }
    },
};

// === POWER-UPS ===
export const POWER_UPS = {
    SHIELD: {
        id: 'shield',
        duration: 5000, // milliseconds
        sprite: 'powerup-shield',
    },
    MAGNET: {
        id: 'magnet',
        duration: 8000,
        range: 200, // pixels
        sprite: 'powerup-magnet',
    },
    WINGS: {
        id: 'wings',
        duration: 5000,
        sprite: 'powerup-wings',
    },
    SPEED: {
        id: 'speed',
        duration: 6000,
        multiplier: 1.5,
        sprite: 'powerup-speed',
    },
    CLOCK: {
        id: 'clock',
        duration: 5000,
        slowFactor: 0.5,
        sprite: 'powerup-clock',
    },
};

// === COLLECTIBLES ===
export const COLLECTIBLES = {
    COIN: {
        points: 10,
        sprite: 'collectible-coin',
    },
    HEART: {
        points: 50,
        sprite: 'collectible-heart',
    },
    STAR: {
        points: 100,
        sprite: 'collectible-star',
    },
};

// === OBSTACLES ===
export const OBSTACLES = {
    CHIMNEY: {
        width: 40,      // Reduced from 50 (originally 80) for tighter visuals
        height: 60,     // Reduced from 100 to avoid "cheap" hits
        sprite: 'obstacle-chimney',
    },
    ICICLE: {
        width: 30,      // Reduced from 50
        height: 80,     // Reduced from 100
        sprite: 'obstacle-icicle',
    },
    SPIKE: {
        width: 60,
        height: 40,
        sprite: 'obstacle-spike',
    },
    FLAME: {
        width: 40,
        height: 40,
        sprite: 'obstacle-flame',
        animated: true,
    },
    ELECTRIC: {
        width: 40,
        height: 40,
        sprite: 'obstacle-electric',
        animated: true,
    },
};

// === PLATFORMS ===
export const PLATFORMS = {
    WOODEN: {
        width: 200,
        height: 40,
        sprite: 'platform-wooden',
        friction: 1,
    },
    CLOUD: {
        width: 200,
        height: 40,
        sprite: 'platform-cloud',
        friction: 1,
        bouncy: false,
    },
    ICE: {
        width: 200,
        height: 40,
        sprite: 'platform-ice',
        friction: 0.95, // slippery
    },
    SPRING: {
        width: 200,
        height: 60,
        sprite: 'platform-spring',
        bounceForce: -20,
    },
};

// === WORLDS ===
export const WORLDS = {
    VILLAGE: {
        id: 1,
        name: 'Christmas Village',
        icon: 'icon-world-village',
        backgrounds: [
            { layer: 'bg-village-sky', speed: 0.1 },
            { layer: 'bg-village-mountains', speed: 0.3 },
            { layer: 'bg-village-houses', speed: 0.5 },
            { layer: 'bg-village-trees', speed: 0.7 },
            { layer: 'bg-village-snow', speed: 1 },
        ],
        levels: 4,
    },
    NORTH_POLE: {
        id: 2,
        name: 'North Pole',
        icon: 'icon-world-pole',
        backgrounds: [
            { layer: 'bg-pole-sky', speed: 0.1 },
            { layer: 'bg-pole-aurora', speed: 0.2 },
            { layer: 'bg-pole-mountains', speed: 0.4 },
            { layer: 'bg-pole-ground', speed: 0.6 },
            { layer: 'bg-pole-blizzard', speed: 1 },
        ],
        levels: 4,
    },
    SKY_ROUTE: {
        id: 3,
        name: 'Sky Route',
        icon: 'icon-world-sky',
        backgrounds: [
            { layer: 'bg-sky-stars', speed: 0.1 },
            { layer: 'bg-sky-moon', speed: 0.2 },
            { layer: 'bg-sky-clouds-far', speed: 0.4 },
            { layer: 'bg-sky-clouds-near', speed: 0.6 },
            { layer: 'bg-sky-birds', speed: 1 },
        ],
        levels: 4,
    },
    CASTLE: {
        id: 4,
        name: "Grinch's Castle",
        icon: 'icon-world-castle',
        backgrounds: [
            { layer: 'bg-castle-storm', speed: 0.1 },
            { layer: 'bg-castle-lightning-1', speed: 0.2 }, // Will animate between frames
            { layer: 'bg-castle-distant', speed: 0.4 },
            { layer: 'bg-castle-walls', speed: 0.6 },
            { layer: 'bg-castle-chains', speed: 1 },
        ],
        levels: 4,
    },
};

// === GAME CONFIG ===
export const GAME = {
    CANVAS_WIDTH: 1920,
    CANVAS_HEIGHT: 1080,
    TARGET_FPS: 60,

    // Difficulty
    BASE_SPAWN_RATE: 60, // frames between spawns
    MIN_SPAWN_RATE: 35,
    SPEED_INCREASE_PER_SCORE: 0.08,
    MAX_SPEED_BONUS: 9,

    // Scoring
    COINS_PER_LIFE: 100,
    STARS_PER_LEVEL: 3,
};

// === CAMERA ===
export const CAMERA = {
    FOLLOW_OFFSET_X: 400, // Player position from left edge
    SMOOTH_FACTOR: 0.1,
    SHAKE_INTENSITY: 10,
    SHAKE_DURATION: 300, // ms
};

// === AUDIO ===
export const AUDIO = {
    MUSIC_VOLUME: 0.5,
    SFX_VOLUME: 0.7,
};

export default {
    PHYSICS,
    PLAYER,
    CHARACTERS,
    POWER_UPS,
    COLLECTIBLES,
    OBSTACLES,
    PLATFORMS,
    WORLDS,
    GAME,
    CAMERA,
    AUDIO,
};
