import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadToCloudinary } from '../../../../utils/cloudinaryUpload';

const AddMemoryModal = ({ isOpen, onClose, onAdd, loading }) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [date, setDate] = useState('');
    const [image, setImage] = useState(null);
    const fileInputRef = useRef(null);

    const handleSubmit = () => {
        if (!title || !date || !image) return;
        onAdd({ title, desc, date, image });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
                <div className="bg-[#1a1a1a] w-full max-w-lg rounded-3xl p-6 border border-gold/20 shadow-2xl relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gold">إضافة ذكرى جديدة</h3>
                        <button onClick={onClose}><X className="text-gray-400 hover:text-white transition" /></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">عنوان الصورة *</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-gold/50 transition" placeholder="مثلاً: أول خروجة لينا" />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">وصف بسيط</label>
                            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-gold/50 h-24 resize-none transition" placeholder="اكتبي تفاصيل أو مشاعرك وقتها..." />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">التاريخ *</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-gold/50 transition scheme-dark" />
                        </div>

                        <div onClick={() => fileInputRef.current?.click()} className="w-full h-40 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-gold/50 hover:bg-white/5 transition group">
                            {image ? (
                                <img src={URL.createObjectURL(image)} className="h-full object-contain" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-gold transition">
                                    <ImageIcon size={32} />
                                    <span className="text-sm">اضغط لاختيار صورة</span>
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => setImage(e.target.files[0])} />

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !title || !date || !image}
                            className="w-full bg-gold text-black font-bold py-4 rounded-xl mt-4 hover:bg-yellow-400 transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'تأكيد الإضافة'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddMemoryModal;
