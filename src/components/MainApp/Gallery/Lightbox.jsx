import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Minimize2, Maximize2, Lock, Unlock, Trash2, Edit2, Archive, Loader2 } from 'lucide-react';
import { supabase } from '../../../supabase';

const Lightbox = ({ photo, onClose, onNext, onPrev, hasNext, hasPrev }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center"
        >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onClose} className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md">
                    <X size={24} />
                </button>
            </div>

            {/* Navigation Buttons */}
            {hasPrev && (
                <button
                    onClick={onPrev}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4 z-10 hidden md:block"
                >
                    <ChevronRight size={48} />
                </button>
            )}
            {hasNext && (
                <button
                    onClick={onNext}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4 z-10 hidden md:block"
                >
                    <ChevronLeft size={48} />
                </button>
            )}

            {/* Main Content Area */}
            <div className="w-full h-full flex flex-col md:flex-row">

                {/* Image Section */}
                <div className="flex-1 flex items-center justify-center p-4 w-full relative">
                    <img
                        src={photo.url}
                        alt={photo.title || 'Memory'}
                        className={`max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-all duration-500 ${photo.is_locked ? 'blur-2xl scale-110 opacity-50' : ''}`}
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

                {/* Info Sidebar */}
                <AnimatePresence>
                    {(photo.caption || photo.title || (photo.album_id && photo.date)) && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent"
                        >
                            <div className="max-w-3xl mx-auto text-center font-cairo">
                                {/* Show date ONLY for gallery photos (not timeline) */}
                                {photo.album_id && photo.date && (
                                    <p className="text-gold/80 text-sm font-bold mb-4 tracking-wider uppercase">
                                        {new Date(photo.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                )}
                                {photo.title && (
                                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-lg leading-tight">
                                        {photo.title}
                                    </h2>
                                )}
                                {photo.caption && (
                                    <p className="text-gray-200 text-lg md:text-xl leading-relaxed max-h-[30vh] overflow-y-auto custom-scrollbar font-medium drop-shadow-md">
                                        {photo.caption}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default Lightbox;
