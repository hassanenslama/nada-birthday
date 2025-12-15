
import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Check, X, Clock, User, Crown, Sparkles, GripVertical, Edit3, Trash2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const WishItem = ({ item, index, onUpdate, onDelete, dragControls }) => {
    const { userRole } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(item.title);

    const creatorName = item.created_by_role === 'admin' ? 'حسن' : 'ندى';
    const CreatorIcon = item.created_by_role === 'admin' ? Crown : Sparkles;

    // Status Logic
    const isCompleted = item.status === 'completed';
    const isWaiting = item.status === 'waiting_confirmation';
    const isPendingDelete = item.status === 'pending_delete';
    const isDeleted = item.status === 'deleted';
    const isMyProposal = item.proposed_by_role === userRole;

    // State for Date Selection
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const handleAction = (e) => {
        e.stopPropagation();
        if (isCompleted || isDeleted) return;

        if (isWaiting || isPendingDelete) {
            if (!isMyProposal) return;
        } else {
            onUpdate(item.id, {
                status: 'waiting_confirmation',
                proposed_by_role: userRole
            });
        }
    };

    const confirmCompletion = (e) => {
        e.stopPropagation();
        onUpdate(item.id, {
            status: 'completed',
            completed_at: new Date(selectedDate).toISOString()
        });
    };

    const rejectCompletion = (e) => {
        e.stopPropagation();
        onUpdate(item.id, {
            status: 'pending',
            proposed_by_role: null
        });
    };

    // Deletion Workflow
    const requestDelete = (e) => {
        e.stopPropagation();
        onUpdate(item.id, {
            status: 'pending_delete',
            proposed_by_role: userRole
        });
    };

    const confirmDelete = (e) => {
        e.stopPropagation();
        onUpdate(item.id, {
            status: 'deleted',
            proposed_by_role: null
        });
    };

    const rejectDelete = (e) => {
        e.stopPropagation();
        onUpdate(item.id, {
            status: 'pending',
            proposed_by_role: null
        });
    };

    // Admin Re-open (Undo)
    const handleReopen = (e) => {
        e.stopPropagation();
        const action = isDeleted ? 'استرجاع المحذوف' : 'إعادة فتح';
        if (window.confirm(`هل أنت متأكد من ${action}؟`)) {
            onUpdate(item.id, {
                status: 'pending',
                completed_at: null,
                proposed_by_role: null
            });
        }
    };

    const saveEdit = () => {
        if (editText.trim() !== item.title) {
            onUpdate(item.id, { title: editText });
        }
        setIsEditing(false);
    };

    return (
        <div
            className={`relative p-3 rounded-xl border transition-all duration-300 overflow-hidden group select-none ${isCompleted
                ? 'bg-gradient-to-r from-gold/10 to-transparent border-gold/30'
                : isDeleted
                    ? 'bg-red-900/10 border-red-500/20 opacity-50 grayscale'
                    : (isWaiting || isPendingDelete)
                        ? 'bg-blue-500/5 border-blue-500/20'
                        : 'bg-[#1a1a1a] border-white/5 hover:border-gold/20'
                } ${''}`}
        >
            <div className="relative z-10 flex items-center gap-4">

                {/* Drag Handle & Number */}
                <div className="flex flex-col items-center gap-1 text-gray-500">
                    <div
                        className="cursor-grab active:cursor-grabbing p-1 hover:text-white transition-colors touch-none"
                        onPointerDown={(e) => dragControls?.start(e)}
                    >
                        <GripVertical size={16} />
                    </div>
                    <span className="text-sm font-bold text-gold/70 font-mono mt-1">#{index + 1}</span>
                </div>

                {/* Checkbox / Action */}
                <div className="pt-1 shrink-0">
                    {isCompleted ? (
                        <div className="w-8 h-8 rounded-full bg-gold text-black flex items-center justify-center shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                            <Check size={16} strokeWidth={3} />
                        </div>
                    ) : isDeleted ? (
                        <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/50">
                            <Trash2 size={16} />
                        </div>
                    ) : (isWaiting || isPendingDelete) ? (
                        !isMyProposal ? (
                            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                {isWaiting && (
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-[#111] border border-white/10 rounded-lg text-[10px] px-2 py-1 text-white focus:border-gold outline-none w-24 h-8 font-mono"
                                    />
                                )}
                                <button
                                    onClick={isPendingDelete ? confirmDelete : confirmCompletion}
                                    className={`w-8 h-8 rounded-full text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${isPendingDelete ? 'bg-red-500 hover:bg-red-400' : 'bg-green-500 hover:bg-green-400'}`}
                                    title="تأكيد"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={isPendingDelete ? rejectDelete : rejectCompletion}
                                    className="w-8 h-8 rounded-full bg-gray-500 hover:bg-gray-400 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                                    title="رفض"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-blue-400 animate-spin-slow flex items-center justify-center bg-blue-500/10">
                                <Clock size={16} className="text-blue-400" />
                            </div>
                        )
                    ) : (
                        <button
                            onClick={handleAction}
                            className="w-8 h-8 rounded-xl border-2 border-gray-600 hover:border-gold hover:bg-gold/10 transition-all group/check relative overflow-hidden"
                        >
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/check:opacity-100 transition-opacity text-gold">
                                <Check size={14} />
                            </span>
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${item.created_by_role === 'admin'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-pink-500/10 text-pink-500 border-pink-500/20'
                            }`}>
                            <CreatorIcon size={10} />
                            {creatorName}
                        </span>

                        {(isCompleted || isDeleted) && (
                            <span className="text-[10px] text-gray-500 font-mono">
                                {isDeleted ? '(محذوف)' : new Date(item.completed_at).toLocaleDateString('ar-EG')}
                            </span>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                className="w-full bg-black/50 border border-gold/50 rounded px-2 py-1 text-white font-cairo focus:outline-none"
                                autoFocus
                                onBlur={saveEdit}
                                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                            />
                        </div>
                    ) : (
                        <h3 className={`font-cairo text-base md:text-lg font-bold transition-all break-words ${isCompleted || isDeleted ? 'text-gray-500 line-through' : 'text-gray-100'
                            }`}>
                            {item.title}
                        </h3>
                    )}

                    {/* Waiting / Deletion Message */}
                    {(isWaiting || isPendingDelete) && (
                        <div className={`mt-2 text-xs font-bold font-cairo w-fit px-3 py-1 rounded-lg border ${isPendingDelete ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                            {isMyProposal ? (
                                <span className="flex items-center gap-2">
                                    <Clock size={12} />
                                    <span>{isPendingDelete ? 'في انتظار الموافقة على الحذف...' : `في انتظار تأكيد ${userRole === 'admin' ? 'ندى' : 'حسن'}...`}</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles size={12} />
                                    <span>{userRole === 'admin' ? 'ندى' : 'حسن'} {isPendingDelete ? 'عايز يحذف دي. توافق؟' : 'بيقول خلصت. نعتمد؟'}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions (Edit/Delete/Reopen) */}
                <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!isCompleted && !isDeleted && !isEditing && !isPendingDelete && (
                        <>
                            <button onClick={() => setIsEditing(true)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg" title="تعديل">
                                <Edit3 size={16} />
                            </button>
                            <button onClick={requestDelete} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg" title="طلب حذف">
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}

                    {/* Admin Re-open */}
                    {userRole === 'admin' && (isCompleted || isDeleted) && (
                        <button onClick={handleReopen} className="p-2 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-lg" title="إسترجاع / إعادة فتح">
                            <Clock size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WishItem;

