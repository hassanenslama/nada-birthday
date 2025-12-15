
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { Check, Clock, Trash2, RefreshCw, AlertTriangle, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmActionModal from './modals/ConfirmActionModal';

const WishManager = () => {
    const [wishes, setWishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, completed, deleted, pending
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });

    useEffect(() => {
        fetchWishes();

        const sub = supabase.channel('admin_wishes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wishes' }, fetchWishes)
            .subscribe();

        return () => sub.unsubscribe();
    }, []);

    const fetchWishes = async () => {
        const { data, error } = await supabase
            .from('wishes')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setWishes(data);
        setLoading(false);
    };

    const initiateAction = (id, action) => {
        if (action === 'force_delete') {
            setConfirmModal({
                isOpen: true,
                data: { id, action },
                title: 'حذف نهائي للأمنية',
                message: 'هل أنت متأكد من حذف هذه الأمنية نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
                type: 'danger',
                confirmText: 'حذف نهائي'
            });
        } else if (action === 'restore') {
            setConfirmModal({
                isOpen: true,
                data: { id, action },
                title: 'استرجاع الأمنية',
                message: 'هل تريد إعادة هذه الأمنية إلى القائمة (قيد الانتظار)؟',
                type: 'warning',
                confirmText: 'استرجاع'
            });
        } else if (action === 'reopen') {
            setConfirmModal({
                isOpen: true,
                data: { id, action },
                title: 'إعادة فتح الأمنية',
                message: 'هل تريد إلغاء تحقيق هذه الأمنية وإعادتها للقائمة؟',
                type: 'warning',
                confirmText: 'إعادة فتح'
            });
        }
    };

    const performAction = async () => {
        const { id, action } = confirmModal.data;
        try {
            let updates = {};
            if (action === 'restore' || action === 'reopen') {
                updates = { status: 'pending', completed_at: null, proposed_by_role: null };
            } else if (action === 'force_delete') {
                await supabase.from('wishes').delete().eq('id', id);
                setConfirmModal({ isOpen: false, data: null });
                return;
            }

            await supabase.from('wishes').update(updates).eq('id', id);
        } catch (err) {
            console.error(err);
        }
        setConfirmModal({ isOpen: false, data: null });
    };

    const handleDateUpdate = async (id, newDate) => {
        // Optimistic update
        setWishes(prev => prev.map(w => w.id === id ? { ...w, completed_at: newDate } : w));

        await supabase.from('wishes').update({ completed_at: newDate }).eq('id', id);
    };

    const filteredWishes = wishes.filter(w => {
        if (filter === 'all') return true;
        if (filter === 'deleted') return w.status === 'deleted' || w.status === 'pending_delete';
        if (filter === 'completed') return w.status === 'completed';
        if (filter === 'pending') return w.status === 'pending' || w.status === 'waiting_confirmation';
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

            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-xl font-bold text-white font-cairo flex items-center gap-2">
                    <span className="text-gold">✨</span> إدارة الأمنيات
                    <span className="text-xs bg-white/5 px-2 py-1 rounded-full text-gray-400 font-mono">{wishes.length}</span>
                </h3>

                <div className="flex gap-2">
                    {['all', 'completed', 'deleted'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-gold text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            {f === 'all' ? 'الكل' : f === 'completed' ? 'محقق' : 'محذوف'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                <AnimatePresence mode='popLayout'>
                    {filteredWishes.map(wish => (
                        <motion.div
                            layout
                            key={wish.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`flex items-center justify-between p-3 rounded-xl border ${wish.status === 'deleted' ? 'bg-red-500/5 border-red-500/10' :
                                wish.status === 'completed' ? 'bg-green-500/5 border-green-500/10' :
                                    'bg-white/5 border-white/5'
                                } `}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <div className={`w-2 h-2 rounded-full ${wish.status === 'completed' ? 'bg-gold' :
                                        wish.status === 'deleted' ? 'bg-red-500' : 'bg-gray-500'
                                    }`} />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className={`font-cairo font-bold text-sm ${wish.status === 'deleted' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                            {wish.title}
                                        </p>
                                        {wish.status === 'completed' && (
                                            <input
                                                type="date"
                                                value={wish.completed_at ? wish.completed_at.split('T')[0] : ''}
                                                onChange={(e) => handleDateUpdate(wish.id, e.target.value)}
                                                className="bg-black/20 border border-white/10 rounded px-2 py-0.5 text-[10px] text-gold font-mono focus:outline-none focus:border-gold/50 cursor-pointer hover:bg-black/40 transition-colors"
                                                title="تعديل تاريخ الانجاز"
                                            />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-mono mt-0.5 flex gap-2">
                                        <span>{wish.created_by_role === 'admin' ? 'by Hassanen' : 'by Nada'}</span>
                                        {wish.status === 'pending_delete' && <span className="text-red-400 font-bold">(طلب حذف)</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                {wish.status === 'deleted' && (
                                    <button
                                        onClick={() => initiateAction(wish.id, 'restore')}
                                        className="p-1.5 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors"
                                        title="استرجاع"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                )}
                                {(wish.status === 'completed') && (
                                    <button
                                        onClick={() => initiateAction(wish.id, 'reopen')}
                                        className="p-1.5 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"
                                        title="إعادة فتح"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={() => initiateAction(wish.id, 'force_delete')}
                                    className="p-1.5 hover:bg-red-500/20 text-red-500/50 hover:text-red-500 rounded-lg transition-colors"
                                    title="حذف نهائي"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredWishes.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">لا توجد أمنيات هنا</div>
                )}
            </div>
        </div>
    );
};

export default WishManager;
