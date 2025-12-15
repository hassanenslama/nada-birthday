import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Type, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../../../supabase';

const EditMediaModal = ({ isOpen, onClose, mediaItem, onUpdate }) => {
    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');
    const [date, setDate] = useState('');
    const [showDate, setShowDate] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (mediaItem) {
            setTitle(mediaItem.title || '');
            setCaption(mediaItem.caption || '');
            setIsLocked(mediaItem.is_locked || false);

            if (mediaItem.date) {
                setDate(new Date(mediaItem.date).toISOString().split('T')[0]);
                setShowDate(true);
            } else {
                setDate(new Date().toISOString().split('T')[0]);
                setShowDate(false);
            }
        }
    }, [mediaItem, isOpen]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('gallery_media')
                .update({
                    title: title,
                    caption: caption,
                    is_locked: isLocked,
                    date: showDate ? date : null
                })
                .eq('id', mediaItem.id);

            if (error) throw error;

            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error updating media:', error);
            alert('فشل تحديث البيانات');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 font-cairo"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 shrink-0">
                            <h3 className="text-xl font-bold text-white">تعديل الذكرى</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            {/* Image Preview */}
                            {mediaItem && (
                                <div className="h-40 w-full rounded-xl overflow-hidden border border-white/10 bg-black">
                                    <img src={mediaItem.url} alt="Preview" className="w-full h-full object-contain" />
                                </div>
                            )}

                            {/* Title */}
                            <div className="space-y-2">
                                <label className="text-gray-400 text-sm flex items-center gap-2">
                                    <Type size={14} />
                                    <span>العنوان</span>
                                </label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-gold/50 focus:outline-none transition-colors text-right"
                                    placeholder="عنوان الصورة"
                                />
                            </div>

                            {/* Caption */}
                            <div className="space-y-2">
                                <label className="text-gray-400 text-sm flex items-center gap-2">
                                    <Type size={14} />
                                    <span>الوصف</span>
                                </label>
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-gold/50 focus:outline-none transition-colors text-right min-h-[100px]"
                                    placeholder="وصف الصورة"
                                />
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-gray-400 text-sm flex items-center gap-2">
                                        <Calendar size={14} />
                                        <span>التاريخ</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={showDate}
                                            onChange={(e) => setShowDate(e.target.checked)}
                                            className="accent-gold w-4 h-4 cursor-pointer"
                                        />
                                        <span className="text-xs text-gray-500">تفعيل التاريخ</span>
                                    </div>
                                </div>
                                {showDate && (
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-gold/50 focus:outline-none transition-colors text-right color-scheme-dark"
                                    />
                                )}
                            </div>

                            {/* Lock Toggle */}
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                <button
                                    onClick={() => setIsLocked(!isLocked)}
                                    className={`p-2 rounded-lg transition-colors ${isLocked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
                                >
                                    {isLocked ? <Lock size={20} /> : <Eye size={20} />}
                                </button>
                                <div className="flex-1 text-right">
                                    <p className="text-white font-bold text-sm">
                                        {isLocked ? 'الصورة مقفولة (Blur)' : 'الصورة ظاهرة'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {isLocked ? 'لا يمكن رؤيتها بوضوح إلا عند فتحها' : 'ظاهرة للجميع في المعرض'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 bg-black/20 flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="flex-1 bg-gold text-black font-bold py-3 rounded-xl hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'حفظ التعديلات'}
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EditMediaModal;
