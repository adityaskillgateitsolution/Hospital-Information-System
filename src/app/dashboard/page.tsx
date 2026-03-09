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
import { useHISStore } from '@/store/hisStore';

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
    const { patients, vitals, reports, appointments, invoices } = useHISStore();

    const stats = [
        { label: 'OP/IP Patients', value: patients.length, color: '#3b82f6' },
        { label: 'Critical Alerts', value: vitals.filter(v => v.temperature > 39 || v.oxygenSaturation < 92).length, color: '#ef4444' },
        { label: 'Pending Reports', value: reports.filter(r => r.status === 'Processing').length, color: '#8b5cf6' },
        { label: 'Total Unpaid', value: invoices.filter(i => i.status === 'Unpaid').length, color: '#f59e0b' }
    ];

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

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }} className="mobile-padding">
                <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }} className="mobile-stack">
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.02em' }}>Hospital Control Center</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Real-time health informatics and department overview.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '32px', marginTop: '20px' }} className="mobile-stack">
                        {stats.map((s, i) => (
                            <div key={i} style={{ textAlign: 'inherit' }} className="mobile-padding glass">
                                <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</p>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: s.color }}>{s.value}</h2>
                            </div>
                        ))}
                    </div>
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
                    className="mobile-grid-1"
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
