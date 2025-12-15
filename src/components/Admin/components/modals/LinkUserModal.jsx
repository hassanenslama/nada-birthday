import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Search, Check, AlertCircle, RefreshCw } from 'lucide-react';

const LinkUserModal = ({ isOpen, users, onSelect, onRefresh, isBlocking = false }) => {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const filteredUsers = users.filter(u =>
        u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-[#1a1a1a] border border-gold/20 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 bg-[#121212] sticky top-0 z-10">
                        {isBlocking && (
                            <div className="flex items-center gap-2 text-red-400 mb-2 bg-red-500/10 p-3 rounded-lg">
                                <AlertCircle size={20} />
                                <span className="font-bold text-sm">مطلوب ربط الحساب للمتابعة</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-gold mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Link2 size={24} />
                                ربط حساب ندى
                            </h3>
                            <button onClick={onRefresh} className="p-2 hover:bg-white/5 rounded-full transition" title="تحديث القائمة">
                                <RefreshCw size={18} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="ابحث بالاسم أو الإيميل..."
                                className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white outline-none focus:border-gold/50 transition"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-4 space-y-2">
                        {users.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
                                <p>مفيش مستخدمين ظاهرين...</p>
                                <button onClick={onRefresh} className="text-gold text-sm hover:underline">تحديث القائمة</button>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <p className="text-center py-8 text-gray-500">لا توجد نتائج بحث</p>
                        ) : (
                            filteredUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => onSelect(user)}
                                    className="w-full bg-[#121212] p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-gold/50 hover:bg-gold/5 transition group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                            {user.profile_picture ? (
                                                <img src={user.profile_picture} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">?</div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-white group-hover:text-gold transition">{user.display_name || 'بدون اسم'}</p>
                                            <p className="text-xs text-gray-500 font-mono">{user.email || 'No Email'}</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-gold group-hover:border-gold group-hover:text-black transition">
                                        <Check size={16} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="bg-[#121212] p-4 text-center border-t border-white/10 text-xs text-gray-500">
                        اختار الحساب الصحيح لندى عشان اللوحة تشتغل
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LinkUserModal;
