import React from 'react';
import { useAuth } from '../../../../context/AuthContext';

const MainMenu = ({ onPlay, onLevels, onSettings, onStore }) => {
    const { user } = useAuth();
    const displayName = user?.user_metadata?.first_name || 'Adventurer';

    return (
        <div className="fixed inset-0 z-[9999] bg-[#1a0b2e] flex flex-col items-center justify-center overflow-hidden">
            {/* Background Image (Parallax Placeholder) */}
            <div className="absolute inset-0 opacity-40">
                <img
                    src="/images/game-santa/Backgrounds/Village/Sky.png"
                    alt="Background"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
                <div className="text-right w-full max-w-4xl pr-8 mb-4">
                    <p className="text-white/60 text-sm">Playing as</p>
                    <p className="text-white font-bold text-xl">{displayName}</p>
                </div>

                {/* Title */}
                <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] mb-2">
                    Christmas Adventure
                </h1>
                <p className="text-xl text-yellow-100/80 tracking-[0.5em] mb-12 uppercase font-light">
                    The Ultimate Holiday Journey
                </p>

                {/* Main Action Area */}
                <div className="flex items-center gap-8 md:gap-16">
                    {/* Store Button */}
                    <button
                        onClick={onStore}
                        className="group flex flex-col items-center gap-2 transform transition-all hover:scale-110"
                    >
                        <div className="w-24 h-24 bg-purple-900/50 rounded-2xl border-2 border-purple-400/30 flex items-center justify-center backdrop-blur-sm group-hover:bg-purple-800/60 group-hover:border-purple-400">
                            <span className="text-4xl">🛒</span>
                        </div>
                        <span className="text-white font-bold text-lg group-hover:text-purple-300">المتجر</span>
                        <span className="text-white/40 text-xs">شراء أزياء وقدرات جديدة</span>
                    </button>

                    {/* Play Button (Hero) */}
                    <button
                        onClick={onPlay}
                        className="group relative transform transition-all hover:scale-105 active:scale-95"
                    >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-red-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>

                        <div className="relative w-64 h-40 bg-gradient-to-b from-red-500 to-red-700 rounded-3xl border-4 border-yellow-400 shadow-[0_10px_0_rgb(120,20,20)] flex flex-col items-center justify-center overflow-hidden">
                            {/* Play Icon */}
                            <img
                                src="/images/game-santa/UI-Elements/Play-Button.png"
                                className="w-56 h-auto drop-shadow-lg"
                                alt="Play"
                            />
                        </div>
                    </button>

                    {/* Levels/Map Button */}
                    <button
                        onClick={onLevels} // Go to World Select explicitly
                        className="group flex flex-col items-center gap-2 transform transition-all hover:scale-110"
                    >
                        <div className="w-24 h-24 bg-blue-900/50 rounded-2xl border-2 border-blue-400/30 flex items-center justify-center backdrop-blur-sm group-hover:bg-blue-800/60 group-hover:border-blue-400">
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">Lvl 1</div>
                            <span className="text-4xl">🗺️</span>
                        </div>
                        <span className="text-white font-bold text-lg group-hover:text-blue-300">المراحل</span>
                        <span className="text-white/40 text-xs">اختر مغامرتك التالية</span>
                    </button>
                </div>
            </div>

            {/* Footer Settings - Raised to avoid overlap */}
            <div className="absolute bottom-32 flex gap-4">
                <button onClick={onSettings} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <img src="/images/game-santa/Decorative-Elements/Settings-Gear-Icon.png" className="w-8 h-8 opacity-80" alt="Settings" />
                </button>
                <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <img src="/images/game-santa/Decorative-Elements/Version1-Sound%20ON.png" className="w-8 h-8 opacity-80" alt="Sound" />
                </button>
            </div>
        </div>
    );
};

export default MainMenu;
