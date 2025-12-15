import { useRef } from 'react';

const GameUI = ({ onAnswer, currentQuestion, totalQuestions, onRetry, onPrevious }) => {
    const hoverSoundRef = useRef(null);

    const playHoverSound = () => {
        if (hoverSoundRef.current) {
            hoverSoundRef.current.currentTime = 0;
            hoverSoundRef.current.play().catch(e => console.log('Hover sound failed:', e));
        }
    };

    return (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">

            <div className="w-full max-w-4xl">
                {/* Question Counter */}
                <div className="text-center mb-8 md:mb-12">
                    <div className="relative inline-block animate-scaleIn">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-gold/30 via-gold/50 to-gold/30 blur-2xl animate-pulse" />

                        {/* Main container */}
                        <div className="relative bg-gradient-to-br from-black/80 via-maroon/40 to-black/80 backdrop-blur-2xl border-2 border-gold/60 rounded-full px-8 py-4 shadow-[0_0_50px_rgba(197,160,89,0.4)]">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                                <p dir="rtl" className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gold via-yellow-200 to-gold bg-clip-text text-transparent font-cairo">
                                    السؤال <span className="text-4xl md:text-5xl mx-2">{currentQuestion}</span> من {totalQuestions}
                                </p>
                                <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Answer Buttons */}
                <div className="space-y-5 md:space-y-6">

                    {/* صح Button */}
                    <button
                        onClick={() => onAnswer('correct')}
                        onMouseEnter={playHoverSound}
                        className="group relative w-full overflow-hidden rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:translate-x-2 active:scale-[0.98] animate-slideInLeft"
                        style={{ animationDelay: '0.1s' }}
                    >
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />

                        {/* Shimmer */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                        </div>

                        {/* Glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_40px_rgba(16,185,129,0.6)]" />

                        {/* Content */}
                        <div className="relative flex items-center justify-between px-6 md:px-8 py-6 md:py-8">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-300">
                                    <span className="text-4xl md:text-5xl">✓</span>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-3xl md:text-5xl font-black text-white font-cairo mb-1">صح</h3>
                                    <p className="text-base md:text-xl text-emerald-100 font-cairo flex items-center gap-2">
                                        <span className="text-2xl md:text-3xl">💎</span>
                                        <span className="font-bold">نقاط +3</span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-white/70 group-hover:text-white group-hover:translate-x-2 transition-all duration-300">
                                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l-5 5 5 5" />
                                </svg>
                            </div>
                        </div>
                    </button>

                    {/* غلط Button */}
                    <button
                        onClick={() => onAnswer('wrong')}
                        onMouseEnter={playHoverSound}
                        className="group relative w-full overflow-hidden rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:translate-x-2 active:scale-[0.98] animate-slideInLeft"
                        style={{ animationDelay: '0.2s' }}
                    >
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />

                        {/* Shimmer */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                        </div>

                        {/* Glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_40px_rgba(220,38,38,0.6)]" />

                        {/* Content */}
                        <div className="relative flex items-center justify-between px-6 md:px-8 py-6 md:py-8">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-300">
                                    <span className="text-4xl md:text-5xl">✕</span>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-3xl md:text-5xl font-black text-white font-cairo mb-1">غلط</h3>
                                    <p className="text-base md:text-xl text-rose-100 font-cairo flex items-center gap-2">
                                        <span className="text-2xl md:text-3xl">💔</span>
                                        <span className="font-bold">نقاط +0</span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-white/70 group-hover:text-white group-hover:translate-x-2 transition-all duration-300">
                                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l-5 5 5 5" />
                                </svg>
                            </div>
                        </div>
                    </button>

                    {/* همشيها Button */}
                    <button
                        onClick={() => onAnswer('skip')}
                        onMouseEnter={playHoverSound}
                        className="group relative w-full overflow-hidden rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:translate-x-2 active:scale-[0.98] animate-slideInLeft"
                        style={{ animationDelay: '0.3s' }}
                    >
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-700 via-gray-600 to-slate-700 opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />

                        {/* Shimmer */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                        </div>

                        {/* Glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_40px_rgba(100,116,139,0.6)]" />

                        {/* Content */}
                        <div className="relative flex items-center justify-between px-6 md:px-8 py-6 md:py-8">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-300">
                                    <span className="text-4xl md:text-5xl">⏭️</span>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-3xl md:text-5xl font-black text-white font-cairo mb-1">همشيها</h3>
                                    <p className="text-base md:text-xl text-slate-200 font-cairo flex items-center gap-2">
                                        <span className="text-2xl md:text-3xl">⭐</span>
                                        <span className="font-bold">نقطة +1</span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-white/70 group-hover:text-white group-hover:translate-x-2 transition-all duration-300">
                                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l-5 5 5 5" />
                                </svg>
                            </div>
                        </div>
                    </button>

                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mt-8 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                    {onPrevious && (
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gold/20 hover:bg-gold/30 border-2 border-gold/60 rounded-xl text-gold font-cairo font-bold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span>السؤال السابق</span>
                        </button>
                    )}

                    <button
                        onClick={onRetry}
                        className="px-6 py-3 bg-maroon/60 hover:bg-maroon/80 border-2 border-maroon rounded-xl text-white font-cairo font-bold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>إعادة السؤال</span>
                    </button>
                </div>
            </div>

            {/* Hover Sound */}
            <audio ref={hoverSoundRef} src="/sounds/click-sound.mp3" preload="auto" />
        </div>
    );
};

export default GameUI;
