/**
 * AssetManager - يدير تحميل كل أصول اللعبة (152 صورة)
 */

class AssetManager {
    constructor() {
        this.assets = {};
        this.loaded = 0;
        this.total = 0;
        this.onProgress = null;
        this.onComplete = null;
    }

    /**
     * تحميل صورة واحدة
     */
    loadImage(name, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                this.assets[name] = img;
                this.loaded++;
                console.log(`✅ Loaded (${this.loaded}/${this.total}): ${name}`);
                if (this.onProgress) {
                    this.onProgress(this.loaded, this.total);
                }
                resolve(img);
            };

            img.onerror = (error) => {
                console.error(`❌ Failed to load: ${name}`);
                console.error(`   Path: ${path}`);
                console.error(`   Error:`, error);
                // Don't reject - continue loading other assets
                this.loaded++;
                if (this.onProgress) {
                    this.onProgress(this.loaded, this.total);
                }
                resolve(null); // Resolve with null instead of reject
            };

            console.log(`📥 Loading: ${name} from ${path}`);
            img.src = path;
        });
    }

    /**
     * تحميل كل الأصول
     */
    async loadAll() {
        const basePath = '/images/game-santa';

        const assets = {
            // === CHARACTERS ===
            // Mr. Santa (Dr-santa)
            'mr-santa-idle': `${basePath}/Dr-santa/Idle.png`,
            'mr-santa-running': `${basePath}/Dr-santa/Running.png`,
            'mr-santa-jumping': `${basePath}/Dr-santa/Jumping.png`,
            'mr-santa-flying': `${basePath}/Dr-santa/Flying.png`,
            'mr-santa-gliding': `${basePath}/Dr-santa/Gliding.png`,
            'mr-santa-hit': `${basePath}/Dr-santa/HitDamage.png`,
            'mr-santa-celebrating': `${basePath}/Dr-santa/Celebrating.png`,

            // Mrs. Santa
            'mrs-santa-idle': `${basePath}/Mrs. Santa/Idle.png`,
            'mrs-santa-running': `${basePath}/Mrs. Santa/Running.png`,
            'mrs-santa-jumping': `${basePath}/Mrs. Santa/Jumping.png`,
            'mrs-santa-flying': `${basePath}/Mrs. Santa/Flying.png`,
            'mrs-santa-gliding': `${basePath}/Mrs. Santa/Gliding.png`,
            'mrs-santa-hit': `${basePath}/Mrs. Santa/HitDamage.png`,
            'mrs-santa-celebrating': `${basePath}/Mrs. Santa/Celebrating.png`,

            // === PLATFORMS ===
            'platform-wooden': `${basePath}/Platforms/Wooden.png`,
            'platform-cloud': `${basePath}/Platforms/Cloud.png`,
            'platform-ice': `${basePath}/Platforms/Ice.png`,
            'platform-spring': `${basePath}/Platforms/Spring.png`,

            // === OBSTACLES ===
            'obstacle-chimney': `${basePath}/Platforms/Chimney.png`,
            'obstacle-icicle': `${basePath}/Platforms/Icicle.png`,
            'obstacle-spike': `${basePath}/Platforms/Spike.png`,
            'obstacle-flame': `${basePath}/Platforms/Flame.png`,
            'obstacle-electric': `${basePath}/Platforms/Electric-Fence.png`,

            // === COLLECTIBLES ===
            'collectible-coin': `${basePath}/SpinningCoin.png`,
            'collectible-heart': `${basePath}/Pulsing-Heart.png`,
            'collectible-star': `${basePath}/Platforms/Star.png`,
            'collectible-checkpoint': `${basePath}/Platforms/Checkpoint-Flag.png`,
            'collectible-finish': `${basePath}/Platforms/Finish-Line.png`,

            // === POWER-UPS ===
            'powerup-shield': `${basePath}/Glowing-Shield.png`,
            'powerup-magnet': `${basePath}/Floating-Magnet.png`,
            'powerup-wings': `${basePath}/Flapping-Wings-Item.png`,
            'powerup-speed': `${basePath}/Pulsing-Speed-Bolt.png`,
            'powerup-clock': `${basePath}/Additional-Power-ups/Clock-(Slow Motion).png`,
            'powerup-boot': `${basePath}/Additional-Power-ups/Triple-Jump-Boot.png`,
            'powerup-multiplier': `${basePath}/Additional-Power-ups/Coin-Multiplier.png`,

            // === BACKGROUNDS - WORLD 1: VILLAGE ===
            'bg-village-sky': `${basePath}/Priority/Village-Sky.png`,
            'bg-village-mountains': `${basePath}/Priority/Village-Mountain.png`,
            'bg-village-houses': `${basePath}/Priority/Village-Houes.png`,
            'bg-village-trees': `${basePath}/Priority/Village-Trees.png`,
            'bg-village-snow': `${basePath}/Priority/Village-Snow-Foreground.png`,

            // === BACKGROUNDS - WORLD 2: NORTH POLE ===
            'bg-pole-sky': `${basePath}/Priority/Pole-Night-Sky.png`,
            'bg-pole-aurora': `${basePath}/Priority/Aurora-Borealis.png`,
            'bg-pole-mountains': `${basePath}/Priority/Pole-Ice-Mountains.png`,
            'bg-pole-ground': `${basePath}/Priority/Pole-Ice-Ground.png`,
            'bg-pole-blizzard': `${basePath}/Priority/Pole-Blizzard.png`,

            // === BACKGROUNDS - WORLD 3: SKY ROUTE ===
            'bg-sky-stars': `${basePath}/Priority/Sky-Stars-Background.png`,
            'bg-sky-moon': `${basePath}/Priority/Large-Moon.png`,
            'bg-sky-clouds-far': `${basePath}/Priority/Far-Clouds.png`,
            'bg-sky-clouds-near': `${basePath}/Priority/Near-Clouds.png`,
            'bg-sky-birds': `${basePath}/Priority/Flying-Birds.png`,

            // === BACKGROUNDS - WORLD 4: CASTLE ===
            'bg-castle-storm': `${basePath}/Priority/Storm-Sky.png`,
            'bg-castle-lightning-1': `${basePath}/Priority/Lightning-Flashes-frame1.png`,
            'bg-castle-lightning-2': `${basePath}/Priority/Lightning-Flashes-frame2.png`,
            'bg-castle-lightning-3': `${basePath}/Priority/Lightning-Flashes-frame3.png`,
            'bg-castle-distant': `${basePath}/Priority/Castle-Distant.png`,
            'bg-castle-walls': `${basePath}/Priority/Castle-Walls.png`,
            'bg-castle-chains': `${basePath}/Priority/Hanging-Chains.png`,

            // === BOSSES ===
            'boss-snowman-idle': `${basePath}/Boss/Snowman-Boss-Idle.png`,
            'boss-snowman-attack': `${basePath}/Boss/Snowman-Boss-Throwing-Attack.png`,
            'boss-dragon-idle': `${basePath}/Boss/Ice-Dragon-Boss-Idle-Flying.png`,
            'boss-dragon-breath': `${basePath}/Boss/Ice-Dragon-Boss-Ice-Breath-Attack.png`,

            // === PARTICLES ===
            'particle-star': `${basePath}/Particles/Star-Particle.png`,
            'particle-heart': `${basePath}/Particles/Heart-Particle.png`,
            'particle-snowflake': `${basePath}/Particles/Snowflake-Particle.png`,
            'particle-spark': `${basePath}/Particles/Spark-Particle.png`,
            'particle-smoke': `${basePath}/Particles/Smoke-Particle.png`,

            // === UI ELEMENTS ===
            'ui-play': `${basePath}/UI-Elements/Play-Button.png`,
            'ui-pause': `${basePath}/UI-Elements/Pause-Button.png`,
            'ui-star-empty': `${basePath}/UI-Elements/Star-Empty.png`,
            'ui-star-filled': `${basePath}/UI-Elements/Star-Filled.png`,
            'ui-level-locked': `${basePath}/UI-Elements/Level-Locked-Icon.png`,
            'ui-level-unlocked': `${basePath}/UI-Elements/Level-Unlocked-Icon.png`,
            'ui-settings': `${basePath}/Decorative-Elements/Settings-Gear-Icon.png`,
            'ui-sound-on': `${basePath}/Decorative-Elements/Version1-Sound ON.png`,
            'ui-sound-off': `${basePath}/Decorative-Elements/Version2-Sound ON.png`,
            'ui-home': `${basePath}/Decorative-Elements/Home-Button-Icon.png`,

            // === WORLD ICONS ===
            'icon-world-village': `${basePath}/World-Selection-Icons/Village-World-Icon.png`,
            'icon-world-pole': `${basePath}/World-Selection-Icons/North-Pole-World-Icon.png`,
            'icon-world-sky': `${basePath}/World-Selection-Icons/Sky-Route-World-Icon.png`,
            'icon-world-castle': `${basePath}/World-Selection-Icons/Castle-World-Icon.png`,

            // === DECORATIONS ===
            'deco-lights': `${basePath}/Decorative-Elements/Christmas-Lights-String.png`,
            'deco-gifts': `${basePath}/Decorative-Elements/Gift-Box-Stack.png`,
            'deco-snow-pile': `${basePath}/Decorative-Elements/Snow-Pile-Ground.png`,
        };

        this.total = Object.keys(assets).length;
        console.log(`🎮 Starting to load ${this.total} assets...`);

        const promises = Object.entries(assets).map(([name, path]) =>
            this.loadImage(name, path)
        );

        try {
            const results = await Promise.allSettled(promises);

            const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
            const failed = this.total - successful;

            console.log(`\n📊 Loading Summary:`);
            console.log(`   ✅ Successful: ${successful}`);
            console.log(`   ❌ Failed: ${failed}`);
            console.log(`   📈 Total: ${this.total}`);

            if (this.onComplete) {
                this.onComplete();
            }

            return this.assets;
        } catch (error) {
            console.error('❌ Critical error loading assets:', error);
            throw error;
        }
    }

    /**
     * الحصول على صورة
     */
    get(name) {
        if (!this.assets[name]) {
            console.warn(`Asset "${name}" not found!`);
            return null;
        }
        return this.assets[name];
    }

    /**
     * نسبة التحميل
     */
    getProgress() {
        return this.total > 0 ? (this.loaded / this.total) * 100 : 0;
    }
}

export default AssetManager;
