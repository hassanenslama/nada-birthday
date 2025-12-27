import React, { useEffect, useRef } from 'react';
import { useSiteStatus } from '../../context/SiteStatusContext';

const Snowfall = () => {
    const frontCanvasRef = useRef(null);
    const backCanvasRef = useRef(null);
    const { isShutdown } = useSiteStatus();

    useEffect(() => {
        const frontCanvas = frontCanvasRef.current;
        const backCanvas = backCanvasRef.current;
        if (!frontCanvas || !backCanvas) return;

        const ctxFront = frontCanvas.getContext('2d');
        const ctxBack = backCanvas.getContext('2d');

        let animationFrameId;
        let particles = [];

        // Configuration - Aggressively Reduced for Mobile Performance
        const isMobile = window.innerWidth < 768;
        // Reduced by another 50% as requested (Mobile: 10, Desktop: 22)
        const particleCount = isShutdown ? (isMobile ? 5 : 10) : (isMobile ? 10 : 22);

        const resizeCanvas = () => {
            frontCanvas.width = window.innerWidth;
            frontCanvas.height = window.innerHeight;
            backCanvas.width = window.innerWidth;
            backCanvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Particle {
            constructor() {
                this.reset(true);
            }

            reset(initial = false) {
                // 1. Determine Type
                // User Request: Increase balls by 30%, Decrease flakes by 20%
                // New Ratio: ~30% Balls (was 20%), ~70% Flakes (was 80%)
                this.type = Math.random() > 0.7 ? 'ball' : 'flake';

                // 2. Determine Layer based on Rules
                if (this.type === 'ball') {
                    // User Request: "Ball snowballs fall entirely in front of the text"
                    this.layer = 'front';
                } else {
                    // User Request: "Snow shapes (flakes) are half and half"
                    this.layer = Math.random() < 0.5 ? 'front' : 'back';
                }

                // 3. Position & Physics
                const targetCanvas = this.layer === 'front' ? frontCanvas : backCanvas;
                this.x = Math.random() * targetCanvas.width;
                this.y = initial ? Math.random() * targetCanvas.height : -50;

                if (this.type === 'ball') {
                    this.size = Math.random() * 3 + 2; // Smaller snowballs
                    this.speedY = Math.random() * 2 + 1.5;
                    this.opacity = Math.random() * 0.4 + 0.2;
                } else {
                    this.size = Math.random() * 8 + 5; // 50% smaller flakes (was 15+10)
                    // Faster speed as requested
                    this.speedY = Math.random() * 2.5 + 1.5;
                    // Opacity max 0.8
                    this.opacity = Math.random() * 0.4 + 0.4;
                }

                this.speedX = Math.random() * 0.5 - 0.25;
                this.rotation = Math.random() * Math.PI * 2;
                this.spinSpeed = Math.random() * 0.02 - 0.01;
            }

            update() {
                this.y += this.speedY;
                this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5;
                this.rotation += this.spinSpeed;

                const targetHeight = (this.layer === 'front' ? frontCanvas.height : backCanvas.height);
                const targetWidth = (this.layer === 'front' ? frontCanvas.width : backCanvas.width);

                if (this.y > targetHeight + 50) {
                    this.reset();
                }

                if (this.x > targetWidth + 50) this.x = -50;
                if (this.x < -50) this.x = targetWidth + 50;
            }

            draw() {
                // Select Context based on layer
                const ctx = this.layer === 'front' ? ctxFront : ctxBack;

                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.globalAlpha = this.opacity;

                if (this.type === 'ball') {
                    // Draw Snowball
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = 'white';
                    ctx.shadowBlur = isMobile ? 0 : 10; // Disable shadow on mobile for performance
                    ctx.shadowColor = 'white';
                    ctx.fill();
                } else {
                    // Draw Snowflake
                    ctx.rotate(this.rotation);
                    ctx.strokeStyle = '#00BFFF';
                    ctx.lineWidth = 2; // Thicker for glow
                    ctx.lineCap = 'round';
                    // Intense Glow Effect - Disabled on mobile
                    ctx.shadowBlur = isMobile ? 0 : 15;
                    ctx.shadowColor = '#00eaff'; // Brighter cyan

                    for (let i = 0; i < 6; i++) {
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(0, this.size);
                        ctx.moveTo(0, this.size * 0.6);
                        ctx.lineTo(this.size * 0.3, this.size * 0.8);
                        ctx.moveTo(0, this.size * 0.6);
                        ctx.lineTo(-this.size * 0.3, this.size * 0.8);
                        ctx.stroke();
                        ctx.rotate(Math.PI / 3);
                    }
                }

                ctx.restore();
            }
        }

        // Initialize particles
        const init = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        init();

        const animate = () => {
            // Clear BOTH canvases
            ctxFront.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
            ctxBack.clearRect(0, 0, backCanvas.width, backCanvas.height);

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isShutdown]);

    return (
        <>
            {/* Background Canvas (Behind Content) */}
            <canvas
                ref={backCanvasRef}
                className="fixed inset-0 pointer-events-none z-[1]"
                style={{ mixBlendMode: 'screen' }}
            />

            {/* Foreground Canvas (Front of Content) */}
            <canvas
                ref={frontCanvasRef}
                className="fixed inset-0 pointer-events-none z-[60]"
                style={{ mixBlendMode: 'screen' }}
            />
        </>
    );
};

export default Snowfall;
