import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';

const QuizDetailsModal = ({ isOpen, onClose, answers }) => {
    if (!isOpen) return null;

    const answerMap = {
        'correct': { text: 'صح (عجبها)', icon: '✅', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        'wrong': { text: 'غلط (معجبهاش)', icon: '❌', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        'skip': { text: 'مشّتها (نص نص)', icon: '🤷‍♂️', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
    };

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-[#1a1a1a] border border-gold/20 w-full max-w-2xl rounded-3xl overflow-hidden relative shadow-2xl flex flex-col max-h-[85vh]">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#121212]">
                        <h3 className="text-xl font-bold text-gold flex items-center gap-2">
                            <Trophy size={24} />
                            تفاصيل إجابات المسابقة
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X size={24} /></button>
                    </div>

                    <div className="overflow-y-auto p-6 custom-scrollbar">
                        {(!answers || Object.keys(answers).length === 0) ? (
                            <div className="text-center py-16 text-gray-500 flex flex-col items-center gap-4">
                                <Trophy size={48} className="opacity-20" />
                                <p>لسه مجاوبتش على أي سؤال 😴</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(answers).map(([qIndex, answerKey], idx) => {
                                    const details = answerMap[answerKey] || { text: answerKey, icon: '❓', color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700' };
                                    return (
                                        <div key={idx} className={`bg-[#121212] p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-gold/30 transition group`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-gold border border-gold/20 group-hover:bg-gold group-hover:text-black transition">
                                                    {parseInt(qIndex) + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">السؤال رقم {parseInt(qIndex) + 1}</p>
                                                </div>
                                            </div>
                                            <div className={`flex items-center gap-3 font-bold ${details.color} ${details.bg} ${details.border} border px-4 py-2 rounded-lg`}>
                                                <span>{details.text}</span>
                                                <span className="text-xl">{details.icon}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default QuizDetailsModal;
