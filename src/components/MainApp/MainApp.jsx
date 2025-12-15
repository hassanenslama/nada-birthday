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

import { usePresence } from '../../context/PresenceContext';
import { useEffect } from 'react';

const MainApp = () => {
    const [activeTab, setActiveTab] = useState(() => {
        // 1. Priority: Pending Game Invite
        if (localStorage.getItem('pending_game')) return 'fun';
        // 2. Secondary: Last visited tab (Persistence)
        return localStorage.getItem('nav_active_tab') || 'home';
    });
    const { updateLocation } = usePresence();

    const getTabNameAr = (tab) => {
        switch (tab) {
            case 'home': return 'في الرئيسية';
            case 'journey': return 'في رحلتنا';
            case 'feelings': return 'في مشاعرنا';
            case 'messages': return 'في الدردشة';
            case 'fun': return 'في الترفيه';
            case 'admin': return 'في لوحة التحكم';
            case 'settings': return 'في الإعدادات';
            default: return 'يتصفح الموقع';
        }
    };

    // 4. Hash Routing Support (Back Button Fix)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            const validTabs = ['home', 'journey', 'feelings', 'messages', 'fun', 'coupons', 'admin', 'settings'];

            if (hash && validTabs.includes(hash)) {
                setActiveTab(hash);
            } else if (!hash) {
                setActiveTab('home');
            }
        };

        // Initial Load: Check hash first, if empty check local storage logic
        const currentHash = window.location.hash.replace('#', '');
        if (currentHash) {
            handleHashChange();
        }

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Sync Presence & Persistence when tab changes
    useEffect(() => {
        updateLocation(getTabNameAr(activeTab));
        localStorage.setItem('nav_active_tab', activeTab);

        // Sync Hash with State (without triggering new history if it matches)
        if (window.location.hash.replace('#', '') !== activeTab) {
            // We use replaceState for initial load to avoid double history, 
            // but normally we want pushState. 
            // Simple hash assignment works as pushState.
            window.location.hash = activeTab;
        }
    }, [activeTab]);

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <HomePage />;
            case 'journey': return <JourneyPage />;
            case 'feelings': return <FeelingsPage />;
            case 'messages': return <MessagesPage />;
            case 'fun': return <FunPage />;
            case 'coupons': return <CouponsPage />;
            case 'admin': return <AdminDashboard />;
            case 'settings': return <SettingsPage />;
            default: return <HomePage />;
        }
    };

    return (
        <div className="fixed inset-0 bg-charcoal text-white overflow-hidden flex flex-col">
            {/* Notifications Bell - Top Right */}
            <div className="absolute top-4 right-4 z-50">
                <NotificationsPanel />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                {renderContent()}
            </div>

            {/* Bottom Navigation */}
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Global Notification Receiver */}
            <NotificationSystem />
        </div>
    );
};

export default MainApp;
