import React, { useState, useEffect, useRef } from 'react';
import Navigation from './Navigation';
import HomePage from './Home/HomePage';
import JourneyPage from './Journey/JourneyPage';
import FeelingsPage from './Feelings/FeelingsPage';
import FunPage from './Fun/FunPage';
import AdminDashboard from '../Admin/AdminDashboard';
import MessagesPage from './Messages/MessagesPage';
import SettingsPage from './Settings/SettingsPage';
import NotificationSystem from './NotificationSystem';
import NotificationsPanel from './NotificationsPanel';
import CouponsPage from './CouponsPage';
import PostsPage from './Posts/PostsPage';
import GuidePage from './Guide/GuidePage';

import GlobalBackground from './GlobalBackground';
import Snowfall from '../Christmas/Snowfall';
import ChristmasHub from '../Christmas/ChristmasHub';
import SantaFlyover from '../Christmas/SantaFlyover';
import ChristmasMusic from '../Christmas/ChristmasMusic';

import { usePresence } from '../../context/PresenceContext';
import { useImmersiveMode } from '../../context/ImmersiveModeContext.jsx';

const MainApp = () => {
    const { isImmersive } = useImmersiveMode();

    // Scroll Ref for Main Content (Defined BEFORE usage)
    const mainContentRef = useRef(null);

    const [activeTab, setActiveTab] = useState(() => {
        // 1. Priority: Pending Game Invite
        if (localStorage.getItem('pending_game')) return 'fun';
        // 2. Default: Home (Persistence disabled to ensure fresh start)
        return 'home';
    });
    const { updateLocation } = usePresence();

    const getTabNameAr = (tab) => {
        switch (tab) {
            case 'home': return 'في الرئيسية';
            case 'journey': return 'في رحلتنا';
            case 'feelings': return 'في مشاعرنا';
            case 'messages': return 'في الدردشة';
            case 'posts': return 'في المنشورات';
            case 'fun': return 'في الترفيه';
            case 'admin': return 'في لوحة التحكم';
            case 'settings': return 'في الإعدادات';
            case 'guide': return 'يقرأ شرح الموقع';
            default: return 'يتصفح الموقع';
        }
    };

    // 4. Smart Hash Routing (Back Button Logic)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            const validTabs = ['home', 'journey', 'feelings', 'messages', 'posts', 'fun', 'coupons', 'admin', 'settings', 'guide'];

            // 1. Handle "Modal" hashes (e.g., admin-menu) by ignoring main tab switch
            if (hash.includes('-')) {
                return;
            }

            // 2. Handle Main Tab Switching
            if (hash && validTabs.includes(hash)) {
                setActiveTab(hash);
            } else if (!hash || hash === 'home') {
                setActiveTab('home');
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Sync Presence
    useEffect(() => {
        updateLocation(getTabNameAr(activeTab));
    }, [activeTab]);

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <HomePage />;
            case 'journey': return <JourneyPage />;
            case 'feelings': return <FeelingsPage />;
            case 'messages': return <MessagesPage />;
            case 'posts': return <PostsPage />;
            case 'fun': return <FunPage />;
            case 'coupons': return <CouponsPage />;
            case 'admin': return <AdminDashboard />;
            case 'settings': return <SettingsPage />;
            case 'guide': return <GuidePage />;
            default: return <HomePage />;
        }
    };

    // Custom Tab Switcher to manage History Stack & Scroll
    const handleTabChange = (newTab) => {
        if (newTab === activeTab) {
            if (activeTab !== 'messages' && mainContentRef.current) {
                mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return;
        }

        if (newTab === 'home') {
            window.location.hash = '';
        } else {
            if (activeTab === 'home' || activeTab === '') {
                window.location.hash = newTab;
            } else {
                window.history.replaceState(null, '', '#' + newTab);
                setActiveTab(newTab);
            }
        }
    };

    return (
        <div className="fixed inset-0 text-white overflow-hidden flex flex-col">
            <GlobalBackground />

            {/* HIDE these in Immersive Mode */}
            {!isImmersive && (
                <>
                    <Snowfall />
                    <ChristmasHub />
                    <SantaFlyover />
                    <ChristmasMusic />

                    {/* Notifications Bell - Top Right */}
                    <div className="absolute top-4 right-4 z-50">
                        <NotificationsPanel />
                    </div>
                </>
            )}

            {/* Main Content Area */}
            <div ref={mainContentRef} className="flex-1 overflow-y-auto pb-20 custom-scrollbar relative z-10">
                {renderContent()}
            </div>

            {/* Bottom Navigation */}
            <div className="relative z-20">
                <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* Global Notification Receiver */}
            <NotificationSystem />
        </div>
    );
};

export default MainApp;
