import React, { useState } from 'react';
import { MapPin, Smartphone, Clock, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../supabase';
import { useSiteStatus } from '../../../context/SiteStatusContext';

const UserMonitorCard = ({ user, isOnline, location }) => {
    const { isShutdown } = useSiteStatus();
    const [showHistory, setShowHistory] = useState(false);

    // Dynamic naming logic
    const displayName = user.id === '5857946a-7888-44db-bbba-c9233f81e649' // Hassan ID (fallback check if needed, but let's use display_name check)
        ? (isShutdown ? 'حسانين' : 'حسن')
        : (user.display_name === 'Hassan' || user.display_name === 'Hassanen' || user.display_name === 'حسن' || user.display_name === 'حسانين'
            ? (isShutdown ? 'حسانين' : 'حسن')
            : user.display_name);

    const [historyLogs, setHistoryLogs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const formatTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('ar-EG');
    };

    const loadHistory = async () => {
        if (showHistory) {
            setShowHistory(false);
            return;
        }

        setLoadingHistory(true);
        const { data } = await supabase
            .from('login_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) setHistoryLogs(data);
        setLoadingHistory(false);
        setShowHistory(true);
    };

    return (
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 group/card hover:bg-white/5 transition">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                {/* User Info */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative shrink-0">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-800 border-2 border-gold/20 overflow-hidden">
                            {user.profile_picture ? (
                                <img src={user.profile_picture} alt={user.display_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gold font-bold text-xl md:text-2xl">{user.display_name?.[0]}</div>
                            )}
                        </div>
                        {isOnline && <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full animate-pulse" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white text-xl md:text-2xl mb-1 truncate">{displayName}</h3>
                        <div className="flex flex-wrap gap-2 text-xs md:text-sm mt-1 text-gray-300">
                            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full whitespace-nowrap"><MapPin size={12} className="text-green-400" /> {location}</span>
                            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full whitespace-nowrap"><Smartphone size={12} className="text-purple-400" /> {user.device_info || 'Unknown'}</span>
                        </div>
                    </div>
                </div>

                {/* Stats (IP & Time) */}
                <div className="w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-end items-center md:items-end pt-3 md:pt-0 border-t border-white/5 md:border-0">
                    <div className="text-lg md:text-xl font-mono text-gold font-bold tracking-wider">{user.last_ip || '---'}</div>
                    <div className="text-xs md:text-sm text-gray-400 dir-ltr font-medium">{formatTime(user.last_seen)}</div>
                </div>
            </div>

            {/* History Toggle */}
            <button
                onClick={loadHistory}
                disabled={loadingHistory}
                className="w-full py-2 flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-white bg-white/5 rounded-lg transition"
            >
                {loadingHistory ? <RotateCw size={12} className="animate-spin" /> :
                    showHistory ? <><RotateCw size={12} className="rotate-180" /> إخفاء السجل</> : <><Clock size={12} /> عرض سجل النشاط (آخر 10)</>}
            </button>

            {/* History List */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pt-3 space-y-2">
                            {historyLogs.length > 0 ? historyLogs.map(log => (
                                <div key={log.id} className="flex items-center justify-between text-sm bg-black/30 p-3 rounded-lg border border-white/10 hover:bg-white/5 transition">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <span className="font-medium text-gold/80 dir-ltr font-mono text-xs">{log.ip_address}</span>
                                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                        <span>{log.device_info}</span>
                                    </div>
                                    <div className="text-gray-400 text-xs font-mono dir-ltr">{formatTime(log.created_at)}</div>
                                </div>
                            )) : (
                                <div className="text-center text-xs text-gray-600 py-2">لا يوجد سجل نشاط سابق</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserMonitorCard;
