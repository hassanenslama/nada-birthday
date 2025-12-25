import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Grid, FolderOpen, ArrowRight, Loader, HeartCrack } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import { useSiteStatus } from '../../../context/SiteStatusContext';
import AlbumCard from './AlbumCard';
import PhotoGrid from './PhotoGrid';
import UploadModal from './UploadModal';
import CreateAlbumModal from './CreateAlbumModal';
import Lightbox from './Lightbox';

import { timelineData } from '../../../data/timeline';

const MemoriesGallery = () => {
    const { userRole, currentUser } = useAuth(); // Need currentUser for fetching unlocks
    const { isShutdown } = useSiteStatus();
    const isAdmin = userRole === 'admin';

    // View State: 'albums' | 'grid'
    const [viewMode, setViewMode] = useState('albums');
    const [selectedAlbum, setSelectedAlbum] = useState(null); // specific album or null for all

    // Data State
    const [albums, setAlbums] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unlockedIds, setUnlockedIds] = useState([]); // Store unlocked memory IDs

    // UI State
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false);
    const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState(null);

    // Fetch Initial Data
    useEffect(() => {
        console.log("🎬 MemoriesGallery mounted, currentUser:", currentUser?.id);
        fetchAlbums();
        fetchPhotos();
        fetchUnlockedMemories();

        if (!currentUser) {
            console.warn("⚠️ No currentUser - skipping subscription");
            return;
        }

        console.log("📡 Setting up Realtime subscriptions for user:", currentUser.id);

        // Subscribe to changes
        const subscription = supabase
            .channel('gallery_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_media' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setPhotos(prev => [payload.new, ...prev]);
                } else if (payload.eventType === 'DELETE') {
                    setPhotos(prev => prev.filter(p => p.id !== payload.old.id));
                } else if (payload.eventType === 'UPDATE') {
                    setPhotos(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'albums' }, (payload) => {
                // For albums, volume is low enough that re-fetching is fine and safer for complex structure
                fetchAlbums();
            })
            // Listen for UNLOCKED MEMORIES changes (Game or Admin action)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'unlocked_memories', filter: `user_id=eq.${currentUser.id}` }, (payload) => {
                console.log("🔔 Gallery received unlock update:", payload);
                if (payload.new && payload.new.ids) {
                    const ids = payload.new.ids.map(Number);
                    console.log("📸 Applying new unlocked IDs:", ids);
                    setUnlockedIds(ids);
                }
            })
            .subscribe((status) => {
                console.log("📡 Gallery subscription status:", status);
            });

        return () => {
            console.log("🔌 Gallery unsubscribing...");
            subscription.unsubscribe();
        };
    }, [currentUser?.id]); // Re-run when user changes

    const fetchAlbums = async () => {
        const { data } = await supabase.from('albums').select('*').order('created_at', { ascending: false });
        if (data) setAlbums(data);
    };

    const fetchPhotos = async () => {
        setIsLoading(true);
        const { data } = await supabase.from('gallery_media').select('*').order('date', { ascending: false });
        if (data) setPhotos(data);
        setIsLoading(false);
    };

    const fetchUnlockedMemories = async () => {
        if (!currentUser) {
            console.log("fetchUnlockedMemories: No current user");
            return;
        }
        console.log("Fetching unlocked memories for user:", currentUser.id);
        const { data, error } = await supabase
            .from('unlocked_memories')
            .select('ids')
            .eq('user_id', currentUser.id)
            .maybeSingle();

        if (error) {
            console.error("Error fetching unlocked memories:", error);
            return;
        }

        if (data && data.ids) {
            const ids = data.ids.map(Number);
            console.log("Loaded unlocked IDs:", ids);
            setUnlockedIds(ids);
        } else {
            console.log("No unlocked memories found, setting to empty array");
            setUnlockedIds([]);
        }
    };

    const deleteAlbum = async (albumId) => {
        const { error } = await supabase.from('albums').delete().eq('id', albumId);
        if (error) {
            console.error('Error deleting album:', error);
            alert('حدث خطأ أثناء حذف الألبوم');
        } else {
            fetchAlbums();
            if (selectedAlbum?.id === albumId) setSelectedAlbum(null); // Reset view if deleting active album
        }
    };

    // Filter Logic - wrapped in useMemo to prevent infinite loops
    const displayedPhotos = useMemo(() => {
        console.log("🔄 Recalculating displayedPhotos...");

        if (!selectedAlbum) {
            console.log("📋 No album selected, showing all photos");
            return photos;
        }

        console.log("📁 Selected album:", selectedAlbum.id);

        if (selectedAlbum.id === 'timeline') {
            console.log("🎯 Processing Timeline album");
            console.log("Current unlockedIds:", unlockedIds);
            console.log("Is Admin?", isAdmin);

            const result = timelineData.map(item => {
                const itemId = Number(item.id);
                const unlockedIdsAsNumbers = unlockedIds.map(Number);
                const isLocked = !unlockedIdsAsNumbers.includes(itemId) && !isAdmin;

                if (itemId <= 3) { // Log first 3 for debugging
                    console.log(`Photo ${itemId}: locked=${isLocked}, inArray=${unlockedIdsAsNumbers.includes(itemId)}`);
                }

                return {
                    id: item.id,
                    url: item.image,
                    caption: item.description,
                    title: item.title,
                    is_video: false,
                    date: item.date,
                    is_timeline: true,
                    is_locked: isLocked
                };
            });

            console.log("📸 Timeline stats:");
            console.log(`  - Total: ${result.length}`);
            console.log(`  - Unlocked: ${result.filter(p => !p.is_locked).length}`);
            console.log(`  - Locked: ${result.filter(p => p.is_locked).length}`);

            return result;
        }

        if (selectedAlbum.id === 'game_memories') {
            // (Legacy/Fallback)
            return timelineData
                .filter(item => unlockedIds.includes(item.id))
                .map(item => ({
                    id: `timeline-${item.id}`,
                    url: item.image,
                    caption: item.description,
                    title: item.title,
                    is_video: false,
                    date: item.date,
                    is_timeline: true
                }));
        }

        // Default: filter by album_id
        return photos.filter(p => p.album_id === selectedAlbum.id);
    }, [selectedAlbum, photos, unlockedIds, isAdmin]); // Dependencies for useMemo

    // Handlers
    const handleAlbumClick = (album) => {
        setSelectedAlbum(album);
        setViewMode('grid');
    };

    const handleViewAll = () => {
        setSelectedAlbum(null);
        setViewMode('grid');
    };

    const handleBackToAlbums = () => {
        setViewMode('albums');
        setSelectedAlbum(null);
    };

    const openLightbox = (photo) => {
        const index = displayedPhotos.findIndex(p => p.id === photo.id);
        setLightboxPhotoIndex(index);
    };

    const handleNextPhoto = () => {
        setLightboxPhotoIndex(prev => (prev < displayedPhotos.length - 1 ? prev + 1 : prev));
    };

    const handlePrevPhoto = () => {
        setLightboxPhotoIndex(prev => (prev > 0 ? prev - 1 : prev));
    };

    return (
        <div className={`min-h-screen bg-[#0a0a0a] text-white p-4 pb-20 md:p-8 transition-all duration-500 ${isShutdown ? 'grayscale' : ''}`}>
            {/* Header */}
            <div className={`flex items-center justify-between mb-8 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-40 py-4 border-b border-white/5 ${isShutdown ? 'grayscale' : ''}`}>
                <div className="flex items-center gap-4">
                    {viewMode === 'grid' && (
                        <button
                            onClick={handleBackToAlbums}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <ArrowRight size={20} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold font-cairo text-gold">
                            {viewMode === 'albums' ? 'متحف الذكريات' : (selectedAlbum ? selectedAlbum.title : 'كل الصور')}
                        </h1>
                        <p className="text-gray-400 text-xs font-cairo">
                            {viewMode === 'albums'
                                ? `${albums.length} ألبومات • ${photos.length} صورة`
                                : `${displayedPhotos.length} صورة`}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => !isShutdown && setIsCreateAlbumOpen(true)}
                        disabled={isShutdown}
                        className={`bg-white/5 text-white transition-all px-4 py-2 rounded-xl flex items-center gap-2 font-bold font-cairo text-sm border border-white/10 ${isShutdown ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
                    >
                        <Plus size={18} />
                        <span className="hidden md:inline">ألبوم جديد</span>
                    </button>

                    {isShutdown ? (
                        <button
                            disabled
                            className="bg-gray-800 text-gray-500 px-4 py-2 rounded-xl flex items-center gap-2 font-bold font-cairo text-sm border border-gray-700 cursor-not-allowed"
                        >
                            <HeartCrack size={18} />
                            <span className="hidden md:inline">معدش بينا ذكريات 💔</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="bg-gold/10 text-gold hover:bg-gold hover:text-black transition-all px-4 py-2 rounded-xl flex items-center gap-2 font-bold font-cairo text-sm border border-gold/20"
                        >
                            <Plus size={18} />
                            <span className="hidden md:inline">إضافة ذكرى</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader className="animate-spin text-gold" size={32} />
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {viewMode === 'albums' ? (
                        <motion.div
                            key="albums"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                        >
                            {/* "All Photos" System Card - Hidden for cleaner UI */}
                            {/* <AlbumCard
                                album={{
                                    title: 'كل الصور',
                                    cover_image: photos[0]?.url,
                                    created_at: new Date(),
                                    is_system: true
                                }}
                                onClick={handleViewAll}
                            /> */}

                            {/* "Timeline" System Card - The one relevant to the Game */}
                            <AlbumCard
                                album={{
                                    id: 'timeline',
                                    title: 'ذكرياتنا (التايم لاين)',
                                    cover_image: timelineData[0]?.image,
                                    created_at: new Date(),
                                    is_system: true
                                }}
                                onClick={() => handleAlbumClick({ id: 'timeline', title: 'ذكرياتنا (التايم لاين)' })}
                            />

                            {/* Actual Albums - Exclude any timeline duplicates */}
                            {albums
                                .filter(album =>
                                    album.id !== 'timeline' &&
                                    !album.title?.includes('تايم') &&
                                    !album.title?.includes('Timeline')
                                )
                                .map(album => (
                                    <AlbumCard
                                        key={album.id}
                                        album={album}
                                        onClick={() => handleAlbumClick(album)}
                                        // Pass Delete Handler ONLY if Admin
                                        onDelete={isAdmin ? deleteAlbum : null}
                                    />
                                ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {displayedPhotos.length > 0 ? (
                                <PhotoGrid
                                    photos={displayedPhotos}
                                    onPhotoClick={(photo) => {
                                        if (photo.is_locked) {
                                            if (isAdmin) {
                                                // Admin can open anyway
                                                openLightbox(photo);
                                            } else {
                                                // Show beautiful notification instead of alert
                                                window.dispatchEvent(new CustomEvent('showNotification', {
                                                    detail: {
                                                        title: 'هذه الذاكرة مقفولة 🔒',
                                                        body: 'العبي "تجميع الصور" عشان تفتحيها 😊',
                                                        type: 'locked'
                                                    }
                                                }));
                                            }
                                        } else {
                                            openLightbox(photo);
                                        }
                                    }}
                                />
                            ) : (
                                <div className="text-center py-20 text-gray-500 font-cairo">
                                    <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>لا توجد صور في هذا الألبوم حتى الآن</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Modals */}
            <CreateAlbumModal
                isOpen={isCreateAlbumOpen}
                onClose={() => setIsCreateAlbumOpen(false)}
                onAlbumCreated={fetchAlbums}
            />

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                albums={albums}
                currentAlbumId={selectedAlbum?.id}
                onUploadComplete={() => {
                    fetchPhotos();
                }}
            />

            {/* Lightbox */}
            {lightboxPhotoIndex !== null && (
                <Lightbox
                    photo={displayedPhotos[lightboxPhotoIndex]}
                    onClose={() => setLightboxPhotoIndex(null)}
                    onNext={handleNextPhoto}
                    onPrev={handlePrevPhoto}
                    hasNext={lightboxPhotoIndex < displayedPhotos.length - 1}
                    hasPrev={lightboxPhotoIndex > 0}
                    // Pass Handlers ONLY if Admin
                    onDelete={isAdmin ? (id) => {
                        fetchPhotos();
                        setLightboxPhotoIndex(null);
                    } : null}
                    onUpdate={isAdmin ? fetchPhotos : null}
                />
            )}
        </div>
    );
};

export default MemoriesGallery;
