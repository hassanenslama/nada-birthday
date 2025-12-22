import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        if (!currentUser) {
            setUserProfile(null);
            setLoading(false);
            return;
        }

        try {
            const { data } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (data) setUserProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();

        if (currentUser) {
            const channel = supabase
                .channel(`profile-${currentUser.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'user_profiles',
                        filter: `id=eq.${currentUser.id}`
                    },
                    (payload) => {
                        // Immediately update local state with the change
                        if (payload.new) {
                            setUserProfile(payload.new);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [currentUser]);

    const value = {
        userProfile,
        loading,
        refetchProfile: fetchProfile
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};
