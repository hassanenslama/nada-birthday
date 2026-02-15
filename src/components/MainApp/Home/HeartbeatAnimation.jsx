import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetPath } from '../../../utils/assets';

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
                {/* Main Pulsing Heart - Now using Love-santa image */}
                <motion.img
                    src={getAssetPath("/images/Love-santa.gif")}
                    alt="Heart"
                    className="w-[200px] h-[200px] object-contain filter drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]"
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
