import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'admin' or 'user'
    const [loading, setLoading] = useState(true);

    // Hardcoded roles for simplicity
    const ADMIN_EMAIL = 'hassanen@love.com';
    const USER_EMAIL = 'nada@love.com';

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                const user = session.user;
                const role = user.email === ADMIN_EMAIL ? 'admin' : 'user';
                setUserRole(role);
                setCurrentUser(user);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                const user = session.user;
                const role = user.email === ADMIN_EMAIL ? 'admin' : 'user';
                setUserRole(role);
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        try {
            // Attempt standard sign out
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Supabase signOut error (ignoring to force logout):", error);
        } finally {
            // NUCLEAR OPTION: Manually clear everything
            localStorage.clear();
            sessionStorage.clear();
            setCurrentUser(null);
            setUserRole(null);
            console.log("✅ Local session destroyed manually");
        }
    };

    const value = {
        currentUser,
        userRole,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
