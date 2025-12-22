import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ThumbsDown, Lock } from 'lucide-react';

const ReactionButton = ({
    type = 'like', // 'like' or 'dislike'
    count,
    isReacted,
    isHidden,
    onReact,
    onHiddenReact
}) => {
    const [showHiddenOption, setShowHiddenOption] = useState(false);
    const timeoutRef = useRef(null);

    const handlePressStart = () => {
        timeoutRef.current = setTimeout(() => {
            setShowHiddenOption(true);
        }, 500); // 500ms long press
    };

    const handlePressEnd = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    const handleClick = () => {
        if (!showHiddenOption) {
            onReact();
        }
    };

    const Icon = type === 'like' ? Heart : ThumbsDown;
    const colorClass = type === 'like' ? 'text-red-500' : 'text-gray-400';
    const activeClass = isReacted
        ? (isHidden ? 'text-gold opacity-80' : colorClass)
        : 'text-gray-500';

    return (
        <div className="relative">
            <button
                className={`flex items-center gap-1 p-2 rounded-full transition-all ${activeClass} hover:bg-white/5 active:scale-95`}
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                onClick={handleClick}
            >
                <Icon size={20} className={isReacted && !isHidden ? 'fill-current' : ''} />
                <span className="text-xs font-bold">{count}</span>
                {isReacted && isHidden && (
                    <Lock size={12} className="absolute -top-1 -right-1 text-gold" />
                )}
            </button>

            <AnimatePresence>
                {showHiddenOption && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowHiddenOption(false)}
                        />
                        <motion.div
                            initial={{ scale: 0, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0, opacity: 0, y: 10 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-[#2a2a2a] border border-gold/30 rounded-xl p-2 shadow-xl flex gap-2"
                        >
                            <button
                                onClick={() => {
                                    onHiddenReact();
                                    setShowHiddenOption(false);
                                }}
                                className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-lg min-w-[80px]"
                            >
                                <div className="relative">
                                    <Icon size={24} className="text-gold" />
                                    <Lock size={12} className="absolute -top-1 -right-1 text-white" />
                                </div>
                                <span className="text-[10px] text-gold font-bold whitespace-nowrap">
                                    {type === 'like' ? 'لايك سري' : 'ديس لايك سري'}
                                </span>
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReactionButton;
