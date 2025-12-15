import React from 'react';
import { motion } from 'framer-motion';

const HeartbeatAnimation = () => {
    return (
        <div className="relative flex justify-center items-center my-12" style={{ height: '300px' }}>
            {/* Background Glows */}
            <motion.div
                className="absolute  rounded-full blur-[100px]"
                style={{ width: '300px', height: '300px', backgroundColor: 'rgba(220, 38, 38, 0.15)' }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <div className="relative z-10">
                {/* Main Pulsing Heart */}
                <svg width="200" height="200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                    <motion.path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill="url(#heartGradient)"
                        animate={{
                            scale: [1, 1.1, 1, 1.05, 1], // The "Lub-Dub" heartbeat pattern
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            times: [0, 0.15, 0.3, 0.45, 1], // Timing to simulate real beat
                            ease: "easeInOut"
                        }}
                    />
                    <defs>
                        <linearGradient id="heartGradient" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#ff0000" />
                            <stop offset="1" stopColor="#990000" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Inner Glow Lines/Details */}
                <motion.svg
                    width="200"
                    height="200"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="absolute top-0 left-0 mix-blend-overlay opacity-50"
                >
                    <path d="M7 5C5 5 3.5 6.5 3.5 8.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
                </motion.svg>
            </div>

            {/* Floating Particles Heart Emission */}
            {[...Array(6)].map((_, i) => (
                <Particle key={i} index={i} />
            ))}
        </div>
    );
};

const Particle = ({ index }) => {
    const randomX = Math.random() * 200 - 100;
    const randomDelay = Math.random() * 2;

    return (
        <motion.div
            className="absolute text-red-500 text-opacity-80"
            initial={{ opacity: 0, scale: 0, y: 0, x: 0 }}
            animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
                y: -150,
                x: randomX
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                delay: randomDelay,
                ease: "easeOut"
            }}
        >
            {index % 2 === 0 ? '❤️' : '✨'}
        </motion.div>
    );
};

export default HeartbeatAnimation;
