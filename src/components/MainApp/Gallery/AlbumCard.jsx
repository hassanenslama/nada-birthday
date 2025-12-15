import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Image as ImageIcon, Trash2 } from 'lucide-react';

const AlbumCard = ({ album, onClick, onDelete }) => {

    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm(`هل أنت متأكد من حذف ألبوم "${album.title}"؟ سيتم حذف جميع الصور بداخله.`)) {
            onDelete(album.id);
        }
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group relative aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer shadow-2xl bg-[#121212] border border-white/10"
        >
            {/* Delete Button (Only for non-system) */}
            {!album.is_system && onDelete && (
                <button
                    onClick={handleDelete}
                    className="absolute top-2 right-2 z-20 p-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                    title="حذف الألبوم"
                >
                    <Trash2 size={16} />
                </button>
            )}

            {/* Background Image */}
            <div className="absolute inset-0">
                {album.cover_image ? (
                    <img
                        src={album.cover_image}
                        alt={album.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                        <ImageIcon className="text-white/20" size={48} />
                    </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <h3 className="text-2xl font-bold text-white font-cairo mb-1 group-hover:text-gold transition-colors">
                    {album.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 font-cairo">
                    {album.is_system && <span className="bg-gold/20 text-gold px-2 py-0.5 rounded-full text-[10px]">نظام</span>}
                </div>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-y-12 translate-x-[-100%] group-hover:translate-x-[100%]" />
        </motion.div>
    );
};

export default AlbumCard;
