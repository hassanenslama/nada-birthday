import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Login = () => {
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState(null); // 'hassanen' or 'nada'
    const [password, setPassword] = useState('');

    const characters = {
        hassanen: {
            email: 'hassanen@love.com',
            label: 'أنا حسانين 🕶️',
            color: 'from-blue-600 to-navy',
            placeholder: 'الباسورد يا هندسة؟'
        },
        nada: {
            email: 'nada@love.com',
            label: 'أنا ندى 👸',
            color: 'from-pink-500 to-rose-400',
            placeholder: 'الباسورد يا ست البنات؟'
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCharacter) return;

        try {
            setError('');
            setLoading(true);
            await login(characters[selectedCharacter].email, password);
            // Navigation handled by App.jsx based on auth state
        } catch (err) {
            console.error("Login Error Full:", err);
            console.log("Attempted Email:", characters[selectedCharacter].email);
            console.log("Error Code:", err.code);
            console.log("Error Message:", err.message);
            setError(`خطأ: ${err.message} (${err.code})`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-20 animate-pulse" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/bg-stars.png')` }}></div>
            <div className="absolute top-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-maroon/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl z-10"
            >
                <h1 className="text-4xl font-signature text-gold text-center mb-8">مين اللي بينورنا؟ ✨</h1>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-center mb-6 font-cairo">
                        {error}
                    </div>
                )}

                {!selectedCharacter ? (
                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => setSelectedCharacter('nada')}
                            className="bg-gradient-to-r from-pink-500 to-rose-400 p-6 rounded-2xl text-white font-bold text-xl hover:scale-105 transition-transform flex items-center justify-between group"
                        >
                            <span>أنا ندى 👸</span>
                            <span className="text-3xl group-hover:rotate-12 transition-transform">🌸</span>
                        </button>

                        <button
                            onClick={() => setSelectedCharacter('hassanen')}
                            className="bg-gradient-to-r from-blue-600 to-navy p-6 rounded-2xl text-white font-bold text-xl hover:scale-105 transition-transform flex items-center justify-between group"
                        >
                            <span>أنا حسانين 🕶️</span>
                            <span className="text-3xl group-hover:rotate-12 transition-transform">💻</span>
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="text-center mb-6">
                            <span className="text-6xl mb-4 block">
                                {selectedCharacter === 'nada' ? '👸' : '🕶️'}
                            </span>
                            <h2 className="text-white text-2xl font-cairo">
                                أهلاً {selectedCharacter === 'nada' ? 'يا ندى' : 'يا حسانين'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => { setSelectedCharacter(null); setPassword(''); setError(''); }}
                                className="text-gold/60 text-sm mt-2 hover:text-gold underline"
                            >
                                (مش أنا)
                            </button>
                        </div>

                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={characters[selectedCharacter].placeholder}
                                className="w-full bg-black/30 border border-gold/30 rounded-xl px-4 py-4 text-white placeholder-white/30 text-center font-cairo focus:outline-none focus:border-gold transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all ${loading ? 'bg-gray-600 cursor-wait' : `bg-gradient-to-r ${characters[selectedCharacter].color} hover:shadow-lg hover:scale-[1.02]`
                                }`}
                        >
                            {loading ? 'ثواني...' : 'دخول 🚀'}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export default Login;
