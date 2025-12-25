import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, BookOpen, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

const GuidePage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState(['الكل']);

    const [activeCategory, setActiveCategory] = useState('الكل');

    // Lightbox State
    const [selectedStep, setSelectedStep] = useState(null);

    useEffect(() => {
        const fetchGuideItems = async () => {
            try {
                const { data, error } = await supabase
                    .from('site_guide')
                    .select('*')
                    .order('display_order', { ascending: true });

                if (error) throw error;

                // Process data to parse steps
                const processedData = data?.map(item => {
                    let steps = [];
                    try {
                        if (item.image_url?.startsWith('[')) {
                            steps = JSON.parse(item.image_url);
                        } else {
                            steps = [{ url: item.image_url, caption: item.description }];
                        }
                    } catch (e) {
                        steps = [{ url: item.image_url, caption: item.description }];
                    }
                    return { ...item, steps };
                }) || [];

                setItems(processedData);

                // Extract unique categories
                const cats = ['الكل', ...new Set(processedData.map(i => i.category || 'عام'))];
                setCategories(cats);

            } catch (error) {
                console.error('Error fetching guide:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGuideItems();
    }, []);

    // Filter Logic (Derived State)
    const filteredItems = React.useMemo(() => {
        if (activeCategory === 'الكل') {
            return items;
        }
        return items.filter(item => (item.category || 'عام') === activeCategory);
    }, [activeCategory, items]);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32 px-4 pt-4 sm:pt-16 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-gold/10 border border-gold/30 mb-4 shadow-[0_0_30px_rgba(197,160,89,0.1)]">
                    <BookOpen size={24} className="text-gold md:w-8 md:h-8" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white font-cairo mb-2">شرح الموقع</h1>
                <p className="text-gray-400 font-cairo text-xs md:text-sm">دليلك الكامل لكل ركن في عالمنا الصغير ❤️</p>
            </motion.div>

            {/* --- CATEGORY TABS --- */}
            <div className="mb-8 overflow-x-auto pb-4 custom-scrollbar flex items-center gap-2 px-2 no-scrollbar md:justify-center">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex-shrink-0 px-5 py-2 rounded-full font-cairo text-sm transition-all duration-300 border ${activeCategory === cat
                            ? 'bg-gold text-black font-bold border-gold shadow-[0_0_15px_rgba(197,160,89,0.3)] scale-105'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Content List */}
            <motion.div
                key={activeCategory} // Force re-render animation on tab change
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8 md:space-y-12"
            >
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                        <GuideItemCard
                            key={item.id}
                            item={item}
                            activeCategory={activeCategory}
                            variants={itemVariants}
                            onExpand={(step) => setSelectedStep(step)}
                        />
                    ))
                ) : (
                    <motion.div variants={itemVariants} className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <p className="text-gray-500 font-cairo">لا يوجد محتوى في هذا القسم حالياً... ⏳</p>
                    </motion.div>
                )}
            </motion.div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedStep && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedStep(null)}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedStep.url}
                                alt="Expanded"
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                            />

                            {/* Caption Overlay */}
                            <div className="absolute bottom-4 left-0 right-0 p-4 mx-auto w-fit max-w-[90%] bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 text-center pointer-events-none">
                                <p className="text-white font-cairo text-base md:text-xl font-bold leading-relaxed" dir="rtl">
                                    {selectedStep.caption}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Sub-component for individual cards to handle Slider state independently
const GuideItemCard = ({ item, activeCategory, variants, onExpand }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = item.steps || [];
    const hasMultipleSteps = steps.length > 1;

    // Handle string image_url that isn't JSON (Legacy check inside parse, but double check here if needed)
    // Actually we parsed it in parent.

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentStep((prev) => (prev + 1) % steps.length);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
    };

    return (
        <motion.div
            variants={variants}
            className="bg-[#121212] rounded-2xl md:rounded-3xl overflow-hidden border border-white/5 shadow-xl group hover:border-gold/20 transition-all font-cairo"
        >
            {/* Category Badge */}
            {activeCategory === 'الكل' && (
                <div className="px-6 pt-4 pb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-gold bg-gold/10 px-2 py-1 rounded-md border border-gold/10">
                        <Layers size={12} />
                        {item.category || 'عام'}
                    </span>
                </div>
            )}

            {/* Header / Title */}
            <div className={`px-5 md:px-8 pb-4 ${activeCategory !== 'الكل' ? 'pt-6' : ''}`}>
                <h3 className="text-white text-lg md:text-xl font-bold mb-1 text-right" dir="rtl">
                    {item.description.length < 50 ? item.description : 'شرح توضيحي'} {/* Use description as title if short-ish, else generic */}
                </h3>
            </div>

            {/* Image Section (Slider) */}
            <div
                className="relative w-full aspect-video sm:aspect-[16/9] bg-black/50 overflow-hidden group/slider cursor-zoom-in"
                onClick={() => onExpand({ url: steps[currentStep]?.url, caption: steps[currentStep]?.caption || item.description })}
            >
                <AnimatePresence mode='wait'>
                    <motion.img
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        src={steps[currentStep]?.url}
                        alt={`Step ${currentStep + 1}`}
                        className="w-full h-full object-contain bg-[#050505]"
                    />
                </AnimatePresence>

                {/* Navigation Buttons for Slider */}
                {hasMultipleSteps && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-gold hover:text-black transition-all opacity-0 group-hover/slider:opacity-100"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-gold hover:text-black transition-all opacity-0 group-hover/slider:opacity-100"
                        >
                            <ChevronRight size={20} />
                        </button>

                        {/* Dots Indicator */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${currentStep === idx ? 'bg-gold w-3' : 'bg-white/30'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Caption Section for Current Step */}
            <div className="p-5 md:p-8 bg-[#1a1a1a]">
                <div className="flex justify-between items-start mb-2">
                    {hasMultipleSteps && (
                        <span className="text-[10px] text-gray-500 bg-black/30 px-2 py-0.5 rounded-full">
                            خطوة {currentStep + 1} من {steps.length}
                        </span>
                    )}
                </div>
                <p className="text-gray-200 text-base md:text-xl font-bold leading-loose whitespace-pre-wrap text-right min-h-[60px]" dir="rtl">
                    {steps[currentStep]?.caption || item.description} {/* Fallback to main desc if caption missing */}
                </p>
            </div>
        </motion.div>
    );
};

export default GuidePage;
