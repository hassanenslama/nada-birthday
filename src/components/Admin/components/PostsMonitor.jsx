import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Clock, Trash2, Shield, AlertTriangle, MessageCircle, Heart, ThumbsDown, User, Calendar, ArrowRight } from 'lucide-react';

const PostsMonitor = () => {
    const [activeTab, setActiveTab] = useState('hidden_reactions');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [dateFilter, setDateFilter] = useState('all');

    useEffect(() => {
        fetchData();
        const subscription = setupRealtimeSubscription();
        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [activeTab]);

    const setupRealtimeSubscription = () => {
        const channelName = `monitor_${activeTab}`;
        const channel = supabase.channel(channelName);

        if (activeTab === 'hidden_reactions') {
            channel
                .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, fetchData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'comment_reactions' }, fetchData);
        } else if (activeTab === 'edit_history') {
            channel
                .on('postgres_changes', { event: '*', schema: 'public', table: 'post_edits' }, fetchData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'comment_edits' }, fetchData);
        } else if (activeTab === 'deleted_content') {
            channel
                .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, fetchData);
        }

        return channel.subscribe();
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let fetchedData = [];

            if (activeTab === 'hidden_reactions') {
                // Fetch Hidden Likes/Dislikes for Posts
                const { data: postReactions } = await supabase
                    .from('post_reactions')
                    .select('*, user_profiles(display_name, avatar_url), posts(content)')
                    .eq('is_hidden', true)
                    .order('created_at', { ascending: false });

                // Fetch Hidden Likes/Dislikes for Comments
                const { data: commentReactions } = await supabase
                    .from('comment_reactions')
                    .select('*, user_profiles(display_name, avatar_url), post_comments(content)')
                    .eq('is_hidden', true)
                    .order('created_at', { ascending: false });

                // Combine and normalize
                fetchedData = [
                    ...(postReactions || []).map(r => ({ ...r, type: 'post', content: r.posts?.content })),
                    ...(commentReactions || []).map(r => ({ ...r, type: 'comment', content: r.post_comments?.content }))
                ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            } else if (activeTab === 'edit_history') {
                // Fetch Post Edits
                const { data: postEdits } = await supabase
                    .from('post_edits')
                    .select('*, user:editor_id(id), editor_profile:user_profiles!editor_id(display_name, avatar_url)')
                    .order('edited_at', { ascending: false });

                // Fetch Comment Edits
                const { data: commentEdits } = await supabase
                    .from('comment_edits')
                    .select('*, user:editor_id(id), editor_profile:user_profiles!editor_id(display_name, avatar_url)')
                    .order('edited_at', { ascending: false });

                // Combine
                fetchedData = [
                    ...(postEdits || []).map(e => ({ ...e, type: 'post' })),
                    ...(commentEdits || []).map(e => ({ ...e, type: 'comment' }))
                ].sort((a, b) => new Date(b.edited_at) - new Date(a.edited_at));

            } else if (activeTab === 'deleted_content') {
                // Fetch Deleted Posts
                const { data: deletedPosts } = await supabase
                    .from('posts')
                    .select('*, user_profiles(display_name, avatar_url)')
                    .eq('is_deleted', true)
                    .order('created_at', { ascending: false });

                // Fetch Deleted Comments
                const { data: deletedComments } = await supabase
                    .from('post_comments')
                    .select('*, user_profiles(display_name, avatar_url)')
                    .eq('is_deleted', true)
                    .order('created_at', { ascending: false });

                fetchedData = [
                    ...(deletedPosts || []).map(p => ({ ...p, type: 'post' })),
                    ...(deletedComments || []).map(c => ({ ...c, type: 'comment' }))
                ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Use created_at or updated_at if available for deletion time
            }

            setData(fetchedData);
        } catch (error) {
            console.error('Error fetching monitor data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ar-EG', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === id
                ? 'bg-gold text-black shadow-lg shadow-gold/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-3 mb-6">
                <TabButton id="hidden_reactions" icon={Eye} label="تفاعلات خفية" />
                <TabButton id="edit_history" icon={Clock} label="سجل التعديلات" />
                <TabButton id="deleted_content" icon={Trash2} label="المحذوفات" />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                </div>
            ) : data.length === 0 ? (
                <div className="text-center py-20 bg-[#121212] rounded-3xl border border-white/5">
                    <Shield size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">سجل النشاط نظيف تماماً! ✨</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {data.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-[#181818] p-4 rounded-2xl border border-white/5 hover:border-gold/20 transition-colors group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="relative">
                                    {item.user_profiles?.avatar_url || item.editor_profile?.avatar_url ? (
                                        <img
                                            src={item.user_profiles?.avatar_url || item.editor_profile?.avatar_url}
                                            alt="User"
                                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                            <User size={20} className="text-gray-400" />
                                        </div>
                                    )}

                                    {/* Type Icon Badge */}
                                    <div className="absolute -bottom-1 -left-1 bg-black rounded-full p-1 border border-white/10">
                                        {activeTab === 'hidden_reactions' && (
                                            item.reaction_type === 'like' ? <Heart size={10} className="text-red-500 fill-red-500" /> : <ThumbsDown size={10} className="text-gray-400" />
                                        )}
                                        {activeTab === 'edit_history' && <Clock size={10} className="text-gold" />}
                                        {activeTab === 'deleted_content' && <Trash2 size={10} className="text-red-500" />}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="text-gray-200 font-bold text-sm flex items-center gap-2">
                                                {item.user_profiles?.display_name || item.editor_profile?.display_name || 'مستخدم غير معروف'}
                                                <span className="text-[10px] items-center flex gap-1 font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                                                    {item.type === 'post' ? 'منشور' : 'تعليق'}
                                                </span>
                                            </h4>
                                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <Calendar size={10} />
                                                {formatDate(item.created_at || item.edited_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content based on Tab */}
                                    {activeTab === 'hidden_reactions' && (
                                        <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                                            <p className="text-gray-300 text-sm italic">
                                                "{item.content || (item.type === 'post' ? 'محتوى المنشور' : 'محتوى التعليق')}"
                                            </p>
                                            <div className="mt-2 flex items-center gap-2 text-xs text-gold/70 bg-gold/5 w-fit px-2 py-1 rounded-lg">
                                                <Eye size={12} />
                                                تفاعل مخفي ({item.reaction_type === 'like' ? 'إعجاب' : 'عدم إعجاب'})
                                                {item.is_deleted && (
                                                    <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-[10px] border border-red-500/20 mr-2">
                                                        (تم الإلغاء)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'edit_history' && (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-xl">
                                                    <p className="text-[10px] text-red-400 mb-1 font-bold">النسخة القديمة</p>
                                                    <p className="text-gray-300 text-sm line-through opacity-70">{item.old_content}</p>
                                                </div>
                                                <div className="bg-green-500/5 border border-green-500/20 p-3 rounded-xl">
                                                    <p className="text-[10px] text-green-400 mb-1 font-bold">النسخة الجديدة</p>
                                                    <p className="text-gray-200 text-sm">{item.new_content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'deleted_content' && (
                                        <div className="bg-red-900/10 border border-red-500/20 p-3 rounded-xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
                                            <p className="text-gray-300 text-sm">{item.content}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                {item.image_url && (
                                                    <img src={item.image_url} alt="Deleted content" className="h-12 w-12 rounded-lg object-cover opacity-50" />
                                                )}
                                                <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">تم الحذف</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PostsMonitor;
