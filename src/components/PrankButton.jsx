import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const PrankButton = ({ onClick }) => {
    const [btnFixed, setBtnFixed] = useState(false);
    const [btnCoords, setBtnCoords] = useState({ x: 0, y: 0 });
    const btnRef = useRef(null);

    const moveButton = () => {
        if (!btnRef.current) return;
        const btnRect = btnRef.current.getBoundingClientRect();
        const btnW = btnRect.width;
        const btnH = btnRect.height;
        const padding = 20;

        const minX = padding;
        const maxX = window.innerWidth - btnW - padding;
        const minY = padding;
        const maxY = window.innerHeight - btnH - padding;

        const safeMaxX = Math.max(minX, maxX);
        const safeMaxY = Math.max(minY, maxY);

        const randomX = Math.random() * (safeMaxX - minX) + minX;
        const randomY = Math.random() * (safeMaxY - minY) + minY;

        setBtnFixed(true);
        setBtnCoords({ x: randomX, y: randomY });
    };

    return (
        <motion.button
            ref={btnRef}
            style={
                btnFixed
                    ? { position: 'fixed', left: 0, top: 0, zIndex: 9999 }
                    : { position: 'absolute', bottom: '15%', zIndex: 50 }
            }
            animate={
                btnFixed
                    ? { x: btnCoords.x, y: btnCoords.y }
                    : { y: 0 }
            }
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onMouseEnter={moveButton}
            onClick={moveButton} // It still runs away on click!
            className="px-10 py-3 md:px-14 md:py-5 bg-gradient-to-r from-[#800020] to-[#4a0412] text-[#D4AF37] font-bold rounded-full border border-[#D4AF37]/40 shadow-[0_0_30px_rgba(128,0,32,0.6)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] text-lg md:text-2xl cursor-pointer whitespace-nowrap font-cairo select-none tracking-widest uppercase"
        >
            افتحي الهدية
        </motion.button>
    );
};

export default PrankButton;
