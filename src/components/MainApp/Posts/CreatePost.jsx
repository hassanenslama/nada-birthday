import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Loader2, X, Sparkles } from 'lucide-react';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const CreatePost = ({ onPostCreated }) => {
    const { currentUser } = useAuth();
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const fileInputRef = useRef(null);

    React.useEffect(() => {
        const fetchProfile = async () => {
            const { data } = await supabase.from('user_profiles').select('*').eq('id', currentUser.id).single();
            if (data) setUserProfile(data);
        };
        fetchProfile();
    }, [currentUser]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const clearImage = () => {
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!content.trim() && !image) || isSubmitting) return;

        setIsSubmitting(true);
        try {
            let imageUrl = null;
            let linkUrl = null;

            // 1. Detect Link
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const match = content.match(urlRegex);
            if (match) linkUrl = match[0];

            // 2. Upload Image
            if (image) {
                const uploadResult = await uploadToCloudinary(image, { folder: 'posts' });
                imageUrl = uploadResult.url;
            }

            // 3. Save to Supabase
            const { error } = await supabase.from('posts').insert({
                user_id: currentUser.id,
                content: content,
                image_url: imageUrl,
                link_url: linkUrl
            });

            if (error) throw error;

            setContent('');
            clearImage();
            if (onPostCreated) onPostCreated();

        } catch (error) {
            console.error('Error creating post:', error);
            alert('حدث خطأ أثناء النشر، حاول مرة أخرى.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-[#121212]/80 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-2xl hover:border-gold/30 transition-all duration-300 mb-10 overflow-hidden"
        >
            {/* Glow Effect */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/10 rounded-full blur-[50px] group-hover:bg-gold/20 transition-all duration-500" />

            <div className="relative flex gap-4">
                <div className="relative">
                    {userProfile?.avatar_url ? (
                        <img
                            src={userProfile.avatar_url}
                            alt="My Avatar"
                            className="w-12 h-12 rounded-full object-cover border-2 border-gold/20 shadow-lg"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold via-yellow-600 to-yellow-800 p-[2px] shadow-lg">
                            <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                                <span className="text-gold font-bold text-lg">
                                    {currentUser?.email?.[0].toUpperCase() || 'U'}
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#121212] rounded-full"></div>
                </div>

                <div className="flex-1">
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="شاركنا لحظاتك المميزة... 💭"
                            className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 resize-none outline-none min-h-[100px] text-sm border border-transparent focus:border-gold/30 transition-all duration-300 mb-2"
                        />

                        <AnimatePresence>
                            {imagePreview && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="relative mt-2 rounded-2xl overflow-hidden max-h-80 border border-white/10 group/img"
                                >
                                    <div className="absolute inset-0 bg-black/20 group-hover/img:bg-transparent transition-colors" />
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-500 hover:scale-110 transition-all shadow-lg border border-white/10"
                                    >
                                        <X size={16} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex justify-between items-center mt-4 pl-1">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 text-gray-400 hover:text-gold transition-all duration-300 px-3 py-2 rounded-xl hover:bg-gold/10 group/btn"
                            >
                                <div className="p-1.5 rounded-lg bg-white/5 group-hover/btn:bg-gold/20 transition-colors">
                                    <ImageIcon size={18} />
                                </div>
                                <span className="text-xs font-medium">صورة</span>
                            </button>
                            {/* Keeping multiple=true for Gallery Grid feel, but restricting to image/* */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                            />

                            <button
                                type="submit"
                                disabled={(!content.trim() && !image) || isSubmitting}
                                className="relative overflow-hidden bg-gradient-to-r from-gold via-yellow-500 to-gold bg-[length:200%] hover:bg-right text-black px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>جاري النشر...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative z-10">نشر</span>
                                        <Send size={16} className="rtl:rotate-180 relative z-10" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </motion.div>
    );
};

export default CreatePost;
