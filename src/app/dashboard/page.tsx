'use client';

import {
    Calendar,
    Users,
    Stethoscope,
    ClipboardCheck,
    CreditCard,
    FileText,
    ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

const modules = [
    {
        title: 'Book an Appointment',
        description: 'Manage clinical schedules and patient bookings.',
        icon: Calendar,
        path: '/appointments',
        color: '#3b82f6'
    },
    {
        title: 'Patient Info',
        description: 'Centralized patient records and medical history.',
        icon: Users,
        path: '/patients',
        color: '#0d9488'
    },
    {
        title: 'Nursing Workbench',
        description: 'Vitals tracking and nursing administration.',
        icon: ClipboardCheck,
        path: '/nursing',
        color: '#8b5cf6'
    },
    {
        title: "Doctor's Workbench",
        description: 'Consultation flow and digital prescriptions.',
        icon: Stethoscope,
        path: '/doctor',
        color: '#f59e0b'
    },
    {
        title: 'Billing',
        description: 'Invoicing, payments and financial tracking.',
        icon: CreditCard,
        path: '/billing',
        color: '#10b981'
    },
    {
        title: 'Report Dispatch',
        description: 'Lab results and diagnostic report management.',
        icon: FileText,
        path: '/reports',
        color: '#ef4444'
    }
];

export default function Dashboard() {
    const router = useRouter();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Hospital Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Welcome back. Here is an overview of your hospital systems.</p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '24px'
                    }}
                >
                    {modules.map((mod, idx) => (
                        <motion.div
                            key={idx}
                            variants={item}
                            onClick={() => router.push(mod.path)}
                            className="glass card-hover"
                            style={{
                                padding: '32px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: mod.color + '15',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: mod.color
                            }}>
                                <mod.icon size={28} />
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>{mod.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    {mod.description}
                                </p>
                            </div>

                            <div style={{
                                marginTop: 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                color: 'var(--primary)'
                            }}>
                                Open Module <ArrowRight size={16} />
                            </div>

                            {/* Decorative gradient corner */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '80px',
                                height: '80px',
                                background: `radial-gradient(circle at top right, ${mod.color}10, transparent)`,
                                zIndex: -1
                            }} />
                        </motion.div>
                    ))}
                </motion.div>
            </main>
        </div>
    );
}
