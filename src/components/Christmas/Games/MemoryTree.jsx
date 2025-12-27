import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAssetPath } from '../../../utils/assets';
import { X, Sparkles, Check, Trash2, Maximize2, History, RotateCcw } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../context/AuthContext';
import SantaFlyover from '../SantaFlyover';

const MemoryTree = ({ onExit }) => {
    const [photos, setPhotos] = useState([]);
    const [decorations, setDecorations] = useState([]);
    const [history, setHistory] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    const [activeTab, setActiveTab] = useState('photos');
    const [confirmData, setConfirmData] = useState(null); // { item: ... }
    const treeRef = useRef(null);
    const { userRole } = useAuth(); // 'admin' (Hassanen) or 'user' (Nada)

    // Storage Key based on role
    const HISTORY_KEY = `tree_history_${userRole || 'guest'}`;

    // Default Decorations
    const [memories, setMemories] = useState([
        { id: 'def1', url: getAssetPath('/images/santa_flying1.gif'), type: 'image' },
        { id: 'def2', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23ef4444" stroke="%23b91c1c" stroke-width="5"/><circle cx="35" cy="35" r="10" fill="white" opacity="0.3"/></svg>', type: 'svg' }, // Red Ball
        { id: 'def3', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23eab308" stroke="%23a16207" stroke-width="5"/><circle cx="35" cy="35" r="10" fill="white" opacity="0.3"/></svg>', type: 'svg' }, // Gold Ball
        { id: 'def4', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%233b82f6" stroke="%231d4ed8" stroke-width="5"/><circle cx="35" cy="35" r="10" fill="white" opacity="0.3"/></svg>', type: 'svg' }, // Blue Ball
        { id: 'def5', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 20,95 95,35 5,35 80,95" fill="%23fbbf24" stroke="%23f59e0b" stroke-width="5" stroke-linejoin="round"/></svg>', type: 'svg' }, // Star
    ]);

    // Local Timeline Photos
    const localPhotos = Array.from({ length: 18 }, (_, i) => ({
        id: `local-${i + 1}`,
        url: `/images/timeline/${i + 1}.jpg`,
        type: 'photo'
    }));

    // Load Data
    useEffect(() => {
        // Load Photos
        const fetchPhotos = async () => {
            const { data } = await supabase.from('memories').select('*').limit(20);
            const allItems = [...defaultDecorations, ...localPhotos];
            if (data && data.length > 0) {
                setPhotos([...allItems, ...data]);
            } else {
                setPhotos(allItems);
            }
        };
        fetchPhotos();

        // Load History (User Specific)
        const savedHistory = localStorage.getItem(HISTORY_KEY);
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                setHistory(parsed);
            } catch (e) { console.error("History parse error", e); }
        }
    }, [HISTORY_KEY]);

    const saveToHistory = () => {
        if (decorations.length === 0) return;

        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleDateString('ar-EG'),
            decorations: decorations
        };

        // Add new entry, keep only last 5
        const updatedHistory = [newEntry, ...history].slice(0, 5);

        setHistory(updatedHistory);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    };

    const loadHistoryItem = (item) => {
        // Trigger Custom Modal instead of window.confirm
        setConfirmData({ item });
    };

    const confirmLoadHistory = () => {
        if (confirmData) {
            setDecorations(confirmData.item.decorations);
            setIsFinished(false);
            setConfirmData(null);
        }
    };

    const addDecoration = (photo) => {
        const newDeco = {
            id: Date.now(),
            url: photo.url,
            // Start near center
            x: 50,
            y: 50,
            scale: 1,
            rotation: 0,
            type: photo.type || 'photo'
        };
        setDecorations([...decorations, newDeco]);
    };

    // --- Interaction Logic ---
    const handleDragStart = (e, id) => {
        e.stopPropagation();
        if (isFinished) return;

        const deco = decorations.find(d => d.id === id);
        if (!deco) return;

        const startX = e.touches ? e.touches[0].clientX : e.clientX;
        const startY = e.touches ? e.touches[0].clientY : e.clientY;

        // Use percentages for responsiveness
        const treeRect = treeRef.current.getBoundingClientRect();
        const startLeft = deco.x;
        const startTop = deco.y;

        const moveHandler = (moveEvent) => {
            const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            const percentX = (deltaX / treeRect.width) * 100;
            const percentY = (deltaY / treeRect.height) * 100;

            setDecorations(prev => prev.map(d =>
                d.id === id ? { ...d, x: startLeft + percentX, y: startTop + percentY } : d
            ));
        };

        const upHandler = () => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
            window.removeEventListener('touchmove', moveHandler);
            window.removeEventListener('touchend', upHandler);
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
        window.addEventListener('touchmove', moveHandler);
        window.addEventListener('touchend', upHandler);
    };

    const handleDelete = (id) => {
        if (isFinished) return;
        setDecorations(prev => prev.filter(d => d.id !== id));
    };

    const handleWheel = (e, id) => {
        if (isFinished) return;
        // Adjust scale
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setDecorations(prev => prev.map(d => {
            if (d.id === id) {
                const newScale = Math.max(0.4, Math.min(d.scale + delta, 2.5)); // Limit scale
                return { ...d, scale: newScale };
            }
            return d;
        }));
    };

    const handleFinish = () => {
        saveToHistory();
        setIsFinished(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] overflow-hidden flex flex-col md:flex-row font-cairo"
            style={{
                background: 'radial-gradient(circle at 50% 100%, #1a2e1a 0%, #050a05 100%)'
            }}
        >
            <SantaFlyover zIndex="z-[200]" />
            {/* Sidebar (Responsive: Compact on mobile) */}
            <div className={`bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col w-full md:w-64 z-20 shrink-0 ${isFinished ? 'hidden' : ''} transition-all duration-300`}>

                {/* Sidebar Header/Tabs */}
                <div className="flex items-center gap-2 p-3 md:p-4 border-b border-white/10">
                    <button onClick={onExit} className="p-1.5 md:p-2 bg-white/10 rounded-full hover:bg-white/20 text-white shrink-0">
                        <X size={16} />
                    </button>
                    <div className="flex-1 flex gap-2 bg-black/30 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('photos')}
                            className={`flex-1 text-[10px] md:text-xs py-1.5 rounded-md transition ${activeTab === 'photos' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            الزينة 🎄
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 text-[10px] md:text-xs py-1.5 rounded-md transition ${activeTab === 'history' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            سجل ({userRole === 'admin' ? 'حسانين' : 'ندى'}) 🕒
                        </button>
                    </div>
                </div>

                {/* Content Area (Horizontal scroll on mobile, vertical on desktop) */}
                <div className="flex-1 overflow-x-auto md:overflow-y-auto p-3 md:p-4 custom-scrollbar max-h-[120px] md:max-h-none min-h-[90px]">
                    {/* Photos Tab */}
                    {activeTab === 'photos' && (
                        <div className="flex flex-row md:flex-col gap-3 md:gap-4 items-center md:items-stretch">
                            {photos.map((photo, i) => (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => addDecoration(photo)}
                                    className="relative w-14 h-14 md:w-full md:h-24 rounded-lg overflow-hidden border border-white/10 hover:border-gold shrink-0 group touch-manipulation"
                                >
                                    <img src={photo.url} className="w-full h-full object-cover" loading="lazy" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <Sparkles className="text-gold" size={16} />
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="flex flex-row md:flex-col gap-3 md:gap-4">
                            {history.length === 0 && <p className="text-white/30 text-center text-[10px] md:text-sm w-full py-2">لا يوجد تصاميم محفوظة</p>}
                            {history.map((item, i) => (
                                <div key={item.id} className="w-32 md:w-full bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col gap-1 shrink-0">
                                    <div className="flex justify-between items-center text-white/50 text-[9px] md:text-xs">
                                        <span>{item.date}</span>
                                        <span>#{i + 1}</span>
                                    </div>
                                    <div className="flex gap-1 overflow-hidden h-6 md:h-8">
                                        {item.decorations.slice(0, 4).map((d, idx) => (
                                            <div key={idx} className="w-4 h-4 md:w-6 md:h-6 rounded-full overflow-hidden border border-white/10">
                                                <img src={d.url} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => loadHistoryItem(item)}
                                        className="w-full py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] text-green-400 flex items-center justify-center gap-1 transition"
                                    >
                                        <RotateCcw size={10} /> استعادة
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden perspective-1000 bg-black/20" ref={treeRef}>

                {/* Gameplay Instructions (Compact & Responsive) */}
                {!isFinished && (
                    <div className="absolute top-2 right-2 md:top-6 md:inset-x-0 mx-auto z-40 md:flex md:justify-center pointer-events-none">
                        <div className="bg-black/40 md:bg-black/60 backdrop-blur-md text-white px-3 py-1.5 md:px-6 md:py-2 rounded-xl md:rounded-full border border-white/10 text-center shadow-xl flex flex-col items-center gap-0.5 md:gap-1 animate-fade-in-down">
                            <p className="text-xs md:text-base font-bold text-gold flex items-center gap-1">
                                <Sparkles size={12} className="md:w-3.5 md:h-3.5" /> طريقة اللعب
                            </p>
                            <div className="hidden md:flex flex-wrap justify-center gap-3 text-sm text-gray-200" dir="rtl">
                                <span className="flex items-center gap-1">👆 اضغط للإضافة</span>
                                <span>|</span>
                                <span className="flex items-center gap-1">✋ اسحب للتحريك</span>
                                <span>|</span>
                                <span className="flex items-center gap-1">✌️ ضغطتين للحذف</span>
                            </div>
                            {/* Mobile Simplified Text */}
                            <div className="md:hidden text-[9px] text-gray-300 leading-tight">
                                اضغط للإضافة • اسحب • ضغطتين للحذف
                            </div>
                        </div>
                    </div>
                )}

                {/* Floor */}
                <div className="absolute bottom-0 w-[200%] h-24 md:h-32 bg-gradient-to-t from-white/5 to-transparent blur-2xl rounded-t-[100%]" />

                {/* Tree - Optimized Sizing for Mobile (Priority Width) vs Desktop (Priority Height) */}
                <svg viewBox="0 0 100 100" className="w-[85%] h-auto md:w-auto md:h-[85%] max-h-[75vh] drop-shadow-2xl filter brightness-90 relative z-10 transition-all duration-500">
                    <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    <rect x="45" y="85" width="10" height="15" fill="#3E2723" />
                    <path d="M20,85 L80,85 L50,45 Z" fill="#1B5E20" />
                    <path d="M25,65 L75,65 L50,30 Z" fill="#2E7D32" />
                    <path d="M30,45 L70,45 L50,15 Z" fill="#4CAF50" />
                </svg>

                {/* Decorations */}
                {decorations.map(deco => (
                    <motion.div
                        key={deco.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: deco.scale }}
                        style={{
                            position: 'absolute',
                            left: `${deco.x}%`,
                            top: `${deco.y}%`,
                            transform: `translate(-50%, -50%) rotate(${deco.rotation}deg)`,
                            zIndex: 20
                        }}
                        onMouseDown={(e) => handleDragStart(e, deco.id)}
                        onTouchStart={(e) => handleDragStart(e, deco.id)}
                        onDoubleClick={() => handleDelete(deco.id)}
                        onWheel={(e) => handleWheel(e, deco.id)}
                        className={`absolute touch-none cursor-grab active:cursor-grabbing group ${isFinished ? 'cursor-default' : ''}`}
                    >
                        {/* String Hanger (Visual Only) */}
                        <div className="absolute -top-4 left-1/2 w-[1px] h-4 bg-white/50 -translate-x-1/2 pointer-events-none" />

                        {/* Ornament Container: Circle if photo */}
                        <div className={`relative overflow-hidden shadow-xl
                            ${deco.type === 'photo'
                                ? 'rounded-full border-2 border-gold/70 w-16 h-16 bg-white'
                                : 'w-16 h-16'}
                        `}>
                            <img
                                src={deco.url}
                                className={`w-full h-full pointer-events-none ${deco.type === 'photo' ? 'object-cover scale-110' : 'object-contain'}`}
                                alt="decoration"
                            />
                        </div>

                        {/* Helper Tooltip (Only visible on hover/focus and not finished) */}
                        {!isFinished && (deco.type === 'photo') && (
                            <div className="hidden md:block absolute -top-10 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                ضغطتين للحذف • العجلة للتكبير
                            </div>
                        )}
                    </motion.div>
                ))}

                {/* Lights Overlay */}
                {isFinished && (
                    <div className="absolute inset-0 pointer-events-none z-30">
                        {/* Garland Strings */}
                        {[...Array(50)].map((_, i) => (
                            <motion.div
                                key={`light-${i}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: [0, 1, 0.5, 1], scale: 1 }}
                                transition={{ delay: i * 0.05, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                                className="absolute w-2 h-2 rounded-full blur-[1px]"
                                style={{
                                    left: `${30 + Math.random() * 40}%`,
                                    top: `${20 + Math.random() * 60}%`,
                                    backgroundColor: ['#ff0000', '#ffd700', '#00ff00', '#00ffff'][Math.floor(Math.random() * 4)],
                                    boxShadow: '0 0 8px currentColor'
                                }}
                            />
                        ))}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1.5, opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute top-[18%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-yellow-400/30 blur-3xl rounded-full"
                        />
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            {!isFinished ? (
                <div className="absolute bottom-6 w-full flex justify-center z-30 pointer-events-none">
                    <button
                        onClick={handleFinish}
                        className="pointer-events-auto px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-full font-bold text-white shadow-2xl flex items-center gap-3 text-lg border-2 border-white/20 transform hover:-translate-y-1 transition-all"
                    >
                        <Check size={24} />
                        <span>إنهاء وتنوير الشجرة! 🎄</span>
                    </button>
                </div>
            ) : (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-10 left-0 w-full flex flex-col items-center justify-center z-40 gap-4"
                >
                    <div className="bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-gold/30 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                        <h2 className="text-2xl font-bold text-gold mb-1">شجرة ذكرياتنا السعيدة 🌟</h2>
                        <p className="text-white/80 font-cairo">كل سنة وأنتِ أجمل حاجة في حياتي ❤️</p>
                    </div>

                    <button onClick={onExit} className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition">
                        العودة للرئيسية
                    </button>
                </motion.div>
            )}

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmData && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a2e1a] border border-gold/30 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
                        >
                            {/* Background Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent pointer-events-none" />

                            <h3 className="text-xl font-bold text-white mb-2">استبدال الشجرة؟ 🎄</h3>
                            <p className="text-gray-300 mb-6 font-cairo text-sm">
                                هل أنت متأكد أنك تريد استبدال تصميمك الحالي بهذا التصميم المحفوظ؟
                                <br />
                                (سيتم فقدان التغييرات غير المحفوظة)
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setConfirmData(null)}
                                    className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition flex-1"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={confirmLoadHistory}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:shadow-lg hover:scale-105 transition flex-1"
                                >
                                    نعم، استبدل
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MemoryTree;
