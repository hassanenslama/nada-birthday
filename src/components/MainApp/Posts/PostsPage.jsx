import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const PostsPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const pullStartPoint = React.useRef(0);
    const pullChange = React.useRef(0);
    const refreshRef = React.useRef(null);

    const fetchPosts = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        console.log('Fetching posts...');

        const { data, error } = await supabase
            .from('posts')
            .select('*, user_profiles(display_name, avatar_url)')
            .neq('is_deleted', true)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setPosts(data);
        } else if (error) {
            console.error('Error fetching posts:', error);
        }
        setLoading(false);
        setIsRefreshing(false);
    };

    // Handle Android Back Button to Refresh
    useEffect(() => {
        // Push a state to history so we can catch the back event
        window.history.pushState({ page: 'posts' }, '', '');

        const handlePopState = (event) => {
            // Prevent default back navigation
            event.preventDefault();

            // Trigger Refresh
            console.log('Back button pressed - Refreshing feed...');
            fetchPosts(true);

            // Push state again to keep trapping the back button
            window.history.pushState({ page: 'posts' }, '', '');
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    useEffect(() => {
        fetchPosts();

        const channel = supabase.channel('public_posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
                fetchPosts(false);
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    // Pull to Refresh Logic
    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            pullStartPoint.current = e.targetTouches[0].clientY;
        }
    };

    const handleTouchMove = (e) => {
        if (window.scrollY === 0 && pullStartPoint.current > 0) {
            pullChange.current = e.targetTouches[0].clientY - pullStartPoint.current;
            if (pullChange.current > 0 && pullChange.current < 200) {
                if (refreshRef.current) {
                    refreshRef.current.style.transform = `translateY(${pullChange.current * 0.5}px)`;
                }
            }
        }
    };

    const handleTouchEnd = () => {
        if (pullChange.current > 80) { // Threshold to trigger refresh
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

    return (
        <div
            className="relative min-h-screen pt-20 px-4 pb-24 max-w-2xl mx-auto touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Refresh Indicator */}
            <div
                ref={refreshRef}
                className="fixed top-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-full p-2 z-50 transition-transform duration-200 shadow-gold"
                style={{ opacity: isRefreshing || pullChange.current > 0 ? 1 : 0 }}
            >
                <Loader2 className={`text-gold ${isRefreshing ? 'animate-spin' : ''}`} size={24} />
            </div>

            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-[-1]">
                <div className="absolute top-20 left-0 w-64 h-64 bg-purple-900/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-20 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10 relative"
            >
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-gold font-cairo inline-flex items-center gap-3 drop-shadow-sm">
                    <Sparkles className="text-gold w-6 h-6" />
                    المنشورات
                    <Sparkles className="text-gold w-6 h-6" />
                </h1>
                <p className="text-gray-400 mt-2 text-sm font-medium">شارك لحظاتك وأفكارك المميزة ✨</p>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent rounded-full" />
            </motion.div>

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
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default PostsPage;
