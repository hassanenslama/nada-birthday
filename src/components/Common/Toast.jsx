import React from 'react';
import { motion } from 'framer-motion';
import { Ban, CheckCheck } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[110] flex justify-center pointer-events-none"
        >
            <div className={`px-6 py-3 rounded-full shadow-2xl backdrop-blur-md text-white font-bold text-sm flex items-center gap-2 pointer-events-auto border ${type === 'error' ? 'bg-red-500/80 border-red-400' : 'bg-green-500/80 border-green-400'}`}>
                {type === 'error' ? <Ban size={16} /> : <CheckCheck size={16} />}
                {message}
            </div>
        </motion.div>
    );
};

export default Toast;
