import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';
import { useAuth } from './AuthContext';

const MusicContext = createContext();

export const useMusic = () => useContext(MusicContext);

export const MusicProvider = ({ children }) => {
    // Playlist Definition
    const playlist = [
        { title: "Die With A Smile", src: `${import.meta.env.BASE_URL}music/Die%20With%20A%20Smile.mp3`, artist: "Lady Gaga & Bruno Mars" },
        { title: "Perhaps Perhaps Perhaps", src: `${import.meta.env.BASE_URL}music/Doris%20Day%20~~~%20Perhaps%20Perhaps%20Perhaps.mp3`, artist: "Doris Day" },
        { title: "الك و بس", src: `${import.meta.env.BASE_URL}music/الك%20و%20بس.mp3`, artist: "Unknown" }
    ];

    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('music_volume')) || 0.5);
    const [isPermanentlyDisabled, setIsPermanentlyDisabled] = useState(() => localStorage.getItem('music_disabled') === 'true');
    const [showPlayer, setShowPlayer] = useState(true); // Toggle visibility of the disc

    const howlRef = useRef(null);

    const { currentUser } = useAuth(); // Dependency on Auth

    // Initialize Howl
    useEffect(() => {
        if (isPermanentlyDisabled || !currentUser) return; // Only play if user is logged in


        // Cleanup old instance
        if (howlRef.current) {
            howlRef.current.unload();
        }

        const track = playlist[currentTrackIndex];
        if (!track) return;

        const sound = new Howl({
            src: [track.src],
            html5: true, // Force HTML5 Audio for large files
            volume: Math.pow(volume, 2.5),
            loop: true, // Loop the playlist or track? For now track loop or playlist loop logic needed.
            onend: () => {
                playNext();
            },
            onloaderror: (id, err) => {
                console.warn("Music Load Error:", err);
            }
        });

        howlRef.current = sound;

        if (isPlaying) {
            sound.play();
        }

        return () => {
            sound.unload();
        };
    }, [currentTrackIndex, isPermanentlyDisabled, currentUser]);

    // Handle Volume Changes
    useEffect(() => {
        if (howlRef.current) {
            // Use exponential curve (x^2.5) for more realistic volume control
            // This makes 50% slider pos = ~17% power, which sounds like "half volume" to ears
            howlRef.current.volume(Math.pow(volume, 2.5));
        }
        localStorage.setItem('music_volume', volume);
    }, [volume]);

    // Handle Play/Pause
    useEffect(() => {
        if (!howlRef.current || isPermanentlyDisabled) return;

        if (isPlaying) {
            if (!howlRef.current.playing()) howlRef.current.play();
        } else {
            howlRef.current.pause();
        }
    }, [isPlaying, isPermanentlyDisabled]);

    const togglePlay = () => {
        if (isPermanentlyDisabled) {
            // If disabled, asking to play re-enables it temporarily? 
            // Or we should guide user to settings. 
            // For better UX, clicking play on a "Disabled" player might just do nothing or prompt.
            // But if it's disabled, the player is likely hidden or inactive.
            return;
        }
        setIsPlaying(!isPlaying);
    };

    const playNext = () => {
        setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
        setIsPlaying(true);
    };

    const playPrevious = () => {
        setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
        setIsPlaying(true);
    };

    const playTrack = (index) => {
        setCurrentTrackIndex(index);
        setIsPlaying(true);
    };

    const setPermanentlyDisabled = (disabled) => {
        setIsPermanentlyDisabled(disabled);
        localStorage.setItem('music_disabled', disabled);
        if (disabled) {
            setIsPlaying(false);
            if (howlRef.current) howlRef.current.unload();
        } else {
            // Re-enabling: Auto play or wait?
            // "If I close the site and open it, it plays again" -> implying AutoPlay default.
            setIsPlaying(true);
        }
    };

    return (
        <MusicContext.Provider value={{
            playlist,
            currentTrackIndex,
            currentTrack: playlist[currentTrackIndex],
            isPlaying,
            volume,
            setVolume,
            togglePlay,
            playNext,
            playPrevious,
            playTrack,
            isPermanentlyDisabled,
            setPermanentlyDisabled,
            showPlayer,
            setShowPlayer
        }}>
            {children}
        </MusicContext.Provider>
    );
};
