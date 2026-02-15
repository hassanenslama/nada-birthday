import React from 'react';
import { useAuth } from '../../../../context/AuthContext';

const MainMenu = ({ onPlay, onLevels, onSettings, onStore, onExit, onFullscreen }) => {
    const { user } = useAuth();
    const displayName = user?.user_metadata?.first_name || 'Adventurer';

    return (
        <div className="fixed inset-0 z-[9999] bg-[#1a0b2e] flex flex-col items-center justify-between overflow-hidden p-4">
            {/* Background Image */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
                <img
                    src={`${import.meta.env.BASE_URL}images/game-santa/Backgrounds/Village/Sky.png`}
                    alt="Background"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Header Section: Title & User Info */}
            <div className="relative z-10 w-full flex justify-between items-start mt-2">
                {/* Space filler for balance */}
                <div className="w-20"></div>

                {/* Title - Compact for Mobile Landscape */}
                <div className="text-center -mt-1 lg:-mt-2">
                    <h1 className="text-4xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        Christmas Adventure
                    </h1>
                    <p className="text-[0.65rem] lg:text-xl text-yellow-100/80 tracking-[0.3em] uppercase font-light">
                        The Ultimate Holiday Journey
                    </p>
                </div>

                {/* User Info - Top Right */}
                <div className="text-right w-20">
                    <p className="text-white/60 text-[9px] lg:text-sm">Playing as</p>
                    <p className="text-white font-bold text-xs lg:text-xl truncate">{displayName}</p>
                </div>
            </div>

            {/* Main Action Area - Centered & Flexible */}
            <div className="relative z-10 flex items-end gap-5 lg:gap-16 mb-4 lg:mb-0">
                {/* Store Button */}
                <button
                    onClick={onStore}
                    className="group flex flex-col items-center gap-1 transform transition-all hover:scale-105 active:scale-95"
                >
                    <div className="w-14 h-14 lg:w-24 lg:h-24 bg-purple-900/50 rounded-xl lg:rounded-2xl border-2 border-purple-400/30 flex items-center justify-center backdrop-blur-sm group-hover:bg-purple-800/60 group-hover:border-purple-400 transition-colors">
                        <span className="text-2xl lg:text-4xl">🛒</span>
                    </div>
                    <span className="text-white font-bold text-[11px] lg:text-lg opacity-80 group-hover:opacity-100">المتجر</span>
                </button>

                {/* Play Button (Hero) */}
                <button
                    onClick={onPlay}
                    className="group relative transform transition-all hover:scale-105 active:scale-95"
                >
                    <div className="absolute inset-0 bg-red-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative w-40 h-24 lg:w-64 lg:h-40 bg-gradient-to-b from-red-500 to-red-700 rounded-2xl lg:rounded-3xl border-4 border-yellow-400 shadow-[0_4px_0_rgb(120,20,20)] lg:shadow-[0_10px_0_rgb(120,20,20)] flex flex-col items-center justify-center overflow-hidden">
                        <img
                            src={`${import.meta.env.BASE_URL}images/game-santa/UI-Elements/Play-Button.png`}
                            className="w-28 lg:w-56 h-auto drop-shadow-lg"
                            alt="Play"
                        />
                    </div>
                </button>

                {/* Levels/Map Button */}
                <button
                    onClick={onLevels}
                    className="group flex flex-col items-center gap-1 transform transition-all hover:scale-105 active:scale-95"
                >
                    <div className="w-14 h-14 lg:w-24 lg:h-24 bg-blue-900/50 rounded-xl lg:rounded-2xl border-2 border-blue-400/30 flex items-center justify-center backdrop-blur-sm group-hover:bg-blue-800/60 group-hover:border-blue-400 transition-colors relative">
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[9px] lg:text-xs font-bold px-1.5 py-0.5 rounded-full">Lvl 1</div>
                        <span className="text-2xl lg:text-4xl">🗺️</span>
                    </div>
                    <span className="text-white font-bold text-[11px] lg:text-lg opacity-80 group-hover:opacity-100">المراحل</span>
                </button>
            </div>

            {/* Footer Settings - Bottom Bar */}
            <div className="relative z-20 flex gap-4 lg:gap-6 bg-black/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/5 mb-1.5">
                <button onClick={onSettings} className="w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-90">
                    <img src={`${import.meta.env.BASE_URL}images/game-santa/Decorative-Elements/Settings-Gear-Icon.png`} className="w-5 h-5 lg:w-8 lg:h-8 opacity-80" alt="Settings" />
                </button>
                <button className="w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-90">
                    <img src={`${import.meta.env.BASE_URL}images/game-santa/Decorative-Elements/Version1-Sound%20ON.png`} className="w-5 h-5 lg:w-8 lg:h-8 opacity-80" alt="Sound" />
                </button>
                {/* Fullscreen Button */}
                <button
                    onClick={onFullscreen}
                    className="w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-blue-900/40 hover:bg-blue-900/60 border border-blue-400/30 flex items-center justify-center transition-colors active:scale-90"
                >
                    <span className="text-base lg:text-xl text-blue-200">⛶</span>
                </button>
                {/* Exit Button */}
                <button
                    onClick={onExit}
                    className="w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 flex items-center justify-center transition-colors active:scale-90"
                >
                    <span className="text-base lg:text-xl">🚪</span>
                </button>
            </div>
        </div>
    );
};

export default MainMenu;
