'use client';

import { Appointment } from '@/store/hisStore';
import { Users, CheckCircle2, Clock, AlertTriangle, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface QueuePanelProps {
    appointments: Appointment[];
}

export default function QueuePanel({ appointments }: QueuePanelProps) {
    const today = new Date().toISOString().split('T')[0];
    const todayAppts = appointments.filter(a => a.start.startsWith(today));

    const stats = {
        total: todayAppts.length,
        completed: todayAppts.filter(a => a.status === 'Completed').length,
        waiting: todayAppts.filter(a => a.status === 'Waiting' || a.status === 'Checked-in').length,
        upcoming: todayAppts.filter(a => a.status === 'Scheduled' || a.status === 'Confirmed').length,
        emergency: todayAppts.filter(a => a.priority === 'Emergency').length
    };

    return (
        <aside style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', color: 'var(--primary)' }}>Today's Analytics</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <StatItem icon={<Users size={18} />} label="Total" count={stats.total} color="var(--primary)" />
                    <StatItem icon={<CheckCircle2 size={18} />} label="Completed" count={stats.completed} color="#22c55e" />
                    <StatItem icon={<PlayCircle size={18} />} label="Waiting" count={stats.waiting} color="#f59e0b" />
                    <StatItem icon={<Clock size={18} />} label="Upcoming" count={stats.upcoming} color="#6366f1" />
                    <StatItem icon={<AlertTriangle size={18} />} label="Emergency" count={stats.emergency} color="#ef4444" />
                </div>
            </div>

            <div className="glass" style={{ padding: '24px', flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>Quick Queue</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {todayAppts.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').slice(0, 5).map(a => (
                        <div key={a.id} style={{ padding: '12px', background: 'var(--background)', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: '700' }}>{a.patientName}</span>
                                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{new Date(a.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{a.doctorName} • {a.department}</div>
                        </div>
                    ))}
                    {todayAppts.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No appointments for today.</p>}
                </div>
            </div>
        </aside>
    );
}

function StatItem({ icon, label, count, color }: { icon: any, label: string, count: number, color: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: color + '08', borderRadius: '12px', border: `1px solid ${color}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: color }}>{icon}</div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.8 }}>{label}</span>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: color }}>{count}</span>
        </div>
    );
}
