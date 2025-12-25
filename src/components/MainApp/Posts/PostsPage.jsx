import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import { Loader2, Sparkles, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useSiteStatus } from '../../../context/SiteStatusContext';

const PostsPage = () => {
    const { isShutdown } = useSiteStatus();
    const [filter, setFilter] = useState('all'); // 'all', 'nada', 'hassanen'
    const { currentUser } = useAuth();
    const [selectedImage, setSelectedImage] = useState(null);

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Touch/Pull Refs
    const pullStartPoint = React.useRef(0);
    const pullChange = React.useRef(0);
    const refreshRef = React.useRef(null);


    // We need useAuth here to check ownership for secrets
    // Re-importing useAuth if not present or assuming checking against post.user_id
    // But currentUser is needed for fetch logic ideally or client side filtering.
    // Client side filtering for secrets is insecure but effective for UI. 
    // Server side is better. RLS should handle it, but I'll add logic here for now.

    // FETCH LOGIC
    const fetchPosts = async (showLoader = true) => {
        if (showLoader) setLoading(true);

        let query = supabase
            .from('posts')
            .select('*, user_profiles(display_name, avatar_url, id)')
            .neq('is_deleted', true)
            .order('created_at', { ascending: false });

        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await query;

        if (!error && data) {
            let filteredPosts = data.filter(post => {
                // 1. Secret Logic: Show if public OR if I am the owner
                const isOwner = user && post.user_id === user.id;
                if (post.is_secret && !isOwner) return false;
                return true;
            });

            // 2. Tab Filter Logic
            // Need to know which ID is Nada and which is Hassanen.
            // Assumption: rely on user_profiles.display_name or similar.
            // Or better: Filter by user_id if we knew them.
            // For now, I'll filter by display name loosely or if the user set it up.
            // "Nada" vs "Hassanen".

            if (filter === 'nada') {
                filteredPosts = filteredPosts.filter(p => p.user_profiles?.display_name?.toLowerCase().includes('nada') || p.user_profiles?.display_name?.includes('ندى'));
            } else if (filter === 'hassanen') {
                filteredPosts = filteredPosts.filter(p => p.user_profiles?.display_name?.toLowerCase().includes('hassanen') || p.user_profiles?.display_name?.includes('حسانين'));
            }

            setPosts(filteredPosts);
        } else if (error) {
            console.error('Error fetching posts:', error);
        }
        setLoading(false);
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchPosts();

        const channel = supabase.channel('public_posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
                fetchPosts(false);
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [filter]); // Re-fetch/Re-filter when tab changes

    // Pull to Refresh Logic
    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            pullStartPoint.current = e.targetTouches[0].clientY;
        }
    };

    const handleTouchMove = (e) => {
        // Safety: If user scrolls down (content moves up), invalidate the pull gesture
        if (window.scrollY > 0) {
            pullStartPoint.current = 0;
            return;
        }

        if (window.scrollY < 5 && pullStartPoint.current > 0) { // < 5 for robustness
            const currentY = e.targetTouches[0].clientY;
            pullChange.current = currentY - pullStartPoint.current;

            // Only engage if pulling down (positive change)
            if (pullChange.current > 0 && pullChange.current < 300) { // Limit max pull visual
                if (refreshRef.current) {
                    refreshRef.current.style.transform = `translateY(${pullChange.current * 0.4}px)`; // Slower drag
                }
            }
        }
    };

    const handleTouchEnd = () => {
        if (pullChange.current > 100) { // Increased Threshold to 100
            setIsRefreshing(true);
            fetchPosts(true);
        }

        pullStartPoint.current = 0;
        pullChange.current = 0;
        if (refreshRef.current) {
            refreshRef.current.style.transform = 'translateY(0)';
        }
    };

    const handleUpdatePost = (updatedPost) => {
        setPosts(prevPosts => prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p));
    };

    // Back Button Logic & Lock Body Scroll
    useEffect(() => {
        if (selectedImage) {
            document.body.style.overflow = 'hidden';
            window.history.pushState({ modalOpen: true }, '', window.location.href);

            const handlePopState = () => {
                setSelectedImage(null);
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                document.body.style.overflow = 'unset';
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [selectedImage]);

    const handleDownload = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const response = await fetch(selectedImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `nada-memory-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(selectedImage, '_blank');
        }
    };

    return (
        <div
            className="relative min-h-screen pt-20 px-4 pb-24 max-w-2xl mx-auto touch-pan-y overscroll-contain"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* ... refresh indicator ... */}

            {/* Header & Tabs */}
            <div className={`mb-8 ${isShutdown ? 'grayscale' : ''}`}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6 relative"
                >
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-gold font-cairo inline-flex items-center gap-3 drop-shadow-sm">
                        <Sparkles className="text-gold w-6 h-6" />
                        المنشورات
                        <Sparkles className="text-gold w-6 h-6" />
                    </h1>
                </motion.div>

                {/* Filter Tabs */}
                <div className="flex justify-center gap-4 bg-white/5 p-1.5 rounded-2xl mx-auto w-fit backdrop-blur-md border border-white/10">
                    {[
                        { id: 'all', label: 'الكل' },
                        { id: 'nada', label: 'بوستات ندى' },
                        { id: 'hassanen', label: isShutdown ? 'بوستات حسانين' : 'بوستات حسن' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${filter === tab.id ? 'bg-gold text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <CreatePost onPostCreated={() => fetchPosts(false)} />

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" size={40} />
                </div>
            ) : (
                <div className="space-y-8">
                    {posts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 px-6 bg-black/20 backdrop-blur-sm rounded-3xl border border-white/5"
                        >
                            <p className="text-gray-400 text-lg mb-2">لسه مفيش بوستات.. الهدوء يعم المكان 🌌</p>
                            <p className="text-gold/80 text-sm">كن أول من يضيف لمسة سحرية هنا! ✨</p>
                        </motion.div>
                    ) : (
                        posts.map((post, index) => (
                            <PostCard
                                key={`${post.id}-${post.updated_at || post.created_at}`}
                                post={post}
                                onDelete={fetchPosts}
                                onUpdate={handleUpdatePost}
                                index={index}
                                onImageClick={(url) => setSelectedImage(url)}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Full Screen Image Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 md:p-8"
                        onClick={() => setSelectedImage(null)}
                    >
                        {/* Action Bar */}
                        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-black/20 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                            <button
                                className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
                                onClick={() => setSelectedImage(null)}
                            >
                                <X size={24} />
                            </button>

                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 bg-gold/90 text-black rounded-full font-bold hover:bg-yellow-400 text-sm shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"
                            >
                                <Download size={18} />
                                تنزيل
                            </button>
                        </div>

                        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                            <img
                                src={selectedImage}
                                alt="Full Screen"
                                className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PostsPage;
