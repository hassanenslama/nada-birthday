import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const NotificationsPanel = () => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser) return;

        fetchNotifications();

        // Setup Realtime subscription
        const channel = supabase
            .channel('notifications_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${currentUser.id}`
                },
                (payload) => {
                    const newNotif = payload.new;
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Show popup notification
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: {
                            title: newNotif.title,
                            body: newNotif.body,
                            type: newNotif.type
                        }
                    }));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${currentUser.id}`
                },
                (payload) => {
                    setNotifications(prev =>
                        prev.map(n => n.id === payload.new.id ? payload.new : n)
                    );
                    calculateUnreadCount();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${currentUser.id}`
                },
                (payload) => {
                    setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                    calculateUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    // Show popup for unread notifications on mount
    useEffect(() => {
        if (notifications.length > 0) {
            const unread = notifications.filter(n => !n.is_read);
            if (unread.length > 0) {
                // Show first unread notification popup
                const firstUnread = unread[0];
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: {
                            title: firstUnread.title,
                            body: firstUnread.body,
                            type: firstUnread.type
                        }
                    }));
                }, 500); // Small delay after page load
            }
        }
    }, []); // Only on mount

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient_id', currentUser.id)
            .eq('is_deleted', false) // Only show non-deleted
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) {
            setNotifications(data);
            calculateUnreadCount(data);
        }
    };

    const calculateUnreadCount = (notifs = notifications) => {
        const count = notifs.filter(n => !n.is_read).length;
        setUnreadCount(count);
    };

    const markAsRead = async (id) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = async () => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('recipient_id', currentUser.id)
            .eq('is_read', false);

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    // Soft Delete instead of permanent delete
    const deleteNotification = async (id) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_deleted: true, deleted_at: new Date() })
            .eq('id', id);

        if (!error) {
            setNotifications(prev => prev.filter(n => n.id !== id));
            calculateUnreadCount();
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={24} />;
            case 'warning': return <AlertTriangle size={24} />;
            case 'error': return <XCircle size={24} />;
            default: return <Info size={24} />;
        }
    };

    const getStyles = (type) => {
        switch (type) {
            case 'success':
                return {
                    container: 'bg-gradient-to-br from-green-500/10 to-green-600/5 hover:from-green-500/15 hover:to-green-600/10 border-green-500/30',
                    icon: 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/30',
                    title: 'text-green-400',
                    glow: 'shadow-green-500/20'
                };
            case 'warning':
                return {
                    container: 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover:from-orange-500/15 hover:to-orange-600/10 border-orange-500/30',
                    icon: 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30',
                    title: 'text-orange-400',
                    glow: 'shadow-orange-500/20'
                };
            case 'error':
                return {
                    container: 'bg-gradient-to-br from-red-500/10 to-red-600/5 hover:from-red-500/15 hover:to-red-600/10 border-red-500/30',
                    icon: 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30',
                    title: 'text-red-400',
                    glow: 'shadow-red-500/20'
                };
            default: // info
                return {
                    container: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:from-blue-500/15 hover:to-blue-600/10 border-blue-500/30',
                    icon: 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/30',
                    title: 'text-blue-400',
                    glow: 'shadow-blue-500/20'
                };
        }
    };

    if (!currentUser) return null;

    return (
        <>
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 text-gray-400 hover:text-white transition-all duration-300 group"
            >
                <div className="absolute inset-0 bg-white/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                <Bell size={24} className="relative z-10 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Slide-in Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90]"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[90vw] md:w-[500px] bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-[100] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-b from-white/5 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-xl shadow-blue-500/30 animate-pulse">
                                        <Bell className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-white font-cairo">الإشعارات</h2>
                                        <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">تابع آخر التحديثات</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all duration-300"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Mark All as Read */}
                            {unreadCount > 0 && (
                                <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                                    <button
                                        onClick={markAllAsRead}
                                        className="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/10 text-sm text-gray-400 hover:text-blue-400 transition-all duration-300 flex items-center justify-center gap-2 group"
                                    >
                                        <Check size={16} className="group-hover:scale-110 transition-transform" />
                                        <span className="font-cairo">تحديد الكل كمقروء ({unreadCount})</span>
                                    </button>
                                </div>
                            )}

                            {/* Notifications List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 font-cairo space-y-4 px-4">
                                        <div className="w-24 h-24 bg-gradient-to-br from-white/5 to-white/0 rounded-full flex items-center justify-center border border-white/10">
                                            <Bell size={48} className="opacity-30" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold">لا توجد إشعارات</p>
                                            <p className="text-sm opacity-60 mt-1.5">أنت مطلع على كل شيء! ✨</p>
                                        </div>
                                    </div>
                                ) : (
                                    notifications.map((notif, index) => {
                                        const styles = getStyles(notif.type);
                                        return (
                                            <motion.div
                                                key={notif.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${styles.container} ${!notif.is_read ? 'ring-2 ring-white/20' : ''}`}
                                            >
                                                {/* Unread Indicator Glow */}
                                                {!notif.is_read && (
                                                    <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                                                )}

                                                <div className="p-4 flex gap-3 sm:gap-4">
                                                    {/* Icon */}
                                                    <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center ${styles.icon} ${styles.glow}`}>
                                                        {getIcon(notif.type)}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`font-bold text-base sm:text-lg mb-1.5 font-cairo ${styles.title} leading-tight`}>
                                                            {notif.title}
                                                        </h4>
                                                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-3 font-cairo opacity-90">
                                                            {notif.body}
                                                        </p>

                                                        {/* Footer */}
                                                        <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                                                            <span className="text-xs text-gray-500 font-medium">
                                                                {new Date(notif.created_at).toLocaleString('ar-EG', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>

                                                            {/* Action Buttons */}
                                                            <div className="flex items-center gap-2">
                                                                {!notif.is_read && (
                                                                    <button
                                                                        onClick={() => markAsRead(notif.id)}
                                                                        className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-all"
                                                                        title="تحديد كمقروء"
                                                                    >
                                                                        <Check size={16} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => deleteNotification(notif.id)}
                                                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all"
                                                                    title="حذف"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default NotificationsPanel;
