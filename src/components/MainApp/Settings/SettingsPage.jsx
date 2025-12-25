import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useProfile } from '../../../context/ProfileContext';
import { useSiteStatus } from '../../../context/SiteStatusContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Globe, Lock, ChevronLeft, User, Key, Save, X, Loader2, CheckCircle2, Music, Bell, Camera, Edit3 } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useMusic } from '../../../context/MusicContext';
import { usePresence } from '../../../context/PresenceContext';
import { EyeOff } from 'lucide-react';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';
import Toast from '../../common/Toast';

const SettingsPage = () => {
    const { logout, currentUser, userRole } = useAuth();
    const { isShutdown } = useSiteStatus();
    const { userProfile, loading: profileLoading } = useProfile();
    const { isPermanentlyDisabled, setPermanentlyDisabled } = useMusic();
    const { isGhostMode, toggleGhostMode } = usePresence();
    const [loading, setLoading] = useState(false);
    const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(() => localStorage.getItem('notification_sound_enabled') !== 'false');
    const [toast, setToast] = useState(null); // { message, type }

    // Use a Ref to clear timeout on unmount
    const toastTimeoutRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
    };

    // Profile State
    const [displayName, setDisplayName] = useState('');
    const [originalDisplayName, setOriginalDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const fileInputRef = useRef(null);
    const nameInputRef = useRef(null);

    // Change Password State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordHistory, setPasswordHistory] = useState(null);

    // Sync local state with global profile state
    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.display_name || '');
            setOriginalDisplayName(userProfile.display_name || '');
            setAvatarUrl(userProfile.avatar_url);
        }
    }, [userProfile]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleProfileUpdate = async () => {
        if (!displayName.trim()) return showToast('الاسم مينفعش يكون فاضي!', 'error');

        setIsProfileSaving(true);
        try {
            let newAvatarUrl = avatarUrl;

            // Upload Image to Supabase Storage if selected
            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError, data } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, selectedImage);

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                newAvatarUrl = publicUrl;
            }

            // Update Profile in DB
            const { error } = await supabase
                .from('user_profiles')
                .upsert({
                    id: currentUser.id,
                    display_name: displayName,
                    avatar_url: newAvatarUrl,
                    updated_at: new Date()
                });

            if (error) throw error;

            if (error) throw error;

            setAvatarUrl(newAvatarUrl);
            setOriginalDisplayName(displayName);
            setSelectedImage(null);
            setIsEditingName(false);
            showToast('تم تحديث البروفايل بنجاح! 🌟');
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('فشل التحديث: ' + (error.message || 'جرب تاني'), 'error');
        } finally {
            setIsProfileSaving(false);
        }
    };

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
            showToast("كلمة السر لازم تكون 6 حروف أو أرقام على الأقل يا ست الكل 😉", 'error');
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            const { error: noteError } = await supabase
                .from('user_profiles')
                .update({ admin_note: newPassword })
                .eq('id', currentUser.id);

            if (noteError) console.error("Note Error:", noteError);

            setPasswordHistory("تم تغيير الباسورد بنجاح! 🥳");
            showToast("تم تغيير الباسورد بنجاح! 🥳");
            setTimeout(() => {
                setShowPasswordModal(false);
                setNewPassword('');
                setPasswordHistory(null);
            }, 2000);

        } catch (error) {
            console.error("Password Update Error:", error);
            showToast("حصل خطأ.. جربي تاني!", 'error');
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

    if (profileLoading) return <div className="flex justify-center items-center min-h-screen text-gold"><Loader2 className="animate-spin" size={40} /></div>;

    return (
        <div className={`min-h-screen pb-24 pt-8 px-4 font-cairo transition-all duration-500 ${isShutdown ? 'grayscale' : ''}`}>
            <h1 className="text-3xl text-gold font-bold mb-8 text-center">الإعدادات ⚙️</h1>

            {/* Editable Profile Card */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-gold/30 rounded-3xl p-6 mb-8 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>

                <div className="relative w-24 h-24 mx-auto mb-4">
                    <div
                        className="w-full h-full rounded-full border-2 border-gold/50 overflow-hidden cursor-pointer shadow-[0_0_20px_rgba(255,215,0,0.1)] group-hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {avatarPreview || avatarUrl ? (
                            <img src={avatarPreview || avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-3xl">
                                {displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase()}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-[2px]">
                            <Camera className="text-white" size={24} />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                <div className="mb-4 px-4">
                    <div className="relative max-w-[200px] mx-auto">
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            readOnly={!isEditingName}
                            onBlur={() => !displayName.trim() && setDisplayName(originalDisplayName)}
                            className={`bg-transparent border-b text-center text-xl font-bold text-white w-full pb-1 outline-none transition-all ${isEditingName
                                ? 'border-gold border-b-2'
                                : 'border-transparent cursor-default'
                                }`}
                            placeholder="اكتب اسمك هنا"
                        />
                        <button
                            onClick={() => {
                                setIsEditingName(!isEditingName);
                                if (!isEditingName) {
                                    setTimeout(() => nameInputRef.current?.focus(), 100);
                                }
                            }}
                            className={`absolute left-0 top-1.5 transition-colors ${isEditingName ? 'text-gold' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Edit3 size={16} />
                        </button>
                    </div>
                    <p className="text-gray-500 text-xs dir-ltr email-font mt-1">{currentUser?.email}</p>
                </div>

                {(selectedImage || displayName !== originalDisplayName) && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handleProfileUpdate}
                        disabled={isProfileSaving}
                        className="bg-gold text-black px-6 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                        {isProfileSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        حفظ التعديلات
                    </motion.button>
                )}
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

                {/* Music Control */}
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

                <div className="opacity-100">
                    <SettingItem
                        icon={Lock}
                        title="تغيير الباسورد"
                        value="********"
                        onClick={() => setShowPasswordModal(true)}
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

            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} />}
            </AnimatePresence>
        </div >
    );
};

export default SettingsPage;
