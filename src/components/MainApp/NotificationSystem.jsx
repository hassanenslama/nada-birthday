import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase'; // Ensure this matches your path
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Lock } from 'lucide-react';

const NotificationSystem = () => {
    const { currentUser } = useAuth();
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (!currentUser) return;

        // Listen for new messages not from me
        const channel = supabase
            .channel('global_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                },
                (payload) => {
                    const newMsg = payload.new;
                    // Only notify if sender is NOT me
                    if (newMsg.sender_uid !== currentUser.id) {
                        showNotification({
                            title: newMsg.sender_name || 'رسالة جديدة',
                            body: newMsg.type === 'image' ? 'بعتت صورة 📷' : newMsg.text,
                            type: 'message'
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    // Listen for custom notification events
    useEffect(() => {
        const handleCustomNotification = (event) => {
            showNotification(event.detail);
        };

        window.addEventListener('showNotification', handleCustomNotification);
        return () => window.removeEventListener('showNotification', handleCustomNotification);
    }, []);

    const showNotification = ({ title, body, type }) => {
        // Play sound (only for messages)
        if (type === 'message') {
            const soundEnabled = localStorage.getItem('notification_sound_enabled') !== 'false';
            if (soundEnabled) {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log("Audio permission denied"));
            }
        }

        setNotification({ title, body, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const getIcon = () => {
        if (notification?.type === 'locked') {
            return <Lock size={24} />;
        }
        if (notification?.type === 'success') {
            return <Bell size={24} />;
        }
        if (notification?.type === 'warning') {
            return <Bell size={24} />;
        }
        if (notification?.type === 'error') {
            return <Bell size={24} />;
        }
        return <Bell size={24} />;
    };

    const getColor = () => {
        if (notification?.type === 'locked') {
            return 'bg-orange-500/20 text-orange-400';
        }
        if (notification?.type === 'success') {
            return 'bg-green-500/20 text-green-400';
        }
        if (notification?.type === 'warning') {
            return 'bg-orange-500/20 text-orange-400';
        }
        if (notification?.type === 'error') {
            return 'bg-red-500/20 text-red-400';
        }
        return 'bg-gold/20 text-gold'; // default (info/message)
    };

    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: -50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -50, x: '-50%' }}
                    className="fixed top-4 left-1/2 z-[100] w-[90%] max-w-sm bg-black/90 backdrop-blur-md border border-gold/30 rounded-2xl shadow-2xl p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => setNotification(null)}
                >
                    <div className={`${getColor()} p-3 rounded-full shrink-0`}>
                        {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0 text-right font-cairo">
                        <h4 className="font-bold text-white">{notification.title}</h4>
                        <p className="text-gray-300 text-sm">{notification.body}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationSystem;
