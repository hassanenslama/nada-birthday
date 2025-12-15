import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Eye, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

const StatsOverview = ({ stats, onViewQuizDetails }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quiz Stats */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-[#121212] p-6 rounded-3xl border border-gold/20 relative overflow-hidden group hover:bg-[#1a1a1a] transition duration-300"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-500 transform group-hover:scale-110">
                    <Trophy size={120} />
                </div>

                <h3 className="text-gray-400 text-sm font-bold mb-4 flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gold/10 text-gold"><Trophy size={18} /></div>
                    نتيجة المسابقة
                </h3>

                <div className="flex items-end gap-2 mb-6">
                    <span className="text-5xl font-black text-white tracking-tighter shadow-gold/20 drop-shadow-lg">
                        {stats.quizScore !== null ? stats.quizScore : 0}
                    </span>
                    <span className="text-base text-gray-500 mb-2 font-bold">/ 30 نقطة</span>
                </div>

                <div className="w-full bg-gray-800/50 h-3 rounded-full overflow-hidden mb-6 border border-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-600 via-gold to-yellow-300 transition-all duration-1000 shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                        style={{ width: `${((stats.quizScore || 0) / 30) * 100}%` }}
                    ></div>
                </div>

                <button
                    onClick={onViewQuizDetails}
                    className="w-full py-3 bg-white/5 hover:bg-gold/20 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 border border-white/5 hover:border-gold/30 hover:text-gold"
                >
                    <Eye size={16} /> عرض تفاصيل الإجابات
                </button>
            </motion.div>

            {/* Memories Stats */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-[#121212] p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden group hover:bg-[#1a1a1a] transition duration-300"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-500 transform group-hover:scale-110">
                    <Lock size={120} />
                </div>

                <h3 className="text-gray-400 text-sm font-bold mb-4 flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Lock size={18} /></div>
                    الذكريات المفتوحة
                </h3>

                <div className="flex items-end gap-2 mb-6">
                    <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                        {stats.unlockedCount}
                    </span>
                    <span className="text-base text-gray-500 mb-2 font-bold">ذكريات</span>
                </div>

                <div className="flex gap-2 text-xs text-gray-500 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span>مفتوح: {stats.unlockedCount}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default StatsOverview;
