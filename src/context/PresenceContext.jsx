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
    const [isGhostMode, setIsGhostMode] = useState(false);
    const channelRef = useRef(null);

    // Use Ref for Ghost Mode to access in callbacks/intervals without dependency loops
    const isGhostModeRef = useRef(false);

    // Initial Fetch of Ghost Mode
    useEffect(() => {
        if (!currentUser) return;
        const fetchGhostMode = async () => {
            const { data } = await supabase
                .from('user_profiles')
                .select('is_ghost_mode')
                .eq('id', currentUser.id)
                .single();

            if (data) {
                setIsGhostMode(data.is_ghost_mode || false);
                isGhostModeRef.current = data.is_ghost_mode || false;
            }
        };
        fetchGhostMode();
    }, [currentUser]);

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

    // Generic Status Updater & Heartbeat
    const updatePresenceLocal = async (newLocation) => {
        if (!channelRef.current || !currentUser) return;

        const now = new Date().toISOString();

        // 1. Update Realtime Presence (Ephemeral) - SKIP IF GHOST MODE
        if (!isGhostModeRef.current) {
            await channelRef.current.track({
                online_at: now,
                user_id: currentUser.id,
                location: newLocation
            });
        }

        // 2. Update Database Tracking Info (Persistent) - ALWAYS UPDATE (For Admin Visibility)
        // We capture IP and Device Info
        try {
            let device = navigator.userAgent;

            // Simple parser for nicer device name
            if (device.match(/Android/i)) device = 'Android Phone';
            else if (device.match(/iPhone/i)) device = 'iPhone';
            else if (device.match(/iPad/i)) device = 'iPad';
            else if (device.match(/Windows/i)) device = 'Windows PC';
            else if (device.match(/Mac/i)) device = 'Mac';

            // Fetch IP
            fetch('https://api.ipify.org?format=json')
                .then(res => res.json())
                .then(async (data) => {
                    if (data?.ip) {
                        const currentIp = data.ip;

                        // 1. Update Profile (Last Seen/Last IP)
                        supabase
                            .from('user_profiles')
                            .update({
                                last_seen: now,
                                last_ip: currentIp,
                                device_info: device
                            })
                            .eq('id', currentUser.id)
                            .then(({ error }) => { if (error) console.error("Error updating profile tracking:", error); });

                        // 2. Check and Insert History (If IP changed)
                        // Get latest log
                        const { data: lastLog } = await supabase
                            .from('login_history')
                            .select('ip_address')
                            .eq('user_id', currentUser.id)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();

                        if (!lastLog || lastLog.ip_address !== currentIp) {
                            console.log("📝 New IP detected, logging to history:", currentIp);
                            await supabase.from('login_history').insert({
                                user_id: currentUser.id,
                                ip_address: currentIp,
                                device_info: device,
                                location: newLocation
                            });
                        }
                    }
                })
                .catch(err => {
                    // Update timestamp even if IP fetch fails
                    supabase.from('user_profiles').update({ last_seen: now }).eq('id', currentUser.id);
                });

        } catch (e) {
            console.error("Tracking Error:", e);
        }
    };

    // Heartbeat to update last_seen every 2 minutes
    useEffect(() => {
        if (!currentUser) return;
        const interval = setInterval(() => {
            updatePresenceLocal(getLocationName(location.pathname));
        }, 120000); // 2 mins

        // Update on visibility change (tab close/minimize)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                supabase
                    .from('user_profiles')
                    .update({ last_seen: new Date().toISOString() })
                    .eq('id', currentUser.id);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [currentUser, location.pathname]);

    const toggleGhostMode = async (status) => {
        setIsGhostMode(status);
        isGhostModeRef.current = status;

        try {
            // 1. Update DB
            await supabase
                .from('user_profiles')
                .update({ is_ghost_mode: status })
                .eq('id', currentUser.id);

            // 2. Handle Realtime
            if (status) {
                // Enabled Ghost Mode -> Untrack (Disappear immediately)
                if (channelRef.current) {
                    await channelRef.current.untrack();
                }
            } else {
                // Disabled Ghost Mode -> Track immediately
                updatePresenceLocal(getLocationName(location.pathname));
            }
        } catch (err) {
            console.error("Error toggling ghost mode:", err);
            // Revert on error
            setIsGhostMode(!status);
            isGhostModeRef.current = !status;
        }
    };

    return (
        <PresenceContext.Provider value={{ onlineUsers, updateLocation: updatePresenceLocal, isGhostMode, toggleGhostMode }}>
            {children}
        </PresenceContext.Provider>
    );
};
