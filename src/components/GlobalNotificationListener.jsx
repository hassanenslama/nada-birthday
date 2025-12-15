import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Gamepad2, X, Check, Bell } from 'lucide-react';

const GlobalNotificationListener = ({ onNavigate }) => {
    const { currentUser } = useAuth();
    const [invite, setInvite] = useState(null);

    useEffect(() => {
        if (!currentUser) return;

        console.log("🔔 Notification Listener Active for:", currentUser.email);

        const channel = supabase.channel('user_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${currentUser.id}`
                },
                (payload) => {
                    console.log("🔔 New Notification:", payload);
                    const newNote = payload.new;

                    if (newNote.payload?.type === 'game_invite') {
                        setInvite(newNote);
                        const soundEnabled = localStorage.getItem('notification_sound_enabled') !== 'false';
                        if (soundEnabled) {
                            new Audio('/sounds/notification.mp3').play().catch(() => { });
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    const handleAccept = async () => {
        if (!invite) return;
        const gameId = invite.payload.gameId;

        // 1. Notify Sender (Optimistic)
        // We could insert a "Accepted" notification back to sender

        // 2. Navigate
        // We need a way to navigate. Passed prop or window.location? 
        // Since we are in MainApp, we might not have router access easily if this is top level.
        // Assuming GameHub uses state `selectedGame`. 
        // We might need to expose a global state or EventBus.
        // For simplicity: We will trigger a specific event or use window location hash if routing is hash based?
        // Current App uses internal state `phase`.

        // Actually, existing FunPage navigation is internal to GameHub state.
        // We can't easily reach into GameHub from here.
        // SOLUTION: Broadcast specific "join_game" event that GameHub listens to?
        // OR: Save "pending_game_join" in localStorage and reload?

        localStorage.setItem('pending_game', gameId);
        window.location.reload(); // Brute force but effective to reset state and load game

        setInvite(null);
    };

    const handleDecline = async () => {
        setInvite(null);
        // Optional: Notify sender of rejection
    };

    return (
        <AnimatePresence>
            {invite && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 20, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none"
                >
                    <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-gold/30 p-4 rounded-2xl shadow-2xl max-w-sm w-full mx-4 pointer-events-auto flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 animate-bounce">
                            <Gamepad2 size={24} />
                        </div>

                        <div className="flex-1">
                            <h4 className="text-white font-bold text-sm mb-1">{invite.title}</h4>
                            <p className="text-gray-400 text-xs">{invite.body}</p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleDecline}
                                className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition border border-red-500/20"
                            >
                                <X size={20} />
                            </button>
                            <button
                                onClick={handleAccept}
                                className="p-2 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-500 transition border border-green-500/20"
                            >
                                <Check size={20} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalNotificationListener;
