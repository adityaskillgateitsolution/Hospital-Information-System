'use client';

import { useHISStore } from '@/store/hisStore';
import { LogOut, Sun, Moon, Activity, User, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
    const { darkMode, toggleDarkMode, logout, user } = useHISStore();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const handleToggleTheme = () => {
        toggleDarkMode();
        localStorage.setItem('theme-manual', 'true');
    };

    return (
        <nav className="glass" style={{
            position: 'sticky',
            top: '16px',
            margin: '0 16px 24px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 100,
            borderRadius: '16px'
        }}>
            <div
                onClick={() => {
                    router.push('/dashboard');
                    setIsMenuOpen(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            >
                <div style={{
                    background: 'var(--primary)',
                    padding: '8px',
                    borderRadius: '10px',
                    color: 'white'
                }}>
                    <Activity size={24} />
                </div>
                <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--primary)' }}>MediSync</span>
            </div>

            {/* Mobile Toggle */}
            <button
                className="tablet-show mobile-show"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ color: 'var(--text-main)', padding: '8px' }}
            >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div
                className={`${isMenuOpen ? 'mobile-menu-open' : 'mobile-hide'}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}
            >
                <button
                    onClick={handleToggleTheme}
                    style={{
                        color: 'var(--text-main)',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    className="card-hover"
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '6px 12px',
                    background: 'var(--background)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                }}>
                    <User size={18} color="var(--primary)" />
                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }} className="mobile-hide">{user?.username || 'Admin'}</span>
                    <span style={{
                        fontSize: '0.75rem',
                        background: 'var(--accent)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '6px'
                    }}>Admin</span>
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        color: 'var(--error)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                    }}
                    className="card-hover"
                >
                    <LogOut size={18} />
                    <span className="mobile-hide">Logout</span>
                </button>
            </div>
        </nav>
    );
}
