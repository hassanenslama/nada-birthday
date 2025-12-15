import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Lock } from 'lucide-react';

const PhotoGrid = ({ photos, onPhotoClick }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 pb-20">
            {photos.map((photo, index) => (
                <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-gray-900"
                    onClick={() => onPhotoClick(photo)}
                >
                    <img
                        src={photo.url}
                        alt={photo.title || 'Memory'}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${photo.is_locked ? 'blur-xl scale-110' : ''}`}
                        loading="lazy"
                    />

                    {/* Locked Overlay */}
                    {photo.is_locked && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="bg-black/50 p-3 rounded-full backdrop-blur-md border border-white/10">
                                <Lock size={24} className="text-white/70" />
                            </div>
                        </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        {photo.title && (
                            <h4 className="text-white font-bold text-sm font-cairo line-clamp-1">{photo.title}</h4>
                        )}
                        {/* Show date ONLY for gallery photos (those with album_id and date) */}
                        {photo.album_id && photo.date && (
                            <span className="text-gray-300 text-[10px] mt-1">{new Date(photo.date).toLocaleDateString('ar-EG')}</span>
                        )}
                    </div>

                    {/* Favorite Indicator (Optional) */}
                    {photo.is_favorite && (
                        <div className="absolute top-2 right-2 text-red-500">
                            <Heart size={16} fill="currentColor" />
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
};

export default PhotoGrid;
