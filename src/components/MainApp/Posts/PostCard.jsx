import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Trash2, ExternalLink, Link as LinkIcon, MoreHorizontal, Share2, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import ReactionButton from './ReactionButton';
import CommentSection from './CommentSection';
import ConfirmModal from './ConfirmModal';

const PostCard = ({ post, onDelete, onUpdate, index }) => {
    const { currentUser } = useAuth();
    const [likesCount, setLikesCount] = useState(0);
    const [dislikesCount, setDislikesCount] = useState(0);
    const [userReaction, setUserReaction] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [commentsCount, setCommentsCount] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isSaving, setIsSaving] = useState(false);

    // Sync editContent with post.content when it updates from parent
    useEffect(() => {
        setEditContent(post.content);
    }, [post.content]);

    // URL Helpers
    const extractUrl = (text) => text?.match(/(https?:\/\/[^\s]+)/)?.[0];

    const getYouTubeId = (url) => {
        if (!url) return null;
        const shortsMatch = url.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
        if (shortsMatch) return shortsMatch[1];
        const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const getTikTokId = (url) => url?.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/)?.[1];

    const detectedUrl = post.link_url || extractUrl(post.content);
    const youtubeId = getYouTubeId(detectedUrl);
    const tiktokId = getTikTokId(detectedUrl);
    const isYouTubeShort = detectedUrl && detectedUrl.includes('/shorts/');

    const displayContent = (youtubeId || tiktokId) && post.content.includes(detectedUrl)
        ? post.content.replace(detectedUrl, '').trim()
        : post.content;

    const isEdited = post.updated_at && post.created_at && new Date(post.updated_at).getTime() > new Date(post.created_at).getTime() + 1000;

    // Data Fetching
    useEffect(() => {
        fetchReactions();
        subscribeReactions();
        fetchCommentsCount();
    }, [post.id]);

    const fetchCommentsCount = async () => {
        const { count } = await supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
        setCommentsCount(count || 0);
    };

    const fetchReactions = async () => {
        const { data } = await supabase.from('post_reactions').select('*').eq('post_id', post.id);
        if (data) processReactions(data);
    };

    const processReactions = (data) => {
        // Filter out soft-deleted reactions
        const activeReactions = data.filter(r => !r.is_deleted);

        const publicLikes = activeReactions.filter(r => r.reaction_type === 'like' && !r.is_hidden).length;
        const publicDislikes = activeReactions.filter(r => r.reaction_type === 'dislike' && !r.is_hidden).length;
        const myReaction = activeReactions.find(r => r.user_id === currentUser.id);

        setLikesCount(myReaction?.reaction_type === 'like' && myReaction?.is_hidden ? publicLikes + 1 : publicLikes);
        setDislikesCount(myReaction?.reaction_type === 'dislike' && myReaction?.is_hidden ? publicDislikes + 1 : publicDislikes);

        setUserReaction(myReaction ? {
            type: myReaction.reaction_type,
            isHidden: myReaction.is_hidden
        } : null);
    };

    const subscribeReactions = () => {
        const sub1 = supabase.channel(`comments:${post.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${post.id}` }, fetchCommentsCount)
            .subscribe();
        const sub2 = supabase.channel(`reactions:${post.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${post.id}` }, fetchReactions)
            .subscribe();
        return () => { supabase.removeChannel(sub1); supabase.removeChannel(sub2); };
    };

    const handleReaction = async (type, isHidden) => {
        const previousState = { userReaction, likesCount, dislikesCount };

        // Optimistic Update
        let newUserReaction = null;
        let newLikes = likesCount;
        let newDislikes = dislikesCount;

        // Logic: 
        // 1. If we have a reaction of strictly different type (Like vs Dislike) -> Insert/Update
        // 2. If we have same type:
        //    a. If we clicked the main button (isActive=false) -> Always Toggle OFF (whether it was hidden or not)
        //    b. If we chose Hidden (isActive=true) AND it was already Hidden -> Toggle OFF
        //    c. If we chose Hidden AND it was Visible -> Upgrade to Hidden (Update)

        const isSameType = userReaction?.type === type;
        const shouldDelete = isSameType && (!isHidden || userReaction?.isHidden === isHidden);

        if (shouldDelete) {
            // Toggling off
            newUserReaction = null;
            if (type === 'like') newLikes = Math.max(0, newLikes - 1);
            else newDislikes = Math.max(0, newDislikes - 1);
        } else {
            // Adding or Changing
            if (userReaction) {
                // Determine if we are just swapping counts or adding new
                // If same type but upgrading (Visible -> Hidden), count doesn't change unless we handle "Hidden" counts differently (currently hidden adds to public count for owner)
                // But logic above: Hidden *replaces* Visible.
                if (userReaction.type === 'like') newLikes = Math.max(0, newLikes - 1);
                else newDislikes = Math.max(0, newDislikes - 1);
            }

            newUserReaction = { type, isHidden };
            if (type === 'like') newLikes++;
            else newDislikes++;
        }

        setUserReaction(newUserReaction);
        setLikesCount(newLikes);
        setDislikesCount(newDislikes);

        try {
            if (shouldDelete) {
                // Soft Delete
                await supabase.from('post_reactions').update({ is_deleted: true }).eq('post_id', post.id).eq('user_id', currentUser.id);
            } else {
                // Upsert
                await supabase.from('post_reactions').upsert({
                    post_id: post.id,
                    user_id: currentUser.id,
                    reaction_type: type,
                    is_hidden: isHidden,
                    is_deleted: false
                }, { onConflict: 'post_id,user_id' });
            }
        } catch (error) {
            console.error('Reaction failed:', error);
            // Revert
            setUserReaction(previousState.userReaction);
            setLikesCount(previousState.likesCount);
            setDislikesCount(previousState.dislikesCount);
        }
    };

    const handleDelete = async () => {
        // Soft delete
        await supabase.from('posts').update({ is_deleted: true }).eq('id', post.id);
        if (onDelete) onDelete(post.id);
    };

    const handleUpdate = async () => {
        if (!editContent.trim()) return;

        console.log('Starting update for post:', post.id);
        setIsSaving(true);

        try {
            // 1. Log the edit history
            await supabase.from('post_edits').insert({
                post_id: post.id,
                editor_id: currentUser.id,
                old_content: post.content,
                new_content: editContent
            });

            // 2. Update the post
            const { data, error } = await supabase
                .from('posts')
                .update({ content: editContent, updated_at: new Date().toISOString() })
                .eq('id', post.id)
                .select();

            if (error) throw error;

            console.log('Update successful', data);

            if (data && data.length > 0) {
                // Optimistic update via parent handler
                if (onDelete && typeof onDelete === 'function' && !onUpdate) {
                    onDelete(); // Refresh list if needed(legacy)
                }
                if (onUpdate) {
                    onUpdate(data[0]);
                }
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error updating post:', error);
            alert('فشل حفظ التعديل: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-[#121212]/80 backdrop-blur-xl rounded-3xl border border-white/5 hover:border-gold/20 transition-all duration-300 shadow-xl overflow-hidden"
        >
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="حذف المنشور"
                message="هل أنت متأكد أنك تريد حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء."
            />

            {/* Header */}
            <div className="p-5 flex justify-between items-start">
                <div className="flex gap-4">
                    <div className="relative">
                        {post.user_profiles?.avatar_url ? (
                            <img
                                src={post.user_profiles.avatar_url}
                                alt="Avatar"
                                className="w-12 h-12 rounded-full object-cover border border-warning/20 shadow-inner"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-warning/20 shadow-inner">
                                <span className="text-gold font-bold text-lg">
                                    {post.user_profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                                </span>
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#121212] rounded-full flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-base flex items-center gap-2">
                            {post.user_profiles?.display_name || 'مستخدم'}
                            {/* <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-normal border border-gold/20">مدير</span> */}
                        </h3>
                        <span className="text-gray-500 text-xs mt-1 block font-medium">
                            {new Date(post.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            {isEdited && <span className="mr-2 text-gold/60 text-[10px]">(تم التعديل)</span>}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {post.user_id === currentUser.id && (
                        <>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="p-2 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-full transition-all"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Text Content */}
            <div className="px-5 pb-4 text-right dir-rtl">
                {isEditing ? (
                    <div className="relative">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-black/40 border border-gold/30 rounded-xl p-3 text-white focus:outline-none focus:border-gold min-h-[100px]"
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-gray-400 hover:bg-white/10 text-xs"
                            >
                                <X size={14} /> إلغاء
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isSaving}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold text-black hover:bg-yellow-400 text-xs font-bold"
                            >
                                <Check size={14} /> حفظ
                            </button>
                        </div>
                    </div>
                ) : (
                    displayContent && (
                        <p className="text-gray-200 whitespace-pre-wrap leading-loose text-sm md:text-base font-medium opacity-90">
                            {displayContent}
                        </p>
                    )
                )}
            </div>

            {/* Visual Content Container */}
            {(post.image_url || youtubeId || tiktokId) && (
                <div className="w-full bg-black/40 border-y border-white/5 backdrop-blur-sm">
                    {post.image_url && (
                        <div className="w-full max-h-[600px] flex items-center justify-center p-1">
                            <img src={post.image_url} alt="Post" className="max-w-full max-h-[500px] object-contain rounded-lg shadow-2xl" />
                        </div>
                    )}

                    {youtubeId && (
                        <div className={`w-full mx-auto ${isYouTubeShort ? 'max-w-sm py-4' : ''}`}>
                            <div className={`${isYouTubeShort ? 'aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/10' : 'aspect-video'} relative bg-black`}>
                                <iframe
                                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&controls=1&rel=0&modestbranding=1`}
                                    title="YouTube video"
                                    className="absolute inset-0 w-full h-full"
                                    allowFullScreen
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    )}

                    {tiktokId && (
                        <div className="flex justify-center py-4">
                            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                                <iframe
                                    src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
                                    className="w-[325px] h-[580px]"
                                    allowFullScreen
                                    loading="lazy"
                                ></iframe>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Link Preview (Fallback) */}
            {detectedUrl && !youtubeId && !tiktokId && (
                <div className="px-5 pb-4">
                    <a
                        href={detectedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 bg-[#1a1a1a] hover:bg-[#202020] border border-white/5 rounded-2xl p-4 transition-all group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center flex-none group-hover:scale-110 transition-transform duration-300">
                            <LinkIcon size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-gray-200 text-sm font-bold mb-0.5">رابط خارجي</h4>
                            <p className="text-gray-500 text-xs truncate dir-ltr font-mono opacity-70">{detectedUrl}</p>
                        </div>
                        <ExternalLink size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                    </a>
                </div>
            )}

            {/* Action Bar */}
            <div className="px-5 py-4 mt-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-white/5 rounded-full p-1.5 border border-white/5 pr-4 pl-2">
                        <ReactionButton
                            type="like"
                            count={likesCount}
                            isReacted={userReaction?.type === 'like'}
                            isHidden={userReaction?.isHidden}
                            onReact={() => handleReaction('like', false)}
                            onHiddenReact={() => handleReaction('like', true)}
                        />
                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                        <ReactionButton
                            type="dislike"
                            count={dislikesCount}
                            isReacted={userReaction?.type === 'dislike'}
                            isHidden={userReaction?.isHidden}
                            onReact={() => handleReaction('dislike', false)}
                            onHiddenReact={() => handleReaction('dislike', true)}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5 transition-all text-gray-400 hover:text-gold group/comment"
                        >
                            <MessageCircle size={20} className="group-hover/comment:scale-110 transition-transform" />
                            <span className="text-sm font-medium">{commentsCount > 0 ? commentsCount : 'تعليق'}</span>
                        </button>
                        <button className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/5 bg-black/20"
                    >
                        <CommentSection postId={post.id} />
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default PostCard;
