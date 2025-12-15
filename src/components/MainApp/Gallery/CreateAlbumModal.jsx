import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';
import { supabase } from '../../../supabase';

const CreateAlbumModal = ({ isOpen, onClose, onAlbumCreated }) => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError('');
        }
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            setError('برجاء كتابة اسم الألبوم');
            return;
        }
        if (!file) {
            setError('برجاء اختيار صورة الغلاف');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            // 1. Upload Cover Image
            const uploadResult = await uploadToCloudinary(file, { folder: 'nada-birthday/covers' });
            // FIX: Handle object return
            const imageUrl = uploadResult.url || uploadResult;

            if (!imageUrl || typeof imageUrl !== 'string') throw new Error('فشل رفع الصورة');

            // 2. Insert Album
            const { data: { user } } = await supabase.auth.getUser();

            const { error: dbError } = await supabase
                .from('albums')
                .insert({
                    title: title,
                    cover_image: imageUrl,
                    user_id: user.id
                });

            if (dbError) throw dbError;

            // Success
            onAlbumCreated();
            handleClose();
        } catch (err) {
            console.error('Create Album Error:', err);
            setError('حدث خطأ أثناء إنشاء الألبوم');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setFile(null);
        setPreview(null);
        setError('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={handleClose}
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
                            <h3 className="text-xl font-bold text-white font-cairo">إنشاء ألبوم جديد</h3>
                            <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            {/* Album Title */}
                            <div className="space-y-2">
                                <label className="text-gold text-sm font-cairo font-bold">اسم الألبوم</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="مثلاً: رحلة دهب 2024"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-gold/50 focus:outline-none transition-colors text-right"
                                    dir="auto"
                                />
                            </div>

                            {/* Cover Image */}
                            <div className="space-y-2">
                                <label className="text-gold text-sm font-cairo font-bold block mb-2">صورة الغلاف</label>
                                <div className="relative aspect-video rounded-xl border-2 border-dashed border-white/20 hover:border-gold/50 transition-colors bg-black/40 overflow-hidden flex items-center justify-center group">
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                                                <ImageIcon size={24} />
                                            </div>
                                            <p className="text-gray-400 text-sm font-cairo">اضغط لاختيار صورة الغلاف</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <p className="text-red-500 text-center text-sm font-cairo bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                    {error}
                                </p>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleCreate}
                                disabled={isUploading}
                                className="w-full bg-gold text-black font-bold py-3 rounded-xl hover:bg-gold/90 transition-all font-cairo flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>جاري الإنشاء...</span>
                                    </>
                                ) : (
                                    <span>إنشاء الألبوم</span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CreateAlbumModal;
