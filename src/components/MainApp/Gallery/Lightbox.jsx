import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Minimize2, Maximize2, Lock, Unlock, Trash2, Edit2, Archive, Loader2 } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useSiteStatus } from '../../../context/SiteStatusContext';

const Lightbox = ({ photo, onClose, onNext, onPrev, hasNext, hasPrev }) => {
    const { isShutdown } = useSiteStatus();
    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return ReactDOM.createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onClose} className="text-white/70 hover:text-white transition-colors bg-black/50 p-2 rounded-full backdrop-blur-md border border-white/10">
                    <X size={24} />
                </button>
            </div>

            {/* Navigation Buttons */}
            {hasPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4 z-50 hidden md:block bg-black/20 hover:bg-black/40 rounded-full"
                >
                    <ChevronRight size={48} />
                </button>
            )}
            {hasNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4 z-50 hidden md:block bg-black/20 hover:bg-black/40 rounded-full"
                >
                    <ChevronLeft size={48} />
                </button>
            )}

            {/* Main Content Area */}
            <div className="w-full h-full flex flex-col md:flex-row relative pointer-events-none">

                {/* Image Section - Pointer events auto for interaction */}
                <div className="flex-1 flex items-center justify-center w-full h-full p-4 pointer-events-auto relative">
                    <img
                        src={photo.url}
                        alt={photo.title || 'Memory'}
                        className={`max-w-full max-h-[90vh] md:max-h-screen object-contain shadow-2xl transition-all duration-500 select-none ${photo.is_locked ? 'blur-2xl scale-110 opacity-50' : ''} ${isShutdown ? 'grayscale' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {photo.is_locked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <div className="bg-black/50 p-6 rounded-full backdrop-blur-md border border-white/10 mb-4">
                                <Lock size={48} className="text-white/70" />
                            </div>
                            <h3 className="text-2xl font-bold text-white font-cairo">هذه الذكرى مقفلة</h3>
                            <p className="text-gray-400 font-cairo mt-2">لا يمكن رؤية التفاصيل حالياً</p>
                        </div>
                    )}
                </div>

                {/* Info Sidebar Overlay - Pointer events auto to allow scrolling text */}
                <AnimatePresence>
                    {(photo.caption || photo.title || (photo.album_id && photo.date)) && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-auto z-40"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="max-w-4xl mx-auto text-center font-cairo">
                                {/* Show date ONLY for gallery photos (not timeline) */}
                                {photo.album_id && photo.date && (
                                    <p className="text-gold/80 text-sm font-bold mb-2 tracking-wider uppercase">
                                        {new Date(photo.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                )}
                                {photo.title && (
                                    <h2 className="text-2xl md:text-4xl font-black text-white mb-3 drop-shadow-lg leading-tight">
                                        {photo.title}
                                    </h2>
                                )}
                                {photo.caption && (
                                    <p className="text-gray-200 text-sm md:text-lg leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar font-medium drop-shadow-md px-4">
                                        {photo.caption}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>,
        document.body
    );
};

export default Lightbox;
