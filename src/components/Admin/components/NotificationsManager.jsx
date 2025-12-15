import React, { useState } from 'react';
import { supabase } from '../../../supabase';
import { Send, Bell, Loader2, Trash2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const NotificationsManager = ({ onToast }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [type, setType] = useState('info');
    const [recipientId, setRecipientId] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [users, setUsers] = useState([]);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch users and recent notifications on mount
    React.useEffect(() => {
        fetchUsers();
        fetchRecentNotifications();
    }, []);

    const fetchUsers = async () => {
        try {
            console.log('🔍 Fetching users from user_profiles...');

            // Fetch from user_profiles (has: id, display_name, profile_picture, bio, created_at)
            const { data, error } = await supabase
                .from('user_profiles')
                .select('id, display_name');

            if (error) {
                console.error('❌ Error fetching user_profiles:', error);
                // Fallback: use current admin
                const currentUser = (await supabase.auth.getUser()).data.user;
                setUsers([
                    {
                        id: currentUser?.id,
                        name: 'Admin',
                        display_name: 'أنا (الأدمن)'
                    }
                ]);
            } else {
                console.log('✅ Users fetched:', data);
                // Map display_name to name for compatibility
                const mappedUsers = (data || []).map(u => ({
                    id: u.id,
                    name: u.display_name || 'مستخدم',
                    display_name: u.display_name
                }));
                setUsers(mappedUsers);
            }
        } catch (err) {
            console.error('❌ Caught error:', err);
            setHasError(true);
            setErrorMessage(err.message);
        }
    };

    const fetchRecentNotifications = async () => {
        try {
            console.log('🔍 Fetching recent notifications...');

            // Get current admin ID
            const currentUserId = (await supabase.auth.getUser()).data.user?.id;

            const { data, error } = await supabase
                .from('notifications')
                // We must specify the FK because we now have two links (recipient_id and created_by)
                .select('*, recipient:user_profiles!notifications_recipient_id_fkey_profiles(display_name)')
                .eq('created_by', currentUserId) // Only get notifications created by this admin
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('❌ Error fetching notifications:', error);
                // Don't crash, just set empty array
                setRecentNotifications([]);
                return;
            }

            console.log('✅ Notifications fetched:', data);
            // Ensure data is array and has safe values
            const safeData = (data || []).map(notif => ({
                ...notif,
                recipient: notif.recipient || { display_name: 'مستخدم' }
            }));
            setRecentNotifications(safeData);
        } catch (err) {
            console.error('❌ Caught error in fetchRecentNotifications:', err);
            // Don't set hasError, just log and continue
            setRecentNotifications([]);
        }
    };

    const handleSend = async () => {
        if (!title || !body) {
            onToast?.('من فضلك املأ العنوان والرسالة', 'error');
            return;
        }

        setIsSending(true);

        try {
            const currentUserId = (await supabase.auth.getUser()).data.user?.id;

            // If "all" is selected, send to all users
            if (recipientId === 'all') {
                const notifications = users.map(user => ({
                    title,
                    body,
                    type,
                    recipient_id: user.id,
                    created_by: currentUserId
                }));

                const { error } = await supabase.from('notifications').insert(notifications);

                if (error) {
                    console.error('Error sending notifications:', error);
                    onToast?.('فشل إرسال الإشعارات', 'error');
                } else {
                    onToast?.(`تم إرسال ${users.length} إشعار بنجاح!`, 'success');
                    setTitle('');
                    setBody('');
                    setRecipientId('');
                    // Safely fetch notifications without crashing
                    try {
                        await fetchRecentNotifications();
                    } catch (err) {
                        console.error('Error refreshing notifications:', err);
                    }
                }
            } else {
                // Send to single user
                if (!recipientId) {
                    onToast?.('من فضلك اختر المستلم', 'error');
                    setIsSending(false);
                    return;
                }

                const { error } = await supabase.from('notifications').insert({
                    title,
                    body,
                    type,
                    recipient_id: recipientId,
                    created_by: currentUserId
                });

                if (error) {
                    console.error('Error sending notification:', error);
                    onToast?.('فشل إرسال الإشعار', 'error');
                } else {
                    onToast?.('تم إرسال الإشعار بنجاح!', 'success');
                    setTitle('');
                    setBody('');
                    setRecipientId('');
                    // Safely fetch notifications without crashing
                    try {
                        await fetchRecentNotifications();
                    } catch (err) {
                        console.error('Error refreshing notifications:', err);
                    }
                }
            }
        } catch (err) {
            console.error('Error in handleSend:', err);
            onToast?.('حدث خطأ أثناء الإرسال', 'error');
        }

        setIsSending(false);
    };

    const handleDelete = async (id) => {
        const { error } = await supabase.from('notifications').delete().eq('id', id);
        if (!error) {
            fetchRecentNotifications();
            onToast?.('تم حذف الإشعار بنجاح', 'success');
        }
    };

    // Show error state if table doesn't exist
    if (hasError) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                <h3 className="text-red-400 text-xl font-bold mb-4">⚠️ خطأ في التهيئة</h3>
                <p className="text-gray-300 mb-6">{errorMessage}</p>
                <div className="bg-black/30 p-4 rounded-lg text-left">
                    <p className="text-sm text-gray-400 mb-2">📝 الخطوات المطلوبة:</p>
                    <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                        <li>افتح Supabase Dashboard</li>
                        <li>اختر SQL Editor</li>
                        <li>شغّل الملف: create_notifications_table.sql</li>
                        <li>ارجع هنا واعمل Refresh</li>
                    </ol>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                    تحديث الصفحة
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Send Notification Form */}
            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="text-blue-400" size={20} />
                    <h3 className="text-lg font-bold text-white">إرسال إشعار جديد</h3>
                </div>

                <div className="space-y-4">
                    {/* Recipient */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            المستلم {users.length > 0 && `(${users.length} مستخدم متاح)`}
                        </label>
                        <select
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">اختر المستلم</option>
                            <option value="all" className="font-bold bg-blue-500/20">🔔 الكل ({users.length} مستخدم)</option>
                            {users.length === 0 ? (
                                <option disabled>جاري التحميل...</option>
                            ) : (
                                users.map(user => (
                                    <option key={user.id} value={user.id}>👤 {user.name || user.email}</option>
                                ))
                            )}
                        </select>
                        {users.length === 0 && (
                            <p className="text-xs text-orange-400 mt-1">⚠️ جاري تحميل المستخدمين...</p>
                        )}
                        {recipientId === 'all' && (
                            <p className="text-xs text-blue-400 mt-1">✅ سيتم إرسال الإشعار لجميع المستخدمين ({users.length})</p>
                        )}
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">النوع</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['info', 'success', 'warning', 'error'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`py-2 rounded-lg transition-colors ${type === t
                                        ? t === 'info' ? 'bg-blue-500 text-white'
                                            : t === 'success' ? 'bg-green-500 text-white'
                                                : t === 'warning' ? 'bg-orange-500 text-white'
                                                    : 'bg-red-500 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {t === 'info' ? 'معلومة' : t === 'success' ? 'نجاح' : t === 'warning' ? 'تحذير' : 'خطأ'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">العنوان</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="عنوان الإشعار"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">الرسالة</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="نص الإشعار"
                            rows={3}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        disabled={isSending}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        {isSending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
                    </button>
                </div>
            </div>

            {/* Recent Notifications */}
            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4">آخر الإشعارات المرسلة</h3>
                <div className="space-y-2">
                    {recentNotifications.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">لا توجد إشعارات</p>
                    ) : (
                        recentNotifications.map(notif => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-black/30 border border-white/5 rounded-lg p-4 flex items-start justify-between gap-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${notif.type === 'info' ? 'bg-blue-500/20 text-blue-400' :
                                            notif.type === 'success' ? 'bg-green-500/20 text-green-400' :
                                                notif.type === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                                                    'bg-red-500/20 text-red-400'
                                            }`}>
                                            {notif.type}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            إلى: {notif.recipient?.display_name || 'مستخدم'}
                                        </span>
                                        {/* Read Status */}
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${notif.is_read
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                            }`}>
                                            {notif.is_read ? '✓ مقروءة' : '○ غير مقروءة'}
                                        </span>

                                        {/* Deleted Status */}
                                        {notif.is_deleted && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                                🗑️ محذوفة من المستخدم
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-white font-bold text-sm">{notif.title}</h4>
                                    <p className="text-gray-400 text-sm line-clamp-1">{notif.body}</p>
                                    <span className="text-xs text-gray-600 mt-1 block">
                                        {new Date(notif.created_at).toLocaleString('ar-EG')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(notif.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsManager;
