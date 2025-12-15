import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EffectsController = ({ effect, onComplete }) => {
    const [confetti, setConfetti] = useState([]);
    const [explosionParticles, setExplosionParticles] = useState([]);
    const [successParticles, setSuccessParticles] = useState([]);

    useEffect(() => {
        if (effect === 'correct') {
            const confettiParticles = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                x: Math.random() * window.innerWidth,
                y: -100,
                color: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F9F871'][Math.floor(Math.random() * 6)],
                delay: Math.random() * 0.3,
                rotation: Math.random() * 360,
                size: Math.random() * 8 + 6
            }));
            setConfetti(confettiParticles);

            const stars = Array.from({ length: 20 }, (_, i) => ({
                id: i,
                angle: (Math.PI * 2 * i) / 20,
                distance: 200 + Math.random() * 100,
                size: Math.random() * 15 + 10
            }));
            setSuccessParticles(stars);

            const timer = setTimeout(() => {
                setConfetti([]);
                setSuccessParticles([]);
                if (onComplete) onComplete();
            }, 3500);

            return () => clearTimeout(timer);
        } else if (effect === 'wrong') {
            const particles = Array.from({ length: 60 }, (_, i) => ({
                id: i,
                angle: (Math.PI * 2 * i) / 60,
                distance: Math.random() * 250 + 150,
                size: Math.random() * 10 + 5,
                color: ['#FF6B6B', '#FF4E4E', '#DC2626', '#991B1B'][Math.floor(Math.random() * 4)]
            }));
            setExplosionParticles(particles);

            const timer = setTimeout(() => {
                setExplosionParticles([]);
                if (onComplete) onComplete();
            }, 1200);

            return () => clearTimeout(timer);
        } else if (effect === 'skip') {
            const timer = setTimeout(() => {
                if (onComplete) onComplete();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [effect, onComplete]);

    if (effect === 'correct') {
        return (
            <div className="fixed inset-0 pointer-events-none z-50" style={{ perspective: '1200px' }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.15, 0] }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-300 to-green-500"
                />

                {confetti.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{
                            x: particle.x,
                            y: particle.y,
                            opacity: 1,
                            rotate: 0,
                            scale: 1
                        }}
                        animate={{
                            y: window.innerHeight + 150,
                            opacity: [1, 1, 0.7, 0],
                            rotate: particle.rotation + 720,
                            scale: [1, 1.2, 1, 0.8]
                        }}
                        transition={{
                            duration: 3,
                            delay: particle.delay,
                            ease: [0.25, 0.1, 0.25, 1]
                        }}
                        style={{
                            position: 'absolute',
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                            boxShadow: `0 0 10px ${particle.color}`
                        }}
                    />
                ))}

                {successParticles.map((star) => (
                    <motion.div
                        key={star.id}
                        initial={{
                            x: window.innerWidth / 2,
                            y: window.innerHeight / 2,
                            scale: 0,
                            opacity: 1
                        }}
                        animate={{
                            x: window.innerWidth / 2 + Math.cos(star.angle) * star.distance,
                            y: window.innerHeight / 2 + Math.sin(star.angle) * star.distance,
                            scale: [0, 1.5, 0],
                            opacity: [1, 1, 0]
                        }}
                        transition={{
                            duration: 1.5,
                            ease: "easeOut"
                        }}
                        className="absolute text-yellow-300"
                        style={{
                            fontSize: star.size,
                            filter: 'drop-shadow(0 0 8px rgba(253, 224, 71, 0.8))'
                        }}
                    >
                        ⭐
                    </motion.div>
                ))}

                <motion.div
                    initial={{ scale: 0, rotateY: -180, opacity: 0, y: 0 }}
                    animate={{
                        scale: [0, 1.3, 1],
                        rotateY: [0, 360, 720],
                        opacity: 1,
                        y: [0, -20, 0]
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                        scale: { duration: 0.8, times: [0, 0.6, 1], ease: "backOut" },
                        rotateY: { duration: 2.5, ease: "easeOut" },
                        y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="absolute top-1/2 left-1/2"
                    style={{
                        transform: 'translate(-50%, -50%)',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    <div
                        className="text-[200px] md:text-[280px] font-black leading-none"
                        style={{
                            background: 'linear-gradient(145deg, #34D399 0%, #10B981 40%, #059669 80%, #047857 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 15px 40px rgba(16, 185, 129, 0.8)) drop-shadow(0 0 80px rgba(16, 185, 129, 0.6))',
                            textShadow: `
                                8px 8px 0 rgba(5, 150, 105, 0.4),
                                16px 16px 0 rgba(5, 150, 105, 0.3),
                                24px 24px 0 rgba(5, 150, 105, 0.2),
                                32px 32px 40px rgba(0, 0, 0, 0.4)
                            `,
                            transform: 'rotateX(15deg)',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        ✓
                    </div>
                </motion.div>
            </div>
        );
    }

    if (effect === 'wrong') {
        return (
            <div className="fixed inset-0 pointer-events-none z-50" style={{ perspective: '1200px' }}>
                <motion.div
                    animate={{
                        x: [0, -15, 15, -12, 12, -8, 8, 0],
                        y: [0, -8, 8, -6, 6, 0],
                        rotate: [0, -2, 2, -1, 1, 0]
                    }}
                    transition={{
                        duration: 0.6,
                        ease: "easeInOut"
                    }}
                    className="w-full h-full"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.4, 0] }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-red-700"
                    />

                    {explosionParticles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            initial={{
                                x: window.innerWidth / 2,
                                y: window.innerHeight / 2,
                                scale: 1,
                                opacity: 1
                            }}
                            animate={{
                                x: window.innerWidth / 2 + Math.cos(particle.angle) * particle.distance,
                                y: window.innerHeight / 2 + Math.sin(particle.angle) * particle.distance,
                                scale: [1, 1.5, 0],
                                opacity: [1, 0.8, 0]
                            }}
                            transition={{
                                duration: 0.9,
                                ease: [0.34, 1.56, 0.64, 1]
                            }}
                            style={{
                                position: 'absolute',
                                width: particle.size,
                                height: particle.size,
                                backgroundColor: particle.color,
                                borderRadius: '50%',
                                boxShadow: `0 0 25px ${particle.color}, 0 0 50px ${particle.color}`
                            }}
                        />
                    ))}

                    <motion.div
                        initial={{ scale: 0, rotateX: -120, rotateZ: -45, opacity: 0 }}
                        animate={{
                            scale: [0, 1.4, 1.1],
                            rotateX: [90, 0],
                            rotateZ: [0, 360, 720],
                            opacity: 1
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                            scale: { duration: 0.7, times: [0, 0.6, 1], ease: "backOut" },
                            rotateX: { duration: 0.6 },
                            rotateZ: { duration: 1.2 }
                        }}
                        className="absolute top-1/2 left-1/2"
                        style={{
                            transform: 'translate(-50%, -50%)',
                            transformStyle: 'preserve-3d',
                        }}
                    >
                        <motion.div
                            animate={{
                                rotateY: [0, 15, -15, 15, 0],
                                scale: [1, 1.08, 1, 1.08, 1]
                            }}
                            transition={{
                                duration: 0.6,
                                times: [0, 0.25, 0.5, 0.75, 1],
                                repeat: 2
                            }}
                        >
                            <div
                                className="text-[200px] md:text-[280px] font-black leading-none"
                                style={{
                                    background: 'linear-gradient(145deg, #FF4E4E 0%, #DC2626 40%, #991B1B 80%, #7F1D1D 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 15px 40px rgba(220, 38, 38, 0.9)) drop-shadow(0 0 80px rgba(220, 38, 38, 0.7))',
                                    textShadow: `
                                        8px 8px 0 rgba(153, 27, 27, 0.5),
                                        16px 16px 0 rgba(153, 27, 27, 0.4),
                                        24px 24px 0 rgba(153, 27, 27, 0.3),
                                        32px 32px 40px rgba(0, 0, 0, 0.5)
                                    `,
                                    transform: 'rotateX(15deg)',
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                ✕
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    if (effect === 'skip') {
        return (
            <div className="fixed inset-0 pointer-events-none z-50" style={{ perspective: '1200px' }}>
                <motion.div
                    initial={{
                        x: window.innerWidth / 2 - 150,
                        y: window.innerHeight / 2 - 100,
                        opacity: 0,
                        rotateY: -60,
                        scale: 0.5
                    }}
                    animate={{
                        x: window.innerWidth + 250,
                        y: window.innerHeight / 2 - 100,
                        opacity: [0, 1, 1, 0.5, 0],
                        rotateY: [0, 20, 0, -20, 0],
                        scale: [0.8, 1.3, 1.3, 1, 0.6]
                    }}
                    transition={{
                        duration: 0.9,
                        times: [0, 0.15, 0.7, 0.9, 1],
                        ease: [0.34, 1.56, 0.64, 1]
                    }}
                    style={{
                        position: 'absolute',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    <div
                        className="text-[150px] md:text-[200px]"
                        style={{
                            background: 'linear-gradient(145deg, #60A5FA 0%, #3B82F6 40%, #2563EB 80%, #1D4ED8 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 12px 30px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 60px rgba(59, 130, 246, 0.6))',
                            textShadow: `
                                6px 6px 0 rgba(37, 99, 235, 0.4),
                                12px 12px 0 rgba(37, 99, 235, 0.3),
                                18px 18px 0 rgba(37, 99, 235, 0.2),
                                24px 24px 30px rgba(0, 0, 0, 0.4)
                            `,
                            transform: 'rotateX(8deg) rotateY(-20deg)',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        ⏭️
                    </div>
                </motion.div>

                {Array.from({ length: 15 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: window.innerWidth / 2 + i * 45,
                            y: window.innerHeight / 2 + (Math.random() - 0.5) * 120,
                            opacity: 0,
                            scale: 0
                        }}
                        animate={{
                            x: window.innerWidth + 300,
                            y: window.innerHeight / 2 + (Math.random() - 0.5) * 180,
                            opacity: [0, 0.8, 0],
                            scale: [0, 1.2, 0]
                        }}
                        transition={{
                            duration: 0.7,
                            delay: i * 0.04,
                            ease: "easeOut"
                        }}
                        className="absolute w-5 h-5 bg-blue-400 rounded-full"
                        style={{
                            boxShadow: '0 0 25px rgba(59, 130, 246, 0.9), 0 0 50px rgba(59, 130, 246, 0.5)',
                            filter: 'blur(1px)'
                        }}
                    />
                ))}

                {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                        key={`line-${i}`}
                        initial={{
                            x: window.innerWidth / 2,
                            y: window.innerHeight / 2 + (i - 4) * 40,
                            opacity: 0,
                            scaleX: 0
                        }}
                        animate={{
                            x: window.innerWidth + 200,
                            opacity: [0, 0.6, 0],
                            scaleX: [0, 1, 0]
                        }}
                        transition={{
                            duration: 0.5,
                            delay: i * 0.03,
                            ease: "easeOut"
                        }}
                        className="absolute h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                        style={{
                            width: 80 + i * 15,
                            filter: 'blur(2px)'
                        }}
                    />
                ))}
            </div>
        );
    }

    return null;
};

export default EffectsController;
