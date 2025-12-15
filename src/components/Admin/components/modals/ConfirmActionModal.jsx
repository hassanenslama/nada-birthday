import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, X } from 'lucide-react';

const ConfirmActionModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger', confirmText = 'تأكيد', cancelText = 'إلغاء' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl overflow-hidden"
            >
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full pointer-events-none ${type === 'danger' ? 'bg-red-500/20' : 'bg-gold/20'}`} />

                <div className="relative z-10 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-gold/10 text-gold'}`}>
                        <AlertTriangle size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 font-cairo">{title}</h3>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed font-cairo">{message}</p>

                    <div className="flex gap-3">
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${type === 'danger'
                                    ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20'
                                    : 'bg-gold hover:bg-yellow-400 text-black shadow-lg shadow-gold/20'
                                }`}
                        >
                            <Check size={18} />
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-sm transition-all"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ConfirmActionModal;
