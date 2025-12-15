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

    // Sync Presence when tab changes
    // Sync Presence & Persistence when tab changes
    useEffect(() => {
        updateLocation(getTabNameAr(activeTab));
        localStorage.setItem('nav_active_tab', activeTab);
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
