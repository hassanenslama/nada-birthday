/**
 * Characters.js - Character Management and Helpers
 */

import { CHARACTERS } from './Constants';

/**
 * Get the asset name for a specific character state
 * @param {string} characterId - e.g. 'mr-santa', 'mrs-santa'
 * @param {string} state - e.g. 'idle', 'running', 'jumping'
 * @returns {string} - Asset key for the sprite
 */
export const getCharacterAsset = (characterId, state) => {
    // Find character by ID
    const charKey = Object.keys(CHARACTERS).find(key => CHARACTERS[key].id === characterId);

    if (!charKey) {
        console.warn(`Character ID not found: ${characterId}`);
        return null;
    }

    const spriteName = CHARACTERS[charKey].sprites[state];

    if (!spriteName) {
        console.warn(`Sprite state '${state}' not found for character '${characterId}'`);
        return null;
    }

    return spriteName;
};

export default {
    getCharacterAsset
};
