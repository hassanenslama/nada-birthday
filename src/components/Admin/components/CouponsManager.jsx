import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { motion } from 'framer-motion';
import { Ticket, Plus, Trash2, Edit2, RotateCcw, Save, X, Loader2, Sparkles } from 'lucide-react';

const CouponsManager = ({ onToast }) => {
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState(null);

    // Form State
    const [couponToDelete, setCouponToDelete] = useState(null); // For delete confirmation placeholder

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        section: 'nada',
        style: 'love'
    });

    const STYLES = [
        { id: 'love', label: 'رومانسي (حب)', color: 'from-pink-500 to-rose-600' },
        { id: 'royal', label: 'ملكي (فخم)', color: 'from-purple-500 to-indigo-600' },
        { id: 'freedom', label: 'حرية (انطلاق)', color: 'from-cyan-500 to-blue-600' },
        { id: 'foodie', label: 'أكيل (طعام)', color: 'from-orange-500 to-yellow-500' },
        { id: 'magic', label: 'سحري (مفاجأة)', color: 'from-emerald-400 to-teal-600' }
    ];

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            onToast?.('فشل تحميل الكوبونات', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.description) {
            onToast?.('يرجى ملء جميع البيانات', 'warning');
            return;
        }

        try {
            if (isEditing && selectedCoupon) {
                // Update
                const { error } = await supabase
                    .from('coupons')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        section: formData.section,
                        style: formData.style
                    })
                    .eq('id', selectedCoupon.id);

                if (error) throw error;
                onToast?.('تم تحديث الكوبون بنجاح', 'success');
            } else {
                // Insert
                const { error } = await supabase
                    .from('coupons')
                    .insert([{
                        ...formData,
                        is_used: false
                    }]);

                if (error) throw error;
                onToast?.('تم إضافة الكوبون بنجاح', 'success');
            }

            // Reset form
            setFormData({ title: '', description: '', section: 'nada', style: 'love' });
            setIsEditing(false);
            setSelectedCoupon(null);
            fetchCoupons();

        } catch (error) {
            console.error('Error saving coupon:', error);
            onToast?.('حدث خطأ أثناء الحفظ', 'error');
        }
    };

    const confirmDelete = (coupon) => {
        setCouponToDelete(coupon);
    };

    const handleDelete = async () => {
        if (!couponToDelete) return;

        try {
            const { error } = await supabase.from('coupons').delete().eq('id', couponToDelete.id);
            if (error) throw error;
            setCoupons(prev => prev.filter(c => c.id !== couponToDelete.id));
            onToast?.('تم حذف الكوبون', 'success');
            setCouponToDelete(null);
        } catch (error) {
            console.error('Error deleting coupon:', error);
            onToast?.('فشل الحذف', 'error');
        }
    };

    const handleReset = async (id) => {
        try {
            // Reset to unused
            const { error } = await supabase
                .from('coupons')
                .update({ is_used: false, used_at: null })
                .eq('id', id);

            if (error) throw error;
            fetchCoupons();
            onToast?.('تم إعادة تفعيل الكوبون', 'success');
        } catch (error) {
            console.error('Error resetting coupon:', error);
            onToast?.('فشل إعادة التفعيل', 'error');
        }
    };

    const startEdit = (coupon) => {
        setFormData({
            title: coupon.title,
            description: coupon.description,
            section: coupon.section,
            style: coupon.style
        });
        setSelectedCoupon(coupon);
        setIsEditing(true);
    };

    return (
        <div className="space-y-8 font-cairo">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Ticket className="text-gold" /> إدارة كوبونات الدلع
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">تحكم في الكوبونات والهدايا المتاحة</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    {isEditing ? <Edit2 size={18} className="text-blue-400" /> : <Plus size={18} className="text-green-400" />}
                    {isEditing ? 'تعديل كوبون' : 'إضافة كوبون جديد'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">عنوان الكوبون</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="مثال: عزومة عشاء"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Section */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">القسم (مين اللي هيستخدمه؟)</label>
                        <select
                            value={formData.section}
                            onChange={e => setFormData({ ...formData, section: e.target.value })}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                        >
                            <option value="nada">🌸 قسم ندى (كوبونات لندى)</option>
                            <option value="hassan">🦁 قسم حسن (كوبونات لحسن)</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">الوصف</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="وصف تفصيلي للكوبون..."
                            rows={2}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Style */}
                    <div className="md:col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">الستايل (الشكل)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setFormData({ ...formData, style: style.id })}
                                    className={`relative p-3 rounded-xl border transition-all overflow-hidden ${formData.style === style.id
                                        ? 'border-white ring-2 ring-white/20 scale-105'
                                        : 'border-white/5 opacity-70 hover:opacity-100 hover:scale-105'
                                        }`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-20`} />
                                    <div className="relative z-10 text-center">
                                        <div className={`w-8 h-8 mx-auto rounded-full bg-gradient-to-br ${style.color} mb-2 shadow-lg`} />
                                        <span className="text-xs font-bold text-white block">{style.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        {isEditing ? 'حفظ التعديلات' : 'إضافة الكوبون'}
                    </button>
                    {isEditing && (
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({ title: '', description: '', section: 'nada', style: 'love' });
                                setSelectedCoupon(null);
                            }}
                            className="px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all"
                        >
                            إلغاء
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Nada's Coupons */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-pink-400 flex items-center gap-2 mb-4 p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
                        🌸 كوبونات ندى
                    </h3>
                    <div className="space-y-3">
                        {coupons.filter(c => c.section === 'nada').map(coupon => (
                            <CouponCard
                                key={coupon.id}
                                coupon={coupon}
                                onEdit={() => startEdit(coupon)}
                                onDelete={() => confirmDelete(coupon)}
                                onReset={() => handleReset(coupon.id)}
                                styles={STYLES}
                            />
                        ))}
                        {coupons.filter(c => c.section === 'nada').length === 0 && (
                            <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                لا توجد كوبونات لندى
                            </div>
                        )}
                    </div>
                </div>

                {/* Hassan's Coupons */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2 mb-4 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        🦁 كوبونات حسن
                    </h3>
                    <div className="space-y-3">
                        {coupons.filter(c => c.section === 'hassan').map(coupon => (
                            <CouponCard
                                key={coupon.id}
                                coupon={coupon}
                                onEdit={() => startEdit(coupon)}
                                onDelete={() => confirmDelete(coupon)}
                                onReset={() => handleReset(coupon.id)}
                                styles={STYLES}
                            />
                        ))}
                        {coupons.filter(c => c.section === 'hassan').length === 0 && (
                            <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                لا توجد كوبونات لحسن
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {couponToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1a1a1a] border border-red-500/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative"
                    >
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-white mb-2">حذف الكوبون؟</h3>
                        <p className="text-center text-gray-400 mb-6 text-sm">
                            هل أنت متأكد أنك تريد حذف كوبون <span className="text-white font-bold">"{couponToDelete.title}"</span>؟
                            <br /> لا يمكن التراجع عن هذا الإجراء.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleDelete}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                نعم، حذف
                            </button>
                            <button
                                onClick={() => setCouponToDelete(null)}
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                إلغاء
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const CouponCard = ({ coupon, onEdit, onDelete, onReset, styles }) => {
    const styleConfig = styles.find(s => s.id === coupon.style) || styles[0];

    return (
        <motion.div
            layout
            className={`relative overflow-hidden rounded-2xl border transition-all group ${coupon.is_used
                ? 'bg-black/40 border-white/5 opacity-60 grayscale'
                : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
        >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${styleConfig.color} opacity-[0.05]`} />

            <div className="relative p-4 flex items-center gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${styleConfig.color} shadow-lg shrink-0`}>
                    <Sparkles className="text-white" size={20} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-lg leading-tight mb-1">{coupon.title}</h4>
                    <p className="text-gray-400 text-sm line-clamp-1">{coupon.description}</p>

                    {coupon.is_used && (
                        <span className="inline-block mt-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                            مستخدم • {new Date(coupon.used_at).toLocaleDateString('ar-EG')}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-1">
                        <button
                            onClick={onEdit}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    {coupon.is_used && (
                        <button
                            onClick={onReset}
                            className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-colors flex items-center justify-center"
                            title="إعادة تفعيل"
                        >
                            <RotateCcw size={16} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default CouponsManager;
