import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Trash2, Edit2, Search, Heart, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmActionModal from './modals/ConfirmActionModal';

const FeelingsManager = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, admin, user
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });

    // Editing
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', content: '' });

    useEffect(() => {
        fetchMessages();

        const sub = supabase.channel('admin_feelings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'feelings' }, fetchMessages)
            .subscribe();

        return () => sub.unsubscribe();
    }, []);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('feelings')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setMessages(data);
        setLoading(false);
    };

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            data: { id, action: 'delete' },
            title: 'حذف الرسالة',
            message: 'هل أنت متأكد من حذف هذه الرسالة نهائياً؟',
            type: 'danger',
            confirmText: 'حذف'
        });
    };

    const performAction = async () => {
        const { id, action } = confirmModal.data;
        if (action === 'delete') {
            await supabase.from('feelings').delete().eq('id', id);
        }
        setConfirmModal({ isOpen: false, data: null });
    };

    const startEdit = (msg) => {
        setEditingId(msg.id);
        setEditForm({ title: msg.title, content: msg.content });
    };

    const saveEdit = async (id) => {
        await supabase.from('feelings').update({
            title: editForm.title,
            content: editForm.content
        }).eq('id', id);
        setEditingId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const filteredMessages = messages.filter(m => {
        if (filter === 'all') return true;
        if (filter === 'admin') return m.sender_role === 'admin';
        if (filter === 'user') return m.sender_role === 'user';
        return true;
    });

    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 overflow-hidden relative group">
            <ConfirmActionModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={performAction}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
            />

            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-xl font-bold text-white font-cairo flex items-center gap-2">
                    <span className="text-pink-500">💌</span> إدارة المشاعر
                    <span className="text-xs bg-white/5 px-2 py-1 rounded-full text-gray-400 font-mono">{messages.length}</span>
                </h3>

                <div className="flex gap-2">
                    {['all', 'admin', 'user'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-pink-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            {f === 'all' ? 'الكل' : f === 'admin' ? 'حسانين' : 'ندى'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                <AnimatePresence mode='popLayout'>
                    {filteredMessages.map(msg => (
                        <motion.div
                            layout
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/5 border border-white/5 p-4 rounded-xl group/card hover:bg-white/10 transition-colors"
                        >
                            {editingId === msg.id ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm font-bold font-cairo focus:border-pink-500 outline-none"
                                        placeholder="العنوان"
                                    />
                                    <textarea
                                        value={editForm.content}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-gray-300 text-sm font-cairo focus:border-pink-500 outline-none h-20 resize-none"
                                        placeholder="المحتوى"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-white px-3 py-1">إلغاء</button>
                                        <button onClick={() => saveEdit(msg.id)} className="text-xs bg-pink-500 text-white hover:bg-pink-600 px-3 py-1 rounded">حفظ</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${msg.sender_role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                                                {msg.sender_role === 'admin' ? 'Hassanen 👑' : 'Nada 👸'}
                                            </span>
                                            <span className="text-[10px] text-gray-600 font-mono">
                                                {new Date(msg.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="text-white font-bold font-cairo mb-1">{msg.title}</h4>
                                        <p className="text-gray-400 text-xs font-cairo line-clamp-2">{msg.content}</p>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(msg)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                            title="تعديل"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(msg.id)}
                                            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FeelingsManager;
