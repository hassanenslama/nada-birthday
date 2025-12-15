import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import LoveCounter from './LoveCounter';
import HeartbeatAnimation from './HeartbeatAnimation';

// Default start date (User can change this)
const START_DATE = '2024-11-30T20:30:00';

const HomePage = () => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#0A0A0A] text-white">
            {/* 1. Animated Background Canvas (Stars/Particles) */}
            <BackgroundEffect />

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center pt-16 px-4 pb-32">

                {/* 2. Hero Section - Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="text-center mb-12 relative"
                >
                    {/* Glowing Aura behind text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold/10 blur-[80px] rounded-full pointer-events-none" />

                    <h1 className="relative text-5xl md:text-8xl font-signature text-transparent bg-clip-text bg-gradient-to-b from-gold via-yellow-200 to-yellow-600 mb-4 drop-shadow-[0_2px_10px_rgba(255,215,0,0.3)]">
                        منورة يا ندى
                    </h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 1 }}
                        className="text-xl md:text-2xl text-gray-300 font-cairo font-light tracking-wide"
                    >
                        كل سنة وأنتي طيبة يا أحلى حاجة في حياتي ❤️
                    </motion.p>
                </motion.div>

                {/* 3. The Heart Centerpiece */}
                <motion.div style={{ y: y2 }} className="mb-8">
                    <HeartbeatAnimation />
                </motion.div>

                {/* 4. Counter Section Title */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mb-10"
                >
                    <p className="text-gold/60 font-cairo text-sm uppercase tracking-[0.2em] mb-3">Together For</p>
                    <h2 className="text-3xl font-bold font-cairo text-white">بقالنا مع بعض</h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-4 rounded-full" />
                </motion.div>

                {/* 5. Love Counter */}
                <LoveCounter startDate={START_DATE} />

                {/* 6. Inspirational Quote Card */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    whileHover={{ scale: 1.02, rotateX: 5 }}
                    className="mt-20 relative group perspective"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 max-w-2xl text-center shadow-2xl overflow-hidden">
                        {/* Quote Icon */}
                        <div className="absolute top-4 right-8 text-gold/20 text-8xl font-serif">"</div>

                        <p className="text-xl md:text-2xl text-white/90 font-cairo leading-loose font-medium">
                            والسيف في الغمد لا أخشى مضاربه<br />
                            <span className="text-gold">وسيف عيني "ندى" في الحالتين بتار ❤️</span>
                        </p>

                        {/* Decorative sparkles */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// Background Effect Component (Stars/Particles)
const BackgroundEffect = () => {
    return (
        <div className="fixed inset-0 pointer-events-none">
            {/* Deep Space Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#110f1e]" />

            {/* Animated Stars */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-white rounded-full"
                    style={{
                        width: Math.random() * 2 + 1 + 'px',
                        height: Math.random() * 2 + 1 + 'px',
                        top: Math.random() * 100 + '%',
                        left: Math.random() * 100 + '%',
                        opacity: Math.random() * 0.5 + 0.1,
                    }}
                    animate={{
                        opacity: [0.2, 0.8, 0.2],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: Math.random() * 3 + 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: Math.random() * 2
                    }}
                />
            ))}

            {/* Floating Gold Dust */}
            {[...Array(10)].map((_, i) => (
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
    );
};

export default HomePage;
