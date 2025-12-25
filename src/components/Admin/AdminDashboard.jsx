import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSiteStatus } from '../../context/SiteStatusContext';
import { LayoutDashboard, LogOut, Settings, RotateCw, AlertTriangle, Check, Shield, Smartphone, Globe, Clock, MapPin, Activity, Home, Menu, X, ChevronRight, MessageCircle, Users, MessageSquare, Heart, Star, Image as ImageIcon, Music, PartyPopper, Gift, Eye, Trash2, Power, ShieldCheck, RefreshCcw, Lock, BookOpen } from 'lucide-react';
import { usePresence } from '../../context/PresenceContext';

// New Modular Components
import StatsOverview from './components/StatsOverview';
import GalleryManager from './components/GalleryManager';
import WishManager from './components/WishManager';
import LinkUserModal from './components/modals/LinkUserModal';
import QuizDetailsModal from './components/modals/QuizDetailsModal';
import ProfileModal from './components/modals/ProfileModal';
import FeelingsManager from './components/FeelingsManager';
import NotificationsManager from './components/NotificationsManager';
import CouponsManager from './components/CouponsManager';
import QuizManager from './components/QuizManager';
import UserMonitorCard from './components/UserMonitorCard';
import PostsMonitor from './components/PostsMonitor';
import GuideManager from './components/GuideManager';


// Toast Component
const Toast = ({ message, type = 'success', onClose }) => (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
        {type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
        <span className="font-bold text-sm">{message}</span>
    </motion.div>
);

const AdminDashboard = () => {
    const { logout, currentUser } = useAuth();
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMobileNav, setShowMobileNav] = useState(false);

    // State
    const [nadaProfile, setNadaProfile] = useState(null);
    const [nadaStats, setNadaStats] = useState({ quizScore: 0, quizAnswers: {}, unlockedCount: 0 });
    const [availableUsers, setAvailableUsers] = useState([]);

    const { onlineUsers } = usePresence();
    const [allUserProfiles, setAllUserProfiles] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);

    useEffect(() => {
        // Fetch logs
        const fetchLogs = async () => {
            const { data } = await supabase.from('app_status_logs').select('*').order('created_at', { ascending: false }).limit(20);
            if (data) setActivityLogs(data);
        };
        fetchLogs();

        const channel = supabase.channel('activity_logs_channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_status_logs' }, (payload) => {
                setActivityLogs(prev => [payload.new, ...prev].slice(0, 20));
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    useEffect(() => {
        // Fetch all users for tracking monitor
        const fetchAllUsers = async () => {
            const { data } = await supabase.from('user_profiles').select('*').order('last_seen', { ascending: false });
            if (data) setAllUserProfiles(data);
        };
        fetchAllUsers();

        // Realtime Listener for tracking updates
        const channel = supabase.channel('admin_tracking_monitor')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => fetchAllUsers())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    // Sync Mobile Menu with Hash (For Back Button Support)
    useEffect(() => {
        const handleHashChange = () => {
            setShowMobileNav(window.location.hash === '#admin-menu');
        };
        window.addEventListener('hashchange', handleHashChange);
        // Initial check
        handleHashChange();
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const formatTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('ar-EG');
    };

    // UI State
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showQuizDetails, setShowQuizDetails] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [forceBlockingLink, setForceBlockingLink] = useState(false);
    const [isRestartConfirming, setIsRestartConfirming] = useState(false);

    // Header Config
    const [adminConfig, setAdminConfig] = useState({
        name: 'Admin',
        nickname: 'Admin',
        bio: '',
        image: null,
        isMale: true
    });

    useEffect(() => {
        if (currentUser) loadDashboardData();
    }, [currentUser]);

    const showToast = (msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Get Admin Profile
            const { data: myProfile } = await supabase.from('user_profiles').select('*').eq('id', currentUser.id).maybeSingle();
            const isNadaSelf = currentUser.email === 'nada@love.com';

            setAdminConfig({
                name: myProfile?.display_name || (isNadaSelf ? 'Nada' : 'Hassanen'),
                nickname: myProfile?.display_name || (isNadaSelf ? 'ندى ❤️' : 'بشمهندس حسانين ❤️'),
                bio: myProfile?.bio,
                image: myProfile?.profile_picture,
                isMale: !isNadaSelf
            });

            // 2. Find "Nada" (Target User)
            let targetId = null;

            // Check Manual Link First
            const { data: linkSetting } = await supabase.from('user_settings').select('nickname').eq('user_id', currentUser.id).eq('contact_key', 'nada_target_link').maybeSingle();

            if (linkSetting?.nickname) {
                targetId = linkSetting.nickname;
            } else {
                // Try RPC fallback
                const { data: rpcId } = await supabase.rpc('get_user_id_by_email', { email: 'nada@love.com' });
                if (rpcId) targetId = rpcId;
            }

            // 3. If no target found, force blocking modal
            if (!targetId && !isNadaSelf) {
                setForceBlockingLink(true);
                setShowLinkModal(true);
                await fetchUsersList(); // Pre-load list
            } else {
                setForceBlockingLink(false);
                if (targetId) await loadTargetStats(targetId);
            }

        } catch (error) {
            console.error("Dashboard Load Error:", error);
            showToast("حدث خطأ في تحميل البيانات", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsersList = async () => {
        const { data } = await supabase.from('user_profiles').select('*').neq('id', currentUser.id);
        setAvailableUsers(data || []);
    };

    const loadTargetStats = async (targetId) => {
        console.log("📊 Loading target stats for:", targetId);

        // Profile
        const { data: profile, error: profileError } = await supabase.from('user_profiles').select('*').eq('id', targetId).maybeSingle();

        if (profileError) {
            console.error("❌ Error loading profile:", profileError);
        } else {
            console.log("✅ Loaded nadaProfile:", profile);
            setNadaProfile(profile);
        }

        // Stats
        const { data: quiz } = await supabase.from('quiz_results').select('*').eq('user_id', targetId).maybeSingle();
        const { data: unlocks } = await supabase.from('unlocked_memories').select('ids').eq('user_id', targetId).maybeSingle();

        setNadaStats({
            quizScore: quiz?.score || 0,
            quizAnswers: quiz?.answers || {},
            unlockedCount: unlocks?.ids?.length || 0
        });

        console.log("📊 Target stats loaded. nadaProfile ID:", profile?.id);
    };

    const handleLinkUser = async (user) => {
        try {
            // Save link setting
            const { data: existing } = await supabase.from('user_settings').select('id').eq('user_id', currentUser.id).eq('contact_key', 'nada_target_link').maybeSingle();

            if (existing) {
                await supabase.from('user_settings').update({ nickname: user.id }).eq('id', existing.id);
            } else {
                await supabase.from('user_settings').insert({ user_id: currentUser.id, contact_key: 'nada_target_link', nickname: user.id });
            }

            // Update State
            setForceBlockingLink(false);
            setShowLinkModal(false);
            loadTargetStats(user.id);
            showToast('تم ربط الحساب بنجاح! 🎉', 'success');

        } catch (error) {
            console.error(error);
            showToast('فشل حفظ الربط', 'error');
        }
    };

    const handleSaveAdminName = async (newName) => {
        try {
            const { data: existing } = await supabase.from('user_settings').select('id').eq('user_id', currentUser.id).eq('contact_key', 'nada_config').maybeSingle();
            if (existing) await supabase.from('user_settings').update({ nickname: newName }).eq('id', existing.id);
            else await supabase.from('user_settings').insert({ user_id: currentUser.id, contact_key: 'nada_config', nickname: newName });

            setAdminConfig(prev => ({ ...prev, nickname: newName }));
        } catch (e) {
            console.error(e);
        }
    };

    // Navigation Tabs
    const { isShutdown, shutdownStage, resetSite } = useSiteStatus();
    const [activeTab, setActiveTab] = useState('overview');

    // Import icons for sidebar
    const tabs = [
        { id: 'overview', label: 'نظرة عامة', icon: Activity },
        { id: 'posts', label: 'المنشورات', icon: MessageCircle },
        { id: 'guide', label: 'شرح الموقع', icon: BookOpen },
        { id: 'gallery', label: 'الصور', icon: Globe }, // Use Image icon if available but Globe is imported
        { id: 'wishes', label: 'الأمنيات', icon: RotateCw }, // Todo: Import better icons
        { id: 'feelings', label: 'المشاعر', icon: Shield }, // Emotional Shield?
        { id: 'quiz', label: 'المسابقة', icon: Settings },
        { id: 'notifications', label: 'الإشعارات', icon: AlertTriangle },
        { id: 'coupons', label: 'الكوبونات', icon: LayoutDashboard }, // Placeholder
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* --- Site Status Control --- */}
                        <section className={`border rounded-3xl p-6 relative overflow-hidden transition-all duration-300 ${isShutdown ? 'bg-red-950/20 border-red-500/30' : 'bg-[#1a1a1a] border-white/5'}`}>
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl ${isShutdown ? 'bg-red-500 text-white' : (shutdownStage > 0 ? 'bg-yellow-500 text-black' : 'bg-green-500/10 text-green-500')}`}>
                                        {isShutdown ? <Power size={28} /> : (shutdownStage > 0 ? <AlertTriangle size={28} /> : <ShieldCheck size={28} />)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">
                                            {isShutdown ? "⛔ الموقع متوقف (SHUTDOWN)" : (shutdownStage > 0 ? "⚠️ تحذير: محاولة إيقاف" : "✅ الموقع يعمل بشكل طبيعي")}
                                        </h2>
                                        <p className="text-sm opacity-70 flex items-center gap-2">
                                            <span>المرحلة الحالية: </span>
                                            <span className="font-mono bg-black/30 px-2 py-0.5 rounded text-gold">
                                                {shutdownStage === 0 && "0 - مستقر"}
                                                {shutdownStage === 1 && "1 - ضغطت زر الإيقاف"}
                                                {shutdownStage === 2 && "2 - تجاوزت التحذير الأول"}
                                                {shutdownStage === 3 && "3 - تم الإيقاف النهائي"}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {shutdownStage > 0 && (
                                    <div className="flex items-center gap-3">
                                        <AnimatePresence mode="wait">
                                            {isRestartConfirming ? (
                                                <motion.button
                                                    key="confirm"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    onClick={async () => {
                                                        console.log("🚀 [Admin] Restart EXECUTION triggered!");
                                                        try {
                                                            setIsRestartConfirming(false);
                                                            await resetSite();
                                                            showToast("تم إعادة تشغيل الموقع بنجاح! 🚀", "success");
                                                        } catch (err) {
                                                            console.error("❌ [Admin] Restart failed:", err);
                                                            showToast("عذراً، فشلت عملية إعادة التشغيل.", "error");
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 border-2 border-red-400/50"
                                                >
                                                    <Check size={20} />
                                                    تأكيد إعادة التشغيل؟
                                                </motion.button>
                                            ) : (
                                                <motion.button
                                                    key="initial"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    onClick={() => {
                                                        console.log("🖱️ [Admin] Restart INITIAL click detected");
                                                        setIsRestartConfirming(true);
                                                        // Reset after 4 seconds
                                                        setTimeout(() => setIsRestartConfirming(false), 4000);
                                                    }}
                                                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 group"
                                                >
                                                    <RefreshCcw size={20} className="group-active:rotate-180 transition-transform duration-500" />
                                                    إعادة تشغيل الموقع
                                                </motion.button>
                                            )}
                                        </AnimatePresence>

                                        {isRestartConfirming && (
                                            <button
                                                onClick={() => setIsRestartConfirming(false)}
                                                className="p-3 text-gray-400 hover:text-white transition-colors"
                                                title="إلغاء"
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 0. Monitoring Section */}
                        <section className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-gold/20 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="p-3 bg-green-500/10 rounded-2xl text-green-400">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">المراقبة الحية</h2>
                                    <p className="text-xs text-gray-500 font-mono">Real-time Activity Monitor</p>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {allUserProfiles.map(user => {
                                    // Check Realtime Online OR Recent Activity (< 2 mins) for Ghost Mode users
                                    const isRealtimeOnline = !!onlineUsers[user.id];
                                    const lastSeenTime = new Date(user.last_seen || 0).getTime();
                                    const isRecent = (Date.now() - lastSeenTime) < 120000; // 2 minutes

                                    const isOnline = isRealtimeOnline || isRecent;
                                    const location = isRealtimeOnline ? onlineUsers[user.id].location : (isRecent ? 'متصل (شبح 👻)' : 'غير متصل');
                                    return (
                                        <UserMonitorCard
                                            key={user.id}
                                            user={user}
                                            isOnline={isOnline}
                                            location={location}
                                        />
                                    );
                                })}
                            </div>
                        </section>

                        {/* 1. Activity Logs Section */}
                        <section className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-gold/20 transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gold/10 rounded-2xl text-gold">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">سجل النشاط</h2>
                                        <p className="text-xs text-gray-500 font-mono">System Audit Log</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {activityLogs.length === 0 ? (
                                    <div className="text-center py-10 text-gray-600 italic">لا يوجد سجلات حتى الآن</div>
                                ) : (
                                    activityLogs.map((log) => (
                                        <div key={log.id} className="flex items-start gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.action_type === 'nada_restore' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                                                log.action_type === 'admin_reset' ? 'bg-blue-500' :
                                                    log.action_type === 'shutdown_final' ? 'bg-red-500' : 'bg-gray-500'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${log.performed_by_role === 'admin' ? 'text-blue-400' : 'text-gold'
                                                        }`}>
                                                        {log.performed_by_role === 'admin' ? 'حسانين' : 'ندى'}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-mono dir-ltr">{formatTime(log.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-gray-300 line-clamp-2">{log.details}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* 2. Stats Section */}
                        <section className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-gold/10 rounded-2xl text-gold">
                                    <LayoutDashboard size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-white">احصائيات سريعة</h2>
                            </div>
                            <StatsOverview stats={nadaStats} onViewQuizDetails={() => setShowQuizDetails(true)} />
                        </section>
                    </div>
                );
            case 'gallery':
                return (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <GalleryManager onToast={showToast} nadaUserId={nadaProfile?.id} />
                    </div>
                );
            case 'wishes':
                return (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <WishManager />
                    </div>
                );
            case 'feelings':
                return (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <FeelingsManager />
                    </div>
                );
            case 'quiz':
                return (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <QuizManager quizData={{ score: nadaStats.quizScore, answers: nadaStats.quizAnswers }} targetUserId={nadaProfile?.id} onRefresh={loadTargetStats} onToast={showToast} />
                    </div>
                );
            case 'notifications':
                return (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <NotificationsManager onToast={showToast} />
                    </div>
                );
            case 'posts':
                return (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <PostsMonitor />
                    </div>
                );
            case 'coupons':
                return (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CouponsManager onToast={showToast} />
                    </div>
                );
            case 'competition':
                return (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Assuming CouponsManager is a placeholder for competition content */}
                        <CouponsManager onToast={showToast} />
                    </div>
                );
            case 'guide':
                return (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <GuideManager />
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-cairo flex flex-col relative overflow-hidden">
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <AnimatePresence>{toast && <Toast {...toast} />}</AnimatePresence>

            {/* Modals */}
            <LinkUserModal isOpen={showLinkModal} users={availableUsers} onSelect={handleLinkUser} onRefresh={fetchUsersList} isBlocking={forceBlockingLink} />
            <QuizDetailsModal isOpen={showQuizDetails} onClose={() => setShowQuizDetails(false)} answers={nadaStats.quizAnswers} />
            <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} originalName={adminConfig.name} currentNickname={adminConfig.nickname} currentImage={adminConfig.image} isMale={adminConfig.isMale} onSaveNickname={handleSaveAdminName} />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-700 rounded-xl flex items-center justify-center text-black shadow-lg shadow-gold/10">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">لوحة التحكم</h1>
                        <p className="text-xs text-gray-500 font-mono tracking-wider">PRO v2.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    {/* Mobile Menu Toggle */}
                    <button onClick={() => window.location.hash = 'admin-menu'} className="md:hidden p-2.5 rounded-xl bg-[#1a1a1a] text-gold border border-gold/20">
                        <Menu size={20} />
                    </button>

                    <button onClick={() => window.location.href = '/'} className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition border border-blue-500/20 hidden md:block" title="العودة للرئيسية">
                        <Home size={20} />
                    </button>
                    <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 bg-[#1a1a1a] hover:bg-[#222] border border-white/5 rounded-full p-1 pr-4 transition group">
                        <span className="text-sm font-bold group-hover:text-gold transition hidden md:block">
                            {isShutdown ? (adminConfig.isMale ? 'بشمهندس حسانين ❤️' : 'ندى ❤️') : adminConfig.nickname}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-gold/20 flex items-center justify-center relative shadow-lg">
                            {adminConfig.image ? <img src={adminConfig.image} className="w-full h-full object-cover" /> : (adminConfig.isMale ? '👑' : '👸')}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1a1a1a] rounded-full"></div>
                        </div>
                    </button>
                    <div className="h-8 w-[1px] bg-white/10 mx-1 hidden md:block" />
                    <button onClick={() => { fetchUsersList(); setShowLinkModal(true); }} className="p-2.5 rounded-xl bg-[#1a1a1a] text-gray-400 hover:text-gold hover:bg-gold/10 transition border border-white/5 hidden md:block"><Settings size={20} /></button>
                    <button onClick={logout} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition border border-red-500/20"><LogOut size={20} /></button>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {showMobileNav && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => window.history.back()}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] md:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed top-0 right-0 bottom-0 w-3/4 max-w-sm bg-[#111] border-l border-white/10 z-[201] md:hidden shadow-2xl overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <LayoutDashboard className="text-gold" size={24} />
                                        القائمة
                                    </h2>
                                    <button onClick={() => window.history.back()} className="p-2 bg-white/5 rounded-full text-gray-400">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {tabs.map(tab => {
                                        const Icon = tab.icon;
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => { setActiveTab(tab.id); window.history.back(); }}
                                                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isActive ? 'bg-gold text-black font-bold shadow-lg shadow-gold/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                <Icon size={24} />
                                                <span className="text-lg">{tab.label}</span>
                                                {isActive && <ChevronRight className="mr-auto" size={20} />}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/10 space-y-3">
                                    <button onClick={() => window.location.href = '/'} className="w-full flex items-center gap-3 p-3 rounded-xl text-blue-400 hover:bg-blue-500/10">
                                        <Home size={20} />
                                        <span>العودة للرئيسية</span>
                                    </button>
                                    <button onClick={() => { fetchUsersList(); setShowLinkModal(true); window.history.back(); }} className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:bg-white/5">
                                        <Settings size={20} />
                                        <span>الإعدادات</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Desktop Sidebar - Hidden on Mobile */}
                <aside className="hidden md:flex flex-col w-64 bg-[#0f0f0f] border-r border-white/5 p-4 gap-2 z-40">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-gold text-black shadow-[0_0_15px_rgba(197,160,89,0.4)] font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                            >
                                <Icon size={20} className={isActive ? 'scale-110' : ''} />
                                <span className="text-sm">{tab.label}</span>
                                {isActive && <motion.div layoutId="activeTabIndicatorDesktop" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                            </button>
                        );
                    })}
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto w-full p-4 pb-32 md:p-8 md:pb-8 custom-scrollbar relative">
                    {renderContent()}

                    <footer className="mt-8 text-center text-gray-600 text-xs font-mono">
                        Admin Dashboard v2.0 • Love OS • Secure Connection
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
