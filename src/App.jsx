import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import Teaser from './components/Teaser';
import Quiz from './components/Quiz';
import MainApp from './components/MainApp/MainApp';
import { supabase } from './supabase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PresenceProvider } from './context/PresenceContext';
import Login from './components/Login';
import { TARGET_DATE } from './config';
import GlobalNotificationListener from './components/GlobalNotificationListener';
import { MusicProvider } from './context/MusicContext';
import FloatingDisc from './components/Common/MusicPlayer/FloatingDisc';
import { requestNotificationPermission } from './utils/notificationHandler';

// Inner App Component to handle Auth State
const AppContent = () => {
  const { currentUser, userRole } = useAuth();
  const [phase, setPhase] = useState('loading'); // loading, teaser, quiz, app
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!currentUser) return;

      // 1. If Admin -> Skip everything, go to App
      if (userRole === 'admin') {
        setPhase('app');
        return;
      }

      // 🚀 FORCE SKIP: Bypass Quiz and Video entirely
      setPhase('app');
    };

    checkStatus();
    checkStatus();
  }, [currentUser, userRole]);

  // Request Notification Permission when user is logged in
  useEffect(() => {
    if (currentUser?.id) {
      requestNotificationPermission(currentUser.id);
    }
  }, [currentUser]);



  // If not logged in, show Login Screen
  if (!currentUser) {
    return <Login />;
  }

  if (phase === 'loading') {
    return <div className="min-h-screen bg-black flex items-center justify-center text-gold font-cairo">جاري التحميل... ⏳</div>;
  }

  const handleUnlock = () => {
    setPhase('quiz');
  };

  const handleQuizComplete = async (result) => {
    console.log("🎉 Quiz completed with result:", result);
    setQuizResult(result);

    // Force a re-check from Supabase to verify the save worked
    console.log("🔄 Re-checking quiz status from database...");

    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("❌ Error re-checking status:", error);
      }

      if (data) {
        console.log("✅ Quiz completion confirmed in database");
        setPhase('app');
      } else {
        console.warn("⚠️ Quiz result not found in database, retrying check in 2s...");
        // Retry after a short delay
        setTimeout(async () => {
          const { data: retryData } = await supabase
            .from('quiz_results')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (retryData) {
            console.log("✅ Quiz completion confirmed on retry");
            setPhase('app');
          } else {
            console.error("❌ Still no quiz result found - proceeding anyway to avoid blocking");
            setPhase('app');
          }
        }, 2000);
      }
    } catch (err) {
      console.error("❌ Critical error checking status:", err);
      // Don't block - proceed to app
      setPhase('app');
    }
  };

  if (phase === 'teaser') {
    return <Teaser onUnlock={handleUnlock} />;
  }

  if (phase === 'quiz') {
    return <Quiz onComplete={handleQuizComplete} />;
  }

  // Pass user info to MainApp
  return (
    <>
      <GlobalNotificationListener />
      <MainApp user={currentUser} role={userRole} />
    </>
  );
};

import { BackButtonProvider } from './context/BackButtonContext';
import { ProfileProvider } from './context/ProfileContext';

function App() {
  return (
    <Router>
      <BackButtonProvider>
        <AuthProvider>
          <ProfileProvider>
            <PresenceProvider>
              <MusicProvider>
                <AppContent />
                <FloatingDisc />
              </MusicProvider>
            </PresenceProvider>
          </ProfileProvider>
        </AuthProvider>
      </BackButtonProvider>
    </Router>
  );
}

export default App;
