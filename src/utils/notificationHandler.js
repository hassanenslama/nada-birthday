import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import { supabase } from "../supabase";

const VAPID_KEY = "BPmLJvweV3lMtAsajLbYwPXOM1Nk82KNnr2ITbAcB68b1JEdyKZuM-AMCFBxMpCnwq1XLVd7r5CisbRShEMbVOQ";

export const requestNotificationPermission = async (userId) => {
    if (!messaging) return;

    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (token) {
                console.log("FCM Token:", token);
                // Save token to Supabase
                await saveTokenToDatabase(userId, token);
            }
        } else {
            console.log("Notification permission denied");
        }
    } catch (error) {
        console.error("Error requesting notification permission:", error);
    }
};

const saveTokenToDatabase = async (userId, token) => {
    if (!userId) return;

    // Check if token exists
    const { data: existingTokens } = await supabase
        .from('user_fcm_tokens')
        .select('*')
        .eq('token', token)
        .eq('user_id', userId);

    if (existingTokens && existingTokens.length > 0) return;

    // Insert new token
    await supabase.from('user_fcm_tokens').insert([
        { user_id: userId, token: token, platform: 'web' }
    ]);
};

export const onForegroundMessage = () => {
    if (!messaging) return;
    return onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // You can show a custom toast here if needed
        // const { title, body } = payload.notification;
        // new Notification(title, { body }); 
    });
};
