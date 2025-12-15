import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Loader2, Users } from 'lucide-react';
import { supabase } from '../../../../supabase';
import { useAuth } from '../../../../context/AuthContext';

const LobbyOverlay = ({ gameId, onReady }) => {
    const { currentUser } = useAuth();
    const [opponentPresent, setOpponentPresent] = useState(false);

    useEffect(() => {
        // Simple presence logic using Broadcast
        // Every 3 seconds, broadcast "I am here"
        // If I receive "I am here" from someone else, then Opponent is Present.

        const channel = supabase.channel(`lobby_${gameId}`)
            .on('broadcast', { event: 'ping' }, ({ payload }) => {
                if (payload.userId !== currentUser.id) {
                    setOpponentPresent(true);
                    // Respond immediately so they know I'm here too
                    channel.send({
                        type: 'broadcast',
                        event: 'pong',
                        payload: { userId: currentUser.id }
                    });
                }
            })
            .on('broadcast', { event: 'pong' }, ({ payload }) => {
                if (payload.userId !== currentUser.id) {
                    setOpponentPresent(true);
                }
            })
            .subscribe();

        const interval = setInterval(async () => {
            await channel.send({
                type: 'broadcast',
                event: 'ping',
                payload: { userId: currentUser.id }
            });
        }, 2000);

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [gameId, currentUser.id]);

    useEffect(() => {
        if (opponentPresent && onReady) {
            onReady();
        }
    }, [opponentPresent]);

    if (opponentPresent) return null; // Hide overlay if ready

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6"
        >
            <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent animate-pulse" />

                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <Users size={32} className="text-gray-400" />
                    <div className="absolute top-0 right-0 w-6 h-6 bg-gold rounded-full flex items-center justify-center animate-bounce">
                        <Loader2 size={14} className="text-black animate-spin" />
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 font-cairo">مستنيين الطرف التاني... ⏳</h3>
                <p className="text-gray-400 text-sm mb-6">اللعبه مش هتبدأ غير لما أنتم الاتنين تكونوا فاتحين في نفس الوقت.</p>

                <div className="flex justify-center">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-500 font-mono">
                        Waiting for opponent...
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default LobbyOverlay;
