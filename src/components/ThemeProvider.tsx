'use client';

import { useEffect, useState } from 'react';
import { useHISStore } from '@/store/hisStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { darkMode, toggleDarkMode } = useHISStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Check auto dark mode after 6 PM (18:00)
        const checkAutoDark = () => {
            const hour = new Date().getHours();
            if ((hour >= 18 || hour < 6) && !localStorage.getItem('theme-manual')) {
                toggleDarkMode(true);
            }
        };

        checkAutoDark();

        // Set data-theme attribute
        if (darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }, [darkMode, toggleDarkMode, mounted]);

    if (!mounted) return null;

    return <>{children}</>;
}
