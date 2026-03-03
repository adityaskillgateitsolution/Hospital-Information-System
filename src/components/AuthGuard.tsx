'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useHISStore } from '@/store/hisStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useHISStore((state) => state.isAuthenticated);
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        if (!isAuthenticated && pathname !== '/login') {
            router.push('/login');
        } else if (isAuthenticated && pathname === '/login') {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router, pathname, mounted]);

    // Prevent hydration mismatch and flicker
    if (!mounted) {
        return <div style={{ height: '100vh', background: 'var(--background)' }} />;
    }

    if (!isAuthenticated && pathname !== '/login') {
        return <div style={{ height: '100vh', background: 'var(--background)' }} />;
    }

    return <>{children}</>;
}
