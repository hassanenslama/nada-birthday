import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCw, AlertTriangle, CheckCircle, XCircle, PlayCircle } from 'lucide-react';
import { supabase } from '../../../supabase';

const QuizManager = ({ quizData, targetUserId, onRefresh, onToast }) => {
    const [isResetting, setIsResetting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const hasPlayed = quizData && Object.keys(quizData.answers || {}).length > 0;

    const handleResetClick = () => {
        if (!targetUserId) return;
        setShowConfirm(true);
    };

    const confirmReset = async () => {
        setShowConfirm(false);
        setIsResetting(true);
        try {
            const { error } = await supabase
                .from('quiz_results')
                .delete()
                .eq('user_id', targetUserId);

            if (error) throw error; // If RLS fails, this might throw

            onToast('تم إعادة تعيين المسابقة بنجاح! 🎮', 'success');
            if (onRefresh) onRefresh(targetUserId);
        } catch (error) {
            console.error("Error resetting quiz:", error);
            onToast('حدث خطأ أثناء إعادة التعيين', 'error');
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#121212] p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-gold/30 transition-all duration-300"
        >
            {/* Confirmation Modal Overlay */}
            {showConfirm && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1a1a1a] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                    >
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <AlertTriangle size={24} />
                            <h4 className="font-bold text-lg">تأكيد الحذف</h4>
                        </div>
                        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                            هل أنت متأكد من حذف نتيجة المسابقة؟ <br />
                            <span className="text-yellow-500 font-bold">ملحوظة:</span> ستتمكن ندى من اللعب مرة أخرى كأنها أول مرة.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmReset}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-bold transition"
                            >
                                نعم، احذف
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-xl font-bold transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Background Icon */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-500 transform group-hover:scale-110 pointer-events-none">
                <Trophy size={140} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

                {/* Status Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${hasPlayed ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            {hasPlayed ? <CheckCircle size={20} /> : <PlayCircle size={20} />}
                        </div>
                        <h3 className="text-xl font-bold text-white">حالة المسابقة</h3>
                    </div>

                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                        {hasPlayed
                            ? 'ندى لعبت المسابقة بالفعل وتم تسجيل النتيجة. لا يمكنها اللعب مرة أخرى إلا إذا قمت بإعادة التعيين.'
                            : 'ندى لم تلعب المسابقة بعد. ستظهر لها المسابقة فور دخولها التطبيق.'}
                    </p>

                    {hasPlayed && (
                        <div className="flex items-center gap-4 text-sm font-mono bg-black/30 p-3 rounded-xl border border-white/5 w-fit">
                            <span className="text-gray-400">النتيجة:</span>
                            <span className="text-gold font-bold text-lg">{quizData.score} / 30</span>
                            <span className="w-px h-4 bg-white/10 mx-2" />
                            <span className="text-gray-400">عدد الإجابات:</span>
                            <span className="text-white font-bold">{Object.keys(quizData.answers || {}).length}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {hasPlayed ? (
                        <button
                            onClick={handleResetClick}
                            disabled={isResetting}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 px-6 py-4 rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] justify-center"
                        >
                            {isResetting ? (
                                <RotateCw className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <RotateCw size={20} />
                                    <span>إعادة اللعب مرة أخرى</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-6 py-4 rounded-xl font-bold flex items-center gap-2 min-w-[200px] justify-center cursor-default">
                            <PlayCircle size={20} />
                            <span>جاهزة للعب..</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default QuizManager;
