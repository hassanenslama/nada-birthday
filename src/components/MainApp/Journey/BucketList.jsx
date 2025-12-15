
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import { Send, Loader2, PartyPopper, AlertTriangle } from 'lucide-react';
import WishItem from './WishItem';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';

const SortableWishItem = ({ item, index, onUpdate, onDelete }) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={item}
            id={item.id}
            dragListener={false}
            dragControls={controls}
            className="relative"
            whileDrag={{ scale: 1.05, zIndex: 50 }}
        >
            <WishItem
                item={item}
                index={index}
                onUpdate={onUpdate}
                onDelete={onDelete}
                dragControls={controls}
            />
        </Reorder.Item>
    );
};

const BucketList = () => {
    const { userRole } = useAuth();
    const [wishes, setWishes] = useState([]);
    const [newItemText, setNewItemText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [dbError, setDbError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all' | 'completed'

    useEffect(() => {
        const init = async () => {
            await fetchWishes();
            await migrateLocalStorage();
        };
        init();

        const subscription = supabase
            .channel('wishes_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wishes' }, (payload) => {
                fetchWishes(); // Refetch to align sort orders easily
            })
            .subscribe();

        return () => subscription.unsubscribe();
    }, []);

    const migrateLocalStorage = async () => {
        const saved = localStorage.getItem('bucketList');
        if (saved) {
            try {
                const localItems = JSON.parse(saved);
                if (localItems.length > 0) {
                    console.log('Migrating local items:', localItems.length);

                    const newWishes = localItems.map((item, index) => ({
                        title: item.text,
                        created_by_role: userRole || 'user',
                        status: item.completed ? 'completed' : 'pending',
                        completed_at: item.completed ? new Date().toISOString() : null,
                        sort_order: index // Initial order
                    }));

                    const { error } = await supabase.from('wishes').insert(newWishes);

                    if (!error) {
                        localStorage.removeItem('bucketList');
                        fetchWishes(); // Refresh
                        console.log('Migration successful');
                    }
                }
            } catch (e) {
                console.error('Migration failed', e);
            }
        }
    };

    const fetchWishes = async () => {
        setIsLoading(true);
        setDbError(null);
        // Order by custom sort_order
        const { data, error } = await supabase
            .from('wishes')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Fetch error:', error);
            setDbError(error);
        } else if (data) {
            setWishes(data);
        }
        setIsLoading(false);
    };

    const handleAddWish = async (e) => {
        e.preventDefault();
        if (!newItemText.trim()) return;

        // Optimistic
        const newOrder = wishes.length > 0 ? Math.min(...wishes.map(w => w.sort_order || 0)) - 1 : 0;
        const optimisticWish = {
            id: 'temp-' + Date.now(),
            title: newItemText,
            created_by_role: userRole,
            status: 'pending',
            created_at: new Date().toISOString(),
            sort_order: newOrder
        };

        setWishes(prev => [optimisticWish, ...prev]);
        setNewItemText('');

        const { data, error } = await supabase
            .from('wishes')
            .insert([{
                title: optimisticWish.title,
                created_by_role: userRole,
                status: 'pending',
                sort_order: newOrder
            }])
            .select()
            .single();

        if (error) {
            console.error(error);
            setWishes(prev => prev.filter(w => w.id !== optimisticWish.id));
        } else {
            setWishes(prev => prev.map(w => w.id === optimisticWish.id ? data : w));
        }
    };

    const handleUpdateWish = async (id, updates) => {
        // Optimistic Update
        setWishes(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));

        const { error } = await supabase
            .from('wishes')
            .update(updates)
            .eq('id', id);

        if (error) console.error('Error updating wish:', error);
    };

    const handleDeleteWish = async (id) => {
        if (!window.confirm('مسح الأمنية دي؟')) return;
        setWishes(prev => prev.filter(w => w.id !== id));
        const { error } = await supabase.from('wishes').delete().eq('id', id);
        if (error) console.error('Error deleting wish:', error);
    };

    const handleReorder = (newOrder) => {
        setWishes(newOrder);

        // Debounce or immediate update? Immediate for now but batch
        // We will update their sort_order in background
        const updates = newOrder.map((item, index) => ({
            id: item.id,
            sort_order: index
        }));

        // We can't do upsert easily on ID only with rpc?
        // Simple loop is okay for small list (<100 items)
        updates.forEach(async (update) => {
            await supabase.from('wishes').update({ sort_order: update.sort_order }).eq('id', update.id);
        });
    };

    const completedCount = wishes.filter(w => w.status === 'completed').length;
    const progress = wishes.length > 0 ? Math.round((completedCount / wishes.length) * 100) : 0;

    return (
        <div className="p-4 sm:p-6 pb-20 min-h-[60vh]">

            {/* Header Stats */}
            <div className="text-center mb-6 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gold/20 blur-3xl rounded-full -z-10" />

                <h2 className="text-2xl md:text-4xl font-bold font-cairo text-white mb-2 drop-shadow-lg">
                    قائمة <span className="text-gold">أمنياتنا</span>
                </h2>
                <div className="flex items-center justify-center gap-2 text-gray-400 font-cairo text-xs md:text-sm mb-4">
                    <PartyPopper size={16} className="text-gold" />
                    <span>حققنا {completedCount} من أصل {wishes.length} حلم</span>
                </div>

                {/* Progress Bar */}
                <div className="max-w-md mx-auto relative h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: progress + '%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="absolute inset-y-0 right-0 bg-gradient-to-l from-gold to-orange-500 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.5)]"
                    />
                </div>
            </div>


            {/* Filter Tabs */}
            <div className="flex justify-center mb-6 gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-1.5 rounded-xl font-bold font-cairo text-sm transition-all flex items-center gap-2 ${filter === 'all' ? 'bg-white text-black shadow-lg scale-105' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                    الكل
                    <span className="bg-black/10 px-2 py-0.5 rounded-full text-[10px]">{wishes.length}</span>
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    className={`px-4 py-1.5 rounded-xl font-bold font-cairo text-sm transition-all flex items-center gap-2 ${filter === 'completed' ? 'bg-gold text-black shadow-lg scale-105 shadow-gold/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                    متحقق
                    <span className="bg-black/10 px-2 py-0.5 rounded-full text-[10px]">{completedCount}</span>
                </button>
            </div>

            {/* Input Area */}
            {dbError ? (
                <div className="max-w-md mx-auto mb-8 bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-center">
                    <AlertTriangle className="mx-auto text-red-500 mb-2" size={32} />
                    <p className="text-white font-bold mb-1">عذراً، قاعدة البيانات غير جاهزة</p>
                    <p className="text-red-300 text-xs font-mono">يرجى تشغيل ملف create_wishes_table.sql</p>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto mb-12 relative z-20">
                    <form onSubmit={handleAddWish} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-gold via-orange-500 to-gold rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur-sm"></div>
                        <input
                            type="text"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            placeholder={userRole === 'admin' ? "اكتب أمنية جديدة يا حسن... 👑" : "اكتبي أمنية جديدة يا ندى... ✨"}
                            className="relative w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 pl-14 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 font-cairo text-base md:text-lg shadow-xl"
                            dir="rtl"
                        />
                        <button
                            type="submit"
                            disabled={!newItemText.trim()}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gold hover:bg-white text-black rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                        >
                            <Send size={18} className={newItemText.trim() ? 'ml-1' : ''} />
                        </button>
                    </form>
                </div>
            )}

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-gold" size={32} />
                </div>
            ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                    {filter === 'all' ? (
                        <Reorder.Group
                            axis="y"
                            values={wishes}
                            onReorder={handleReorder}
                            className="space-y-4"
                        >
                            <AnimatePresence mode='popLayout'>
                                {wishes.length > 0 ? (
                                    wishes.map((wish, index) => (
                                        (wish.status !== 'deleted') && (
                                            (wish.status !== 'deleted') && (
                                                <SortableWishItem
                                                    key={wish.id}
                                                    item={wish}
                                                    index={index}
                                                    onUpdate={handleUpdateWish}
                                                    onDelete={handleDeleteWish}
                                                />
                                            )
                                        )
                                    ))
                                ) : (
                                    <div className="text-center py-20 text-gray-500 font-cairo">
                                        <p>لسه مفيش أمنيات.. ابدأوا احلموا سوا! ✨</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </Reorder.Group>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence mode='popLayout'>
                                {wishes.map((wish, index) => (
                                    (wish.status === 'completed') && (
                                        <motion.div
                                            key={wish.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <WishItem
                                                item={wish}
                                                index={index}
                                                onUpdate={handleUpdateWish}
                                                onDelete={handleDeleteWish}
                                                isDragging={false}
                                            />
                                        </motion.div>
                                    )
                                ))}
                                {completedCount === 0 && (
                                    <div className="text-center py-20 text-gray-500 font-cairo">
                                        <p>لسه محققناش حاجة.. شدوا حيلكم! 💪</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BucketList;
