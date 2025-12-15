import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Clock, CheckCircle, Gift, Sparkles, Heart, Plus, X, Loader2, Palmtree, Waves, Stars, Crown, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

const CouponsPage = () => {
    const { currentUser } = useAuth();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('nada'); // 'nada' or 'hassan'
    const [selectedCoupon, setSelectedCoupon] = useState(null); // For confirmation modal
    const [showAddModal, setShowAddModal] = useState(false); // For adding new coupon

    // Determine if user can add coupons (Nada or Hassan/Admin)
    // Nada -> Can add to 'nada' section
    // Hassan (Admin) -> Can add to 'hassan' section (or both)

    // Simple logic for this private app:
    // Check email for Nada. Check admin role or email for Hassan.
    const isNada = currentUser?.email === 'nada@love.com' || currentUser?.email?.startsWith('nada');
    const isHassan = currentUser?.email === 'hassanen@love.com' || currentUser?.email?.startsWith('admin');

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setCoupons(data);
        setLoading(false);
    };

    const getStyles = (style) => {
        switch (style) {
            case 'love':
                return {
                    bg: 'from-pink-500 via-rose-500 to-red-500',
                    shadow: 'shadow-pink-500/30',
                    icon: Heart,
                    animation: 'animate-pulse',
                    glow: 'hover:shadow-pink-500/50'
                };
            case 'royal':
                return {
                    bg: 'from-purple-600 via-violet-600 to-indigo-700',
                    shadow: 'shadow-purple-500/30',
                    icon: Crown,
                    animation: '',
                    glow: 'hover:shadow-purple-500/60 hover:shadow-2xl'
                };
            case 'freedom':
                return {
                    bg: 'from-sky-400 via-cyan-500 to-blue-600',
                    shadow: 'shadow-cyan-500/30',
                    icon: Zap,
                    animation: '',
                    glow: 'hover:shadow-cyan-400/50'
                };
            case 'foodie':
                return {
                    bg: 'from-orange-400 via-amber-500 to-yellow-500',
                    shadow: 'shadow-orange-500/30',
                    icon: Gift,
                    animation: '',
                    glow: 'hover:shadow-orange-400/50'
                };
            case 'magic':
                return {
                    bg: 'from-emerald-500 via-teal-500 to-cyan-600',
                    shadow: 'shadow-emerald-500/30',
                    icon: Sparkles,
                    animation: '',
                    glow: 'hover:shadow-emerald-400/60'
                };
            case 'sunset':
                return {
                    bg: 'from-red-500 via-orange-500 to-pink-500',
                    shadow: 'shadow-orange-500/30',
                    icon: Sparkles,
                    animation: '',
                    glow: 'hover:shadow-orange-500/60'
                };
            case 'ocean':
                return {
                    bg: 'from-blue-700 via-blue-500 to-cyan-400',
                    shadow: 'shadow-blue-500/30',
                    icon: Waves,
                    animation: '',
                    glow: 'hover:shadow-blue-400/50'
                };
            case 'galaxy':
                return {
                    bg: 'from-purple-900 via-pink-600 to-blue-600',
                    shadow: 'shadow-purple-700/40',
                    icon: Stars,
                    animation: '',
                    glow: 'hover:shadow-purple-500/70'
                };
            case 'gold':
                return {
                    bg: 'from-yellow-500 via-amber-500 to-orange-400',
                    shadow: 'shadow-yellow-500/40',
                    icon: Crown,
                    animation: '',
                    glow: 'hover:shadow-yellow-400/60'
                };
            case 'forest':
                return {
                    bg: 'from-green-700 via-emerald-600 to-lime-500',
                    shadow: 'shadow-green-600/30',
                    icon: Palmtree,
                    animation: '',
                    glow: 'hover:shadow-green-500/50'
                };
            default:
                return {
                    bg: 'from-gray-600 to-gray-700',
                    shadow: 'shadow-gray-500/20',
                    icon: Ticket,
                    animation: '',
                    glow: 'hover:shadow-gray-400/40'
                };
        }
    };

    const handleUseCoupon = async (coupon) => {
        if (!currentUser) return;

        try {
            // 1. Update Coupon
            const { error } = await supabase
                .from('coupons')
                .update({
                    is_used: true,
                    used_at: new Date()
                })
                .eq('id', coupon.id);

            if (error) throw error;

            // 2. Send Notification to the OTHER person
            let recipientEmail = 'hassanen@love.com';
            if (coupon.section === 'hassan') recipientEmail = 'nada@love.com';

            // Get ID by email
            const { data: recipientData } = await supabase.rpc('get_user_id_by_email', { email: recipientEmail });

            if (recipientData) {
                await supabase.from('notifications').insert([{
                    recipient_id: recipientData,
                    title: '🎟️ تم استخدام كوبون!',
                    body: `تم استخدام كوبون "${coupon.title}" بنجاح! جهز نفسك 😉`,
                    type: 'success',
                    created_by: currentUser.id
                }]);
            }

            // 3. UI Updates
            setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_used: true, used_at: new Date() } : c));
            setSelectedCoupon(null);

            // 4. Confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FF69B4', '#FFD700', '#00BFFF']
            });

        } catch (error) {
            console.error('Error using coupon:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    title: 'خطأ',
                    body: 'حدث خطأ أثناء استخدام الكوبون',
                    type: 'error'
                }
            }));
        }
    };

    const handleAddCoupon = async (data) => {
        try {
            const { error } = await supabase.from('coupons').insert([{
                ...data,
                created_by: currentUser.id
            }]);

            if (error) throw error;

            fetchCoupons();
            setShowAddModal(false);

            // Notify success to current user
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    title: 'تم بنجاح! 🎉',
                    body: 'تم إضافة الكوبون الجديد للقائمة',
                    type: 'success'
                }
            }));

            // Send automatic notification to the OTHER person
            console.log('🎯 [COUPON NOTIFICATION] Starting notification send process...');
            try {
                console.log('🎯 [COUPON NOTIFICATION] isNada:', isNada, 'currentUser:', currentUser?.email);

                // Determine creator name and recipient
                const creatorName = isNada ? 'ندى' : 'حسن';
                const recipientEmail = isNada ? 'hassanen@love.com' : 'nada@love.com';

                console.log('🎯 [COUPON NOTIFICATION] Creator:', creatorName, '| Recipient email:', recipientEmail);

                // Get recipient ID
                const { data: recipientId, error: rpcError } = await supabase.rpc('get_user_id_by_email', { email: recipientEmail });

                console.log('🎯 [COUPON NOTIFICATION] RPC Response - ID:', recipientId, '| Error:', rpcError);

                if (recipientId) {
                    console.log('🎯 [COUPON NOTIFICATION] Attempting to insert notification...');
                    const { data: insertResult, error: insertError } = await supabase.from('notifications').insert([{
                        recipient_id: recipientId,
                        title: '🎁 كوبون جديد!',
                        body: `تم إضافة كوبون جديد من قبل ${creatorName}: "${data.title}"`,
                        type: 'info',
                        created_by: currentUser.id
                    }]);

                    console.log('🎯 [COUPON NOTIFICATION] Insert Result:', insertResult, '| Error:', insertError);

                    if (!insertError) {
                        console.log('✅ [COUPON NOTIFICATION] SUCCESS! Notification sent.');
                    }
                } else {
                    console.warn('⚠️ [COUPON NOTIFICATION] No recipient ID found!');
                }
            } catch (notifError) {
                console.error('❌ [COUPON NOTIFICATION] Exception:', notifError);
                // Don't throw - coupon was created successfully
            }

        } catch (error) {
            console.error('Error adding coupon:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    title: 'خطأ',
                    body: 'حدث خطأ أثناء إضافة الكوبون',
                    type: 'error'
                }
            }));
        }
    };

    return (
        <div className="bg-[#0a0a0a] text-white pb-24 font-cairo min-h-full">
            {/* Header */}
            <div className="pt-8 pb-6 px-4 bg-gradient-to-b from-purple-900/20 to-transparent relative">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                        <Gift className="text-gold animate-bounce" />
                        كوبونات الدلع
                    </h1>
                    <p className="text-gray-400 text-sm">😎 {isHassan ? 'استخدمهم' : 'استخدميهم'} بحكمة.. الفرصة بتيجي مرة واحدة!</p>
                </div>

                {/* Add Button (Only for specific users) */}
                {currentUser && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="absolute bottom-6 left-4 p-3 bg-gradient-to-r from-gold to-yellow-600 hover:shadow-lg hover:shadow-gold/50 rounded-full transition-all shadow-xl z-10"
                        title="أضف كوبون جديد"
                    >
                        <Plus className="text-black" size={24} />
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8 px-4">
                <div className="bg-white/5 p-1 rounded-2xl flex w-full max-w-md border border-white/10 relative">
                    {/* Active Tab Indicator Background */}
                    <motion.div
                        layoutId="activeTab"
                        className={`absolute inset-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r ${activeTab === 'nada' ? 'from-pink-500 to-rose-600' : 'from-blue-500 to-cyan-600'} opacity-20`}
                        initial={false}
                        animate={{ x: activeTab === 'nada' ? 0 : '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />

                    <button
                        onClick={() => setActiveTab('nada')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all relative z-10 flex items-center justify-center gap-2 ${activeTab === 'nada' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <span>🌸 كوبونات ندى</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('hassan')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all relative z-10 flex items-center justify-center gap-2 ${activeTab === 'hassan' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <span>🦁 كوبونات حسن</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 max-w-4xl">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {coupons.filter(c => c.section === activeTab).map((coupon, index) => {
                            const style = getStyles(coupon.style);
                            const Icon = style.icon;

                            return (
                                <motion.div
                                    key={coupon.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 group ${coupon.is_used
                                        ? 'border-white/5 bg-gray-900/50 grayscale opacity-70'
                                        : `border-white/10 bg-white/5 hover:border-white/30 hover:shadow-2xl hover:-translate-y-1 ${style.shadow} ${style.glow}`
                                        }`}
                                >
                                    {/* Card Header Background */}
                                    <div className={`h-24 bg-gradient-to-r ${style.bg} relative overflow-hidden`}>
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                                        <Icon className="absolute -bottom-6 -right-6 text-white/20 rotate-12" size={120} />

                                        <div className="absolute top-4 left-4 w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                                            <Icon className="text-white" size={24} />
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6 relative">
                                        <h3 className="text-xl font-bold text-white mb-2 leading-tight">{coupon.title}</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                            {coupon.description}
                                        </p>

                                        {coupon.is_used ? (
                                            <div className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-gray-500 font-bold text-center text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                                                <Clock size={16} />
                                                <span>تم الاستخدام في {new Date(coupon.used_at).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                        ) : coupon.created_by === currentUser?.id ? (
                                            <div className="w-full py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold text-center text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                                                <Gift size={16} />
                                                <span>هدية منك للطرف الآخر 💝</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedCoupon(coupon)}
                                                className={`w-full py-3.5 rounded-xl font-bold text-sm bg-white text-black hover:bg-gold transition-all shadow-lg flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-95`}
                                            >
                                                <Ticket size={18} className="text-black" />
                                                استخدام الكوبون
                                            </button>
                                        )}
                                    </div>

                                    {/* Setup Top Right Badge if Used */}
                                    {coupon.is_used && (
                                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1">
                                            <CheckCircle size={12} className="text-green-400" />
                                            مستخدم
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {!loading && coupons.filter(c => c.section === activeTab).length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <Gift size={64} className="mx-auto mb-4 text-gray-600" />
                        <p>لا توجد كوبونات متاحة حالياً في هذا القسم</p>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {selectedCoupon && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setSelectedCoupon(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a1a1a] border border-white/10 p-6 rounded-3xl w-full max-w-sm relative z-10 shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-gold to-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-gold/20">
                                <Ticket size={32} className="text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-center mb-2 text-white">متأكدة يا روحي؟ 😉</h3>
                            <p className="text-center text-gray-400 text-sm mb-6 leading-relaxed">
                                لو استخدمتي كوبون <span className="text-gold font-bold">"{selectedCoupon.title}"</span>
                                مش هتقدري ترجعيه تاني إلا بموافقة الإدارة العليا (أنا يعني 🦁).
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleUseCoupon(selectedCoupon)}
                                    className="flex-1 py-3 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all transform active:scale-95"
                                >
                                    أيوه استخدمه! 🔥
                                </button>
                                <button
                                    onClick={() => setSelectedCoupon(null)}
                                    className="flex-1 py-3 bg-white/5 text-gray-300 font-bold rounded-xl hover:bg-white/10 transition-all"
                                >
                                    خلاص بلاش 🙈
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Coupon Modal */}
            <AddCouponModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddCoupon}
                currentUser={currentUser}
                isNada={isNada}
                isHassan={isHassan}
                getStyles={getStyles}
            />
        </div>
    );
};

// Simplified Add Coupon Modal for Users
const AddCouponModal = ({ isOpen, onClose, onAdd, isNada, isHassan, getStyles }) => {
    const defaultSection = isNada ? 'nada' : 'hassan';
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        style: 'love',
        section: defaultSection
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!formData.title || !formData.description) return;
        setSubmitting(true);
        await onAdd(formData);
        setSubmitting(false);
        setFormData({ title: '', description: '', style: 'love', section: defaultSection });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-[#1a1a1a] border border-white/10 p-6 rounded-3xl w-full max-w-md relative z-10 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Plus className="text-gold" /> إضافة كوبون جديد
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">عنوان الكوبون</label>
                        <input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-gold outline-none"
                            placeholder="مثال: خروجة سينما"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">الوصف</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-gold outline-none resize-none h-24"
                            placeholder="وصف الهدية..."
                        />
                    </div>

                    {/* Live Preview */}
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">المعاينة المباشرة</label>
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 p-4 bg-black/30">
                            {(() => {
                                const previewStyle = getStyles(formData.style);
                                const PreviewIcon = previewStyle.icon;
                                return (
                                    <div className="scale-75 origin-top">
                                        <div className={`h-20 bg-gradient-to-r ${previewStyle.bg} relative overflow-hidden rounded-2xl mb-3`}>
                                            <PreviewIcon className="absolute -bottom-4 -right-4 text-white/20 rotate-12" size={80} />
                                            <div className="absolute top-3 left-3 w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                                                <PreviewIcon className="text-white" size={18} />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-base mb-1">{formData.title || 'عنوان الكوبون'}</h4>
                                            <p className="text-gray-400 text-xs">{formData.description || 'وصف الكوبون سيظهر هنا...'}</p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Style Selection - Enhanced Visual Grid */}
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">اختر شكل الكارت (10 أشكال مميزة)</label>
                        <div className="grid grid-cols-5 gap-2">
                            {['love', 'royal', 'freedom', 'foodie', 'magic', 'sunset', 'ocean', 'galaxy', 'gold', 'forest'].map(styleId => {
                                const themeStyle = getStyles(styleId);
                                const ThemeIcon = themeStyle.icon;
                                return (
                                    <button
                                        key={styleId}
                                        onClick={() => setFormData({ ...formData, style: styleId })}
                                        className={`relative p-2 rounded-xl border transition-all overflow-hidden group ${formData.style === styleId
                                            ? 'border-white ring-2 ring-white/40 scale-105'
                                            : 'border-white/10 opacity-70 hover:opacity-100 hover:scale-105'
                                            }`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${themeStyle.bg} opacity-30 group-hover:opacity-50 transition-opacity`} />
                                        <div className="relative z-10">
                                            <ThemeIcon className="mx-auto text-white" size={20} />
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !formData.title}
                        className="w-full py-4 bg-gradient-to-r from-gold to-yellow-600 rounded-xl font-bold text-black mt-4 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 className="animate-spin" size={18} />}
                        إضافة الكوبون ✨
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default CouponsPage;
