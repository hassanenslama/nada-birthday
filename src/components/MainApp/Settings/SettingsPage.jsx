import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Globe, Lock, ChevronLeft, User, Key, Save, X, Loader2, CheckCircle2, Music, Bell } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useMusic } from '../../../context/MusicContext';
import { usePresence } from '../../../context/PresenceContext';
import { EyeOff } from 'lucide-react'; // Icon for Ghost Mode


const SettingsPage = () => {
    const { logout, currentUser, userRole } = useAuth();
    const { isPermanentlyDisabled, setPermanentlyDisabled } = useMusic();
    const { isGhostMode, toggleGhostMode } = usePresence();
    const [loading, setLoading] = useState(false);
    const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(() => localStorage.getItem('notification_sound_enabled') !== 'false');

    // Change Password State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordHistory, setPasswordHistory] = useState(null); // success msg

    const handleLogout = async () => {
        try {
            setLoading(true);
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert("كلمة السر لازم تكون 6 حروف أو أرقام على الأقل يا ست الكل 😉");
            return;
        }

        setPasswordLoading(true);
        try {
            // 1. Update Authentication Password (Real Change)
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            // 2. Update Admin Note (So Hassanen knows it for help)
            // We update the 'admin_note' field in her user profile
            const { error: noteError } = await supabase
                .from('user_profiles')
                .update({ admin_note: newPassword })
                .eq('id', currentUser.id);

            if (noteError) console.error("Note Error:", noteError);

            setPasswordHistory("تم تغيير الباسورد بنجاح! 🥳");
            setTimeout(() => {
                setShowPasswordModal(false);
                setNewPassword('');
                setPasswordHistory(null);
            }, 2000);

        } catch (error) {
            console.error("Password Update Error:", error);
            alert("حصل خطأ.. جربي تاني!");
        } finally {
            setPasswordLoading(false);
        }
    };

    const SettingItem = ({ icon: Icon, title, value, onClick, isDestructive = false }) => (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm mb-3 transition-colors ${isDestructive ? 'hover:bg-red-500/10 border-red-500/20' : 'hover:bg-white/10'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-500/20 text-red-400' : 'bg-gold/10 text-gold'}`}>
                    <Icon size={20} />
                </div>
                <div className="text-right">
                    <h3 className={`font-bold text-sm ${isDestructive ? 'text-red-300' : 'text-gray-200'}`}>{title}</h3>
                    {value && <p className="text-xs text-gray-500 mt-1">{value}</p>}
                </div>
            </div>
            {!isDestructive && <ChevronLeft className="text-gray-500" size={16} />}
        </motion.button>
    );

    return (
        <div className="min-h-screen pb-24 pt-8 px-4 font-cairo">
            <h1 className="text-3xl text-gold font-bold mb-8 text-center">الإعدادات ⚙️</h1>

            {/* Profile Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gold/30 rounded-3xl p-6 mb-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>

                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg shadow-gold/20">
                    {userRole === 'admin' ? '🕶️' : '👸'}
                </div>

                <h2 className="text-xl font-bold text-white mb-1">
                    {userRole === 'admin' ? 'الباشمهندس حسانين' : 'الأميرة ندى'}
                </h2>
                <p className="text-gray-500 text-sm dir-ltr email-font">{currentUser?.email}</p>
            </div>

            {/* Settings List */}
            <div className="space-y-2">
                <p className="text-gray-400 text-xs font-bold mb-4 px-2">عام</p>

                <SettingItem
                    icon={Globe}
                    title="اللغة"
                    value="العربية"
                    onClick={() => alert('قريباً.. حالياً المتاح عربي بس يا ست الكل 😉')}
                />

                {/* Music Control - Added here as requested */}
                <div className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm mb-3 transition-colors hover:bg-white/10">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-gold/10 text-gold">
                            <Music size={20} />
                        </div>
                        <div className="text-right">
                            <h3 className="font-bold text-sm text-gray-200">الموسيقى الخلفية</h3>
                            <p className="text-xs text-gray-500 mt-1">{isPermanentlyDisabled ? 'متوقفة نهائياً' : 'تعمل تلقائياً'}</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-2">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={!isPermanentlyDisabled}
                            onChange={(e) => setPermanentlyDisabled(!e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                    </label>
                </div>

                {/* Notification Sound Toggle */}
                <div className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm mb-3 transition-colors hover:bg-white/10">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
                            <Bell size={20} />
                        </div>
                        <div className="text-right">
                            <h3 className="font-bold text-sm text-gray-200">صوت الإشعارات</h3>
                            <p className="text-xs text-gray-500 mt-1">{notificationSoundEnabled ? 'مفعل' : 'مكتوم'}</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-2">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSoundEnabled}
                            onChange={(e) => {
                                setNotificationSoundEnabled(e.target.checked);
                                localStorage.setItem('notification_sound_enabled', e.target.checked);
                            }}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                </div>

                {/* Ghost Mode Toggle */}
                <div className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm mb-3 transition-colors hover:bg-white/10">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-purple-500/10 text-purple-400">
                            <EyeOff size={20} />
                        </div>
                        <div className="text-right">
                            <h3 className="font-bold text-sm text-gray-200">وضع الشبح (إخفاء الظهور)</h3>
                            <p className="text-xs text-gray-500 mt-1">{isGhostMode ? 'مفعل (لن يراك أحد)' : 'معطل (أنت مرئي للجميع)'}</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-2">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isGhostMode}
                            onChange={(e) => toggleGhostMode(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                </div>

                <div className="opacity-50 pointer-events-none grayscale">
                    <SettingItem
                        icon={Lock}
                        title="تغيير الباسورد"
                        value="********"
                        onClick={() => { }} // Disabled
                    />
                </div>

                <p className="text-gray-400 text-xs font-bold mt-8 mb-4 px-2">الحساب</p>

                <SettingItem
                    icon={LogOut}
                    title={loading ? "جاري الخروج..." : "تسجيل خروج"}
                    onClick={handleLogout}
                    isDestructive={true}
                />
            </div>

            <div className="mt-12 text-center">
                <p className="text-gray-600 text-xs">Version 1.0.0 (Love Edition)</p>
                <p className="text-gray-700 text-[10px] mt-1">Made with ❤️ by Hassanen</p>
            </div>

            {/* Change Password Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowPasswordModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#1a1a1a] border border-gold/30 p-6 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(197,160,89,0.2)]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">تغيير الباسورد 🔐</h3>
                                <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            {passwordHistory ? (
                                <div className="text-center py-8">
                                    <CheckCircle2 className="mx-auto text-green-500 mb-2" size={48} />
                                    <p className="text-white font-bold">{passwordHistory}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">الباسورد الجديد</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-gold outline-none"
                                            placeholder="اكتبي الباسورد الجديد هنا..."
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500">
                                        لازم يكون 6 حروف أو أرقام على الأقل.
                                    </p>

                                    <button
                                        onClick={handleChangePassword}
                                        disabled={passwordLoading}
                                        className="w-full bg-gold hover:bg-yellow-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                                    >
                                        {passwordLoading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> حفظ التغيير</>}
                                    </button>
                                </div>
                            )}

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsPage;
