import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { uploadToCloudinary, compressImage } from '../../../utils/cloudinaryUpload';
import { usePresence } from '../../../context/PresenceContext';
import { useMusic } from '../../../context/MusicContext';
import { useBackButton } from '../../../context/BackButtonContext';
import { Send, Smile, X, Loader2, CheckCheck, Check, Paperclip, Edit2, Camera, Reply, Trash2, Ban, Music, User as UserIcon } from 'lucide-react';

// Custom Hook for Long Press
const useLongPress = (callback = () => { }, ms = 500) => {
    const [startLongPress, setStartLongPress] = useState(false);
    useEffect(() => {
        let timerId;
        if (startLongPress) timerId = setTimeout(callback, ms);
        else clearTimeout(timerId);
        return () => clearTimeout(timerId);
    }, [startLongPress, callback, ms]);
    return {
        onMouseDown: () => setStartLongPress(true),
        onMouseUp: () => setStartLongPress(false),
        onMouseLeave: () => setStartLongPress(false),
        onMouseMove: () => setStartLongPress(false),
        onTouchStart: () => setStartLongPress(true),
        onTouchMove: () => setStartLongPress(false),
        onTouchEnd: () => setStartLongPress(false),
    };
};

import EmojiPicker from 'emoji-picker-react';

// Toast Component
const Toast = ({ message, type, onClose }) => {
    return (
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-0 left-0 right-0 z-[110] flex justify-center pointer-events-none">
            <div className={`px-6 py-3 rounded-full shadow-2xl backdrop-blur-md text-white font-bold text-sm flex items-center gap-2 pointer-events-auto border ${type === 'error' ? 'bg-red-500/80 border-red-400' : 'bg-green-500/80 border-green-400'}`}>
                {type === 'error' ? <Ban size={16} /> : <CheckCheck size={16} />}
                {message}
            </div>
        </motion.div>
    );
};

const ReactionSelector = ({ onSelect, onClose }) => {
    const reactions = ["❤️", "😂", "😮", "😢", "😡", "👍"];
    return (
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#2a2a2a] rounded-full shadow-xl border border-gold/20 flex gap-1 p-1 px-2 mx-auto w-max max-w-[calc(100vw-40px)] overflow-x-auto custom-scrollbar">
            {reactions.map(r => (<button key={r} onClick={() => onSelect(r)} className="p-2 hover:scale-125 transition text-lg">{r}</button>))}
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white"><X size={12} /></button>
        </motion.div>
    );
};

// My Profile Modal
const MyProfileModal = ({ isOpen, onClose, myProfile, onUpdate }) => {
    const [bio, setBio] = useState(myProfile.bio || '');
    const [displayName, setDisplayName] = useState(myProfile.displayName || '');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const fileRef = useRef(null);
    const [initialBio, setInitialBio] = useState(myProfile.bio || '');
    const { isPermanentlyDisabled, setPermanentlyDisabled } = useMusic(); // FIX: Add missing hook

    useEffect(() => {
        setBio(myProfile.bio || '');
        setDisplayName(myProfile.displayName || '');
        setInitialBio(myProfile.bio || '');
    }, [myProfile]);

    const getRelativeTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays === 1) return 'منذ يوم واحد';
        if (diffDays < 30) return `منذ ${diffDays} يوم`;
        return date.toLocaleDateString('ar-EG');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await uploadToCloudinary(file, {
                folder: 'profile-pictures',
                onProgress: (percent) => console.log(`Upload progress: ${percent}%`)
            });
            await onUpdate({ profilePicture: result.url });
        } catch (err) {
            console.error('Error uploading image:', err);
            alert('حدث خطأ أثناء رفع الصورة');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveBio = async () => {
        setSaving(true);
        await onUpdate({ bio, bioUpdatedAt: new Date().toISOString() });
        setSaving(false);
        setInitialBio(bio);
    };

    const handleSaveDisplayName = async () => {
        if (!displayName.trim()) return;
        setSaving(true);
        await onUpdate({ displayName: displayName.trim() });
        setSaving(false);
        setEditingName(false);
    };

    const handleSaveColors = async (bubbleColor, bioColor) => {
        await onUpdate({ chatBubbleColor: bubbleColor, bioColor: bioColor });
    };

    if (!isOpen) return null;

    const colorOptions = [
        { hex: '#e5c15d', name: 'Gold' },
        { hex: '#3b82f6', name: 'Blue' },
        { hex: '#ef4444', name: 'Red' },
        { hex: '#10b981', name: 'Green' },
        { hex: '#8b5cf6', name: 'Purple' },
        { hex: '#800000', name: 'Maroon' },
        { hex: '#89CFF0', name: 'Baby Blue' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[#121212] border border-gold/20 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
            >
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white z-20 bg-black/50 rounded-full p-2"><X size={20} /></button>
                    <div className="h-32 bg-gradient-to-r from-gold/20 to-yellow-900/20 shrink-0"></div>

                    <div className="px-6 relative -mt-16 flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                            <div className="w-32 h-32 rounded-full border-4 border-[#121212] bg-gray-800 overflow-hidden shadow-xl flex items-center justify-center">
                                {myProfile.profilePicture ? <img src={myProfile.profilePicture} className="w-full h-full object-cover" /> :
                                    <div className="w-full h-full bg-gradient-to-br from-gold to-yellow-800 flex items-center justify-center text-black font-bold text-4xl">
                                        {myProfile.displayName?.[0] || 'U'}
                                    </div>}
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Camera className="text-white" />
                            </div>
                            <input type="file" ref={fileRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
                            {uploading && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                        </div>

                        <div className="mt-4 text-center w-full">
                            <h2 className="text-sm font-bold text-gold/80 mb-1">اسم العرض</h2>
                            <div className="flex items-center justify-center gap-2">
                                {editingName ? (
                                    <div className="flex w-full gap-2">
                                        <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-black/50 p-2 rounded text-white flex-1 text-center" />
                                        <button onClick={handleSaveDisplayName} className="text-green-500"><CheckCheck /></button>
                                    </div>
                                ) : (
                                    <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2" onClick={() => setEditingName(true)}>
                                        {myProfile.displayName} <Edit2 size={14} className="text-gray-500" />
                                    </h1>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Bio Editing */}
                        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-gold/70">نبذة عني (Bio)</label>
                                {myProfile.bioUpdatedAt && <span className="text-xs text-gray-400 font-mono dir-ltr">{getRelativeTime(myProfile.bioUpdatedAt)}</span>}
                            </div>
                            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="اكتب نبذة عنك..." className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm outline-none min-h-[80px] resize-none custom-scrollbar" maxLength={150} />
                            <div className="flex justify-between items-center mt-2 h-8">
                                <span className="text-xs text-gray-500">{bio.length}/150</span>
                                {(bio !== initialBio) && (
                                    <button onClick={handleSaveBio} disabled={saving} className="px-4 py-1.5 bg-gold text-black rounded-lg text-xs font-bold hover:bg-yellow-500 transition disabled:opacity-50 flex items-center gap-1">
                                        {saving ? <><Loader2 className="animate-spin" size={12} /> حفظ...</> : 'حفظ'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Color Customization */}
                        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                            <label className="text-xs text-gold/70 block mb-3">تخصيص الألوان</label>
                            <div className="flex gap-4 flex-col sm:flex-row">
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-400 mb-2 block">لون الرسائل</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {colorOptions.map(({ hex }) => (
                                            <button
                                                key={hex}
                                                onClick={() => handleSaveColors(hex, myProfile.bioColor)}
                                                className={`w-8 h-8 rounded-full border-2 ${myProfile.chatBubbleColor === hex ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}
                                                style={{ backgroundColor: hex }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-400 mb-2 block">لون البايو & الاسم</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {colorOptions.map(({ hex }) => (
                                            <button
                                                key={hex}
                                                onClick={() => handleSaveColors(myProfile.chatBubbleColor, hex)}
                                                className={`w-8 h-8 rounded-full border-2 ${myProfile.bioColor === hex ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}
                                                style={{ backgroundColor: hex }}
                                            />
                                        ))}
                                    </div>
                                    <div className="text-gray-400 text-xs mt-2 text-center">سيظهر هذا اللون عند الآخرين</div>
                                </div>
                            </div>
                        </div>

                        {/* Music Settings */}
                        <div className="bg-[#1a1a1a]/50 p-4 rounded-xl border border-white/5">
                            <h3 className="text-gold font-bold mb-3 flex items-center gap-2"><Music size={16} /> إعدادات الموسيقى</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 text-sm">تشغيل الموسيقى الخلفية</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={!isPermanentlyDisabled}
                                        onChange={(e) => setPermanentlyDisabled(!e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">عند التعطيل، لن تعمل الموسيقى تلقائياً عند فتح الموقع.</p>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-[#121212] pt-4 border-t border-white/5"></div>
            </motion.div>
        </motion.div>
    );
};

// Other Person's Profile Modal
const ProfileModal = ({ isOpen, onClose, otherProfile, myNickname, onSaveNickname }) => {
    const [nickname, setNickname] = useState(myNickname);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => { setNickname(myNickname); }, [myNickname]);

    const getRelativeTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays === 1) return 'منذ يوم واحد';
        if (diffDays < 30) return `منذ ${diffDays} يوم`;
        return date.toLocaleDateString('ar-EG');
    };

    if (!isOpen) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#121212] border border-gold/20 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-white z-10 bg-black/50 rounded-full p-2"><X size={20} /></button>
                <div className="h-32 bg-gradient-to-r from-gold/20 to-yellow-900/20"></div>
                <div className="px-6 relative -mt-16 flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full border-4 border-[#121212] bg-gray-800 overflow-hidden shadow-xl flex items-center justify-center">
                        {otherProfile.profilePicture ? <img src={otherProfile.profilePicture} className="w-full h-full object-cover" /> :
                            <div className="w-full h-full bg-gradient-to-br from-gold to-yellow-800 flex items-center justify-center text-black font-bold text-4xl">
                                {otherProfile.displayName?.[0] || 'H'}
                            </div>}
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-4">{otherProfile.displayName}</h2>
                    {otherProfile.bio && (
                        <div className="text-center mt-2 px-4">
                            <p className="text-sm text-gray-400">{otherProfile.bio}</p>
                            {otherProfile.bioUpdatedAt && (
                                <p className="text-xs text-gray-400 mt-2 font-mono dir-ltr">{getRelativeTime(otherProfile.bioUpdatedAt)}</p>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                        <label className="text-xs text-gold/70 block mb-2">اسم الدلع (يظهر لك فقط)</label>
                        <div className="flex items-center justify-between gap-2">
                            {isEditing ? (
                                <input value={nickname} autoFocus onChange={e => setNickname(e.target.value)} className="flex-1 bg-transparent border-b border-gold text-white outline-none pb-1" />
                            ) : (
                                <p className="flex-1 text-white font-bold">{nickname}</p>
                            )}
                            <button onClick={() => {
                                if (isEditing) { onSaveNickname(nickname); setIsEditing(false); }
                                else setIsEditing(true);
                            }} className="text-gold p-2 hover:text-white transition">
                                {isEditing ? <CheckCheck size={18} /> : <Edit2 size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const ImagePreviewModal = ({ file, onClose, onSend, uploading, isViewOnce, onToggleViewOnce }) => {
    const [caption, setCaption] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col h-full w-full">
            <div className="flex justify-between items-center p-4">
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white"><X size={24} /></button>
                <h3 className="text-white font-bold">معاينة الصورة</h3>
                <div className="w-10"></div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                {previewUrl && <img src={previewUrl} alt="Preview" className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain" />}
            </div>
            <div className="p-4 pb-28 bg-[#121212] border-t border-white/10">
                <div className="flex items-end gap-2 max-w-2xl mx-auto">
                    <div className="flex-1 bg-[#1a1a1a] rounded-3xl flex items-center border border-white/5 px-4 py-2">
                        <button
                            type="button"
                            onClick={() => onToggleViewOnce && onToggleViewOnce()}
                            className={`p-2 rounded-full mr-2 transition ${isViewOnce ? 'bg-green-500/20 text-green-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            <span className="font-bold border-2 border-current rounded-full w-5 h-5 flex items-center justify-center text-[10px]">1</span>
                        </button>
                        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="اكتبي تعليق..." className="flex-1 bg-transparent text-white p-2 outline-none text-sm" onKeyDown={e => { if (e.key === 'Enter' && !uploading) onSend(caption); }} />
                    </div>
                    <button onClick={() => onSend(caption)} disabled={uploading} className="p-3 bg-gold text-black rounded-full shadow-lg font-bold">
                        {uploading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};



const ViewOnceModal = ({ imageUrl, onClose }) => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
            <img src={imageUrl} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            <p className="text-white mt-4 text-sm animate-pulse">هذه الصورة ستختفي للأبد عند إغلاقها</p>
            <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full"><X /></button>
        </motion.div>
    );
};

const ActionMenu = ({ onEdit, onDelete, canEdit, onClose }) => {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-14 right-0 z-50 flex gap-2 bg-[#222] p-2 rounded-xl border border-white/10 shadow-xl"
            style={{ maxWidth: '90vw', right: '0' }}
        >
            {canEdit && <button onClick={onEdit} className="flex items-center gap-1 p-2 hover:bg-white/10 rounded-lg text-blue-400 text-xs whitespace-nowrap"><Edit2 size={16} /> تعديل</button>}
            <button onClick={onDelete} className="flex items-center gap-1 p-2 hover:bg-white/10 rounded-lg text-red-500 text-xs whitespace-nowrap"><Trash2 size={16} /> حذف</button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><X size={16} /></button>
        </motion.div>
    );
};

const MessageItem = ({ msg, isMe, onReply, onAction, onReaction, interactionState, bubbleColor }) => {
    const controls = useAnimation();

    // Long Press -> Show Reaction Selector (Emoji)
    const longPressEvent = useLongPress(() => {
        if (!msg.isDeleted) {
            onReaction(msg.id);
            if (navigator.vibrate) navigator.vibrate(50);
        }
    }, 500);

    const handleDragEnd = async (event, info) => {
        if (Math.abs(info.offset.x) > 50 && !msg.isDeleted) {
            onReply(msg);
            if (navigator.vibrate) navigator.vibrate(20);
        }
        await controls.start({ x: 0 });
    };

    // Double Click -> Show Action Menu (Only if isMe)
    const handleDoubleClick = () => {
        if (!msg.isDeleted && isMe) {
            onAction(msg.id);
        }
    };

    // Helpers
    const getMessageTime = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderTicks = (msg) => {
        if (!isMe) return null;
        if (msg.readAt) return <CheckCheck size={14} className="text-blue-500" />;
        if (msg.deliveredAt) return <CheckCheck size={14} className="text-gray-400" />;
        return <Check size={14} className="text-gray-500/50" />;
    };

    // Edit Time Limit Check (1 Hour)
    const canEdit = isMe && !msg.isDeleted && msg.type === 'text' && (Date.now() - new Date(msg.timestamp).getTime() < 3600000);

    const isInteracting = interactionState?.id === msg.id;
    const mode = isInteracting ? interactionState.mode : null;

    return (
        <motion.div className={`relative flex ${isMe ? 'justify-end' : 'justify-start'} w-full mb-1 touch-pan-y`} drag="x" dragConstraints={isMe ? { left: -60, right: 0 } : { left: 0, right: 60 }} dragElastic={0.1} onDragEnd={handleDragEnd} animate={controls} onDoubleClick={handleDoubleClick} {...longPressEvent}>
            <div
                className={`relative max-w-[85%] sm:max-w-[65%] rounded-lg px-2 py-1 text-sm transition-all border shadow-sm z-10 ${isMe ? 'text-black border-transparent rounded-tr-sm' : 'bg-[#222] text-white border-white/5 rounded-tl-sm'} ${msg.isDeleted ? 'italic' : ''}`}
                style={{ backgroundColor: isMe ? (bubbleColor || '#e5c15d') : '#222' }}
            >
                <AnimatePresence>
                    {isInteracting && (
                        <>
                            {/* Backdrop to close on click outside */}
                            <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); onAction(null); }}></div>

                            <div
                                className={`flex gap-2 absolute -top-14 z-50 min-w-[max-content] w-max`}
                                style={isMe ? { right: 0 } : { left: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {mode === 'reaction' && (
                                    <ReactionSelector onSelect={r => onReaction(msg.id, r)} onClose={() => onReaction(null)} />
                                )}
                                {mode === 'action' && (
                                    <ActionMenu
                                        onEdit={() => onAction(msg, 'edit')}
                                        onDelete={() => onAction(msg, 'delete')}
                                        canEdit={canEdit}
                                        onClose={() => onAction(null)}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </AnimatePresence>

                {msg.replyTo && !msg.isDeleted && (
                    <div className={`mb-1 border-l-2 pl-2 text-xs opacity-75 ${isMe ? 'border-black/20' : 'border-gold/50'}`}>
                        <span className="font-bold block">{msg.replyTo.senderName}</span>
                        <span className="line-clamp-1">{msg.replyTo.text || '📷 صورة'}</span>
                    </div>
                )}

                {msg.isDeleted ? (
                    <div className="flex items-center gap-2 text-xs opacity-70">
                        <Ban size={14} />
                        <span>{isMe ? 'أنت حذفت هذه الرسالة' : 'تم حذف هذه الرسالة'}</span>
                    </div>
                ) : (
                    <>
                        {msg.type === 'image' ? (
                            <div className="mt-0.5">
                                {msg.isViewOnce ? (
                                    <div className="select-none">
                                        {msg.viewedAt ? (
                                            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg italic text-gray-500 cursor-default">
                                                <div className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center">
                                                    <span className="text-[10px]">1</span>
                                                </div>
                                                <span className="text-xs">تم العرض</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => !isMe && msg.onOpenViewOnce && msg.onOpenViewOnce(msg)}
                                                className={`flex items-center gap-2 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-white/10 p-2 rounded-lg hover:bg-white/10 transition ${isMe ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                                            >
                                                <div className="w-8 h-8 rounded-full border-2 border-dotted border-gold flex items-center justify-center animate-pulse">
                                                    <span className="text-xs font-bold text-gold">1</span>
                                                </div>
                                                <span className="text-xs text-white">صورة للعرض مرة واحدة</span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <img src={msg.image} className="rounded-lg max-h-64 object-cover" />
                                        {msg.text && <p className={`mt-1 text-sm ${isMe ? 'text-black/90' : 'text-gray-200'}`}>{msg.text}</p>}
                                    </>
                                )}
                            </div>
                        ) : (
                            <p className="leading-relaxed whitespace-pre-wrap select-none">{msg.text}</p>
                        )}
                    </>
                )}

                <div className={`flex justify-end gap-1 mt-0.5 text-[10px] items-center ${isMe ? 'opacity-60' : 'text-gray-500'}`}>
                    {msg.editedAt && !msg.isDeleted && <span className="italic flex items-center gap-0.5"><Edit2 size={8} /> تم التعديل</span>}
                    <span>{getMessageTime(msg.timestamp)}</span>
                    {isMe && renderTicks(msg)}
                </div>
                {msg.reaction && !msg.isDeleted && <div className={`absolute -bottom-2 ${isMe ? 'left-0' : 'right-0'} bg-[#333] rounded-full p-0.5 text-xs shadow-md border border-white/10`}>{msg.reaction}</div>}
            </div>
        </motion.div>
    );
};

// MAPPER FUNCTIONS
const mapMessageFromDB = (msg) => ({
    id: msg.id,
    text: msg.text,
    image: msg.image,
    senderUid: msg.sender_uid,
    senderName: msg.sender_name,
    timestamp: msg.timestamp || msg.created_at,
    reaction: msg.reaction,
    replyTo: msg.reply_to,
    type: msg.type || (msg.image ? 'image' : 'text'),
    isViewOnce: msg.is_view_once,
    viewedAt: msg.viewed_at,
    read: msg.read,
    readAt: msg.read_at,
    deliveredAt: msg.delivered_at,
    editedAt: msg.edited_at,
    isDeleted: msg.is_deleted
});

const mapProfileFromDB = (data) => ({
    id: data.id,
    displayName: data.display_name,
    profilePicture: data.profile_picture,
    bio: data.bio,
    bioUpdatedAt: data.bio_updated_at,
    chatBubbleColor: data.chat_bubble_color || '#e5c15d',
    bioColor: data.bio_color || '#e5c15d',
    lastSeen: data.last_seen
});

const MessagesPage = () => {
    const { currentUser } = useAuth();
    const isNada = currentUser?.email?.includes('nada');

    // Messages State
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [editMessageId, setEditMessageId] = useState(null);
    const [editText, setEditText] = useState('');
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [oldestTimestamp, setOldestTimestamp] = useState(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // UI State
    const [showEmojis, setShowEmojis] = useState(false);
    const [isFocused, setIsFocused] = useState(false); // Track input focus

    // Add onFocus/onBlur to input
    const handleInputFocus = () => setIsFocused(true);
    const handleInputBlur = () => {
        // Tiny delay to allow focus switch
        setTimeout(() => setIsFocused(false), 200);
    };
    const [showProfile, setShowProfile] = useState(false);
    const [showMyProfile, setShowMyProfile] = useState(false);
    const [interactionState, setInteractionState] = useState({ id: null, mode: null }); // { id: 123, mode: 'reaction' | 'action' }
    const [replyTo, setReplyTo] = useState(null);

    // File Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isViewOnce, setIsViewOnce] = useState(false);
    const [activeViewOnceMsg, setActiveViewOnceMsg] = useState(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null); // Added ref for auto-resize

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [newMessage]);

    // Toast State
    const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Profile State
    const [myProfile, setMyProfile] = useState({});
    const [otherProfile, setOtherProfile] = useState({});
    const [otherUserUid, setOtherUserUid] = useState(null);
    const [myNicknameForOther, setMyNicknameForOther] = useState('');

    const { registerHandler, unregisterHandler } = useBackButton();

    // REGISTER BACK HANDLERS

    // 1. Emoji Picker
    useEffect(() => {
        if (showEmojis) {
            registerHandler('emoji-picker', () => setShowEmojis(false), 20);
        } else {
            unregisterHandler('emoji-picker');
        }
        return () => unregisterHandler('emoji-picker');
    }, [showEmojis]);

    // 2. Profile Modals
    useEffect(() => {
        if (showMyProfile || showProfile) {
            registerHandler('profile-modal', () => {
                setShowMyProfile(false);
                setShowProfile(false);
            }, 30);
        } else {
            unregisterHandler('profile-modal');
        }
        return () => unregisterHandler('profile-modal');
    }, [showMyProfile, showProfile]);

    // 3. Interaction State (Reactions/Actions)
    useEffect(() => {
        if (interactionState.id) {
            registerHandler('interaction-menu', () => setInteractionState({ id: null, mode: null }), 40);
        } else {
            unregisterHandler('interaction-menu');
        }
        return () => unregisterHandler('interaction-menu');
    }, [interactionState.id]);

    // 4. Keyboard / Focused Input (Optional, usually OS handles this, but we can try)
    useEffect(() => {
        if (isFocused) {
            registerHandler('input-focus', () => {
                // Blur inputs
                if (fileInputRef.current) fileInputRef.current.blur();
                // We don't have direct ref to main input? We need one.
                // Assuming valid generic blur logic or finding the active element.
                if (document.activeElement) document.activeElement.blur();
                setIsFocused(false);
            }, 10);
        } else {
            unregisterHandler('input-focus');
        }
        return () => unregisterHandler('input-focus');
    }, [isFocused]);


    // Constants
    const MESSAGES_PER_PAGE = 20;

    // State for Advanced Features
    const { onlineUsers } = usePresence(); // Use Global Presence

    const handleEmojiSelect = (emoji) => {
        setNewMessage(prev => prev + emoji);
    };
    const [typingUsers, setTypingUsers] = useState({});
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    // Determines if the partner is online
    const partnerPresence = otherUserUid ? onlineUsers[otherUserUid] : null;
    const isPartnerOnline = !!partnerPresence;
    const partnerLocation = partnerPresence?.location;
    const isPartnerTyping = otherUserUid && typingUsers[otherUserUid];

    // Helper: Mark messages as read
    const markMessagesAsRead = async (unreadMessages) => {
        if (!unreadMessages || unreadMessages.length === 0) return;

        const now = new Date().toISOString();
        const ids = unreadMessages.map(m => m.id);

        try {
            await supabase
                .from('chat_messages')
                .update({ read: true, read_at: now, delivered_at: now }) // Assume delivered if read
                .in('id', ids);

            // Optimistic update
            setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, read: true, read_at: now, delivered_at: m.delivered_at || now } : m));
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    // Helper: Mark single message as delivered (if received via realtime)
    const markMessageAsDelivered = async (msgId) => {
        try {
            await supabase.from('chat_messages').update({ delivered_at: new Date().toISOString() }).eq('id', msgId);
        } catch (e) { }
    };

    // Typing Effect Only (Presence handled globally)
    useEffect(() => {
        if (!currentUser) return;

        const roomName = 'global_chat_room';
        const channel = supabase.channel(roomName);

        channel
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                setTypingUsers(prev => ({ ...prev, [payload.uid]: payload.isTyping }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    // --- Message Actions Handlers ---

    const handleEditMessage = async () => {
        if (!editMessageId || !editText.trim()) return;

        try {
            const { error } = await supabase
                .from('chat_messages')
                .update({
                    text: editText.trim(),
                    edited_at: new Date().toISOString()
                })
                .eq('id', editMessageId)
                .eq('sender_uid', currentUser.id);

            if (error) throw error;

            // Optimistic Update
            setMessages(prev => prev.map(m => m.id === editMessageId ? { ...m, text: editText.trim(), editedAt: new Date().toISOString() } : m));
            setEditMessageId(null);
            setEditText('');
            showToast("تم تعديل الرسالة بنجاح");
        } catch (err) {
            console.error("Error editing message:", err);
            showToast("فشل تعديل الرسالة", "error");
        }
    };

    const handleDeleteMessage = async (msgId) => {
        // Removed window.confirm as requested

        try {
            const { error } = await supabase
                .from('chat_messages')
                .update({
                    is_deleted: true,
                    text: '', // clear text for security/privacy
                    image: null
                })
                .eq('id', msgId)
                .eq('sender_uid', currentUser.id);

            if (error) throw error;

            // Optimistic Update
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDeleted: true, text: '', image: null } : m));
            showToast("تم حذف الرسالة");
        } catch (err) {
            console.error("Error deleting message:", err);
            showToast("فشل حذف الرسالة", "error");
        }
    };

    // Handle Typing Broadcast
    const handleTypingInput = (e) => {
        setNewMessage(e.target.value);

        if (!isTyping) {
            setIsTyping(true);
            const channel = supabase.getChannels().find(c => c.topic === 'global_chat_room');
            if (channel) channel.send({ type: 'broadcast', event: 'typing', payload: { uid: currentUser.id, isTyping: true } });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            const channel = supabase.getChannels().find(c => c.topic === 'global_chat_room');
            if (channel) channel.send({ type: 'broadcast', event: 'typing', payload: { uid: currentUser.id, isTyping: false } });
        }, 2000);
    };

    // ... (Keep existing loadMessages but add logic to mark read)
    // Modified Load Messages (simplified integration)
    useEffect(() => {
        const loadMessages = async (isLoadMore = false) => {
            if (isLoadMore && (!hasMoreMessages || isLoadingOlder)) return;
            setIsLoadingOlder(isLoadMore);

            let query = supabase.from('chat_messages').select('*').order('timestamp', { ascending: false }).limit(MESSAGES_PER_PAGE);
            if (isLoadMore && oldestTimestamp) query = query.lt('timestamp', oldestTimestamp);

            const { data, error } = await query;

            if (data && !error) {
                const fetchedMsgs = data.reverse().map(mapMessageFromDB);

                if (isLoadMore) {
                    // ... existing pagination logic
                    if (messagesContainerRef.current) {
                        const previousScrollHeight = messagesContainerRef.current.scrollHeight;
                        setMessages(prev => {
                            const newIds = new Set(fetchedMsgs.map(m => m.id));
                            return [...fetchedMsgs, ...prev.filter(m => !newIds.has(m.id))];
                        });
                        requestAnimationFrame(() => {
                            if (messagesContainerRef.current) {
                                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - previousScrollHeight;
                            }
                        });
                    }
                    if (fetchedMsgs.length > 0) setOldestTimestamp(fetchedMsgs[0].timestamp);
                } else {
                    setMessages(fetchedMsgs); // Initial load usually replaces, but in Strict Mode might overlap if not careful.
                    // For initial load, we usually just set. But to be safe against double-invocations:
                    // setMessages(fetchedMsgs); // is fine if we assume fresh start.
                    // But wait, if they say "refresh", maybe something else persists?
                    // Let's stick to setMessages(fetchedMsgs) for initial load as it wipes previous.
                    // Actually, let's just leave this as is for now, main dupes come from pagination/strict mode re-runs.
                    setMessages(fetchedMsgs);
                    setTimeout(scrollToBottom, 100);
                    if (fetchedMsgs.length > 0) setOldestTimestamp(fetchedMsgs[0].timestamp);

                    // MARK UNREAD AS READ (Only those sent by partner)
                    const unread = fetchedMsgs.filter(m => m.senderUid !== currentUser.id && !m.read);
                    markMessagesAsRead(unread);
                }
                setHasMoreMessages(data.length === MESSAGES_PER_PAGE);
            }
            setIsLoadingOlder(false);
            setIsLoadingOlder(false);
        };

        const scrollToBottom = () => {
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
        };

        loadMessages(false);

        const channel = supabase
            .channel('chat_messages')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newMsg = mapMessageFromDB(payload.new);
                    setMessages(prev => {
                        // Prevent duplicates
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    setTimeout(scrollToBottom, 100);

                    // If incoming message is NOT from me, mark as Delivered immediately, and Read if I'm viewing
                    if (newMsg.senderUid !== currentUser.id) {
                        // Mark Delivered
                        markMessageAsDelivered(newMsg.id);
                        // Mark Read (since we are on the page)
                        markMessagesAsRead([newMsg]);
                    }

                } else if (payload.eventType === 'UPDATE') {
                    const updated = mapMessageFromDB(payload.new);
                    setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [currentUser]); // Simplified dependencies

    // Handle scroll to load older messages
    useEffect(() => {
        const handleScroll = (e) => {
            const { scrollTop } = e.target;

            // If scrolled near top (within 200px) and not already loading
            if (scrollTop < 200 && !isLoadingOlder && hasMoreMessages) {
                const loadOlderMessages = async () => { // Renamed to avoid conflict with outer loadMessages
                    if (isLoadingOlder || !hasMoreMessages) return;

                    setIsLoadingOlder(true);

                    let query = supabase
                        .from('chat_messages')
                        .select('*')
                        .order('timestamp', { ascending: false })
                        .limit(MESSAGES_PER_PAGE);

                    if (oldestTimestamp) {
                        query = query.lt('timestamp', oldestTimestamp);
                    }

                    const { data, error } = await query;

                    if (error) {
                        console.error('Error loading older messages:', error);
                        setIsLoadingOlder(false);
                        return;
                    }

                    if (data) {
                        const newMessages = data.reverse().map(mapMessageFromDB);

                        if (messagesContainerRef.current) {
                            const previousScrollHeight = messagesContainerRef.current.scrollHeight;

                            setMessages(prev => {
                                const newIds = new Set(newMessages.map(m => m.id));
                                return [...newMessages, ...prev.filter(m => !newIds.has(m.id))];
                            });

                            requestAnimationFrame(() => {
                                if (messagesContainerRef.current) {
                                    const newScrollHeight = messagesContainerRef.current.scrollHeight;
                                    messagesContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight;
                                }
                            });
                        }

                        if (newMessages.length > 0) {
                            setOldestTimestamp(newMessages[0].timestamp);
                        }

                        setHasMoreMessages(data.length === MESSAGES_PER_PAGE);
                    }

                    setIsLoadingOlder(false);
                };

                loadOlderMessages();
            }
        };

        const currentRef = messagesContainerRef.current;
        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (currentRef) {
                currentRef.removeEventListener('scroll', handleScroll);
            }
        };
    }, [isLoadingOlder, hasMoreMessages, oldestTimestamp]); // Dependencies for handleScroll

    // Load my profile
    useEffect(() => {
        if (!currentUser) return;

        // Initial fetch
        const loadProfile = async () => {
            const { data } = await supabase.from('user_profiles').select('*').eq('id', currentUser.id).single();
            if (data) {
                setMyProfile(mapProfileFromDB(data));
            } else {
                // Initialize default profile
                const defaultProfile = {
                    id: currentUser.id,
                    display_name: isNada ? 'Nada' : 'Hassanen',
                    profile_picture: null,
                    bio: ''
                };
                await supabase.from('user_profiles').insert(defaultProfile);
                setMyProfile(mapProfileFromDB(defaultProfile));
            }
        };
        loadProfile();

        // Realtime
        const channel = supabase
            .channel(`my_profile_${currentUser.id}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'user_profiles', filter: `id=eq.${currentUser.id}` },
                (payload) => {
                    if (payload.new) setMyProfile(mapProfileFromDB(payload.new));
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [currentUser, isNada]);

    // Find and load partner's profile using email-based logic (ROBUST)
    useEffect(() => {
        if (!currentUser) return;

        console.log('🔍 Finding partner profile. I am:', currentUser.email);

        const findPartnerProfile = async () => {
            // Determine partner's email based on my email
            const partnerEmail = currentUser.email.includes('nada')
                ? 'hassanen@love.com'
                : 'nada@love.com';

            const partnerDisplayName = currentUser.email.includes('nada')
                ? 'Hassanen'
                : 'Nada';

            console.log('📧 Looking for partner:', partnerEmail);

            // Use RPC to get partner's UUID by email
            const { data: partnerIdData, error: rpcError } = await supabase
                // FIX: RPC expects parameter named 'email', not 'user_email'
                .rpc('get_user_id_by_email', { email: partnerEmail });

            if (rpcError) {
                console.error('Error calling RPC:', rpcError);
                // Fallback: try to find from messages
                const { data: msgData } = await supabase
                    .from('chat_messages')
                    .select('sender_uid')
                    .neq('sender_uid', currentUser.id)
                    .limit(1);

                if (msgData && msgData.length > 0) {
                    const foundUid = msgData[0].sender_uid;
                    setOtherUserUid(foundUid);
                    await loadPartnerProfile(foundUid, partnerDisplayName);
                } else {
                    // No messages and RPC failed - show default
                    console.warn('⚠️ No way to find partner - showing default');
                    setOtherProfile({
                        displayName: partnerDisplayName,
                        profilePicture: null,
                        bio: ''
                    });
                }
                return;
            }

            if (partnerIdData) {
                console.log('✅ Found partner ID:', partnerIdData);
                setOtherUserUid(partnerIdData);
                await loadPartnerProfile(partnerIdData, partnerDisplayName);
            } else {
                console.warn('⚠️ Partner not found');
                setOtherProfile({
                    displayName: partnerDisplayName,
                    profilePicture: null,
                    bio: ''
                });
            }
        };

        const loadPartnerProfile = async (partnerId, expectedName) => {
            // Fetch partner's profile
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', partnerId)
                .maybeSingle();

            if (profileData) {
                console.log('✅ Partner profile found');
                setOtherProfile(mapProfileFromDB(profileData));
            } else {
                // Create default profile for partner
                console.log('📝 Creating default profile for partner');
                const defaultProfile = {
                    id: partnerId,
                    display_name: expectedName,
                    profile_picture: null,
                    bio: ''
                };

                const { error: insertError } = await supabase
                    .from('user_profiles')
                    .insert(defaultProfile);

                if (!insertError) {
                    setOtherProfile(mapProfileFromDB(defaultProfile));
                }
            }

            // Subscribe to partner's profile changes
            const channel = supabase
                .channel(`partner_profile_${partnerId}`)
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'user_profiles', filter: `id=eq.${partnerId}` },
                    (payload) => {
                        if (payload.new) {
                            console.log('🔄 Partner profile updated');
                            setOtherProfile(mapProfileFromDB(payload.new));
                        }
                    }
                )
                .subscribe();

            return () => supabase.removeChannel(channel);
        };


        findPartnerProfile();
    }, [currentUser, isNada]);

    // Load my nickname for the other person
    useEffect(() => {
        if (!currentUser) return;
        const configKey = isNada ? 'hassanen_config' : 'nada_config';

        const loadNickname = async () => {
            const { data } = await supabase
                .from('user_settings')
                .select('nickname')
                .eq('user_id', currentUser.id)
                .eq('contact_key', configKey)
                .single();

            if (data?.nickname) {
                setMyNicknameForOther(data.nickname);
            } else {
                setMyNicknameForOther(isNada ? 'بشمهندس حسانين ❤️' : 'ندى ❤️');
            }
        };
        loadNickname();
    }, [currentUser, isNada]);

    const handleUpdateMyProfile = async (updates) => {
        if (!currentUser) return;
        // Map updates to snake_case
        const dbUpdates = {};
        if (updates.displayName) dbUpdates.display_name = updates.displayName;
        if (updates.profilePicture) dbUpdates.profile_picture = updates.profilePicture;
        if (updates.bio) dbUpdates.bio = updates.bio;
        if (updates.bioUpdatedAt) dbUpdates.bio_updated_at = updates.bioUpdatedAt;
        if (updates.chatBubbleColor) dbUpdates.chat_bubble_color = updates.chatBubbleColor;
        if (updates.bioColor) dbUpdates.bio_color = updates.bioColor;

        await supabase.from('user_profiles').update(dbUpdates).eq('id', currentUser.id);
    };

    const handleUpdateNickname = async (newNick) => {
        if (!currentUser) return;
        const configKey = isNada ? 'hassanen_config' : 'nada_config';

        // Upsert nickname
        const { data } = await supabase
            .from('user_settings')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('contact_key', configKey)
            .single();

        if (data) {
            await supabase.from('user_settings').update({ nickname: newNick }).eq('id', data.id);
        } else {
            await supabase.from('user_settings').insert({
                user_id: currentUser.id,
                contact_key: configKey,
                nickname: newNick
            });
        }
        setMyNicknameForOther(newNick);
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await supabase.from('chat_messages').insert({
                text: newMessage,
                sender_uid: currentUser.id,
                sender_name: myProfile.displayName,
                type: 'text',
                read: false,
                reply_to: replyTo ? { id: replyTo.id, text: replyTo.text, senderName: replyTo.senderName, senderUid: replyTo.senderUid } : null
            });
            setNewMessage(''); setReplyTo(null); setShowEmojis(false);
        } catch (error) { console.error(error); }
    };

    const handleConfirmSendImage = async (caption) => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            // Compress image before upload for faster loading in chat
            const compressedFile = await compressImage(selectedFile, 2); // Max 2MB

            // Upload to Cloudinary
            const result = await uploadToCloudinary(compressedFile, {
                folder: 'chat-images',
                onProgress: (percent) => {
                    console.log(`Chat image upload: ${percent}%`);
                }
            });

            // Save message with Cloudinary URL
            await supabase.from('chat_messages').insert({
                image: result.url,
                text: caption || '',
                sender_uid: currentUser.id,
                sender_name: myProfile.displayName,
                type: 'image',
                read: false,
                is_view_once: isViewOnce
            });

            setIsViewOnce(false); // Reset

            setSelectedFile(null);
            console.log('✅ Chat image sent via Cloudinary');
        } catch (err) {
            console.error('Error uploading chat image:', err);
            alert('فشل إرسال الصورة: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleReaction = async (msgId, reaction) => {
        try {
            await supabase.from('chat_messages').update({ reaction }).eq('id', msgId);
            setSelectedMsgId(null);
        } catch (e) { }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const isSameDay = (d1Str, d2Str) => {
        if (!d1Str || !d2Str) return false;
        return new Date(d1Str).toDateString() === new Date(d2Str).toDateString();
    };

    const handleOpenViewOnce = (msg) => {
        setActiveViewOnceMsg(msg);
    };

    const handleCloseViewOnce = async () => {
        if (!activeViewOnceMsg) return;
        const msgId = activeViewOnceMsg.id;
        setActiveViewOnceMsg(null);

        // Burn it
        try {
            await supabase.from('chat_messages').update({ viewed_at: new Date().toISOString() }).eq('id', msgId);
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, viewedAt: new Date().toISOString() } : m));
        } catch (e) { console.error(e); }
    };

    // Update messages to include onOpenViewOnce handler
    const displayedMessages = messages.map(m => ({ ...m, onOpenViewOnce: handleOpenViewOnce }));

    // Display name: use nickname if set, otherwise use real name
    const displayName = myNicknameForOther || otherProfile.displayName;

    const getLastSeenText = (dateString) => {
        if (!dateString) return 'غير متصل';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'كان متصلاً قبل لحظات';
        if (diffMins < 60) return `آخر ظهور منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `آخر ظهور منذ ${diffHours} ساعة`;
        if (diffDays === 1) return 'آخر ظهور أمس';
        return `آخر ظهور ${date.toLocaleDateString('ar-EG')}`;
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-[#0a0a0a] flex flex-col font-cairo overflow-hidden">
            <AnimatePresence>
                <MyProfileModal key="my-profile-modal" isOpen={showMyProfile} onClose={() => setShowMyProfile(false)} myProfile={myProfile} onUpdate={handleUpdateMyProfile} />
                <ProfileModal key="profile-modal" isOpen={showProfile} onClose={() => setShowProfile(false)} otherProfile={otherProfile} myNickname={myNicknameForOther} onSaveNickname={handleUpdateNickname} />
                {selectedFile && (
                    <ImagePreviewModal
                        key="image-preview"
                        file={selectedFile}
                        onClose={() => { setSelectedFile(null); setIsViewOnce(false); }}
                        onSend={handleConfirmSendImage}
                        uploading={uploading}
                        isViewOnce={isViewOnce}
                        onToggleViewOnce={() => setIsViewOnce(!isViewOnce)}
                    />
                )}
                {activeViewOnceMsg && <ViewOnceModal key="view-once" imageUrl={activeViewOnceMsg.image} onClose={handleCloseViewOnce} />}

                {/* Edit Modal */}
                {editMessageId && (
                    <motion.div key="edit-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Edit2 size={18} className="text-blue-400" /> تعديل الرسالة</h3>
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none min-h-[100px] resize-none mb-4"
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setEditMessageId(null)} className="px-4 py-2 rounded-xl text-gray-400 hover:bg-white/5 transition">إلغاء</button>
                                <button onClick={handleEditMessage} className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition">حفظ التعديل</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

            </AnimatePresence>

            {/* Custom Toast - Rendered outside modal AnimatePresence */}
            <AnimatePresence>
                {toast && <Toast key="toast-notification" message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            {/* Header */}
            <div className="flex-none h-16 bg-[#121212]/95 backdrop-blur border-b border-white/5 flex items-center px-4 justify-between z-30 shadow-md pt-safe-top">
                <button onClick={() => setShowMyProfile(true)} className="p-2 hover:bg-white/10 rounded-full transition">
                    <UserIcon size={20} className="text-gold" />
                </button>

                <div className="flex items-center gap-3 flex-1 justify-center cursor-pointer" onClick={() => setShowProfile(true)}>
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold/20 bg-gray-800 flex items-center justify-center">
                            {otherProfile.profilePicture ? <img src={otherProfile.profilePicture} className="w-full h-full object-cover" /> :
                                <div className="w-full h-full bg-gradient-to-br from-gold to-yellow-800 flex items-center justify-center text-black font-bold text-sm">
                                    {otherProfile.displayName?.[0] || (isNada ? 'H' : 'N')}
                                </div>}
                        </div>
                        {isPartnerOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#121212] rounded-full"></span>}
                    </div>
                    <div className="text-center">
                        <h1 className="text-white font-bold text-sm leading-tight">{displayName}</h1>
                        <div className="h-4 flex items-center justify-center">
                            {isPartnerTyping ? (
                                <span className="text-green-400 text-[10px] font-bold animate-pulse">جاري الكتابة...</span>
                            ) : isPartnerOnline ? (
                                <span className="text-gray-400 text-[10px] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                                    متصل الآن {partnerLocation ? `- ${partnerLocation}` : ''}
                                </span>
                            ) : (
                                <span className="text-gray-500 text-[10px]">{getLastSeenText(otherProfile.lastSeen)}</span>
                            )}
                        </div>
                        {otherProfile.bio && (
                            <div className="w-48 overflow-hidden relative h-5 mt-0.5">
                                <div
                                    className={`whitespace-nowrap ${otherProfile.bio.length > 35 ? 'animate-marquee' : 'text-center'} text-xs font-bold`}
                                    style={{ color: otherProfile.bioColor || '#e5c15d' }}
                                >
                                    {otherProfile.bio}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-40 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                <div className="space-y-1">
                    {/* Loading Indicator */}
                    {isLoadingOlder && (
                        <div className="text-center py-3 mb-2">
                            <div className="inline-flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-gold/20">
                                <Loader2 className="animate-spin text-gold" size={16} />
                                <span className="text-gray-300 text-xs">جاري تحميل رسائل قديمة...</span>
                            </div>
                        </div>
                    )}

                    {displayedMessages.map((msg, index) => {
                        const isMe = msg.senderUid === currentUser?.id;
                        const prevMsg = displayedMessages[index - 1];
                        const showDate = !prevMsg || !isSameDay(msg.timestamp, prevMsg.timestamp);
                        return (
                            <div key={msg.id}>
                                {showDate && msg.timestamp && (
                                    <div className="flex justify-center my-6 opacity-60"><span className="bg-black/40 text-[10px] px-2 py-0.5 rounded-full border border-white/5">{formatDate(msg.timestamp)}</span></div>
                                )}
                                <MessageItem
                                    msg={msg}
                                    isMe={isMe}
                                    interactionState={interactionState}
                                    onReaction={(msgId, reaction) => {
                                        if (reaction) {
                                            handleReaction(msgId, reaction);
                                            setInteractionState({ id: null, mode: null });
                                        } else if (msgId) {
                                            setInteractionState({ id: msgId, mode: 'reaction' });
                                        } else {
                                            setInteractionState({ id: null, mode: null });
                                        }
                                    }}
                                    onAction={(msgOrId, action) => {
                                        if (action === 'edit' && typeof msgOrId === 'object') {
                                            const msg = msgOrId;
                                            setEditMessageId(msg.id);
                                            setEditText(msg.text);
                                            setInteractionState({ id: null, mode: null });
                                        } else if (action === 'delete') {
                                            // Handle both object and ID (MessageItem passes ID for delete now, but just in case)
                                            const idToDelete = typeof msgOrId === 'object' ? msgOrId.id : msgOrId;
                                            handleDeleteMessage(idToDelete);
                                            setInteractionState({ id: null, mode: null });
                                        } else if (msgOrId) {
                                            // Opening the menu
                                            setInteractionState({ id: msgOrId, mode: 'action' });
                                        } else {
                                            // Closing
                                            setInteractionState({ id: null, mode: null });
                                        }
                                    }}
                                    onReply={setReplyTo}
                                    bubbleColor={isMe ? myProfile.chatBubbleColor : otherProfile.chatBubbleColor}
                                />
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            {/* Input - Dynamic Bottom Position - High Z-Index to cover Nav */}
            {/* Input - Portal to Body to escape all parent transforms/overflows */}
            {createPortal(
                <div className={`fixed left-0 right-0 z-[9999] transition-none ${isFocused ? 'bottom-0' : 'bottom-[80px]'}`} style={{ position: 'fixed', bottom: isFocused ? '0px' : '80px', willChange: 'bottom' }}>
                    <div className="bg-[#121212] border-t border-white/5 w-full pb-safe-bottom">
                        <AnimatePresence>
                            {replyTo && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-[#1a1a1a] border-b border-white/5 px-4 py-2 flex justify-between items-center">
                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                        <Reply size={16} className="text-gold flex-none" />
                                        <div className="border-l-2 border-gold pl-2 text-xs flex-1 min-w-0">
                                            <span className="text-gold font-bold block">الرد على {replyTo.senderUid === currentUser?.id ? 'نفسك' : displayName}</span>
                                            <span className="text-gray-400 truncate block">{replyTo.text || '📷 صورة'}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/10 rounded-full flex-none"><X size={16} className="text-gray-400" /></button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="p-2">
                            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(e); }} className="flex gap-2 items-end max-w-4xl mx-auto">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gold bg-[#1a1a1a] rounded-full hover:bg-gold/10 flex-none self-end"><Paperclip size={20} /></button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} />
                                <div className="relative flex-1 bg-[#1a1a1a] rounded-2xl flex items-center border border-white/5 px-1 min-h-[50px] max-h-32">
                                    <button type="button" onClick={() => { document.activeElement.blur(); setShowEmojis(!showEmojis); }} className="p-2 text-gray-400 hover:text-white self-end"><Smile size={20} /></button>
                                    <textarea
                                        ref={textareaRef}
                                        value={newMessage}
                                        onChange={handleTypingInput}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setTimeout(() => setIsFocused(false), 100)}
                                        placeholder="اكتب رسالة..."
                                        className="flex-1 bg-transparent p-3 max-h-28 min-h-[44px] outline-none text-white resize-none text-sm custom-scrollbar"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                        rows={1}
                                    />

                                    {/* Emoji Picker Anchored Here */}
                                    <AnimatePresence>
                                        {showEmojis && (
                                            <>
                                                {/* Invisible Backdrop to close on outside click */}
                                                <div
                                                    className="fixed inset-0 z-[95] cursor-default"
                                                    onClick={(e) => { e.stopPropagation(); setShowEmojis(false); }}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    className="absolute bottom-full right-0 mb-2 z-[100]"
                                                >
                                                    <div className="shadow-2xl rounded-2xl overflow-hidden border border-gold/20">
                                                        <EmojiPicker
                                                            onEmojiClick={(emojiData) => {
                                                                setNewMessage(prev => prev + emojiData.emoji);
                                                            }}
                                                            theme="dark"
                                                            searchDisabled={true}
                                                            skinTonesDisabled
                                                            height={350}
                                                            width="100%"
                                                            previewConfig={{ showPreview: false }}
                                                        />
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() && !selectedFile}
                                    className={`p-3 rounded-full flex-none transition-all duration-300 ${newMessage.trim() || selectedFile
                                        ? 'bg-gold text-black hover:scale-110 shadow-[0_0_15px_rgba(197,160,89,0.5)]'
                                        : 'bg-[#1a1a1a] text-gray-500'
                                        }`}
                                >
                                    <Send size={20} className={newMessage.trim() || selectedFile ? 'fill-current' : ''} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </div >

    );
};

export default MessagesPage;
