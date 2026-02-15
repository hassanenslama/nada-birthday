/**
 * useCharacters Hook
 * Manages character unlocking and selection with Supabase integration
 */

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { CHARACTERS } from '../game/Constants';

export const useCharacters = () => {
    const [unlockedCharacters, setUnlockedCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    // Load unlocked characters from database
    const loadCharacters = async () => {
        if (!user) {
            // Guest user - unlock all default free characters
            const freeChars = Object.values(CHARACTERS)
                .filter(char => char.price === 0)
                .map(char => char.id);
            setUnlockedCharacters(freeChars);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('user_characters')
                .select('character_id, unlocked')
                .eq('user_id', user.id)
                .eq('unlocked', true);

            if (fetchError) throw fetchError;

            // Extract character IDs
            const unlockedIds = data.map(item => item.character_id);
            setUnlockedCharacters(unlockedIds);
            setError(null);
        } catch (err) {
            console.error('Error loading characters:', err);
            setError(err.message);
            // Fallback to default characters on error
            setUnlockedCharacters(['mr-santa', 'mrs-santa']);
        } finally {
            setLoading(false);
        }
    };

    // Unlock a character (purchase with coins)
    const unlockCharacter = async (characterId, coinCost) => {
        if (!user) {
            setError('يجب تسجيل الدخول لشراء الشخصيات');
            return false;
        }

        try {
            // Insert/update character unlock status
            const { error: unlockError } = await supabase
                .from('user_characters')
                .upsert({
                    user_id: user.id,
                    character_id: characterId,
                    unlocked: true,
                    purchased_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,character_id'
                });

            if (unlockError) throw unlockError;

            // Reload characters
            await loadCharacters();
            return true;
        } catch (err) {
            console.error('Error unlocking character:', err);
            setError(err.message);
            return false;
        }
    };

    // Check if a specific character is unlocked
    const isUnlocked = (characterId) => {
        return unlockedCharacters.includes(characterId);
    };

    // Load characters on mount and when user changes
    useEffect(() => {
        loadCharacters();
    }, [user?.id]);

    return {
        unlockedCharacters,
        loading,
        error,
        loadCharacters,
        unlockCharacter,
        isUnlocked
    };
};
