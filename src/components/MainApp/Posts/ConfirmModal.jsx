import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'نعم، احذف', cancelText = 'إلغاء', isDanger = true }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl overflow-hidden"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-gold/10 text-gold'}`}>
                            <AlertTriangle size={24} />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            {message}
                        </p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-white/5 text-white hover:bg-white/10 transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => { onConfirm(); onClose(); }}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${isDanger
                                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                                        : 'bg-gold text-black hover:bg-yellow-500'
                                    }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmModal;
