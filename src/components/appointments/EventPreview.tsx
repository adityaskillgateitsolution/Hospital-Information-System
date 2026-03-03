'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Appointment } from '@/store/hisStore';
import { Clock, User, FileText, Activity, ShieldCheck, AlertCircle } from 'lucide-react';
import { STATUS_COLORS } from '@/utils/appointmentUtils';

interface EventPreviewProps {
    appointment: Appointment | null;
    position: { x: number; y: number } | null;
}

export default function EventPreview({ appointment, position }: EventPreviewProps) {
    if (!appointment || !position) return null;

    const startTime = new Date(appointment.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(appointment.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const duration = Math.round((new Date(appointment.end).getTime() - new Date(appointment.start).getTime()) / 60000);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
                position: 'fixed',
                left: position.x + 15,
                top: position.y + 15,
                zIndex: 9999,
                width: '280px',
                pointerEvents: 'none'
            }}
        >
            <div className="glass" style={{
                padding: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                border: `1.5px solid ${STATUS_COLORS[appointment.status]}30`
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={16} color="var(--primary)" /> {appointment.patientName}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{appointment.id} • {appointment.department}</p>
                    </div>
                    <div style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: STATUS_COLORS[appointment.status] + '15',
                        color: STATUS_COLORS[appointment.status],
                        fontSize: '0.7rem',
                        fontWeight: '800'
                    }}>
                        {appointment.status}
                    </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: 'var(--text-muted)' }}><Clock size={16} /></div>
                        <div>
                            <p style={{ fontSize: '0.8rem', fontWeight: '700' }}>{startTime} - {endTime}</p>
                            <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>{duration} Min Session</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: 'var(--text-muted)' }}><Activity size={16} /></div>
                        <div>
                            <p style={{ fontSize: '0.8rem', fontWeight: '700' }}>{appointment.priority} Priority</p>
                            <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>{appointment.visitType}</p>
                        </div>
                    </div>

                    {appointment.notes && (
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                            <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}><FileText size={16} /></div>
                            <p style={{ fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.8, lineHeight: '1.4' }}>
                                "{appointment.notes.slice(0, 80)}{appointment.notes.length > 80 ? '...' : ''}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Analytics */}
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} color={appointment.insurance ? "var(--accent)" : "var(--text-muted)"} />
                        <span style={{ fontSize: '0.7rem', fontWeight: '600', color: appointment.insurance ? "var(--accent)" : "var(--text-muted)" }}>
                            {appointment.insurance ? 'Insured' : 'Self-Pay'}
                        </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Logged: {new Date(appointment.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
