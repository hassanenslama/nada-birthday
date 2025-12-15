import React, { useState } from 'react';
import { MapPin, Smartphone, Clock, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../supabase';

const UserMonitorCard = ({ user, isOnline, location }) => {
    const [showHistory, setShowHistory] = useState(false);
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
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gold/20 overflow-hidden">
                            {user.profile_picture ? (
                                <img src={user.profile_picture} alt={user.display_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gold font-bold text-2xl">{user.display_name?.[0]}</div>
                            )}
                        </div>
                        {isOnline && <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full animate-pulse" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-2xl mb-1">{user.display_name}</h3>
                        <div className="flex flex-wrap gap-2 text-sm mt-1 text-gray-300">
                            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><MapPin size={14} className="text-green-400" /> {location}</span>
                            <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><Smartphone size={14} className="text-purple-400" /> {user.device_info || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-mono text-gold mb-1 font-bold tracking-wider">{user.last_ip || '---'}</div>
                    <div className="text-sm text-gray-400 dir-ltr font-medium">{formatTime(user.last_seen)}</div>
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
                                <div key={log.id} className="flex items-center justify-between text-[10px] bg-black/20 p-2 rounded border border-white/5">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <span>{log.device_info}</span>
                                        <span className="font-mono text-gold dir-ltr">{log.ip_address}</span>
                                    </div>
                                    <div className="text-gray-600 dir-ltr">{formatTime(log.created_at)}</div>
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
