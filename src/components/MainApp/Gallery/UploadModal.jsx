import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Calendar, Type, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';
import { supabase } from '../../../supabase';

const UploadModal = ({ isOpen, onClose, albums, currentAlbumId, onUploadComplete }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');

    // Date Logic
    const [showDate, setShowDate] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const [selectedAlbumId, setSelectedAlbumId] = useState(currentAlbumId || (albums[0]?.id));
    const [isLocked, setIsLocked] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    // Update selectedAlbumId when albums load or when opening
    useEffect(() => {
        if (isOpen) {
            // Priority: provided currentAlbumId -> existing state -> first album
            if (!selectedAlbumId && albums.length > 0) {
                setSelectedAlbumId(currentAlbumId || albums[0].id);
            }
            // Reset Date on open
            setDate(new Date().toISOString().split('T')[0]);
            setShowDate(true);
        }
    }, [isOpen, albums, currentAlbumId, selectedAlbumId]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError('');
        }
    };

    const handleUpload = async () => {
        // Fallback: Ensure we have an album ID
        const targetAlbumId = selectedAlbumId || currentAlbumId || albums[0]?.id;

        if (!file) {
            setError('برجاء اختيار صورة');
            return;
        }
        if (!targetAlbumId) {
            setError('برجاء اختيار أو إنشاء ألبوم أولاً');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            // 1. Upload to Cloudinary
            const uploadResult = await uploadToCloudinary(file);
            console.log("Upload Result:", uploadResult);

            // FIX: Extract URL correctly (handle both string return or object return from utility)
            const imageUrl = uploadResult.url || uploadResult;

            if (!imageUrl || typeof imageUrl !== 'string') throw new Error('فشل رفع الصورة');

            // 2. Insert into Supabase
            const { data: { user } } = await supabase.auth.getUser();

            const { error: dbError } = await supabase
                .from('gallery_media')
                .insert({
                    album_id: targetAlbumId,
                    url: imageUrl,
                    title: title,
                    caption: caption,
                    date: showDate ? date : null, // Logic: Send Null if date hidden
                    user_id: user.id,
                    is_locked: isLocked
                });

            if (dbError) throw dbError;

            // Success
            onUploadComplete();
            handleClose();
        } catch (err) {
            console.error('Upload Error:', err);
            setError('حدث خطأ أثناء الرفع: ' + (err.message || 'Error'));
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreview(null);
        setTitle('');
        setCaption('');
        setError('');
        setIsLocked(false);
        setShowDate(true);
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
                            <h3 className="text-xl font-bold text-white font-cairo">إضافة ذكريات جديدة</h3>
                            <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            {/* Image Preview */}
                            <div className="relative aspect-video rounded-xl border-2 border-dashed border-white/20 hover:border-gold/50 transition-colors bg-black/40 overflow-hidden flex items-center justify-center group shrink-0">
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-center p-4">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                                            <Upload size={24} />
                                        </div>
                                        <p className="text-gray-400 text-sm font-cairo">اضغط لاختيار صورة</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Title (New) */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gold text-sm font-cairo">
                                    <Type size={16} />
                                    <span>عنوان الصورة (اختياري)</span>
                                </div>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="اكتب عنواناً للصورة..."
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-gold/50 focus:outline-none transition-colors text-right"
                                />
                            </div>

                            {/* Caption */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gold text-sm font-cairo">
                                    <Type size={16} />
                                    <span>الوصف (اختياري)</span>
                                </div>
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="اكتب وصف للصورة..."
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:border-gold/50 focus:outline-none transition-colors text-right"
                                    rows={2}
                                />
                            </div>

                            {/* Date Section */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gold text-sm font-cairo">
                                        <Calendar size={16} />
                                        <span>التاريخ</span>
                                    </div>

                                    {/* Show Date Toggle */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="show-date"
                                            checked={showDate}
                                            onChange={(e) => setShowDate(e.target.checked)}
                                            className="w-4 h-4 accent-gold cursor-pointer"
                                        />
                                        <label htmlFor="show-date" className="text-xs text-gray-400 cursor-pointer select-none font-cairo">
                                            إظهار التاريخ
                                        </label>
                                    </div>
                                </div>

                                {showDate && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-gold/50 focus:outline-none transition-colors text-right placeholder-gray-500 color-scheme-dark"
                                        />
                                    </motion.div>
                                )}
                            </div>

                            {/* Album Selection */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gold text-sm font-cairo">
                                    <ImageIcon size={16} />
                                    <span>الألبوم</span>
                                </div>
                                <select
                                    value={selectedAlbumId || ''}
                                    onChange={(e) => setSelectedAlbumId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-gold/50 focus:outline-none transition-colors text-right appearance-none"
                                >
                                    <option value="" disabled className="bg-gray-900 text-gray-500">اختر الألبوم...</option>
                                    {albums.map(album => (
                                        <option key={album.id} value={album.id} className="bg-gray-900">
                                            {album.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Lock Toggle */}
                            <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5">
                                <input
                                    type="checkbox"
                                    id="lock-photo"
                                    checked={isLocked}
                                    onChange={(e) => setIsLocked(e.target.checked)}
                                    className="w-5 h-5 accent-gold cursor-pointer"
                                    style={{ colorScheme: 'dark' }}
                                />
                                <label htmlFor="lock-photo" className="text-white text-sm font-cairo cursor-pointer select-none flex items-center gap-2">
                                    {isLocked ? <Lock size={16} className="text-gold" /> : <EyeOff size={16} className="text-gray-400" />}
                                    <span>إخفاء الصورة (Blur) لحين فتحها</span>
                                </label>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <p className="text-red-500 text-center text-sm font-cairo bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                    {error}
                                </p>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="w-full bg-gold text-black font-bold py-3 rounded-xl hover:bg-gold/90 transition-all font-cairo flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shrink-0"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>جاري الرفع...</span>
                                    </>
                                ) : (
                                    <span>حفظ الذكرى</span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UploadModal;
