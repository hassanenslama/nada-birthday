import { Home, Map, Heart, Gamepad2, Settings, User, Ticket, Newspaper } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navigation = ({ activeTab, onTabChange }) => {
    const { userRole: role } = useAuth();

    const tabs = [
        { id: 'home', icon: Home, label: 'الرئيسية' },
        { id: 'journey', icon: Map, label: 'رحلتنا' },
        { id: 'feelings', icon: Heart, label: 'مشاعرنا' },
        { id: 'messages', icon: ({ color, size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>, label: 'رسايلنا' },
        { id: 'posts', icon: Newspaper, label: 'المنشورات' },
        { id: 'fun', icon: Gamepad2, label: 'ترفيه' },
        { id: 'coupons', icon: Ticket, label: 'كوبونات' },
        { id: 'settings', icon: User, label: 'حسابي' },
    ];

    if (role === 'admin') {
        tabs.push({ id: 'admin', icon: Settings, label: 'تحكم' });
    }

    return (
        <div className="absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-gold/30 z-50 pb-safe transition-all duration-300">
            <div className="flex justify-around items-center px-2 py-3">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                        >
                            <span
                                className={`text-2xl transition-all duration-300 filter ${isActive ? 'drop-shadow-[0_0_10px_rgba(197,160,89,0.5)]' : ''}`}
                            >
                                <Icon size={24} color={isActive ? '#c5a059' : '#9ca3af'} />
                            </span>
                            <span className={`text-xs font-cairo font-bold ${isActive ? 'text-gold' : 'text-gray-400'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Navigation;
