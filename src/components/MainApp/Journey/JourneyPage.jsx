import React, { useState } from 'react';
import MemoriesGallery from '../Gallery/MemoriesGallery';
import BucketList from './BucketList';

const JourneyPage = () => {
    const [view, setView] = useState('timeline'); // 'timeline' or 'bucketlist'

    return (
        <div className="flex flex-col h-full pt-8 pb-0">
            {/* Header Toggle */}
            <div className="px-4 mb-8">
                <div className="bg-black/40 p-1.5 rounded-full flex relative overflow-hidden backdrop-blur-xl border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] max-w-lg mx-auto">
                    {/* Active Background Animation */}
                    <div
                        className={`absolute inset-y-1.5 w-[calc(50%-6px)] rounded-full bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728] shadow-[0_0_10px_rgba(255,215,0,0.3)] transition-all duration-500 ease-out`}
                        style={{
                            left: view === 'bucketlist' ? '6px' : 'calc(50%)',
                        }}
                    />

                    <button
                        onClick={() => setView('timeline')}
                        className={`flex-1 py-3 text-center rounded-full relative z-10 font-bold font-cairo text-sm md:text-lg transition-all duration-300 flex items-center justify-center gap-2 ${view === 'timeline' ? 'text-black scale-105' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <span>📸</span>
                        <span>متحف الذكريات</span>
                    </button>

                    <button
                        onClick={() => setView('bucketlist')}
                        className={`flex-1 py-3 text-center rounded-full relative z-10 font-bold font-cairo text-sm md:text-lg transition-all duration-300 flex items-center justify-center gap-2 ${view === 'bucketlist' ? 'text-black scale-105' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <span>✨</span>
                        <span>أمنياتنا</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {view === 'timeline' ? <MemoriesGallery /> : <BucketList />}
            </div>
        </div>
    );
};

export default JourneyPage;
