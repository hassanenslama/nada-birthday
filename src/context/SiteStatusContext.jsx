import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const SiteStatusContext = createContext();

export const SiteStatusProvider = ({ children }) => {
    const [isShutdown, setIsShutdown] = useState(false);
    const [shutdownStage, setShutdownStage] = useState(0);
    const [shutdownTime, setShutdownTime] = useState(null);
    const [restorationUsed, setRestorationUsed] = useState(false);
    const [loading, setLoading] = useState(true);

    // Initial Fetch & Realtime Subscription
    useEffect(() => {
        fetchStatus();

        // Listen for changes
        const channel = supabase.channel('site_status_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'app_status' }, (payload) => {
                if (payload.new) {
                    setIsShutdown(payload.new.is_shutdown);
                    setShutdownStage(payload.new.shutdown_stage);
                    setShutdownTime(payload.new.shutdown_time);
                    setRestorationUsed(payload.new.restoration_used);
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchStatus = async () => {
        try {
            const { data, error } = await supabase.from('app_status').select('*').eq('id', 1).maybeSingle();
            if (data) {
                setIsShutdown(data.is_shutdown);
                setShutdownStage(data.shutdown_stage);
                setShutdownTime(data.shutdown_time);
                setRestorationUsed(data.restoration_used || false);
            }
        } catch (err) {
            console.error('Error fetching site status:', err);
        } finally {
            setLoading(false);
        }
    };

    const logAction = async (type, details, role) => {
        try {
            await supabase.from('app_status_logs').insert([{ action_type: type, details, performed_by_role: role }]);
        } catch (err) {
            console.error('Error logging action:', err);
        }
    };

    // Update Stage (Called by Teaser)
    const updateStage = async (stage, shutdown = false) => {
        try {
            console.log(`🔄 [SiteStatus] Updating stage to ${stage} (shutdown: ${shutdown})`);
            const now = new Date().toISOString();

            const updateData = {
                shutdown_stage: stage,
                is_shutdown: shutdown,
                updated_at: now
            };

            if (shutdown) updateData.shutdown_time = now;
            if (!shutdown && stage === 0) updateData.shutdown_time = null;

            const { error } = await supabase
                .from('app_status')
                .update(updateData)
                .eq('id', 1);

            if (error) throw error;

            // Logging
            if (shutdown && stage === 3) {
                await logAction('shutdown_final', 'تم إيقاف الموقع نهائياً من قبل المستخدم', 'nada');
            } else {
                await logAction('shutdown_progress', `تغيير مرحلة الإيقاف إلى ${stage}`, 'nada');
            }

            // Optimistic update
            setShutdownStage(stage);
            setIsShutdown(shutdown);
            if (shutdown) setShutdownTime(now);

        } catch (err) {
            console.error('❌ [SiteStatus] Update failed:', err);
            fetchStatus();
            throw err;
        }
    };

    // Restore by Nada (One-time)
    const restoreSite = async () => {
        try {
            const now = new Date().toISOString();
            const { error } = await supabase.from('app_status').update({
                is_shutdown: false,
                shutdown_stage: 0,
                shutdown_time: null,
                restoration_used: true,
                updated_at: now
            }).eq('id', 1);

            if (error) throw error;

            await logAction('nada_restore', 'قامت ندى باستعادة الموقع (استخدام الفرصة الواحدة)', 'nada');
            setIsShutdown(false);
            setShutdownStage(0);
            setRestorationUsed(true);
        } catch (err) {
            console.error('Error restoring site:', err);
            throw err;
        }
    };

    // Reset everything (Called by Admin)
    const resetSite = async () => {
        try {
            const now = new Date().toISOString();
            const { error } = await supabase.from('app_status').update({
                is_shutdown: false,
                shutdown_stage: 0,
                shutdown_time: null,
                restoration_used: false, // Reset the chance for Nada
                updated_at: now
            }).eq('id', 1);

            if (error) throw error;

            await logAction('admin_reset', 'قام حسانين بإعادة تشغيل الموقع وتصفير محاولات الاستعادة لندى', 'admin');
            setIsShutdown(false);
            setShutdownStage(0);
            setRestorationUsed(false);
        } catch (err) {
            console.error('Error resetting site:', err);
            throw err;
        }
    };

    return (
        <SiteStatusContext.Provider value={{ isShutdown, shutdownStage, shutdownTime, restorationUsed, updateStage, restoreSite, resetSite, loading }}>
            {/* 
                We apply grayscales at the component level to allow "Secret" content to stay in color.
                This wrapper provides a quick transition for those components.
            */}
            <div className="transition-all duration-300">
                {children}
            </div>
        </SiteStatusContext.Provider>
    );
};

export const useSiteStatus = () => useContext(SiteStatusContext);
