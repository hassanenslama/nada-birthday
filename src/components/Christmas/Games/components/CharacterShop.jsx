/**
 * Character Shop Component
 * Professional UI for character selection and purchasing
 */

import React, { useState } from 'react';
import { CHARACTERS } from '../../../../game/Constants';
import { useCharacters } from '../../../../hooks/useCharacters';

const CharacterShop = ({ selectedCharacter, onSelect, onBack }) => {
    const { unlockedCharacters, loading, unlockCharacter, isUnlocked } = useCharacters();
    const [purchasing, setPurchasing] = useState(null);

    const handleCharacterClick = async (charId, price) => {
        const unlocked = isUnlocked(charId);

        if (unlocked) {
            // Character already unlocked - select it
            onSelect(charId);
        } else {
            // Character locked - attempt purchase
            setPurchasing(charId);
            const success = await unlockCharacter(charId, price);
            setPurchasing(null);

            if (success) {
                onSelect(charId);
            }
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center">
                <div className="text-white text-4xl animate-pulse">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900 overflow-auto">
            {/* Header */}
            <div className="relative z-10 p-4 lg:p-8">
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 lg:top-8 lg:left-8 w-12 h-12 lg:w-16 lg:h-16 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border-2 border-white/30 flex items-center justify-center transition-all text-2xl lg:text-3xl active:scale-90"
                >
                    ←
                </button>

                <h1 className="text-4xl lg:text-7xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] mb-2 lg:mb-4">
                    متجر الشخصيات
                </h1>
                <p className="text-center text-white/70 text-sm lg:text-xl tracking-widest uppercase">
                    Character Shop
                </p>
            </div>

            {/* Character Grid */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-4 lg:mt-8">
                {Object.values(CHARACTERS).map((char) => {
                    const unlocked = isUnlocked(char.id);
                    const isSelected = selectedCharacter === char.id;
                    const isPurchasing = purchasing === char.id;

                    return (
                        <CharacterCard
                            key={char.id}
                            character={char}
                            unlocked={unlocked}
                            selected={isSelected}
                            purchasing={isPurchasing}
                            onClick={() => handleCharacterClick(char.id, char.price)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

// Character Card Component
const CharacterCard = ({ character, unlocked, selected, purchasing, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`
                relative group cursor-pointer transform transition-all duration-300
                ${selected ? 'scale-105 ring-4 ring-yellow-400' : 'hover:scale-102'}
                ${!unlocked ? 'opacity-75' : ''}
            `}
        >
            {/* Card Container */}
            <div className={`
                relative bg-gradient-to-br from-indigo-800/90 to-purple-900/90 
                rounded-2xl lg:rounded-3xl p-6 lg:p-8 
                backdrop-blur-xl border-2 
                ${selected ? 'border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.5)]' : 'border-white/20'}
                ${unlocked ? 'hover:border-white/40' : 'hover:border-red-400/40'}
                transition-all duration-300
            `}>
                {/* Lock/Check Badge */}
                <div className="absolute -top-3 -right-3 lg:-top-4 lg:-right-4 z-10">
                    {selected ? (
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl lg:text-3xl">✓</span>
                        </div>
                    ) : !unlocked ? (
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl lg:text-3xl">🔒</span>
                        </div>
                    ) : null}
                </div>

                {/* Character Preview */}
                <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden bg-gradient-to-b from-blue-900/30 to-purple-900/30 border-2 border-white/10">
                    {/* Idle animation sprite would go here */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-8xl lg:text-9xl opacity-90">
                            {character.id === 'mr-santa' ? '🎅' : '🤶'}
                        </span>
                    </div>

                    {/* Locked Overlay */}
                    {!unlocked && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-2">🔒</div>
                                <div className="text-yellow-300 font-bold text-2xl">{character.price} عملة</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Character Info */}
                <div className="text-center space-y-2 lg:space-y-3">
                    {/* Name */}
                    <h2 className="text-2xl lg:text-4xl font-black text-white">
                        {character.nameAr}
                    </h2>
                    <p className="text-sm lg:text-lg text-white/60 font-medium">
                        {character.name}
                    </p>

                    {/* Ability */}
                    <div className="bg-white/10 rounded-xl p-3 lg:p-4 backdrop-blur-sm border border-white/20">
                        <p className="text-xs lg:text-sm text-white/50 uppercase tracking-wider mb-1">
                            القدرة الخاصة
                        </p>
                        <p className="text-base lg:text-xl font-bold text-yellow-300">
                            {character.abilityAr}
                        </p>
                        <p className="text-xs lg:text-sm text-white/60 mt-1">
                            {character.ability}
                        </p>
                    </div>

                    {/* Action Button */}
                    <button
                        className={`
                            w-full py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-lg lg:text-2xl
                            transition-all duration-300 transform active:scale-95
                            ${unlocked
                                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white shadow-lg hover:shadow-green-500/50'
                                : 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black shadow-lg hover:shadow-yellow-500/50'
                            }
                            ${purchasing ? 'opacity-50 cursor-wait' : ''}
                        `}
                        disabled={purchasing}
                    >
                        {purchasing ? (
                            '⏳ جاري الشراء...'
                        ) : unlocked ? (
                            selected ? '✓ محدد' : 'اختيار'
                        ) : (
                            `🛒 شراء (${character.price} عملة)`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CharacterShop;
