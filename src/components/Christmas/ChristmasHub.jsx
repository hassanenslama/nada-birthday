import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Heart, TreePine, Snowflake, Trophy } from 'lucide-react';
import LoveDelivery from './Games/LoveDeliveryEnhanced';
import MemoryTree from './Games/MemoryTree';

const ChristmasHub = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeGame, setActiveGame] = useState(null); // 'runner', 'tree', null

    return (
        <>
            {/* Floating Action Button (Santa's Gift) */}
            {!activeGame && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed top-20 left-4 z-40 bg-red-600 text-white p-3 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] border-2 border-white/20 hover:bg-red-500 transition-colors"
                    title="احتفالات الكريسمس 🎄"
                >
                    <Gift size={28} className="animate-pulse" />
                </motion.button>
            )}

            {/* Main Hub Modal */}
            <AnimatePresence>
                {isOpen && !activeGame && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="bg-red-950 border border-red-500/30 rounded-3xl p-6 md:p-10 max-w-lg w-full relative overflow-hidden text-center shadow-2xl"
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 via-red-500 to-green-500" />
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Snowflake size={150} />
                            </div>

                            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors bg-white/10 p-2 rounded-full">
                                <X size={24} />
                            </button>

                            <div className="mb-8">
                                <h2 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-md font-cairo">🎄 احتفالات الكريسمس 🎄</h2>
                                <p className="text-red-200 font-cairo">كل سنة وأنتم طيبين يا أحلى كابل في الدنيا! ❤️</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setActiveGame('runner');
                                    }}
                                    className="group relative p-6 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl border border-white/10 hover:border-white/30 transition-all hover:scale-105 shadow-lg overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                    <Heart size={48} className="mx-auto mb-4 text-white drop-shadow-md group-hover:animate-bounce" />
                                    <h3 className="text-xl font-bold text-white relative z-10 font-cairo">مهمة الحب ❤️</h3>
                                    <p className="text-xs text-red-100 mt-2 relative z-10 font-cairo">اجمع القلوب ووصل الهدية!</p>
                                </button>

                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setActiveGame('tree');
                                    }}
                                    className="group relative p-6 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl border border-white/10 hover:border-white/30 transition-all hover:scale-105 shadow-lg overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                    <TreePine size={48} className="mx-auto mb-4 text-white drop-shadow-md group-hover:rotate-12 transition-transform" />
                                    <h3 className="text-xl font-bold text-white relative z-10 font-cairo">شجرة الذكريات 🎄</h3>
                                    <p className="text-xs text-green-100 mt-2 relative z-10 font-cairo">زين الشجرة بصوركم سوا</p>
                                </button>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/30 rounded-full text-gold text-sm font-bold border border-gold/20">
                                    <Trophy size={16} />
                                    <span>مفاجآت خاصة في انتظاركم!</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Games Rendering */}
            <AnimatePresence>
                {activeGame === 'runner' && (
                    <LoveDelivery onExit={() => setActiveGame(null)} />
                )}
                {activeGame === 'tree' && (
                    <MemoryTree onExit={() => setActiveGame(null)} />
                )}
            </AnimatePresence>
        </>
    );
};

export default ChristmasHub;
