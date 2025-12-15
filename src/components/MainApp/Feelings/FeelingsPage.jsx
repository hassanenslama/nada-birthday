import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, Calendar, Image as ImageIcon, Send, X, Loader2 } from 'lucide-react';

const FeelingsPage = () => {
    const { userRole } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, admin, user
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [newMsg, setNewMsg] = useState({ title: '', content: '', image_url: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchMessages();
        const sub = supabase.channel('feelings_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'feelings' }, fetchMessages)
            .subscribe();
        return () => sub.unsubscribe();
    }, []);

    const fetchMessages = async () => {
        const { data } = await supabase.from('feelings').select('*').order('created_at', { ascending: false });
        if (data) setMessages(data);
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMsg.title.trim() || !newMsg.content.trim()) return;

        setIsSubmitting(true);
        const { error } = await supabase.from('feelings').insert([{
            title: newMsg.title,
            content: newMsg.content,
            image_url: newMsg.image_url || null,
            sender_role: userRole || 'user'
        }]);

        if (!error) {
            setIsModalOpen(false);
            setNewMsg({ title: '', content: '', image_url: '' });
        }
        setIsSubmitting(false);
    };

    const filteredMessages = messages.filter(m => {
        if (activeTab === 'all') return true;
        if (activeTab === 'admin') return m.sender_role === 'admin';
        if (activeTab === 'user') return m.sender_role === 'user';
        return true;
    });

    const categories = [
        { id: 'all', label: 'كلامنا سوا' },
        { id: 'admin', label: 'رسايل حسانين' },
        { id: 'user', label: 'رسايل ندى' }
    ];

    return (
        <div className="min-h-screen pb-24 pt-8 px-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <div className="text-center mb-10 relative z-10">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <h1 className="text-4xl md:text-5xl font-bold font-cairo text-white mb-2 drop-shadow-lg flex items-center justify-center gap-3">
                        <Heart className="text-red-500 fill-red-500 animate-pulse" />
                        مشاعرنا
                    </h1>
                    <p className="text-white/60 font-cairo text-lg">كل كلمة هنا بتوثق لحظة حب بينا ❤️</p>
                </motion.div>

                {/* Tabs */}
                <div className="flex justify-center gap-2 mt-8 flex-wrap">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`px-6 py-2 rounded-full font-cairo font-bold transition-all duration-300 relative overflow-hidden ${activeTab === cat.id
                                    ? cat.id === 'admin' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                        : cat.id === 'user' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                                            : 'bg-gold/20 text-gold border border-gold/50 shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                                }`}
                        >
                            {activeTab === cat.id && (
                                <motion.div layoutId="activeTab" className="absolute inset-0 bg-current opacity-10" />
                            )}
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages Grid */}
            <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2 relative z-10">
                <AnimatePresence mode='popLayout'>
                    {filteredMessages.map((msg, index) => (
                        <motion.div
                            key={msg.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                            className={`relative group rounded-3xl p-6 border backdrop-blur-xl overflow-hidden ${msg.sender_role === 'admin'
                                    ? 'bg-gradient-to-br from-blue-900/10 to-transparent border-blue-500/10 hover:border-blue-500/30'
                                    : 'bg-gradient-to-br from-pink-900/10 to-transparent border-pink-500/10 hover:border-pink-500/30'
                                }`}
                        >
                            {/* Decorative Blur */}
                            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -z-10 transition-opacity opacity-0 group-hover:opacity-100 ${msg.sender_role === 'admin' ? 'bg-blue-500/10' : 'bg-pink-500/10'
                                }`} />

                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg ${msg.sender_role === 'admin' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'
                                        }`}>
                                        {msg.sender_role === 'admin' ? '👑' : '👸'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white font-cairo text-lg leading-tight">{msg.title}</h3>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                                            <Calendar size={10} />
                                            {new Date(msg.created_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {msg.image_url && (
                                <div className="mb-4 rounded-xl overflow-hidden aspect-video relative group/img cursor-pointer">
                                    <img src={msg.image_url} alt={msg.title} className="w-full h-full object-cover transform group-hover/img:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                </div>
                            )}

                            <p className="text-gray-300 font-cairo leading-relaxed whitespace-pre-line text-sm md:text-base">
                                {msg.content}
                            </p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {!loading && filteredMessages.length === 0 && (
                <div className="text-center py-20 text-white/30 font-cairo">
                    <Heart size={48} className="mx-auto mb-4 opacity-20" />
                    <p>لسه مفيش رسايل هنا.. كوني أول حد يكتب! ✨</p>
                </div>
            )}

            {/* FAB */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-gradient-to-r from-gold to-orange-500 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.4)] flex items-center justify-center text-black"
            >
                <Plus size={24} strokeWidth={3} />
            </motion.button>

            {/* Add Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            className="relative bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            {/* Modal Glow */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gold via-purple-500 to-gold" />

                            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition">
                                <X size={24} />
                            </button>

                            <h2 className="text-2xl font-bold text-white mb-6 font-cairo flex items-center gap-2">
                                <Edit2 size={20} className="text-gold" />
                                رسالة جديدة
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1 font-cairo">عنوان الرسالة</label>
                                    <input
                                        type="text"
                                        value={newMsg.title}
                                        onChange={e => setNewMsg({ ...newMsg, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold outline-none transition font-cairo"
                                        placeholder="مثلاً: وحشتيني..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-sm mb-1 font-cairo">محتوى الرسالة</label>
                                    <textarea
                                        value={newMsg.content}
                                        onChange={e => setNewMsg({ ...newMsg, content: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold outline-none transition font-cairo h-32 resize-none scrollbar-thin scrollbar-thumb-white/10"
                                        placeholder="اكتب كل اللي في قلبك..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-sm mb-1 font-cairo flex items-center gap-2">
                                        <ImageIcon size={14} />
                                        رابط صورة (اختياري)
                                    </label>
                                    <input
                                        type="text"
                                        value={newMsg.image_url}
                                        onChange={e => setNewMsg({ ...newMsg, image_url: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold outline-none transition font-mono text-xs text-left"
                                        placeholder="https://example.com/image.jpg"
                                        dir="ltr"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-gold to-orange-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                        <>
                                            إرسال
                                            <Send size={18} className="group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Start Icon for Add Modal
import { Edit2 } from 'lucide-react';

export default FeelingsPage;
