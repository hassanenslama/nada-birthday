import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';
import { timelineData } from '../../../data/timeline';
import { Activity, PlusCircle, Unlock, Lock, Trash2, Calendar, Filter } from 'lucide-react';
import AddMemoryModal from './modals/AddMemoryModal';

const MemoryManager = ({ currentUser, nadaUserId, onToast }) => {
    const [coreMemories, setCoreMemories] = useState([]);
    const [customMemories, setCustomMemories] = useState([]);
    const [unlockedIds, setUnlockedIds] = useState([]);
    const [filter, setFilter] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();

        if (!nadaUserId) return;

        // Subscribe to changes (Real-time update when user plays game)
        console.log("Subscribing to unlocking events for:", nadaUserId);
        const channel = supabase
            .channel(`admin_memory_updates_${nadaUserId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'unlocked_memories',
                filter: `user_id=eq.${nadaUserId}`
            }, (payload) => {
                console.log("Admin received memory update:", payload);
                if (payload.new && payload.new.ids) {
                    setUnlockedIds(payload.new.ids.map(Number));
                    onToast('تم تحديث الذكريات تلقائياً! ♻️', 'success');
                }
            })
            .subscribe();

        return () => {
            console.log("Unsubscribing admin...");
            supabase.removeChannel(channel);
        };
    }, [currentUser, nadaUserId]);

    const fetchData = async () => {
        // Load custom memories
        const { data: custom } = await supabase.from('custom_memories').select('*').order('date', { ascending: false });
        if (custom) setCustomMemories(custom);
        setCoreMemories(timelineData);

        // Load unlock status
        if (nadaUserId) {
            const { data: unlockedData } = await supabase.from('unlocked_memories').select('ids').eq('user_id', nadaUserId).maybeSingle();
            if (unlockedData) {
                console.log("Admin loaded initial unlocks:", unlockedData.ids);
                setUnlockedIds((unlockedData.ids || []).map(Number));
            }
        }
    };

    const toggleLock = async (memoryId, isLocked) => {
        if (!nadaUserId) {
            onToast('لازم تربط حساب ندى الأول! ⚠️', 'error');
            return;
        }

        let error;
        if (isLocked) {
            // To Lock (Remove from unlocked list) -> Call remove RPC
            // Wait, if "isLocked" is true (the current state passed in?), no usually UI passes "target state" or "current state".
            // Let's check the UI call.
            // <button onClick={() => toggleLock(mem.id, !isUnlocked)}>
            // If !isUnlocked is true, we want to UNLOCK.
            // So if `isLocked` arg implies "Make it Locked" or "It is Locked"?
            // Variable name `isLocked` in `toggleLock(memoryId, isLocked)` is ambiguous.
            // Let's assume the argument represents the NEW STATE we want.
            // If we want to Lock -> remove from DB.
            // If we want to Unlock -> add to DB.
        }

        // Actually, looking at previous code:
        // let newIds = isLocked ? [...add] : filter...
        // so `isLocked` meant "Should be Locked" (Wait, `newIds = isLocked ? [...add]` -> If `isLocked` is true, we ADD it? That means UNLOCKING it?)
        // Let's check previous code:
        // `let newIds = isLocked ? [...new Set([...unlockedIds, memoryId])] : unlockedIds.filter(id => id !== memoryId);`
        // If `isLocked` is true, we ADD -> So `isLocked` meant "Make it Unlocked" (confusing name).
        // Let's rename the argument for clarity: `shouldUnlock`.

        const shouldUnlock = isLocked; // maintain existing logic flow direction

        if (shouldUnlock) {
            const { error: rpcError } = await supabase.rpc('append_unlocked_memory', { p_user_id: nadaUserId, p_memory_id: memoryId });
            error = rpcError;
        } else {
            const { error: rpcError } = await supabase.rpc('remove_unlocked_memory', { p_user_id: nadaUserId, p_memory_id: memoryId });
            error = rpcError;
        }

        if (error) {
            console.error("RPC Error:", error);
            onToast('فشل تعديل الحالة', 'error');
        } else {
            // Optimistic update or wait for Realtime?
            // Realtime is subscribed, so it should update automatically!
            // But we can update local state for instant feedback.
            // setUnlockedIds is updated via subscription.
            onToast(shouldUnlock ? 'تم فتح الصورة للحب ✅' : 'تم قفل الصورة 🔒', 'success');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('متأكد عايز تمسح الذكرى دي نهائي؟')) return;
        const { error } = await supabase.from('custom_memories').delete().eq('id', id);
        if (!error) {
            setCustomMemories(prev => prev.filter(m => m.id !== id));
            onToast('تم المسح بنجاح 🗑️', 'success');
        } else {
            onToast('فشل المسح', 'error');
        }
    };

    const handleAdd = async (data) => {
        setUploading(true);
        try {
            const result = await uploadToCloudinary(data.image, { folder: 'gallery-memories' });
            const { data: inserted, error } = await supabase.from('custom_memories').insert({
                user_id: currentUser.id,
                title: data.title,
                description: data.desc,
                date: new Date(data.date).toISOString(),
                image: result.url
            }).select();

            if (error) throw error;
            if (inserted) setCustomMemories(prev => [inserted[0], ...prev]);

            onToast('تمت الإضافة بنجاح ✨', 'success');
            setShowAddForm(false);
        } catch (e) {
            console.error(e);
            onToast('فشل الرفع: ' + e.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const allMemories = [
        ...coreMemories.map(m => ({ ...m, type: 'core' })),
        ...customMemories.map(m => ({ ...m, type: 'custom' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const displayMemories = filter === 'all' ? allMemories : allMemories.filter(m => m.type === filter);

    return (
        <div className="bg-[#121212] border border-gold/20 rounded-3xl p-6 relative min-h-[500px]">
            {/* Header / Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-2">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">ألبوم الذكريات</h3>
                        <p className="text-xs text-gray-500">{displayMemories.length} ذكرى موجودة</p>
                    </div>
                </div>

                <div className="flex bg-[#1a1a1a] rounded-xl p-1 gap-1 border border-white/5 w-full md:w-auto">
                    {['all', 'core', 'custom'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition ${filter === f ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {f === 'all' ? 'الكل' : f === 'core' ? 'الأساسية' : 'المضافة'}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full md:w-auto flex items-center gap-2 bg-gold text-black px-6 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition shadow-lg shadow-gold/10"
                >
                    <PlusCircle size={18} />
                    <span>إضافة ذكرى</span>
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayMemories.map((mem) => {
                    const isUnlocked = mem.type === 'custom' ? true : unlockedIds.includes(mem.id); // Custom always visible to admin
                    return (
                        <div key={`${mem.type}-${mem.id}`} className="group relative bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5 hover:border-gold/30 transition duration-500 shadow-xl">
                            {/* Image Area */}
                            <div className="relative h-56 overflow-hidden">
                                <img src={mem.image} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-80" />

                                {/* Badge */}
                                <div className="absolute top-3 right-3">
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase backdrop-blur-md border border-white/10 ${mem.type === 'core' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                        {mem.type === 'core' ? 'نظام' : 'خاص'}
                                    </span>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-5 relative">
                                <h4 className="font-bold text-white text-lg mb-1 line-clamp-1">{mem.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                    <Calendar size={12} />
                                    <span>{new Date(mem.date).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2 h-10 leading-relaxed mb-4">{mem.description}</p>

                                {/* Actions Bar */}
                                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                    <div className="text-xs font-bold text-gold/50 group-hover:text-gold transition">
                                        {isUnlocked ? 'ظاهرة لندى ✅' : 'مقفولة 🔒'}
                                    </div>

                                    {mem.type === 'core' ? (
                                        <button
                                            onClick={() => toggleLock(mem.id, !isUnlocked)}
                                            className={`p-2 rounded-lg transition ${isUnlocked ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                                            title={isUnlocked ? 'قفل' : 'فتح'}
                                        >
                                            {isUnlocked ? <Lock size={18} /> : <Unlock size={18} />}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleDelete(mem.id)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
                                            title="مسح"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <AddMemoryModal isOpen={showAddForm} onClose={() => setShowAddForm(false)} onAdd={handleAdd} loading={uploading} />
        </div>
    );
};

export default MemoryManager;
