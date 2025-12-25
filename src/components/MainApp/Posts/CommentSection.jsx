import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import { Send, Trash2, Loader2, MessageCircle, CornerDownRight, Edit2, Check, X, Image as ImageIcon, Lock, Unlock } from 'lucide-react';
import ReactionButton from './ReactionButton';
import ConfirmModal from './ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';


const CommentItem = ({ comment, postId, onDelete, onUpdate, onReply, replies = [], getReplies, depth = 0 }) => {
    const { currentUser } = useAuth();
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPublicConfirm, setShowPublicConfirm] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setEditContent(comment.content);
    }, [comment.content]);

    // Reaction State
    const [likesCount, setLikesCount] = useState(0);
    const [dislikesCount, setDislikesCount] = useState(0);
    const [userReaction, setUserReaction] = useState(null);

    const isEdited = comment.updated_at && comment.created_at && new Date(comment.updated_at).getTime() > new Date(comment.created_at).getTime() + 1000;

    useEffect(() => {
        fetchReactions();
        subscribeReactions();
    }, []);

    const fetchReactions = async () => {
        const { data } = await supabase.from('comment_reactions').select('*').eq('comment_id', comment.id);
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

        setUserReaction(myReaction ? { type: myReaction.reaction_type, isHidden: myReaction.is_hidden } : null);
    };

    const subscribeReactions = () => {
        const channel = supabase.channel(`comment_reactions_${comment.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comment_reactions', filter: `comment_id=eq.${comment.id}` }, fetchReactions)
            .subscribe();
        return () => supabase.removeChannel(channel);
    };

    const handleReaction = async (type, isHidden) => {
        const previousState = { userReaction, likesCount, dislikesCount };

        // Logic: 
        // 1. If we have a reaction of strictly different type (Like vs Dislike) -> Insert/Update
        // 2. If we have same type:
        //    a. If we clicked the main button (isActive=false) -> Always Toggle OFF (whether it was hidden or not)
        //    b. If we chose Hidden (isActive=true) AND it was already Hidden -> Toggle OFF
        //    c. If we chose Hidden AND it was Visible -> Upgrade to Hidden (Update)

        const isSameType = userReaction?.type === type;
        const shouldDelete = isSameType && (!isHidden || userReaction?.isHidden === isHidden);

        let newLikes = likesCount;
        let newDislikes = dislikesCount;
        let newUserReaction = null;

        if (shouldDelete) {
            // Toggling off
            newUserReaction = null;
            if (type === 'like') newLikes = Math.max(0, newLikes - 1);
            else newDislikes = Math.max(0, newDislikes - 1);
        } else {
            // Adding or Changing
            if (userReaction) {
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
                await supabase.from('comment_reactions').update({ is_deleted: true }).eq('comment_id', comment.id).eq('user_id', currentUser.id);
            } else {
                // Upsert
                await supabase.from('comment_reactions').upsert({
                    comment_id: comment.id,
                    user_id: currentUser.id,
                    reaction_type: type,
                    is_hidden: isHidden,
                    is_deleted: false
                }, { onConflict: 'comment_id,user_id' });
            }
        } catch (error) {
            console.error(error);
            setUserReaction(previousState.userReaction);
            setLikesCount(previousState.likesCount);
            setDislikesCount(previousState.dislikesCount);
        }
    };

    const handleDelete = async () => {
        // Soft Delete
        await supabase.from('post_comments').update({ is_deleted: true }).eq('id', comment.id);
        if (onDelete) onDelete(comment.id);
    };

    const handleUpdate = async () => {
        if (!editContent.trim()) return;

        console.log('Starting comment update:', comment.id);
        setIsSaving(true);

        try {
            // 1. Log Edit
            await supabase.from('comment_edits').insert({
                comment_id: comment.id,
                editor_id: currentUser.id,
                old_content: comment.content,
                new_content: editContent
            });

            // 2. Update Comment
            const { data, error } = await supabase
                .from('post_comments')
                .update({ content: editContent, updated_at: new Date().toISOString() })
                .eq('id', comment.id)
                .select();

            if (error) throw error;

            console.log('Update successful', data);

            if (data && data.length > 0) {
                if (onDelete && typeof onDelete === 'function' && !onUpdate) {
                    onDelete();
                }
                if (onUpdate) {
                    onUpdate(data[0]);
                }
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            alert('فشل حفظ التعديل: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim() || submittingReply) return;

        setSubmittingReply(true);
        if (onReply) {
            await onReply(replyContent, comment.id);
        }
        setReplyContent('');
        setIsReplying(false);
        setSubmittingReply(false);
    };

    const handleMakePublic = async () => {
        try {
            const { error } = await supabase
                .from('post_comments')
                .update({ is_secret: false })
                .eq('id', comment.id);

            if (error) throw error;

            if (onDelete) onDelete();
            setShowPublicConfirm(false);
        } catch (error) {
            console.error('Error making comment public:', error);
            alert('حدث خطأ، حاول مرة أخرى.');
        }
    };

    // Style logic for nesting
    const containerClasses = `
        group transition-all duration-300 relative
        ${depth === 0 ? 'mb-3' : 'mt-2'}
        ${depth === 1 ? 'mr-4 md:mr-8' : ''} 
        ${depth > 1 ? 'mr-2 md:mr-3' : ''}
    `;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={containerClasses}
        >
            <div className={`
                p-3 rounded-2xl border border-white/5 relative
                ${comment.is_secret
                    ? 'bg-[#2a0a10]/90 border border-[#800020]/50'
                    : depth > 0
                        ? 'bg-black/40 backdrop-blur-sm border-r-2 border-r-gold/20'
                        : 'bg-[#181818] hover:bg-[#202020] hover:border-gold/10'
                }
            `}>
                <ConfirmModal
                    isOpen={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={handleDelete}
                    title="حذف التعليق"
                    message="هل تريد حذف هذا التعليق نهائياً؟"
                    confirmText="حذف"
                />

                <ConfirmModal
                    isOpen={showPublicConfirm}
                    onClose={() => setShowPublicConfirm(false)}
                    onConfirm={handleMakePublic}
                    title="نشر التعليق"
                    message="هل أنت متأكد من أنك تريد عرض التعليق للجميع؟"
                    confirmText="نشر"
                    confirmColor="bg-green-600 hover:bg-green-700"
                />

                <div className="flex gap-2">
                    {/* Avatar */}
                    <div className="relative flex-none">
                        {comment.user_profiles?.avatar_url ? (
                            <img
                                src={comment.user_profiles.avatar_url}
                                alt="U"
                                className={`${depth > 0 ? 'w-7 h-7' : 'w-9 h-9'} rounded-full object-cover border border-white/10 shadow-lg`}
                            />
                        ) : (
                            <div className={`
                                rounded-full bg-gradient-to-br from-gold/30 to-gold/5 flex items-center justify-center border border-white/10 shadow-lg
                                ${depth > 0 ? 'w-7 h-7' : 'w-9 h-9'}
                            `}>
                                <span className={`text-gold font-bold ${depth > 0 ? 'text-[10px]' : 'text-xs'}`}>
                                    {comment.user_profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                                </span>
                            </div>
                        )}
                        {depth > 0 && (
                            <div className="absolute -right-4 top-2 text-gold/20">
                                <CornerDownRight size={14} className="rtl:rotate-180" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-gray-200 text-sm font-bold flex items-center gap-2">
                                    {comment.user_profiles?.display_name || 'مستخدم'}
                                    {/* <span className="text-[10px] font-normal bg-white/5 px-1.5 py-0.5 rounded-full text-gold">مسؤول</span> */}
                                    {comment.is_secret && (
                                        <span className="mr-1 px-1.5 py-0.5 rounded-full bg-[#2a0a10] text-[#ff99ac] text-[9px] border border-[#800020] flex items-center gap-0.5 shadow-sm">
                                            <Lock size={8} /> سري
                                        </span>
                                    )}
                                </h4>
                                <span className="text-white/20 text-[10px]">•</span>
                                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                                    {new Date(comment.created_at).toLocaleDateString('ar-EG', { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' })}
                                </span>
                                {isEdited && <span className="text-[10px] text-custom-gold/50 mx-1">(تم التعديل)</span>}
                            </div>
                            {comment.user_id === currentUser?.id && (
                                <div className="flex items-center gap-1">
                                    {comment.is_secret && (
                                        <button
                                            onClick={() => setShowPublicConfirm(true)}
                                            className="text-[#ff99ac] hover:text-white transition-colors opacity-0 group-hover:opacity-100 p-1.5 bg-black/50 rounded-full"
                                            title="نشر للعامة"
                                        >
                                            <Unlock size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="text-gray-600 hover:text-gold transition-colors opacity-0 group-hover:opacity-100 p-1.5 bg-black/50 rounded-full"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1.5 bg-black/50 rounded-full"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        {isEditing ? (
                            <div className="mt-2">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full bg-black/30 border border-gold/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold resize-none custom-scrollbar leading-relaxed"
                                    rows={1}
                                    enterKeyHint="enter"
                                    autoFocus
                                    onInput={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                />
                                <div className="flex gap-2 mt-2 justify-end">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex items-center gap-1 px-2 py-1 rounded text-gray-400 hover:bg-white/10 text-[10px]"
                                    >
                                        <X size={12} /> إلغاء
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={isSaving}
                                        className="flex items-center gap-1 px-2 py-1 rounded bg-gold text-black hover:bg-yellow-400 text-[10px] font-bold"
                                    >
                                        <Check size={12} /> حفظ
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-1">
                                <p className="text-gray-100 whitespace-pre-wrap leading-relaxed opacity-100 font-medium text-sm">
                                    {comment.content}
                                </p>
                                {comment.image_url && (
                                    <div className="mt-2 rounded-lg overflow-hidden max-w-[200px] border border-white/10 group/image">
                                        <img
                                            src={comment.image_url}
                                            alt="Attachment"
                                            className="w-full h-auto object-cover max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(comment.image_url, '_blank')}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-2 pl-1">
                            <div className="flex items-center gap-2 bg-white/5 rounded-full px-2 py-0.5">
                                <ReactionButton
                                    type="like"
                                    count={likesCount}
                                    isReacted={userReaction?.type === 'like'}
                                    isHidden={userReaction?.isHidden}
                                    onReact={() => handleReaction('like', false)}
                                    onHiddenReact={() => handleReaction('like', true)}
                                    size="sm"
                                />
                                <div className="w-px h-3 bg-white/10"></div>
                                <ReactionButton
                                    type="dislike"
                                    count={dislikesCount}
                                    isReacted={userReaction?.type === 'dislike'}
                                    isHidden={userReaction?.isHidden}
                                    onReact={() => handleReaction('dislike', false)}
                                    onHiddenReact={() => handleReaction('dislike', true)}
                                    size="sm"
                                />
                            </div>

                            <button
                                onClick={() => setIsReplying(!isReplying)}
                                className="text-[10px] text-gold/80 hover:text-gold flex items-center gap-1 transition-colors px-2 py-1 rounded-full hover:bg-gold/10 font-bold"
                            >
                                <MessageCircle size={12} />
                                <span>رد</span>
                            </button>
                        </div>

                        {/* Reply Form */}
                        <AnimatePresence>
                            {isReplying && (
                                <motion.form
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    onSubmit={handleReplySubmit}
                                    className="mt-3 flex gap-2 overflow-hidden"
                                >
                                    <input
                                        type="text"
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="اكتب ردك..."
                                        autoFocus
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-gold/50 transition-all placeholder-gray-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!replyContent.trim() || submittingReply}
                                        className="p-2 bg-gold text-black rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 shadow-md"
                                    >
                                        {submittingReply ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} className="rtl:rotate-180" />}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Nested Replies */}
            {replies && replies.length > 0 && (
                <div className={`${depth > 0 ? 'border-r border-white/5 mr-2 pr-0' : 'mr-2'}`}>
                    {replies.map(reply => (
                        <CommentItem
                            key={`${reply.id}-${reply.updated_at}`}
                            comment={reply}
                            replies={getReplies(reply.id)}
                            getReplies={getReplies}
                            postId={postId}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            onReply={onReply}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

const CommentSection = ({ postId }) => {
    const { currentUser } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSecret, setIsSecret] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const { data } = await supabase.from('user_profiles').select('*').eq('id', currentUser.id).single();
            if (data) setCurrentUserProfile(data);
        };
        fetchUserProfile();
    }, [currentUser]);

    useEffect(() => {
        fetchComments();
        const channel = supabase.channel(`comments_realtime:${postId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` }, fetchComments)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [postId]);

    const fetchComments = async () => {
        setLoading(true);
        // setComments([]); // Force clear removed

        const { data } = await supabase
            .from('post_comments')
            .select('*, user_profiles(display_name, avatar_url)')
            .neq('is_deleted', true)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (data) {
            // Filter: Public OR My Secret
            // Client-side filtering for prototype
            const visibleComments = data.filter(c => !c.is_secret || c.user_id === currentUser.id);
            setComments(visibleComments);
        }
        setLoading(false);
    };

    const handleImageSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAddComment = async (content, parentId = null, imageUrl = null) => {
        const { error } = await supabase.from('post_comments').insert({
            post_id: postId,
            user_id: currentUser.id,
            content: content,
            parent_id: parentId,
            image_url: imageUrl,
            is_secret: isSecret && !parentId // Only root comments can be secret for now to avoid complexity in threads
        });

        if (error) {
            console.error('Error adding comment:', error);
            alert('فشل إضافة التعليق');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!newComment.trim() && !selectedImage) || submitting) return;

        setSubmitting(true);
        try {
            let imageUrl = null;
            if (selectedImage) {
                const uploadResult = await uploadToCloudinary(selectedImage, { folder: 'comment-images' });
                imageUrl = uploadResult.url;
            }

            await handleAddComment(newComment.trim(), null, imageUrl);
            setNewComment('');
            clearImage();
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('حدث خطأ أثناء إرسال التعليق');
        } finally {
            setSubmitting(false);
        }
    };

    // Group comments into hierarchy
    const rootComments = comments.filter(c => !c.parent_id);
    const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

    const handleUpdateComment = (updatedComment) => {
        setComments(prevComments => prevComments.map(c => c.id === updatedComment.id ? updatedComment : c));
    };

    return (
        <div className="border-t border-white/5 bg-[#121212]/50 backdrop-blur-md p-5 rounded-b-3xl">
            {/* Input for Parent Comment */}
            <div className="flex gap-3 items-end mb-8">
                {currentUserProfile?.avatar_url ? (
                    <img
                        src={currentUserProfile.avatar_url}
                        alt="Me"
                        className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-lg mb-1"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-white/10 flex-none shadow-lg mb-1">
                        <span className="text-gold font-bold text-sm">{currentUser?.email?.[0].toUpperCase() || 'U'}</span>
                    </div>
                )}
                <div className="flex-1 relative group w-full">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-gold/20 to-purple-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>

                    {/* Image Preview */}
                    <AnimatePresence>
                        {imagePreview && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                                className="relative mb-2 rounded-xl overflow-hidden bg-black/50 border border-white/10 w-fit max-w-[200px]"
                            >
                                <img src={imagePreview} alt="Preview" className="max-h-32 object-contain" />
                                <button
                                    type="button"
                                    onClick={clearImage}
                                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={isSecret ? "اكتب تعليق سري... 🔒" : "شارك برأيك... ✨"}
                            className={`relative w-full border rounded-2xl pl-12 pr-24 py-3.5 text-sm text-white outline-none transition-all placeholder-gray-500 shadow-xl resize-none min-h-[50px] max-h-[150px] leading-relaxed custom-scrollbar ${isSecret ? 'bg-[#2a0a10] border-[#800020] focus:border-[#ff0040] placeholder-rose-800/50' : 'bg-[#181818] border-white/10 focus:border-gold/40 focus:bg-[#1a1a1a]'}`}
                            rows={1}
                            enterKeyHint="enter"
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gold transition-colors"
                        >
                            <ImageIcon size={20} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                            multiple
                            onChange={handleImageSelect}
                        />

                        <button
                            type="button"
                            onClick={() => setIsSecret(!isSecret)}
                            className={`absolute right-10 top-1/2 -translate-y-1/2 p-2 transition-colors ${isSecret ? 'text-[#ff99ac]' : 'text-gray-400 hover:text-purple-400'}`}
                            title={isSecret ? "تعليق سري" : "تعليق عام"}
                        >
                            {isSecret ? <Lock size={20} /> : <Unlock size={20} />}
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={(!newComment.trim() && !selectedImage) || submitting}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-gold to-yellow-500 text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg z-10"
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="rtl:rotate-180" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-1 pl-1">
                {loading ? (
                    <div className="text-center py-8"><Loader2 className="animate-spin inline text-gold" size={28} /></div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12 opacity-60 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <MessageCircle size={40} className="mx-auto mb-3 text-gold/50" />
                        <p className="text-base text-gray-400 font-medium">المكان هادئ... شاركنا أول تعليق! ✍️</p>
                    </div>
                ) : (
                    rootComments.map(comment => (
                        <CommentItem
                            key={`${comment.id}-${comment.updated_at}`}
                            comment={comment}
                            replies={getReplies(comment.id)}
                            getReplies={getReplies}
                            postId={postId}
                            onDelete={fetchComments}
                            onUpdate={handleUpdateComment}
                            onReply={handleAddComment}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentSection;
