import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';
import { Image, Trash2, Edit2, Check, X, Plus, GripVertical, Tag, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GuideManager = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [newCategory, setNewCategory] = useState('عام');
    const [customCategory, setCustomCategory] = useState('');

    // Multi-Step State
    // Each step: { id, imageFile, imageUrl, caption, previewUrl }
    const [steps, setSteps] = useState([{ id: Date.now(), imageFile: null, imageUrl: null, caption: '', previewUrl: null }]);

    // Edit State
    const [editingId, setEditingId] = useState(null);

    // Delete Confirmation State
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState(null);

    // Category Management
    const [categories, setCategories] = useState(['عام']);
    const [editingCategory, setEditingCategory] = useState(null);
    const [renamedCategory, setRenamedCategory] = useState('');

    useEffect(() => {
        fetchGuideItems();
    }, []);

    const fetchGuideItems = async () => {
        try {
            console.log("Fetching guide items...");
            const { data, error } = await supabase
                .from('site_guide')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setItems(data || []);

            // Extract unique categories from data
            const usedCategories = [...new Set(data?.map(i => i.category || 'عام'))];
            setCategories(prev => [...new Set([...prev, ...usedCategories])]);
            console.log("Guide items fetched:", data);

        } catch (error) {
            console.error('Error fetching guide:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStep = () => {
        setSteps([...steps, { id: Date.now(), imageFile: null, imageUrl: null, caption: '', previewUrl: null }]);
    };

    const handleRemoveStep = (id) => {
        if (steps.length === 1) return;
        setSteps(steps.filter(s => s.id !== id));
    };

    const handleStepCaptionChange = (id, caption) => {
        setSteps(steps.map(s => s.id === id ? { ...s, caption } : s));
    };

    const handleStepImageChange = (id, e) => {
        const file = e.target.files[0];
        if (file) {
            setSteps(steps.map(s => s.id === id ? {
                ...s,
                imageFile: file,
                previewUrl: URL.createObjectURL(file), // Show new file preview
                imageUrl: null // Clear old URL if replacing image
            } : s));
        }
    };

    const handleAddCategory = () => {
        console.log("Attempting to add category:", customCategory);
        if (!customCategory.trim()) return;
        const newCat = customCategory.trim();

        if (!categories.includes(newCat)) {
            setCategories(prev => [...prev, newCat]);
        }
        setNewCategory(newCat);
        setCustomCategory('');
        alert(`تم اختيار القسم "${newCat}" بنجاح!`);
    };

    const handleDeleteCategory = async (categoryToDelete) => {
        console.log("Deleting category:", categoryToDelete);
        try {
            const { error } = await supabase.from('site_guide').delete().eq('category', categoryToDelete);
            if (error) throw error;

            setCategories(categories.filter(c => c !== categoryToDelete));
            setItems(items.filter(i => i.category !== categoryToDelete));
            if (newCategory === categoryToDelete) setNewCategory('عام');
            setDeleteCategoryConfirm(null);
            console.log("Category deleted successfully");

        } catch (error) {
            console.error('Error deleting category:', error);
            alert('حدث خطأ أثناء حذف القسم');
        }
    };

    const handleRenameCategory = async (oldName) => {
        console.log("Renaming category from", oldName, "to", renamedCategory);
        if (!renamedCategory.trim() || renamedCategory === oldName) {
            setEditingCategory(null);
            return;
        }

        try {
            const { error } = await supabase.from('site_guide').update({ category: renamedCategory.trim() }).eq('category', oldName);
            if (error) throw error;

            setCategories(categories.map(c => c === oldName ? renamedCategory.trim() : c));
            setItems(items.map(i => i.category === oldName ? { ...i, category: renamedCategory.trim() } : i));
            if (newCategory === oldName) setNewCategory(renamedCategory.trim());
            setEditingCategory(null);
            console.log("Category renamed successfully");

        } catch (error) {
            console.error('Error renaming category:', error);
            alert('حدث خطأ أثناء تعديل اسم القسم');
        }
    };

    const resetForm = () => {
        setTitle('');
        setSteps([{ id: Date.now(), imageFile: null, imageUrl: null, caption: '', previewUrl: null }]);
        setCustomCategory('');
        setEditingId(null);
        setNewCategory('عام');
    };

    const handleSubmit = async () => {
        console.log(editingId ? "Updating item..." : "Adding new item...");
        if (!title.trim() && steps.every(s => !s.imageFile && !s.caption && !s.imageUrl)) return;

        try {
            setUploading(true);

            // Upload images for steps that have new files
            const processedSteps = await Promise.all(steps.map(async (step) => {
                let finalUrl = step.imageUrl; // Keep existing URL by default

                if (step.imageFile) {
                    console.log(`Uploading new image for step...`);
                    const uploadResult = await uploadToCloudinary(step.imageFile);
                    finalUrl = uploadResult.url;
                }

                return {
                    url: finalUrl, // Can be null if no image at all
                    caption: step.caption
                };
            }));

            // Filter out truly empty steps (no url AND no caption)
            const validSteps = processedSteps.filter(s => s.url || s.caption);
            const jsonSteps = JSON.stringify(validSteps);

            const finalCategory = customCategory.trim() ? customCategory.trim() : newCategory;
            if (finalCategory && !categories.includes(finalCategory)) {
                setCategories([...categories, finalCategory]);
            }

            if (editingId) {
                // Update Existing
                const { error } = await supabase
                    .from('site_guide')
                    .update({
                        image_url: jsonSteps,
                        description: title,
                        category: finalCategory
                    })
                    .eq('id', editingId);

                if (error) throw error;
                console.log("Item updated successfully");
            } else {
                // Insert New
                const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.display_order || 0)) : 0;
                const { error } = await supabase.from('site_guide').insert([{
                    image_url: jsonSteps,
                    description: title,
                    display_order: maxOrder + 1,
                    category: finalCategory
                }]);

                if (error) throw error;
                console.log("Item added successfully");
            }

            resetForm();
            fetchGuideItems();

        } catch (error) {
            console.error('Error saving item:', error);
            alert('فشل الحفظ: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        console.log("Deleting item:", id);
        try {
            const { error } = await supabase.from('site_guide').delete().eq('id', id);
            if (error) throw error;
            setItems(items.filter(i => i.id !== id));
            setDeleteConfirmId(null);
            // If deleting the item currently being edited, reset form
            if (editingId === id) resetForm();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('فشل الحذف');
        }
    };

    // Helper to parse existing item data for Edit or Display
    const parseGuideData = (item) => {
        let guideSteps = [];
        try {
            // Try parsing as JSON first
            if (item.image_url?.startsWith('[')) {
                guideSteps = JSON.parse(item.image_url);
            } else {
                // Fallback for legacy single image
                guideSteps = [{ url: item.image_url, caption: item.description }]; // Legacy: description was caption kind of
            }
        } catch (e) {
            guideSteps = [{ url: item.image_url, caption: item.description }];
        }
        return guideSteps;
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setTitle(item.description); // Main Title
        setNewCategory(item.category || 'عام');

        const existingSteps = parseGuideData(item);
        const mappedSteps = existingSteps.map((s, index) => ({
            id: Date.now() + index, // Generate temporary unique IDs
            imageFile: null,
            imageUrl: s.url,
            caption: s.caption || '',
            previewUrl: s.url // Use existing URL as preview
        }));

        setSteps(mappedSteps.length > 0 ? mappedSteps : [{ id: Date.now(), imageFile: null, imageUrl: null, caption: '', previewUrl: null }]);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="p-6 text-white bg-black/50 min-h-screen font-cairo">
            <h2 className="text-3xl font-bold mb-8 text-gold flex items-center gap-3">
                <Image className="text-gold" />
                <span>إدارة شرح الموقع</span>
            </h2>

            {/* --- FORM (ADD or EDIT) --- */}
            <div className={`bg-[#1a1a1a] p-6 rounded-2xl border border-white/10 mb-10 shadow-xl transition-all duration-300 ${editingId ? 'border-gold/50 shadow-gold/10' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-300">
                        {editingId ? 'تعديل الشرح الحالي' : 'إضافة شرح جديد'}
                    </h3>
                    {editingId && (
                        <button onClick={resetForm} className="text-sm text-red-400 hover:text-red-300 bg-red-900/20 px-3 py-1 rounded-full cursor-pointer">
                            إلغاء التعديل
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-6">
                    {/* 1. Category Selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400">القسم:</label>
                        <div className="flex flex-wrap gap-2 items-center">
                            {categories.map(cat => (
                                <div key={cat} className={`group relative px-4 py-2 rounded-full text-sm border transition-all flex items-center gap-2 ${newCategory === cat && !customCategory ? 'bg-gold text-black border-gold font-bold' : 'bg-black/30 text-gray-400 border-white/10 hover:border-gold/30'}`}>
                                    {editingCategory === cat ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={renamedCategory}
                                                onChange={(e) => setRenamedCategory(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRenameCategory(cat);
                                                    if (e.key === 'Escape') setEditingCategory(null);
                                                }}
                                                className="bg-black/50 text-white w-20 px-1 rounded outline-none"
                                            />
                                            <button onClick={() => handleRenameCategory(cat)} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                                            <button onClick={() => setEditingCategory(null)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <button onClick={() => { setNewCategory(cat); setCustomCategory(''); }} className="cursor-pointer">{cat}</button>

                                            {/* Category Actions */}
                                            {cat !== 'عام' && !editingCategory && (
                                                <div className="flex gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setRenamedCategory(cat); }} className="text-blue-400 hover:text-blue-300 p-0.5"><Edit2 size={12} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); setDeleteCategoryConfirm(cat); }} className="text-red-400 hover:text-red-300 p-0.5"><Trash2 size={12} /></button>

                                                    {/* Confirm Delete Category */}
                                                    {deleteCategoryConfirm === cat && (
                                                        <div className="absolute top-full left-0 mt-2 bg-red-900/90 text-white p-2 rounded shadow-lg z-50 flex flex-col gap-2 min-w-[150px]">
                                                            <span className="text-xs">حذف القسم؟</span>
                                                            <div className="flex justify-between">
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }} className="bg-red-500 px-2 py-1 rounded text-xs">نعم</button>
                                                                <button onClick={(e) => { e.stopPropagation(); setDeleteCategoryConfirm(null); }} className="bg-gray-700 px-2 py-1 rounded text-xs">لا</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                            <div className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="+ قسم جديد"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                    className={`px-4 py-2 rounded-full text-sm bg-black/30 border focus:outline-none focus:border-gold w-32 ${customCategory ? 'border-gold text-gold' : 'border-white/10 text-gray-400'}`}
                                />
                                {customCategory && (
                                    <button onClick={handleAddCategory} className="p-2 bg-gold text-black rounded-full"><Check size={14} /></button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. Main Title */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400">عنوان الشرح:</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="مثلاً: طريقة إضافة منشور جديد..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-gold/50 outline-none font-bold"
                        />
                    </div>

                    {/* 3. Steps (Images + Captions) */}
                    <div className="space-y-4">
                        <label className="text-sm text-gray-400 block">الخطوات (الصور والشرح):</label>

                        {steps.map((step, index) => (
                            <div key={step.id} className="flex gap-4 p-4 bg-black/20 rounded-xl border border-white/10 relative group">
                                <span className="absolute top-2 right-2 text-xs font-mono text-gray-600">#{index + 1}</span>

                                {/* Image Input */}
                                <label className="cursor-pointer relative flex-shrink-0 w-32 h-32 block">
                                    <input type="file" onChange={(e) => handleStepImageChange(step.id, e)} accept="image/*" className="hidden" />
                                    <div className="w-full h-full bg-black/40 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden hover:border-gold/50 transition-colors">
                                        {step.previewUrl ? (
                                            <img src={step.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <Plus className="mx-auto text-gray-500 mb-1" size={20} />
                                                <span className="text-[10px] text-gray-500">صورة</span>
                                            </div>
                                        )}
                                    </div>
                                </label>

                                {/* Caption Input */}
                                <div className="flex-1">
                                    <textarea
                                        value={step.caption}
                                        onChange={(e) => handleStepCaptionChange(step.id, e.target.value)}
                                        placeholder={`شرح الخطوة رقم ${index + 1}...`}
                                        className="w-full h-32 bg-transparent border-none resize-none outline-none text-sm leading-relaxed"
                                    />
                                </div>

                                {/* Remove Step */}
                                {steps.length > 1 && (
                                    <button
                                        onClick={() => handleRemoveStep(step.id)}
                                        className="self-start text-red-400/50 hover:text-red-400 p-2"
                                        title="حذف الخطوة"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            onClick={handleAddStep}
                            className="w-full py-2 border-2 border-dashed border-white/10 rounded-xl text-gray-400 hover:text-gold hover:border-gold/30 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={16} />
                            <span>إضافة خطوة جديدة</span>
                        </button>
                    </div>

                    <div className="h-px bg-white/10 my-2"></div>

                    <button
                        onClick={handleSubmit}
                        disabled={uploading || !title}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gold hover:bg-yellow-600 text-black'}`}
                    >
                        {uploading ? 'جاري الحفظ...' : (editingId ? 'تعديل الشرح' : 'حفظ الشرح جديد')}
                    </button>
                </div>
            </div>

            {/* --- LIST ITEMS (Preview) --- */}
            <div className="space-y-4">
                <AnimatePresence>
                    {items.map((item, index) => {
                        const stepsData = parseGuideData(item);
                        const mainImage = stepsData[0]?.url;
                        const isEditingThis = editingId === item.id;

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`bg-[#121212] p-4 rounded-xl border flex gap-4 items-start group relative transition-all ${isEditingThis ? 'border-gold shadow-gold/20' : 'border-white/5 hover:border-gold/20'}`}
                            >
                                {/* Category Chip */}
                                <div className="absolute top-4 left-4">
                                    <span className="bg-gold/10 text-gold border border-gold/20 text-xs px-2 py-1 rounded-md font-mono">
                                        {item.category || 'عام'}
                                    </span>
                                </div>

                                <div className="text-gray-600 font-mono text-xs pt-2">#{index + 1}</div>

                                {/* Image Thumbnail */}
                                <div className="w-32 h-32 bg-black/50 rounded-lg overflow-hidden flex-shrink-0 border border-white/5 relative">
                                    {mainImage ? (
                                        <img src={mainImage} alt="Guide" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                                            <Image size={24} />
                                        </div>
                                    )}
                                    {stepsData.length > 1 && (
                                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 rounded flex items-center gap-1">
                                            <LayoutGrid size={10} />
                                            <span>+{stepsData.length - 1}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-1 ml-16">
                                    <h4 className="font-bold text-lg text-gold mb-2">{item.description}</h4>
                                    <p className="text-gray-400 text-sm">
                                        يحتوي على {stepsData.length} خطوات شرح.
                                    </p>
                                    {isEditingThis && <span className="text-xs text-gold animate-pulse">جاري التعديل...</span>}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 z-30">
                                    {deleteConfirmId === item.id ? (
                                        <div className="bg-red-900/90 text-white p-2 rounded-lg flex flex-col gap-2 animate-in slide-in-from-right-2">
                                            <span className="text-xs font-bold text-center">متأكد؟</span>
                                            <div className="flex gap-1">
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded">نعم</button>
                                                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded">لا</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                                                className="p-2 bg-blue-900/20 text-blue-400 rounded-lg hover:bg-blue-900/40 border border-blue-500/10 hover:border-blue-500/30 transition-all backdrop-blur-md cursor-pointer"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }}
                                                className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 border border-red-500/10 hover:border-red-500/30 transition-all backdrop-blur-md cursor-pointer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default GuideManager;
