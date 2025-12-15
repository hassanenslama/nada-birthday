import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, LogOut, Settings, RotateCw, AlertTriangle, Check } from 'lucide-react';

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

    // State
    const [nadaProfile, setNadaProfile] = useState(null);
    const [nadaStats, setNadaStats] = useState({ quizScore: 0, quizAnswers: {}, unlockedCount: 0 });
    const [availableUsers, setAvailableUsers] = useState([]);

    // UI State
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showQuizDetails, setShowQuizDetails] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [forceBlockingLink, setForceBlockingLink] = useState(false);

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

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-cairo flex flex-col relative overflow-x-hidden">
            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <AnimatePresence>{toast && <Toast {...toast} />}</AnimatePresence>

            {/* Modals */}
            <LinkUserModal
                isOpen={showLinkModal}
                users={availableUsers}
                onSelect={handleLinkUser}
                onRefresh={fetchUsersList}
                isBlocking={forceBlockingLink}
            />
            <QuizDetailsModal
                isOpen={showQuizDetails}
                onClose={() => setShowQuizDetails(false)}
                answers={nadaStats.quizAnswers}
            />
            <ProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                originalName={adminConfig.name}
                currentNickname={adminConfig.nickname}
                currentImage={adminConfig.image}
                isMale={adminConfig.isMale}
                onSaveNickname={handleSaveAdminName}
            />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-700 rounded-xl flex items-center justify-center text-black shadow-lg shadow-gold/10">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">لوحة التحكم</h1>
                        <p className="text-xs text-gray-500 font-mono tracking-wider">PRO EDITION</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowProfileModal(true)}
                        className="flex items-center gap-3 bg-[#1a1a1a] hover:bg-[#222] border border-white/5 rounded-full p-1 pr-4 transition group"
                    >
                        <span className="text-sm font-bold group-hover:text-gold transition">{adminConfig.nickname}</span>


                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-gold/20 flex items-center justify-center relative shadow-lg">
                            {adminConfig.image ? <img src={adminConfig.image} className="w-full h-full object-cover" /> : (adminConfig.isMale ? '👑' : '👸')}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1a1a1a] rounded-full"></div>
                        </div>
                    </button>

                    <div className="h-8 w-[1px] bg-white/10 mx-1" />

                    <button
                        onClick={() => { fetchUsersList(); setShowLinkModal(true); }}
                        className="p-2.5 rounded-xl bg-[#1a1a1a] text-gray-400 hover:text-gold hover:bg-gold/10 transition border border-white/5"
                        title="ربط الحساب"
                    >
                        <Settings size={20} />
                    </button>

                    <button
                        onClick={logout}
                        className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition border border-red-500/20"
                        title="تسجيل خروج"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header >

            {/* Main Content */}
            < main className="flex-1 container mx-auto px-4 py-8 space-y-8 max-w-7xl z-10" >

                {/* 1. Stats Section */}
                < section >
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-1 h-6 bg-gold rounded-full" />
                        <h2 className="text-lg font-bold text-gray-200">نظرة عامة</h2>
                    </div>
                    <StatsOverview
                        stats={nadaStats}
                        onViewQuizDetails={() => setShowQuizDetails(true)}
                    />
                </section >

                {/* 2. Gallery Management Section (NEW) */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-1 h-6 bg-purple-500 rounded-full" />
                        <h2 className="text-lg font-bold text-gray-200">إدارة الصور والألبومات (Gallery)</h2>
                    </div>
                    {/* Debug log */}
                    {console.log("🎨 Rendering GalleryManager with nadaUserId:", nadaProfile?.id)}
                    <GalleryManager onToast={showToast} nadaUserId={nadaProfile?.id} />
                </section>

                {/* 3. Wish Management Section (Bucket List) */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-1 h-6 bg-gold rounded-full" />
                        <h2 className="text-lg font-bold text-gray-200">إدارة الأمنيات (Bucket List)</h2>
                    </div>
                    <WishManager />
                </section>

                {/* 4. Feelings Management (New) */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-1 h-6 bg-pink-500 rounded-full" />
                        <h2 className="text-lg font-bold text-gray-200">إدارة المشاعر (Feelings)</h2>
                    </div>
                    <FeelingsManager />
                </section>

                {/* 5. Quiz Management (NEW) */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-1 h-6 bg-yellow-500 rounded-full" />
                        <h2 className="text-lg font-bold text-gray-200">إدارة المسابقة (Quiz Reset)</h2>
                    </div>
                    <QuizManager
                        quizData={{ score: nadaStats.quizScore, answers: nadaStats.quizAnswers }}
                        targetUserId={nadaProfile?.id}
                        onRefresh={loadTargetStats}
                        onToast={showToast}
                    />
                </section>

                {/* 6. Notifications Management */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-1 h-6 bg-blue-500 rounded-full" />
                        <h2 className="text-lg font-bold text-gray-200">إدارة الإشعارات (Notifications)</h2>
                    </div>
                    <NotificationsManager onToast={showToast} />
                </section>

                {/* 6. Coupons Management (New) */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-1 h-6 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full" />
                        <h2 className="text-lg font-bold text-gray-200">إدارة الكوبونات (Coupons)</h2>
                    </div>
                    <CouponsManager onToast={showToast} />
                </section>

                {/* Footer Info */}
                < footer className="text-center text-gray-600 text-xs py-8 font-mono" >
                    Admin Dashboard v2.0 • Love OS
                </footer >
            </main >
        </div >
    );
};

export default AdminDashboard;
