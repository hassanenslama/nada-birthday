import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Trash2, Folder, Image as ImageIcon, Loader2, Lock, Eye, Edit2, EyeOff, Unlock } from 'lucide-react';
import EditMediaModal from './modals/EditMediaModal';
import ConfirmationModal from './modals/ConfirmationModal';
import { timelineData } from '../../../data/timeline';

const GalleryManager = ({ onToast, nadaUserId }) => {
    const [albums, setAlbums] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [unlockedIds, setUnlockedIds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Edit State
    const [editingPhoto, setEditingPhoto] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Confirmation State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        type: null, // 'album' | 'photo'
        id: null
    });

    useEffect(() => {
        console.log("🔍 GalleryManager: nadaUserId =", nadaUserId);
        fetchData();
    }, [nadaUserId]);

    const fetchData = async () => {
        setIsLoading(true);
        const { data: albumsData } = await supabase.from('albums').select('*').order('created_at', { ascending: false });
        const { data: photosData } = await supabase.from('gallery_media').select('*').order('created_at', { ascending: false });

        // Fetch unlocked memories for Nada
        if (nadaUserId) {
            console.log("📥 Fetching unlocked memories for:", nadaUserId);
            const { data: unlockedData, error } = await supabase
                .from('unlocked_memories')
                .select('ids')
                .eq('user_id', nadaUserId)
                .maybeSingle();

            if (error) {
                console.error("❌ Error fetching unlocked memories:", error);
            } else {
                const ids = unlockedData?.ids?.map(Number) || [];
                console.log("✅ Loaded unlocked IDs:", ids);
                setUnlockedIds(ids);
            }
        } else {
            console.warn("⚠️ nadaUserId is not set! Cannot fetch unlocked memories.");
            setUnlockedIds([]);
        }

        if (albumsData) setAlbums(albumsData);
        if (photosData) setPhotos(photosData);
        setIsLoading(false);
    };

    const confirmDelete = (type, id) => {
        setDeleteModal({
            isOpen: true,
            type,
            id
        });
    };

    const executeDelete = async () => {
        const { type, id } = deleteModal;

        if (type === 'album') {
            const { error } = await supabase.from('albums').delete().eq('id', id);
            if (error) {
                console.error(error);
                onToast('فشل حذف الألبوم', 'error');
            } else {
                setAlbums(prev => prev.filter(a => a.id !== id));
                onToast('تم حذف الألبوم بنجاح', 'success');
                fetchData();
            }
        } else if (type === 'photo') {
            const { error } = await supabase.from('gallery_media').delete().eq('id', id);
            if (error) {
                console.error(error);
                onToast('فشل حذف الصورة', 'error');
            } else {
                setPhotos(prev => prev.filter(p => p.id !== id));
                onToast('تم حذف الصورة بنجاح', 'success');
            }
        }

        setDeleteModal({ isOpen: false, type: null, id: null });
    };

    const handleToggleLock = async (photo) => {
        const newStatus = !photo.is_locked;
        const { error } = await supabase
            .from('gallery_media')
            .update({ is_locked: newStatus })
            .eq('id', photo.id);

        if (error) {
            console.error(error);
            onToast('فشل تغيير حالة القفل', 'error');
        } else {
            setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, is_locked: newStatus } : p));
            onToast(newStatus ? 'تم قفل الصورة 🔒' : 'تم فتح الصورة 👁️', 'success');
        }
    };

    const handleToggleTimelineLock = async (memoryId, isCurrentlyUnlocked) => {
        if (!nadaUserId) {
            onToast('لازم تربط حساب ندى الأول! ⚠️', 'error');
            return;
        }

        try {
            let newIds;
            if (isCurrentlyUnlocked) {
                // Lock it (remove from unlocked list)
                newIds = unlockedIds.filter(id => id !== memoryId);
            } else {
                // Unlock it (add to unlocked list)
                newIds = [...new Set([...unlockedIds, memoryId])];
            }

            const { error } = await supabase
                .from('unlocked_memories')
                .upsert({
                    user_id: nadaUserId,
                    ids: newIds,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) {
                console.error(error);
                onToast('فشل تغيير حالة القفل', 'error');
            } else {
                setUnlockedIds(newIds);
                onToast(isCurrentlyUnlocked ? 'تم قفل الصورة 🔒' : 'تم فتح الصورة 👁️', 'success');
            }
        } catch (e) {
            console.error(e);
            onToast('حدث خطأ', 'error');
        }
    };

    const openEditModal = (photo) => {
        setEditingPhoto(photo);
        setIsEditModalOpen(true);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 flex justify-center"><Loader2 className="animate-spin text-gold" /></div>;

    return (
        <div className="space-y-8 font-cairo">

            {/* Albums Manager */}
            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 mb-4 text-white">
                    <Folder className="text-gold" />
                    <h3 className="text-xl font-bold">إدارة الألبومات ({albums.length})</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {albums.map(album => (
                        <div key={album.id} className="bg-black/40 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:border-white/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                                    {album.cover_image ? (
                                        <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500"><ImageIcon size={16} /></div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-white font-bold text-sm truncate">{album.title}</h4>
                                    <span className="text-xs text-gray-500 block">{album.is_system ? 'نظام' : 'مخصص'}</span>
                                    <span className="text-[10px] text-gray-600 block">
                                        {photos.filter(p => p.album_id === album.id).length} صور
                                    </span>
                                </div>
                            </div>

                            {!album.is_system && (
                                <button
                                    onClick={() => confirmDelete('album', album.id)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="حذف الألبوم"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Combined Photos Manager (Timeline + Gallery Photos) */}
            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-6 text-white">
                    <div className="flex items-center gap-3">
                        <ImageIcon className="text-gold" />
                        <h3 className="text-xl font-bold">إدارة كل الصور ({timelineData.length + photos.length})</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Timeline: {unlockedIds.length}/{timelineData.length} مفتوحة</span>
                        <span>•</span>
                        <span>Gallery: {photos.length} صورة</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {/* Timeline Photos */}
                    {timelineData.map(memory => {
                        const isUnlocked = unlockedIds.includes(Number(memory.id));

                        return (
                            <div key={`timeline-${memory.id}`} className="group relative bg-black/60 rounded-xl overflow-hidden border border-blue-400/20 hover:border-blue-400/50 transition-all duration-300">
                                <div className="relative aspect-square">
                                    <img
                                        src={memory.image}
                                        alt={memory.title}
                                        className={`w-full h-full object-cover transition-all duration-500 ${!isUnlocked ? 'blur-sm grayscale opacity-50' : ''}`}
                                    />
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <Lock className="text-white/50" size={24} />
                                        </div>
                                    )}

                                    {/* Timeline Badge */}
                                    <div className="absolute top-2 left-2 bg-blue-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                                        TIMELINE
                                    </div>

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                        <h4 className="text-white text-xs font-bold text-center line-clamp-2">{memory.title}</h4>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleTimelineLock(Number(memory.id), isUnlocked)}
                                                className={`p-2 rounded-full transition-colors ${isUnlocked ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white' : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'}`}
                                                title={isUnlocked ? 'قفل' : 'فتح'}
                                            >
                                                {isUnlocked ? <Lock size={14} /> : <Unlock size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Gallery Photos */}
                    {photos.map(photo => (
                        <div key={`gallery-${photo.id}`} className="group relative bg-black/60 rounded-xl overflow-hidden border border-gold/20 hover:border-gold/50 transition-all duration-300">
                            <div className="relative aspect-square">
                                <img
                                    src={photo.url}
                                    alt={photo.title}
                                    className={`w-full h-full object-cover transition-all duration-500 ${photo.is_locked ? 'blur-sm grayscale opacity-50' : ''}`}
                                />
                                {photo.is_locked && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <Lock className="text-white/50" size={24} />
                                    </div>
                                )}

                                {/* Gallery Badge */}
                                <div className="absolute top-2 left-2 bg-gold/90 text-black text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    GALLERY
                                </div>

                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                    <h4 className="text-white text-xs font-bold text-center line-clamp-2">{photo.title || 'بدون عنوان'}</h4>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => openEditModal(photo)}
                                            className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-full transition-colors"
                                            title="تعديل"
                                        >
                                            <Edit2 size={14} />
                                        </button>

                                        <button
                                            onClick={() => handleToggleLock(photo)}
                                            className={`p-1.5 rounded-full transition-colors ${photo.is_locked ? 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white' : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white'}`}
                                            title={photo.is_locked ? 'فتح' : 'قفل'}
                                        >
                                            {photo.is_locked ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>

                                        <button
                                            onClick={() => confirmDelete('photo', photo.id)}
                                            className="p-1.5 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <EditMediaModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                mediaItem={editingPhoto}
                onUpdate={fetchData}
            />

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, type: null, id: null })}
                onConfirm={executeDelete}
                title={deleteModal.type === 'album' ? 'حذف الألبوم' : 'حذف الصورة'}
                message={deleteModal.type === 'album' ? 'هل أنت متأكد من حذف هذا الألبوم؟ سيتم حذف جميع الصور بداخله نهائياً.' : 'هل أنت متأكد من حذف هذه الصورة نهائياً؟'}
                isDangerous={true}
            />
        </div>
    );
};

export default GalleryManager;
