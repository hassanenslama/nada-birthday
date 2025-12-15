import React, { useState } from 'react';

const MessageCard = ({ message }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            onClick={() => setIsOpen(!isOpen)}
            className={`relative w-full cursor-pointer perspective-1000 transition-all duration-500 ${isOpen ? 'h-64' : 'h-24'}`}
        >
            {/* The Envelope / Card Closed State */}
            <div className={`absolute inset-0 bg-white/5 border border-gold/30 rounded-xl overflow-hidden transition-all duration-500 hover:bg-white/10 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center h-full px-6 gap-4">
                    <span className="text-4xl animate-bounce-custom">{message.emoji}</span>
                    <div className="flex-1 text-right" dir="rtl">
                        <h3 className="text-xl font-bold font-cairo text-white">{message.title}</h3>
                        <p className="text-gold/60 text-sm font-cairo">اضغطي للفتح ✨</p>
                    </div>
                </div>
            </div>

            {/* The Open Card (Message Revealed) */}
            <div className={`absolute inset-0 bg-maroon/40 backdrop-blur-xl border-2 border-gold rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-700 origin-center ${isOpen ? 'opacity-100 rotate-x-0 scale-100' : 'opacity-0 rotate-x-90 scale-95 pointer-events-none'}`}>

                <h3 className="text-2xl font-bold font-cairo text-gold mb-4">{message.title}</h3>

                <p className="font-cairo text-white/90 text-lg leading-relaxed max-w-md animate-typewriter">
                    "{message.content}"
                </p>

                <div className="mt-4 text-3xl animate-pulse">
                    {message.emoji}
                </div>

                {/* Close hint */}
                <button
                    className="absolute top-4 left-4 text-white/50 hover:text-white"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                    }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default MessageCard;
