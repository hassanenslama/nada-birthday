import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';
import { useAuth } from './AuthContext';
import { useSiteStatus } from './SiteStatusContext';

const MusicContext = createContext();

export const useMusic = () => useContext(MusicContext);

export const MusicProvider = ({ children }) => {
    const { isShutdown } = useSiteStatus();

    // Default Playlist
    const defaultPlaylist = [
        { title: "Die With A Smile", src: `${import.meta.env.BASE_URL}music/Die%20With%20A%20Smile.mp3`, artist: "Lady Gaga & Bruno Mars" },
        { title: "Perhaps Perhaps Perhaps", src: `${import.meta.env.BASE_URL}music/Doris%20Day%20~~~%20Perhaps%20Perhaps%20Perhaps.mp3`, artist: "Doris Day" },
        { title: "الك و بس", src: `${import.meta.env.BASE_URL}music/الك%20و%20بس.mp3`, artist: "Unknown" }
    ];

    // Shutdown Playlist (Sad/Close folder)
    const shutdownPlaylist = [
        { title: "Runaway", src: `${import.meta.env.BASE_URL}music/close/Runaway.mp3`, artist: "AURORA" },
        { title: "To Die For", src: `${import.meta.env.BASE_URL}music/close/To%20Die%20For.mp3`, artist: "Sam Smith" },
        { title: "Cinnamon Girl", src: `${import.meta.env.BASE_URL}music/close/Cinnamon%20Girl.mp3`, artist: "Lana Del Rey" },
        { title: "Sometimes Love Just Ain t Enough", src: `${import.meta.env.BASE_URL}music/close/Sometimes%20Love%20Just%20Ain%20t%20Enough.mp3`, artist: "Patty Smyth" },
        { title: "Someone Like You", src: `${import.meta.env.BASE_URL}music/close/Someone%20Like%20You.mp3`, artist: "Adele" },
        { title: "Skyfall", src: `${import.meta.env.BASE_URL}music/close/Skyfall.mp3`, artist: "Adele" },
        { title: "Love In The Dark", src: `${import.meta.env.BASE_URL}music/close/Love%20In%20The%20Dark.mp3`, artist: "Adele" },
        { title: "Dynasty", src: `${import.meta.env.BASE_URL}music/close/Dynasty.mp3`, artist: "MIIA" },
        { title: "Set Fire To The Rain", src: `${import.meta.env.BASE_URL}music/close/Set%20Fire%20To%20The%20Rain.mp3`, artist: "Adele" },
        { title: "Wrecking Ball", src: `${import.meta.env.BASE_URL}music/close/Wrecking%20Ball.mp3`, artist: "Miley Cyrus" }
    ];

    const playlist = isShutdown ? shutdownPlaylist : defaultPlaylist;

    const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
        const savedIndex = localStorage.getItem('music_track_index');
        return savedIndex !== null ? parseInt(savedIndex) : 0;
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('music_volume')) || 0.5);
    const [isPermanentlyDisabled, setIsPermanentlyDisabled] = useState(() => localStorage.getItem('music_disabled') === 'true');
    const [showPlayer, setShowPlayer] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const howlRef = useRef(null);
    const progressIntervalRef = useRef(null);

    const { currentUser } = useAuth();

    // Reset playlist when mode changes
    useEffect(() => {
        // Only reset if it's the first time or if the playlist actually changed
        // But the user specifically asked: "if I leave site but same browser, don't restart song"
        // So we should only clear if cross-mode transition happens and we want a fresh start
        // However, for Shutdown, we usually WANT the sad music to start fresh or from last saved sad music.
        // Let's keep it simple: if mode changes, reset index to last saved or 0.
    }, [isShutdown]);

    // Initialize Howl
    useEffect(() => {
        if (isPermanentlyDisabled || !currentUser) return;

        if (howlRef.current) {
            howlRef.current.unload();
            clearInterval(progressIntervalRef.current);
        }

        const track = playlist[currentTrackIndex];
        if (!track) return;

        const sound = new Howl({
            src: [track.src],
            html5: true,
            volume: Math.pow(volume, 2.5),
            loop: true,
            onplay: () => {
                setDuration(sound.duration());
                startProgressInterval();
            },
            onend: () => {
                clearInterval(progressIntervalRef.current);
                playNext();
            },
            onload: () => {
                setDuration(sound.duration());
                // Restore position if possible
                const savedTime = localStorage.getItem('music_current_time');
                const savedIndex = localStorage.getItem('music_track_index');
                if (savedTime && savedIndex && parseInt(savedIndex) === currentTrackIndex) {
                    const seekToTime = parseFloat(savedTime);
                    if (seekToTime < sound.duration() - 2) { // Don't resume at the very end
                        sound.seek(seekToTime);
                        setCurrentTime(seekToTime);
                    }
                }
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
            clearInterval(progressIntervalRef.current);
        };
    }, [currentTrackIndex, isPermanentlyDisabled, currentUser, isShutdown]);

    const startProgressInterval = () => {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(() => {
            if (howlRef.current && isPlaying) {
                const pos = howlRef.current.seek();
                if (typeof pos === 'number') {
                    setCurrentTime(pos);
                    // Save to localStorage every second
                    localStorage.setItem('music_current_time', pos.toString());
                    localStorage.setItem('music_track_index', currentTrackIndex.toString());
                }
            }
        }, 1000);
    };

    // Handle Volume Changes
    useEffect(() => {
        if (howlRef.current) {
            howlRef.current.volume(Math.pow(volume, 2.5));
        }
        localStorage.setItem('music_volume', volume);
    }, [volume]);

    // Handle Play/Pause
    useEffect(() => {
        if (!howlRef.current || isPermanentlyDisabled) return;

        if (isPlaying) {
            if (!howlRef.current.playing()) howlRef.current.play();
            startProgressInterval();
        } else {
            howlRef.current.pause();
            clearInterval(progressIntervalRef.current);
        }
    }, [isPlaying, isPermanentlyDisabled]);

    const togglePlay = () => {
        if (isPermanentlyDisabled) return;
        setIsPlaying(!isPlaying);
    };

    const playNext = () => {
        const nextIndex = (currentTrackIndex + 1) % playlist.length;
        setCurrentTrackIndex(nextIndex);
        localStorage.setItem('music_track_index', nextIndex.toString());
        localStorage.setItem('music_current_time', '0');
        setIsPlaying(true);
    };

    const playPrevious = () => {
        const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        setCurrentTrackIndex(prevIndex);
        localStorage.setItem('music_track_index', prevIndex.toString());
        localStorage.setItem('music_current_time', '0');
        setIsPlaying(true);
    };

    const playTrack = (index) => {
        setCurrentTrackIndex(index);
        localStorage.setItem('music_track_index', index.toString());
        localStorage.setItem('music_current_time', '0');
        setIsPlaying(true);
    };

    const seekTo = (seconds) => {
        if (howlRef.current) {
            howlRef.current.seek(seconds);
            setCurrentTime(seconds);
            localStorage.setItem('music_current_time', seconds.toString());
        }
    };

    const setPermanentlyDisabled = (disabled) => {
        setIsPermanentlyDisabled(disabled);
        localStorage.setItem('music_disabled', disabled);
        if (disabled) {
            setIsPlaying(false);
            if (howlRef.current) howlRef.current.unload();
            clearInterval(progressIntervalRef.current);
        } else {
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
            currentTime,
            duration,
            seekTo,
            isPermanentlyDisabled,
            setPermanentlyDisabled,
            showPlayer,
            setShowPlayer
        }}>
            {children}
        </MusicContext.Provider>
    );
};
