import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Check } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, originalName, currentNickname, onSaveNickname, currentImage, isMale = true }) => {
    const [nickname, setNickname] = useState(currentNickname);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => { setNickname(currentNickname); }, [currentNickname]);

    if (!isOpen) return null;
    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#121212] border border-gold/20 w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white z-10 bg-black/50 rounded-full p-2 hover:bg-black/80 transition"><X size={20} /></button>
                    <div className="h-32 bg-gradient-to-r from-gold/20 to-yellow-900/20"></div>
                    <div className="px-6 relative -mt-16 flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full border-4 border-[#121212] bg-gray-800 overflow-hidden shadow-xl flex items-center justify-center group relative">
                            {currentImage ? <img src={currentImage} className="w-full h-full object-cover" alt="Profile" /> : <div className="text-4xl">{isMale ? '👑' : '👸'}</div>}
                        </div>
                    </div>
                    <div className="p-6 space-y-4 font-cairo">
                        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                            <label className="text-xs text-gold/70 block mb-1">{isMale ? 'اسمه الأصلي (عنده)' : 'اسمها الأصلي (عندها)'}</label>
                            <p className="text-gray-300 font-bold">{originalName}</p>
                        </div>
                        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                            <label className="text-xs text-gold/70 block mb-1">اسم الدلع (بيظهرلك انت بس)</label>
                            <div className="flex justify-between items-center gap-2">
                                {isEditing ? (
                                    <input
                                        value={nickname}
                                        autoFocus
                                        onChange={e => setNickname(e.target.value)}
                                        className="bg-transparent border-b border-gold text-white w-full outline-none py-1"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                onSaveNickname(nickname);
                                                setIsEditing(false);
                                            }
                                        }}
                                    />
                                ) : (
                                    <p className="text-white font-bold text-lg">{nickname}</p>
                                )}
                                <button
                                    onClick={() => {
                                        if (isEditing) {
                                            onSaveNickname(nickname);
                                            setIsEditing(false);
                                        } else {
                                            setIsEditing(true);
                                        }
                                    }}
                                    className="text-gold p-2 hover:bg-gold/10 rounded-full transition"
                                >
                                    {isEditing ? <Check size={18} /> : <Edit2 size={18} />}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-center text-gray-500 pt-2">التغييرات دي خاصة بيك انت بس كأدمن 😉</p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProfileModal;
