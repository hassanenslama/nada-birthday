import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';

const PresenceContext = createContext();

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [onlineUsers, setOnlineUsers] = useState({});
    const [myPresence, setMyPresence] = useState(null);
    const channelRef = useRef(null);

    // Map Routes to Readable Names
    const getLocationName = (pathname) => {
        if (pathname === '/') return 'في الرئيسية';
        if (pathname.includes('/messages')) return 'في الدردشة';
        if (pathname.includes('/gallery')) return 'في معرض الذكريات';
        if (pathname.includes('/quiz')) return 'في اختبار الحب';
        if (pathname.includes('/admin')) return 'في لوحة التحكم';
        return 'يتصفح الموقع';
    };

    useEffect(() => {
        if (!currentUser) return;

        const roomName = 'global_tracking';

        // Clean up previous channel if exists
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase.channel(roomName, {
            config: {
                presence: {
                    key: currentUser.id,
                },
            },
        });

        channelRef.current = channel;

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const users = {};
                for (let key in newState) {
                    // Start with the existing user data if available
                    // Supabase presence gives an array for each key. We take the latest state.
                    if (newState[key] && newState[key].length > 0) {
                        users[key] = newState[key][0];
                    }
                }
                setOnlineUsers(users);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                setOnlineUsers(prev => ({ ...prev, [key]: newPresences[0] }));
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                setOnlineUsers(prev => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const presenceData = {
                        online_at: new Date().toISOString(),
                        user_id: currentUser.id,
                        location: getLocationName(location.pathname),
                        is_typing: false // Can be updated by specific pages
                    };
                    await channel.track(presenceData);
                    setMyPresence(presenceData);
                }
            });

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [currentUser]);

    // Update location when route changes
    useEffect(() => {
        if (!currentUser || !channelRef.current) return;

        const updateLocation = async () => {
            const newLocation = getLocationName(location.pathname);
            // We can't access "current" presence easily without tracking state locally or re-tracking
            // Simply re-tracking with new data updates the presence
            await channelRef.current.track({
                online_at: new Date().toISOString(),
                user_id: currentUser.id,
                location: newLocation
            });
        };

        updateLocation();
    }, [location.pathname, currentUser]);

    // Generic Status Updater
    const updatePresenceLocal = async (newLocation) => {
        if (!channelRef.current || !currentUser) return;
        await channelRef.current.track({
            online_at: new Date().toISOString(),
            user_id: currentUser.id,
            location: newLocation
        });
    };

    return (
        <PresenceContext.Provider value={{ onlineUsers, updateLocation: updatePresenceLocal }}>
            {children}
        </PresenceContext.Provider>
    );
};
