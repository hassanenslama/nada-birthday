import React, { useState } from 'react';
import Navigation from './Navigation';
import HomePage from './Home/HomePage';
// Import other placeholders for now to avoid errors
import JourneyPage from './Journey/JourneyPage';
// Import other placeholders for now to avoid errors
import FeelingsPage from './Feelings/FeelingsPage';
import FunPage from './Fun/FunPage';
import AdminDashboard from '../Admin/AdminDashboard';
import MessagesPage from './Messages/MessagesPage';
import SettingsPage from './Settings/SettingsPage';
import NotificationSystem from './NotificationSystem';
import NotificationsPanel from './NotificationsPanel';
import CouponsPage from './CouponsPage';
import PostsPage from './Posts/PostsPage';

import { usePresence } from '../../context/PresenceContext';
import { useEffect } from 'react';

const MainApp = () => {
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
            default: return 'يتصفح الموقع';
        }
    };

    // 4. Smart Hash Routing (Back Button Logic)
    // Goal: Back button always goes Home from other tabs. Menus/Modals use sub-hashes.

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            const validTabs = ['home', 'journey', 'feelings', 'messages', 'posts', 'fun', 'coupons', 'admin', 'settings'];

            // 1. Handle "Modal" hashes (e.g., admin-menu) by ignoring main tab switch
            if (hash.includes('-')) {
                // It's a modal state (handled by child components), do nothing here
                return;
            }

            // 2. Handle Main Tab Switching
            if (hash && validTabs.includes(hash)) {
                setActiveTab(hash);
            } else if (!hash || hash === 'home') {
                setActiveTab('home');
            }
        };

        // Initial check
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
            default: return <HomePage />;
        }
    };

    // Scroll Ref for Main Content
    const mainContentRef = React.useRef(null);

    // Custom Tab Switcher to manage History Stack & Scroll
    const handleTabChange = (newTab) => {
        if (newTab === activeTab) {
            // If clicking same tab (except messages), scroll to top
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
        <div className="fixed inset-0 bg-charcoal text-white overflow-hidden flex flex-col">
            {/* Notifications Bell - Top Right */}
            <div className="absolute top-4 right-4 z-50">
                <NotificationsPanel />
            </div>

            {/* Main Content Area */}
            <div ref={mainContentRef} className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                {renderContent()}
            </div>

            {/* Bottom Navigation */}
            <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Global Notification Receiver */}
            <NotificationSystem />
        </div>
    );
};

export default MainApp;
