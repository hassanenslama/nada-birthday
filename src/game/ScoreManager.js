/**
 * ScoreManager - Real Database Version with Supabase
 */

import { supabase } from '../supabase';

class ScoreManager {
    constructor() {
        this.tableName = 'game_leaderboard';
    }

    /**
     * Save score to Supabase
     * @param {string} playerName - Player name (حسانين or ندى)
     * @param {number} score - Final score
     * @param {object} extras - Additional data (coins, hearts, character)
     */
    async saveScore(playerName, score, extras = {}) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .insert([
                    {
                        player_name: playerName,
                        score: score,
                        coins: extras.coins || 0,
                        hearts: extras.hearts || 0,
                        character: extras.character || 'mr-santa'
                    }
                ])
                .select();

            if (error) {
                console.error('Error saving score:', error);
                return null;
            }

            console.log('✅ Score saved to database:', data);
            return data;
        } catch (err) {
            console.error('Save score error:', err);
            return null;
        }
    }

    /**
     * Get top scores from Supabase
     * @param {number} limit - Number of scores to fetch (default: 10)
     */
    async getScores(limit = 10) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .order('score', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching scores:', error);
                return [];
            }

            // Format scores for display
            return data.map(entry => ({
                name: entry.player_name,
                score: entry.score,
                coins: entry.coins,
                hearts: entry.hearts,
                character: entry.character,
                date: new Date(entry.created_at)
            }));
        } catch (err) {
            console.error('Get scores error:', err);
            return [];
        }
    }

    /**
     * Get player's best score
     * @param {string} playerName
     */
    async getPlayerBest(playerName) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('player_name', playerName)
                .order('score', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error('Error fetching player best:', error);
                return null;
            }

            return data;
        } catch (err) {
            console.error('Get player best error:', err);
            return null;
        }
    }

    /**
     * Subscribe to realtime leaderboard updates
     * @param {function} callback - Called when leaderboard changes
     */
    subscribeToUpdates(callback) {
        const channel = supabase
            .channel('leaderboard-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: this.tableName
                },
                (payload) => {
                    console.log('🔔 New score added:', payload);
                    callback(payload.new);
                }
            )
            .subscribe();

        return channel;
    }

    /**
     * Clear all scores (admin only - use with caution!)
     */
    async clearScores() {
        try {
            const { error } = await supabase
                .from(this.tableName)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (error) {
                console.error('Error clearing scores:', error);
                return false;
            }

            console.log('✅ All scores cleared');
            return true;
        } catch (err) {
            console.error('Clear scores error:', err);
            return false;
        }
    }
}

export default ScoreManager;
