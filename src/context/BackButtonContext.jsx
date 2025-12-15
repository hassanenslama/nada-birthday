import React, { createContext, useContext, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const BackButtonContext = createContext();

export const BackButtonProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Stack of handlers: { id, fn, priority }
    // Priority: higher executes first. Default 10.
    const handlersRef = useRef([]);
    const lastBackPressRef = useRef(0);

    const registerHandler = (id, handler, priority = 10) => {
        // Remove existing if any to avoid duplicates
        unregisterHandler(id);
        handlersRef.current.push({ id, handler, priority });
        // Sort by priority DESC (so high priority is at [0] or handled first)
        // Actually simplest is: Find highest priority item.
        // Let's keep it simple: We iterate to find the 'best' handler.
        handlersRef.current.sort((a, b) => a.priority - b.priority);
    };

    const unregisterHandler = (id) => {
        handlersRef.current = handlersRef.current.filter(h => h.id !== id);
    };

    useEffect(() => {
        const handleBackButton = async () => {
            // 1. Check Custom Handlers (Modals, Games, etc.)
            // We take the LAST one added with the HIGHEST priority.
            // Since we sorted by priority ascending, the last elements have high priority.
            if (handlersRef.current.length > 0) {
                const topHandler = handlersRef.current[handlersRef.current.length - 1];
                console.log('Executing Back Handler:', topHandler.id);
                topHandler.handler();
                return;
            }

            // 2. Navigation / Exit
            // If we are deep in navigation (not at root), go back.
            // Assuming '/' is root. Adjust if 'home' etc.
            if (location.pathname !== '/' && location.pathname !== '/nada-birthday/') {
                navigate(-1);
                return;
            }

            // 3. Double Press to Exit
            const now = Date.now();
            if (now - lastBackPressRef.current < 2000) {
                CapacitorApp.exitApp();
            } else {
                lastBackPressRef.current = now;
                toast('اضغط مرة أخرى للخروج', {
                    duration: 2000,
                    style: {
                        background: '#333',
                        color: '#fff',
                        borderRadius: '20px',
                    },
                });
            }
        };

        const listener = CapacitorApp.addListener('backButton', handleBackButton);
        return () => {
            listener.then(l => l.remove()).catch(e => console.error(e));
        };
    }, [location.pathname, navigate]); // Re-bind when location changes? No, listener is global. 
    // BUT we need fresh 'location' inside the callback?
    // Capacitor listener callback captures closure variables.
    // We must use a ref for location or re-bind. Re-binding is safer.

    return (
        <BackButtonContext.Provider value={{ registerHandler, unregisterHandler }}>
            {children}
        </BackButtonContext.Provider>
    );
};

export const useBackButton = () => useContext(BackButtonContext);
