import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '../../../../supabase';
import { useAuth } from '../../../../context/AuthContext';
import { Eraser, Trash2, Palette, Download } from 'lucide-react';
import LobbyOverlay from './LobbyOverlay';

const COLORS = ['#F87171', '#FACC15', '#60A5FA', '#34D399', '#FFFFFF', '#000000'];

const LoveBoard = () => {
    const { currentUser } = useAuth();
    const canvasRef = useRef(null);
    const [color, setColor] = useState('#F87171');
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPos = useRef(null);
    const [isOpponentReady, setIsOpponentReady] = useState(false);

    // Setup Canvas & Realtime
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Resize canvas to parent
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight; // parent should have explicit height

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;

        // Resize Listener
        const handleResize = () => {
            // Save content? For now simple resize clears or we need backing store.
            // Keep simple: Resize might clear (users typically don't resize mobile often)
        };
        window.addEventListener('resize', handleResize);

        // Supabase Channel
        const channel = supabase.channel('love_board')
            .on('broadcast', { event: 'draw' }, ({ payload }) => {
                if (payload.userId !== currentUser.id) {
                    drawFromBroadcast(payload);
                }
            })
            .on('broadcast', { event: 'clear' }, () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            })
            .subscribe();

        return () => {
            window.removeEventListener('resize', handleResize);
            supabase.removeChannel(channel);
        };
    }, []);

    const drawFromBroadcast = ({ x0, y0, x1, y1, color }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.moveTo(x0 * canvas.width, y0 * canvas.height); // Normalize coords
        ctx.lineTo(x1 * canvas.width, y1 * canvas.height);
        ctx.stroke();
        ctx.closePath();
    };

    const getCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if (e.changedTouches) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) / canvas.width, // Normalized 0-1
            y: (clientY - rect.top) / canvas.height
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const { x, y } = getCoords(e);
        lastPos.current = { x, y };
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault(); // Prevent scrolling on touch

        const { x, y } = getCoords(e);
        const prev = lastPos.current;

        // Draw locally
        drawFromBroadcast({ x0: prev.x, y0: prev.y, x1: x, y1: y, color });

        // Broadcast (throttle this in production, but raw might be fine for LAN/fast net)
        supabase.channel('love_board').send({
            type: 'broadcast',
            event: 'draw',
            payload: {
                userId: currentUser.id,
                x0: prev.x, y0: prev.y,
                x1: x, y1: y,
                color
            }
        });

        lastPos.current = { x, y };
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPos.current = null;
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        supabase.channel('love_board').send({
            type: 'broadcast',
            event: 'clear',
            payload: {}
        });
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.download = `love_drawing_${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL();
        link.click();
    };

    return (
        <div className="flex flex-col h-full bg-[#111] relative">
            <LobbyOverlay gameId="draw" onReady={() => setIsOpponentReady(true)} />

            <div className={`flex-1 w-full h-full relative transition-all duration-500 ${!isOpponentReady ? 'blur-sm grayscale opacity-50 pointer-events-none' : ''}`}>
                {/* Toolbar */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#222]/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3 border border-white/10 shadow-xl z-10">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                    <div className="w-px h-6 bg-white/20 mx-1" />
                    <button onClick={handleClear} className="text-gray-400 hover:text-red-500 transition">
                        <Trash2 size={20} />
                    </button>
                    <button onClick={handleDownload} className="text-gray-400 hover:text-gold transition">
                        <Download size={20} />
                    </button>
                </div>

                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="flex-1 w-full h-full touch-none cursor-crosshair"
                />

                <p className="absolute bottom-4 w-full text-center text-gray-600 text-[10px] pointer-events-none">
                    ارسموا سوا في نفس الوقت ❤️
                </p>
            </div>
        </div>
    );
};

export default LoveBoard;
