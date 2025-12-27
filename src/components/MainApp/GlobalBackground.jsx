import React from 'react';
import { motion } from 'framer-motion';
import { useSiteStatus } from '../../context/SiteStatusContext';

const GlobalBackground = () => {
    const { isShutdown } = useSiteStatus();

    return (
        <div className={`fixed inset-0 pointer-events-none transition-colors duration-1000 z-[-1] ${isShutdown ? 'bg-[#000000]' : 'bg-[#0A0A0A]'}`}>
            <div className={`absolute inset-0 transition-opacity duration-1000 ${isShutdown ? 'opacity-40' : 'opacity-100'}`}>
                {/* Deep Space Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#110f1e]" />

                {/* Simulated Stars */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full opacity-20 animate-pulse"
                        style={{
                            width: Math.random() * 2 + 1 + 'px',
                            height: Math.random() * 2 + 1 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animationDuration: Math.random() * 3 + 2 + 's'
                        }}
                    />
                ))}

                {/* Floating Gold Dust (Hidden on shutdown) */}
                {!isShutdown && [...Array(10)].map((_, i) => (
                    <motion.div
                        key={`dust-${i}`}
                        className="absolute bg-gold rounded-full blur-[1px]"
                        style={{
                            width: Math.random() * 3 + 'px',
                            height: Math.random() * 3 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                        }}
                        animate={{
                            y: [-20, -100],
                            opacity: [0, 0.4, 0],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default GlobalBackground;
