import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Shield, Zap, Star, Magnet, Clock, X, Trophy, RotateCcw, ArrowUp } from 'lucide-react';
import { getAssetPath } from '../../../utils/assets';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';

const LoveDeliveryEnhanced = ({ onExit }) => {
    const canvasRef = useRef(null);

    // Core Game State (Only UI-related states)
    const [score, setScore] = useState(0);
    const [coins, setCoins] = useState(0);
    const [lives, setLives] = useState(3);
    const [combo, setCombo] = useState(0);
    const [level, setLevel] = useState(1);

    // Game Flow
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [started, setStarted] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [leaderboard, setLeaderboard] = useState({ admin: [], user: [] });

    // Visuals
    const [playerY, setPlayerY] = useState(0);
    const [activePowerUps, setActivePowerUps] = useState({
        shield: 0,
        magnet: 0,
        slowmo: 0,
        star: 0,
        rocket: 0
    });

    // Use Refs for values that change rapidly (avoid re-renders)
    const comboTimeoutRef = useRef(null);
    const comboMultiplierRef = useRef(1);

    const { userRole } = useAuth();

    // Constants
    const MAX_LIVES = 3;
    const VICTORY_SCORE = 200;
    const BASE_JUMP_FORCE = -16;  // Increased for higher jumps
    const GRAVITY = 0.6;
    const BASE_SPEED = 6;

    // Play Sound Helper (with error handling)
    const playSound = (soundName) => {
        try {
            const audio = new Audio(`/sounds/Santa-game/${soundName}.mp3`);
            audio.volume = 0.3;
            audio.play().catch(() => { });  // Silently fail if sound doesn't exist
        } catch (e) { }
    };

    // Combo System
    const addToCombo = () => {
        const newCombo = combo + 1;
        setCombo(newCombo);

        // Update multiplier
        if (newCombo >= 10) {
            comboMultiplierRef.current = 5;
            playSound('combo');
        } else if (newCombo >= 5) {
            comboMultiplierRef.current = 3;
        } else if (newCombo >= 3) {
            comboMultiplierRef.current = 2;
        } else {
            comboMultiplierRef.current = 1;
        }

        // Reset combo timeout
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
        comboTimeoutRef.current = setTimeout(() => {
            setCombo(0);
            comboMultiplierRef.current = 1;
        }, 3000);
    };

    // Power-up Management
    useEffect(() => {
        const interval = setInterval(() => {
            setActivePowerUps(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(key => {
                    if (updated[key] > 0) updated[key] -= 100;
                });
                return updated;
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Music State Management
    useEffect(() => {
        const timer = setTimeout(() => {
            window.dispatchEvent(new CustomEvent('christmas_game_mode', { detail: { active: true } }));
        }, 100);

        return () => {
            clearTimeout(timer);
            window.dispatchEvent(new CustomEvent('christmas_game_mode', { detail: { active: false } }));
        };
    }, []);

    // Leaderboard
    const fetchLeaderboard = async () => {
        const { data } = await supabase
            .from('game_scores')
            .select('*')
            .eq('game_name', 'love_delivery')
            .order('score', { ascending: false })
            .order('created_at', { ascending: false });

        if (data) {
            // Remove duplicates and get top 5 for each role
            const adminScores = data.filter(s => s.user_role === 'admin').slice(0, 5);
            const userScores = data.filter(s => s.user_role === 'user').slice(0, 5);
            setLeaderboard({ admin: adminScores, user: userScores });
        }
    };

    const saveScore = async (finalScore) => {
        if (!userRole) return;
        await supabase.from('game_scores').insert([
            { user_role: userRole, score: finalScore, game_name: 'love_delivery' }
        ]);
    };

    useEffect(() => {
        if (showLeaderboard) fetchLeaderboard();
    }, [showLeaderboard]);

    const resetGame = () => {
        setGameOver(false);
        setGameWon(false);
        setScore(0);
        setCoins(0);
        setLives(MAX_LIVES);
        setCombo(0);
        comboMultiplierRef.current = 1;
        setLevel(1);
        setActivePowerUps({ shield: 0, magnet: 0, slowmo: 0, star: 0, rocket: 0 });
        setStarted(false);
        setTimeout(() => setStarted(true), 50);
    };

    const handleExitRequest = () => setShowExitConfirm(true);
    const confirmExit = () => onExit();
    const cancelExit = () => setShowExitConfirm(false);

    // Main Game Loop - ONLY depends on 'started'
    useEffect(() => {
        if (!started) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Sprite Class for Animation Handling
        class Sprite {
            constructor(src, frameCount, fps = 12) {
                this.image = new Image();
                this.image.src = getAssetPath(src);
                this.frameCount = frameCount;
                this.frameInterval = 1000 / fps;
                this.frameTimer = 0;
                this.currentFrame = 0;
                this.loaded = false;
                this.image.onload = () => { this.loaded = true; };
            }

            update(deltaTime) {
                this.frameTimer += deltaTime;
                if (this.frameTimer > this.frameInterval) {
                    this.currentFrame = (this.currentFrame + 1) % this.frameCount;
                    this.frameTimer = 0;
                }
            }

            draw(ctx, x, y, width, height, facingLeft = false) {
                if (!this.loaded) return;

                const imgWidth = this.image.naturalWidth || this.image.width;
                const imgHeight = this.image.naturalHeight || this.image.height;

                // Auto-detect orientation: Horizontal vs Vertical Strip vs Grid
                // 1) Horizontal Strip: Width >>> Height (Ratio > 4:1)
                const isHorizontal = imgWidth > imgHeight * 3;
                // 2) Vertical Strip: Height >>> Width (Ratio > 3:1)
                const isVertical = imgHeight > imgWidth * 2;

                let frameWidth, frameHeight, sx, sy;

                if (isHorizontal) {
                    // Horizontal Strip (1 x N)
                    frameWidth = imgWidth / this.frameCount;
                    frameHeight = imgHeight;
                    sx = Math.floor(this.currentFrame * frameWidth);
                    sy = 0;
                } else if (isVertical) {
                    // Vertical Strip (N x 1)
                    frameWidth = imgWidth;
                    frameHeight = imgHeight / this.frameCount;
                    sx = 0;
                    sy = Math.floor(this.currentFrame * frameHeight);
                } else {
                    // 3) GRID Detected (Likely 4x2 for 8 frames)
                    // Dimensions 2707x1478 -> Ratio ~1.8 -> Fits 4x2 (4/2 = 2)

                    const cols = Math.ceil(Math.sqrt(this.frameCount));
                    const rows = Math.ceil(this.frameCount / cols);

                    // Specific override for 8 frames (4x2 usually)
                    const gridCols = this.frameCount === 8 ? 4 : cols;
                    const gridRows = this.frameCount === 8 ? 2 : rows;

                    frameWidth = imgWidth / gridCols;
                    frameHeight = imgHeight / gridRows;

                    const col = this.currentFrame % gridCols;
                    const row = Math.floor(this.currentFrame / gridCols);

                    sx = Math.floor(col * frameWidth);
                    sy = Math.floor(row * frameHeight);
                }

                ctx.save();
                if (facingLeft) {
                    ctx.translate(x + width, y);
                    ctx.scale(-1, 1);
                    ctx.drawImage(
                        this.image,
                        sx, sy, Math.floor(frameWidth), Math.floor(frameHeight),
                        0, 0, width, height
                    );
                } else {
                    ctx.drawImage(
                        this.image,
                        sx, sy, Math.floor(frameWidth), Math.floor(frameHeight),
                        x, y, width, height
                    );
                }
                ctx.restore();
            }
            getDebugInfo() {
                return {
                    loaded: this.loaded,
                    width: this.image.naturalWidth || this.image.width,
                    height: this.image.naturalHeight || this.image.height,
                    frames: this.frameCount,
                    src: this.image.src
                };
            }
        }

        // Initialize Canvas
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // --- LOAD ASSETS ---
        // Santa Sprites
        const sprites = {
            idle: new Sprite('/images/game-santa/Idle.png', 8, 12),
            run: new Sprite('/images/game-santa/Running.png', 8, 16),
            jump: new Sprite('/images/game-santa/Jumping.png', 8, 12),
            fly: new Sprite('/images/game-santa/Flying.png', 8, 12),
            glide: new Sprite('/images/game-santa/Gliding.png', 8, 12),
            hit: new Sprite('/images/game-santa/HitDamage.png', 8, 12)
        };

        // Collectible & Power-up Sprites (animated)
        const itemSprites = {
            coin: new Sprite('/images/game-santa/SpinningCoin.png', 8, 12),
            heart: new Sprite('/images/game-santa/Pulsing-Heart.png', 8, 10),
            shield: new Sprite('/images/game-santa/Glowing-Shield.png', 8, 10),
            magnet: new Sprite('/images/game-santa/Floating-Magnet.png', 8, 10),
            star: new Sprite('/images/game-santa/Twinkling-Star.png', 8, 12),
            rocket: new Sprite('/images/game-santa/Pulsing-Speed-Bolt.png', 8, 12),
            wings: new Sprite('/images/game-santa/Flapping-Wings-Item.png', 8, 10)
        };

        // Game State (all local to this effect)
        let player = {
            x: 50,
            y: canvas.height - 150,
            width: 100,
            height: 100,
            dy: 0,
            vx: 0,
            grounded: false,
            state: 'idle',
            facingLeft: false,
            jumpCount: 0,       // For Double Jump
            isDashing: false,   // For Dash
            dashTimer: 0        // Duration of dash
        };
        // Dash Constants
        const DASH_SPEED_MULTIPLIER = 2.0;
        const DASH_DURATION = 15; // Frames (~0.25s)

        let obstacles = [];
        let powerups = [];
        let particles = [];
        let backgroundStars = [];
        let frameCount = 0;

        // Local game variables
        let currentScore = 0;
        let currentCoins = 0;
        let currentCombo = 0;
        let currentLives = MAX_LIVES;
        let gameSpeed = BASE_SPEED;
        let spawnRate = 60;
        let currentPowerUps = { shield: 0, magnet: 0, slowmo: 0, star: 0, rocket: 0 };

        // Smart Spawning State
        let waveTimer = 0;
        let currentWave = 'normal'; // normal, rush, coinRain, mixed

        // Initialize Stars
        for (let i = 0; i < 50; i++) {
            backgroundStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.1
            });
        }

        const createExplosion = (x, y, color, count = 8) => {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 1.0,
                    color,
                    size: Math.random() * 4 + 2
                });
            }
        };

        const update = () => {
            // STOP if game is over
            if (gameOver || gameWon) return;

            // Update level
            const newLevel = Math.floor(currentScore / 10) + 1;
            if (newLevel !== level) setLevel(newLevel);

            // Difficulty Scaling (WITH CAP for Endless play)
            // Max speed cap at ~12 (BASE_SPEED=3 + 9) to keep game playable for 15+ mins
            const rawSpeed = BASE_SPEED + (currentScore * 0.08); // Slower progression
            gameSpeed = Math.min(rawSpeed, BASE_SPEED + 9); // Cap at +9

            // Spawn rate also capped (min 35 frames for breathing room)
            spawnRate = Math.max(35, 65 - (currentScore * 0.3));

            // Speed modifiers
            const speedMod = currentPowerUps.rocket > 0 ? 1.5 :
                player.isDashing ? DASH_SPEED_MULTIPLIER : 1;
            const slowMod = currentPowerUps.slowmo > 0 ? 0.5 : 1;

            // Dash Logic
            if (player.isDashing) {
                player.dashTimer--;
                if (player.dashTimer <= 0) {
                    player.isDashing = false;
                    player.dy = 0; // Stop vertical momentum after dash
                } else {
                    player.dy = 0; // Anti-gravity during dash
                }
            } else {
                // Normal Physics
                player.dy += GRAVITY;
            }
            player.y += player.dy;

            // Y CEILING: Prevent flying off-screen
            const SKY_CEILING = 50; // Minimum Y position (top of screen)
            if (player.y < SKY_CEILING) {
                player.y = SKY_CEILING;
                player.dy = 0; // Stop upward movement
            }

            const groundY = canvas.height - 80;

            if (player.y + player.height > groundY) {
                player.y = groundY - player.height;
                player.dy = 0;
                player.grounded = true;
                player.jumpCount = 0; // Reset double jump

                // Ground State Logic
                if (gameSpeed > 0) {
                    player.state = 'run';
                } else {
                    player.state = 'idle';
                }
            } else {
                player.grounded = false;

                // Air State Logic
                if (player.dy < 0) {
                    player.state = 'jump';
                } else {
                    player.state = 'jump';
                }
            }

            // Power-up Overrides
            if (currentPowerUps.rocket > 0) player.state = 'fly';

            // Update React state for DOM rendering
            setPlayerY(player.y);

            // Background
            backgroundStars.forEach(star => {
                star.x -= star.speed * slowMod;
                if (star.x < 0) star.x = canvas.width;
            });

            // --- SMART SPAWNING ALGORITHM (Phase 2) ---
            waveTimer++;

            // 1. Wave Management (Change logic every 1000 frames ~ 16s)
            if (waveTimer % 1000 === 0) {
                // Include 'easy' wave for breathing room (longer play sessions)
                const waves = ['normal', 'easy', 'rush', 'coinRain', 'mixed'];
                currentWave = waves[Math.floor(Math.random() * waves.length)];
                // Visual notification for wave change could go here
            }

            // EASY WAVE: Slower, more rewards, less hazards
            if (currentWave === 'easy') {
                spawnRate = Math.max(spawnRate, 50); // Force slower spawn
                gameSpeed = Math.max(BASE_SPEED, gameSpeed * 0.7); // Reduce speed
            }

            // 2. Pattern Definition
            const spawnPattern = (patternType) => {
                const startX = canvas.width;
                const groundY = canvas.height - 120;
                const airY = canvas.height - 300;

                if (patternType === 'coinArc') {
                    // Arc of 5 coins (LOW & TIGHT for reachability)
                    for (let i = 0; i < 5; i++) {
                        const yOffset = Math.sin((i / 4) * Math.PI) * 40; // Reduced from 60 to 40
                        obstacles.push({
                            x: startX + (i * 70), // Tighter spacing
                            y: groundY - 80 - yOffset,  // Lower base: groundY-80 to groundY-120
                            width: 30, height: 30, type: 'coin',
                            oscillation: 0, // REMOVED oscillation
                            collected: false
                        });
                    }
                } else if (patternType === 'groundHazard') {
                    // 2 Snowballs with a jump gap
                    obstacles.push({ x: startX, y: groundY, width: 40, height: 40, type: 'snowball', oscillation: 0, collected: false });
                    obstacles.push({ x: startX + 250, y: groundY, width: 40, height: 40, type: 'snowball', oscillation: 0, collected: false });
                    // Prize in the middle (Reachable with jump)
                    obstacles.push({ x: startX + 125, y: groundY - 150, width: 40, height: 40, type: 'gift', oscillation: 0, collected: false });
                } else if (patternType === 'rain') {
                    // Coins in LOW reachable spread
                    for (let i = 0; i < 3; i++) {
                        obstacles.push({
                            x: startX + (i * 100),
                            y: groundY - 60 - (Math.random() * 80), // Range: groundY-60 to groundY-140
                            width: 30, height: 30, type: 'coin',
                            oscillation: 0, // NO oscillation
                            collected: false
                        });
                    }
                }
            };

            // 3. Spawning Logic based on Wave
            let effectiveSpawnRate = spawnRate;
            if (currentWave === 'rush') effectiveSpawnRate = 30; // Fast spawn
            if (currentWave === 'coinRain') effectiveSpawnRate = 20; // Very fast coins

            if (frameCount % Math.floor(effectiveSpawnRate) === 0) {
                const rand = Math.random();

                if (currentWave === 'coinRain') {
                    spawnPattern('rain');
                } else if (rand > 0.7) {
                    spawnPattern('coinArc');
                } else if (rand > 0.4) {
                    spawnPattern('groundHazard');
                } else {
                    // Classic Random Fallback (Single item)
                    const type = Math.random() > 0.6 ? 'heart' : 'snowball';
                    const y = type === 'snowball' ? canvas.height - 120 : canvas.height - 250;
                    obstacles.push({
                        x: canvas.width, y: y,
                        width: 40, height: 40, type,
                        oscillation: 0, collected: false
                    });
                }
            }

            // Spawn Power-ups (Guaranteed every 15s or based on luck)
            if (frameCount % 900 === 0) { // Every ~15s
                const powerupTypes = ['shield', 'magnet', 'slowmo', 'star', 'rocket'];
                const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
                powerups.push({
                    x: canvas.width,
                    y: canvas.height - 250, // Accessible height
                    width: 35, height: 35,
                    type: randomType,
                    collected: false
                });
            }

            // Move Obstacles
            obstacles.forEach(obs => {
                obs.x -= gameSpeed * slowMod;
                // REMOVED oscillation to keep heights predictable
                // if (obs.type !== 'snowball') {
                //     obs.y += Math.sin(frameCount * 0.1 + obs.oscillation) * 1;
                // }

                // Magnet Effect
                if (currentPowerUps.magnet > 0 && (obs.type === 'heart' || obs.type === 'gift' || obs.type === 'coin')) {
                    const dx = player.x - obs.x;
                    const dy = player.y - obs.y;
                    obs.x += dx * 0.05;
                    obs.y += dy * 0.05;
                }

                // Collision
                const hitboxPadding = 10;
                if (!obs.collected &&
                    player.x + hitboxPadding < obs.x + obs.width - hitboxPadding &&
                    player.x + player.width - hitboxPadding > obs.x + hitboxPadding &&
                    player.y + hitboxPadding < obs.y + obs.height - hitboxPadding &&
                    player.y + player.height - hitboxPadding > obs.y + hitboxPadding) {

                    if (obs.type === 'snowball') {
                        if (currentPowerUps.shield > 0) {
                            obs.collected = true;
                            createExplosion(obs.x, obs.y, '#60a5fa', 12);
                            playSound('hit');
                        } else {
                            currentLives--;
                            setLives(currentLives);
                            playSound('hit');

                            if (currentLives <= 0) {
                                setGameOver(true);
                                saveScore(currentScore);
                                return;
                            }
                            obs.collected = true;
                            createExplosion(obs.x, obs.y, '#ff4444', 15);
                            currentCombo = 0;
                            setCombo(0);
                            comboMultiplierRef.current = 1;
                        }
                    } else {
                        obs.collected = true;

                        // Combo
                        currentCombo++;
                        addToCombo();

                        // Score
                        const basePoints = obs.type === 'coin' ? 5 : 1;
                        const starBonus = currentPowerUps.star > 0 ? 2 : 1;
                        const points = basePoints * comboMultiplierRef.current * starBonus;

                        currentScore += points;
                        setScore(currentScore);

                        if (obs.type === 'coin') {
                            currentCoins += 1;
                            setCoins(currentCoins);
                            createExplosion(obs.x, obs.y, '#fbbf24', 10);
                            playSound('coin');
                        } else {
                            createExplosion(obs.x, obs.y, obs.type === 'heart' ? '#ef4444' : '#fbbf24', 8);
                            playSound('collect');
                        }

                        if (currentScore >= VICTORY_SCORE) {
                            setGameWon(true);
                            saveScore(currentScore);
                            return;
                        }
                    }
                }
            });

            // Move Power-ups
            powerups.forEach(pu => {
                pu.x -= gameSpeed * slowMod;

                const hitboxPadding = 10;
                if (!pu.collected &&
                    player.x + hitboxPadding < pu.x + pu.width - hitboxPadding &&
                    player.x + player.width - hitboxPadding > pu.x + hitboxPadding &&
                    player.y + hitboxPadding < pu.y + pu.height - hitboxPadding &&
                    player.y + player.height - hitboxPadding > pu.y + hitboxPadding) {

                    pu.collected = true;

                    const durations = {
                        shield: 10000,
                        magnet: 8000,
                        slowmo: 5000,
                        star: 15000,
                        rocket: 10000
                    };

                    currentPowerUps[pu.type] = durations[pu.type];
                    setActivePowerUps({ ...currentPowerUps });
                    playSound('powerup');
                    createExplosion(pu.x, pu.y, '#a78bfa', 12);
                }
            });

            // Update power-ups timers
            Object.keys(currentPowerUps).forEach(key => {
                if (currentPowerUps[key] > 0) {
                    currentPowerUps[key] = Math.max(0, currentPowerUps[key] - 16);
                }
            });

            // Update Particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
            });
            particles = particles.filter(p => p.life > 0);

            // Cleanup
            obstacles = obstacles.filter(obs => obs.x > -50 && !obs.collected);
            powerups = powerups.filter(pu => pu.x > -50 && !pu.collected);
            frameCount++;
        };

        const draw = () => {
            if (gameOver || gameWon) {
                cancelAnimationFrame(animationFrameId);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Sky Gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#0f172a');
            gradient.addColorStop(1, '#1e293b');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Stars
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            backgroundStars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // Moon
            ctx.fillStyle = "#fbbf24";
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#fbbf24";
            ctx.beginPath();
            ctx.arc(canvas.width - 100, 100, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Ground
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

            // Particles
            particles.forEach(p => {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            });

            // Obstacles (with animated sprites)
            obstacles.forEach(obs => {
                // Update sprite animation
                const spriteKey = obs.type === 'gift' ? 'heart' : obs.type; // Use heart sprite for gifts
                if (itemSprites[spriteKey]) {
                    itemSprites[spriteKey].update(16);
                    itemSprites[spriteKey].draw(ctx, obs.x, obs.y, obs.width, obs.height);
                } else {
                    // Fallback to emoji if sprite missing
                    ctx.save();
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = obs.type === 'snowball' ? 'white' : 'gold';
                    ctx.font = "36px Arial";
                    ctx.fillStyle = '#ffffff';
                    const emoji = { heart: "❤️", gift: "🎁", snowball: "❄️", coin: "🪙" };
                    ctx.fillText(emoji[obs.type], obs.x, obs.y + 30);
                    ctx.restore();
                }
            });

            // Power-ups (with animated sprites)
            powerups.forEach(pu => {
                if (itemSprites[pu.type]) {
                    itemSprites[pu.type].update(16);
                    // Add glow effect
                    ctx.save();
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#a78bfa';
                    itemSprites[pu.type].draw(ctx, pu.x, pu.y, pu.width, pu.height);
                    ctx.restore();
                } else {
                    // Fallback to emoji
                    ctx.save();
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#a78bfa';
                    ctx.font = "30px Arial";
                    ctx.fillStyle = '#ffffff';
                    const icons = { shield: "🛡️", magnet: "🧲", slowmo: "⏰", star: "⭐", rocket: "🚀" };
                    ctx.fillText(icons[pu.type], pu.x, pu.y + 25);
                    ctx.restore();
                }
            });

            // --- RENDER SPRITE ---
            // --- RENDER SPRITE ---
            const activeSprite = sprites[player.state];
            if (activeSprite) {
                activeSprite.update(16);
                activeSprite.draw(ctx, player.x, player.y, player.width, player.height, player.facingLeft);

                activeSprite.draw(ctx, player.x, player.y, player.width, player.height, player.facingLeft);
            } else {
                console.warn("Missing sprite for state:", player.state);
                // Fallback
                sprites.idle?.draw(ctx, player.x, player.y, player.width, player.height, player.facingLeft);
            }

            // Update();
            update();
            animationFrameId = requestAnimationFrame(draw);
        };

        const handleJump = () => {
            // 1. First Jump (from Ground)
            if (player.grounded || currentPowerUps.rocket > 0) {
                const jumpMod = currentPowerUps.rocket > 0 ? 1.3 : 1;
                player.dy = BASE_JUMP_FORCE * jumpMod;
                playSound('jump');
                player.grounded = false;
                player.jumpCount = 1;
                player.state = currentPowerUps.rocket > 0 ? 'fly' : 'jump';
            }
            // 2. Double Jump (Air)
            else if (player.jumpCount < 2 && !player.isDashing) {
                player.dy = BASE_JUMP_FORCE * 0.9; // Slightly weaker second jump
                player.jumpCount++;
                playSound('jump');
                // Optional: visual effect like cloud under feet?
            }
            // 3. Wings Logic
            else if (currentPowerUps.wings > 0) {
                player.dy = BASE_JUMP_FORCE * 0.8;
                playSound('jump');
            }
        };

        const handleDash = () => {
            if (!player.isDashing && !player.grounded) { // Dash mostly useful in air
                player.isDashing = true;
                player.dashTimer = DASH_DURATION;
                player.state = 'fly'; // Temporarily reuse fly sprite for dash
                playSound('powerup'); // Reuse sound for now
            }
        };

        const handleInput = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                handleJump();
            }
            if (e.code === 'ShiftLeft' || e.code === 'KeyD') {
                e.preventDefault();
                handleDash();
            }
        };

        const handleSpaceKey = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handleJump();
            }
        };

        // Add Listeners
        // Add Listeners
        window.addEventListener('keydown', handleInput);
        // Mobile Touches governed by UI buttons now, removing global touchstart to prevent conflicts
        // canvas.addEventListener('mousedown', handleJump); // Removed global click sprint

        // Start Loop
        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('keydown', handleInput);
            // canvas.removeEventListener('mousedown', handleJump);
            cancelAnimationFrame(animationFrameId);
        };
    }, [started]);

    const comboMultiplier = comboMultiplierRef.current;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] overflow-hidden font-cairo bg-black"
        >
            {/* Landscape Prompt for Mobile */}
            <div className="landscape-prompt fixed inset-0 z-[200] bg-black flex-col items-center justify-center gap-4 p-8 text-white hidden">
                <div className="text-6xl animate-bounce">📱</div>
                <div className="text-2xl font-bold text-center">قلب الموبايل!</div>
                <div className="text-sm text-gray-400 text-center">اللعبة أحسن في الوضع الأفقي (Landscape)</div>
            </div>

            <style>{`
                @media (max-width: 768px) and (orientation: portrait) {
                    .landscape-prompt {
                        display: flex !important;
                    }
                }
            `}</style>

            <canvas ref={canvasRef} className="block w-full h-full z-0" />

            {/* HUD */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <button onClick={handleExitRequest} className="p-2 bg-black/30 backdrop-blur text-white rounded-full hover:bg-white/10 transition">
                    <X />
                </button>

                {/* Lives */}
                <div className="flex gap-1">
                    {[...Array(MAX_LIVES)].map((_, i) => (
                        <Heart
                            key={i}
                            className={`w-8 h-8 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
                        />
                    ))}
                </div>

                {/* Score */}
                <div className="bg-black/20 px-4 py-2 rounded-full border border-white/10 backdrop-blur">
                    <div className="text-white font-bold text-xl">{score}</div>
                    <div className="text-yellow-400 text-xs">🪙 {coins}</div>
                </div>

                {/* Combo */}
                {combo > 0 && (
                    <motion.div
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        className={`px-4 py-2 rounded-full font-black text-2xl ${combo >= 10 ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse' :
                            combo >= 5 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
                                combo >= 3 ? 'bg-gradient-to-r from-yellow-500 to-green-500' :
                                    'bg-blue-500'
                            }`}
                    >
                        <div className="text-white">x{combo}</div>
                        <div className="text-xs text-white/80">{comboMultiplier}x نقاط</div>
                        {combo >= 10 && <div className="text-xs text-white animate-bounce">FEVER!</div>}
                    </motion.div>
                )}
            </div>

            {/* Power-ups Display */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                {Object.entries(activePowerUps).map(([type, time]) => {
                    if (time <= 0) return null;
                    const icons = {
                        shield: <Shield className="w-5 h-5" />,
                        magnet: <Magnet className="w-5 h-5" />,
                        slowmo: <Clock className="w-5 h-5" />,
                        star: <Star className="w-5 h-5" />,
                        rocket: <Zap className="w-5 h-5" />
                    };
                    return (
                        <motion.div
                            key={type}
                            initial={{ scale: 1.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-2 bg-purple-500/90 px-3 py-2 rounded-full text-white text-sm"
                        >
                            {icons[type]}
                            <span>{Math.ceil(time / 1000)}s</span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Leaderboard Button */}
            <div className="absolute top-4 right-4 z-20" style={{ marginTop: '150px' }}>
                <button
                    onClick={() => setShowLeaderboard(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gold/20 backdrop-blur border border-gold/50 rounded-full text-white hover:bg-gold/30 transition"
                >
                    <Trophy size={18} className="text-gold" />
                    <span className="text-sm font-bold">المتصدرين</span>
                </button>
            </div>

            {/* Start Screen */}
            {
                !started && !gameOver && !gameWon && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/70 backdrop-blur-sm z-30 p-4 text-center">
                        <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-red-500 to-gold bg-clip-text text-transparent">
                            مهمة توصيل الحب ❤️
                        </h2>
                        <p className="mb-6 text-gray-300 text-lg">
                            💗 3 أرواح | 🔥 نظام Combo | ⚡ قوى خاصة
                        </p>
                        <button
                            onClick={() => setStarted(true)}
                            className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl font-bold text-2xl animate-bounce hover:scale-105 transition"
                        >
                            ابدأ اللعب 🚀
                        </button>
                    </div>
                )
            }

            {/* --- MOBILE CONTROLS --- */}
            {started && !gameOver && (
                <div className="absolute bottom-32 left-0 right-0 z-50 flex justify-between px-8" style={{ pointerEvents: 'none' }}>
                    {/* Left: Dash Button */}
                    <button
                        className="bg-blue-500/50 backdrop-blur-md rounded-full w-20 h-20 flex items-center justify-center border-4 border-white/20 active:bg-blue-600/80 active:scale-95 transition pointer-events-auto"
                        onTouchStart={(e) => { e.preventDefault(); handleDash(); }}
                        onMouseDown={(e) => { e.preventDefault(); handleDash(); }}
                    >
                        <Zap size={32} className="text-white" />
                    </button>

                    {/* Right: Jump Button */}
                    <button
                        className="bg-red-500/50 backdrop-blur-md rounded-full w-24 h-24 flex items-center justify-center border-4 border-white/20 active:bg-red-600/80 active:scale-95 transition pointer-events-auto shadow-lg shadow-red-500/30"
                        onTouchStart={(e) => { e.preventDefault(); handleJump(); }}
                        onMouseDown={(e) => { e.preventDefault(); handleJump(); }}
                    >
                        <ArrowUp size={40} className="text-white" />
                    </button>
                </div>
            )}

            {/* Game Over */}
            {
                gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80 z-30">
                        <h2 className="text-4xl font-bold mb-4 text-red-500">Game Over!</h2>
                        <div className="text-7xl font-black mb-4">{score}</div>
                        <div className="text-yellow-400 mb-6">🪙 {coins} عملات</div>
                        <div className="flex gap-3">
                            <button onClick={resetGame} className="px-6 py-3 bg-red-600 rounded-xl hover:bg-red-500 flex items-center gap-2">
                                <RotateCcw /> حاول تاني
                            </button>
                            <button onClick={() => setShowLeaderboard(true)} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 flex items-center gap-2">
                                <Trophy /> الترتيب
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Exit Confirmation */}
            <AnimatePresence>
                {showExitConfirm && (
                    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a1a2e] border border-red-500/30 rounded-3xl p-8 max-w-sm w-full text-center"
                        >
                            <h3 className="text-2xl font-bold text-white mb-4">آكيد عايز تخرج؟</h3>
                            <div className="flex gap-4">
                                <button onClick={confirmExit} className="flex-1 py-3 bg-red-600/20 text-red-400 border border-red-500/50 rounded-xl hover:bg-red-600 hover:text-white transition">
                                    أيوه
                                </button>
                                <button onClick={cancelExit} className="flex-1 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition">
                                    لا
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Leaderboard Modal */}
            <AnimatePresence>
                {showLeaderboard && (
                    <div className="fixed inset-0 z-40 bg-black/90 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a1a2e] border border-gold/30 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">🏆 أبطال الحب</h2>
                                <button onClick={() => setShowLeaderboard(false)} className="p-2 hover:bg-white/10 rounded-full">
                                    <X className="text-white" />
                                </button>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Hassanen */}
                                <div className="bg-white/5 rounded-2xl p-4">
                                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-xl">🤴</div>
                                        <h3 className="font-bold text-lg text-blue-300">حسانين</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {leaderboard.admin.length === 0 ? (
                                            <p className="text-white/30 text-center py-4">بانتظار اللعب...</p>
                                        ) : (
                                            leaderboard.admin.map((entry, idx) => (
                                                <div key={idx} className={`flex justify-between p-3 rounded-xl ${idx === 0 ? 'bg-gold/20 border border-gold/30' : 'bg-white/5'}`}>
                                                    <span className="font-mono">{entry.score} pts</span>
                                                    <span className="text-xs opacity-30">
                                                        {new Date(entry.created_at).toLocaleDateString('ar-EG', {
                                                            month: 'numeric', day: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                {/* Nada */}
                                <div className="bg-white/5 rounded-2xl p-4">
                                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
                                        <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center text-xl">👸</div>
                                        <h3 className="font-bold text-lg text-pink-300">ندى</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {leaderboard.user.length === 0 ? (
                                            <p className="text-white/30 text-center py-4">بانتظار اللعب...</p>
                                        ) : (
                                            leaderboard.user.map((entry, idx) => (
                                                <div key={idx} className={`flex justify-between p-3 rounded-xl ${idx === 0 ? 'bg-pink-500/20 border border-pink-500/30' : 'bg-white/5'}`}>
                                                    <span className="font-mono">{entry.score} pts</span>
                                                    <span className="text-xs opacity-30">
                                                        {new Date(entry.created_at).toLocaleDateString('ar-EG', {
                                                            month: 'numeric', day: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div >
    );
};

export default LoveDeliveryEnhanced;
