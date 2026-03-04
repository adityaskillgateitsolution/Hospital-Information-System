'use client';

import { useState } from 'react';
import { useHISStore, Vitals, Patient } from '@/store/hisStore';
import {
    ClipboardCheck,
    Activity,
    Thermometer,
    Heart,
    FileText,
    CheckCircle2,
    AlertCircle,
    PlusCircle,
    History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

export default function NursingPage() {
    const { appointments, patients, vitals, rooms, admissions, addVitals, dischargePatient } = useHISStore();
    const [activeTab, setActiveTab] = useState<'queue' | 'admissions'>('queue');
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

    // Vitals form state
    const [bp, setBp] = useState('');
    const [pulse, setPulse] = useState('');
    const [temp, setTemp] = useState('');
    const [notes, setNotes] = useState('');

    // Filter patients that are "Checked-in" or "Scheduled" for today
    const activePatients = appointments
        .filter(a => a.status === 'Checked-in' || a.status === 'Scheduled')
        .map(a => patients.find(p => p.id === a.patientId))
        .filter((p): p is Patient => !!p);

    const activeAdmissions = admissions.filter(a => a.status === 'Admitted');

    const selectedPatient = patients.find(p => p.id === selectedPatientId);
    const patientVitals = vitals.filter(v => v.patientId === selectedPatientId);

    const handleSaveVitals = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId) return;

        const newVitals: Vitals = {
            patientId: selectedPatientId,
            bloodPressure: bp,
            pulse: parseInt(pulse),
            temperature: parseFloat(temp),
            recordedAt: new Date().toLocaleString()
        };

        addVitals(newVitals);
        resetForm();
    };

    const resetForm = () => {
        setBp('');
        setPulse('');
        setTemp('');
        setNotes('');
    };

    const isCritical = (v: Vitals) => {
        return v.temperature > 38 || v.pulse > 100 || v.pulse < 50;
    };

    const handleDischarge = (admissionId: string) => {
        if (confirm('Are you sure you want to discharge this patient?')) {
            dischargePatient(admissionId);
        }
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Nursing Workbench</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Monitor active patients and record clinical vitals.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--background)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setActiveTab('queue')}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '700',
                                background: activeTab === 'queue' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'queue' ? 'white' : 'var(--text-main)',
                                border: 'none', cursor: 'pointer'
                            }}
                        >
                            Active Queue
                        </button>
                        <button
                            onClick={() => setActiveTab('admissions')}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '700',
                                background: activeTab === 'admissions' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'admissions' ? 'white' : 'var(--text-main)',
                                border: 'none', cursor: 'pointer'
                            }}
                        >
                            IP Admissions
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
                    {/* Left Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {activeTab === 'queue' ? (
                            <>
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>ACTIVE QUEUE</h3>
                                {activePatients.length === 0 ? (
                                    <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
                                        <p style={{ color: 'var(--text-muted)' }}>No patients in the active queue.</p>
                                    </div>
                                ) : (
                                    activePatients.map((p) => (
                                        <div
                                            key={p.id}
                                            className="glass card-hover"
                                            onClick={() => setSelectedPatientId(p.id)}
                                            style={{
                                                padding: '16px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                border: selectedPatientId === p.id ? '2px solid var(--accent)' : '1px solid var(--border)'
                                            }}
                                        >
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                background: 'var(--accent)15',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--accent)'
                                            }}>
                                                <Activity size={20} />
                                            </div>
                                            <div>
                                                <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>{p.name}</h4>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.id} • {p.gender}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </>
                        ) : (
                            <>
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>ACTIVE ADMISSIONS</h3>
                                {activeAdmissions.length === 0 ? (
                                    <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
                                        <p style={{ color: 'var(--text-muted)' }}>No active IP admissions.</p>
                                    </div>
                                ) : (
                                    activeAdmissions.map((adm) => {
                                        const p = patients.find(patient => patient.id === adm.patientId);
                                        const r = rooms.find(room => room.id === adm.roomId);
                                        return (
                                            <div
                                                key={adm.id}
                                                className="glass card-hover"
                                                onClick={() => setSelectedPatientId(adm.patientId)}
                                                style={{
                                                    padding: '16px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '8px',
                                                    border: selectedPatientId === adm.patientId ? '2px solid var(--primary)' : '1px solid var(--border)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>{p?.name}</h4>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room {r?.roomNumber} • Bed {r?.bedNumber}</p>
                                                    </div>
                                                    <div style={{ background: 'var(--primary)15', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800' }}>
                                                        {r?.wardType}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Admitted: {new Date(adm.admissionDate).toLocaleDateString()}</p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDischarge(adm.id);
                                                        }}
                                                        style={{ background: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', border: 'none' }}
                                                    >
                                                        Discharge
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </>
                        )}
                    </div>

                    {/* Right Panel: Vitals & Notes */}
                    <div>
                        {!selectedPatient ? (
                            <div className="glass" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '60px' }}>
                                <ClipboardCheck size={64} style={{ marginBottom: '20px', opacity: 0.2 }} />
                                <p>Select a patient to record vitals or view details.</p>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                            >
                                {/* Patient Header */}
                                <div className="glass" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, var(--accent)05, transparent)' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Recording for: {selectedPatient.name}</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Patient ID: {selectedPatient.id} | Age: {selectedPatient.age}</p>
                                    </div>
                                    <div style={{
                                        padding: '8px 16px',
                                        borderRadius: '30px',
                                        background: patientVitals.length > 0 && isCritical(patientVitals[patientVitals.length - 1]) ? '#fee2e2' : '#dcfce7',
                                        color: patientVitals.length > 0 && isCritical(patientVitals[patientVitals.length - 1]) ? '#ef4444' : '#10b981',
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        {patientVitals.length > 0 && isCritical(patientVitals[patientVitals.length - 1]) ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                                        {patientVitals.length > 0 && isCritical(patientVitals[patientVitals.length - 1]) ? 'CRITICAL' : 'STABLE'}
                                    </div>
                                </div>

                                {/* Vitals Form */}
                                <div className="glass" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <PlusCircle size={18} color="var(--accent)" /> New Vitals Entry
                                    </h3>
                                    <form onSubmit={handleSaveVitals} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                                                <Activity size={14} color="var(--primary)" /> BP (mmHg)
                                            </label>
                                            <input
                                                type="text"
                                                value={bp}
                                                onChange={(e) => setBp(e.target.value)}
                                                placeholder="120/80"
                                                required
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                                                <Heart size={14} color="#ef4444" /> Pulse (bpm)
                                            </label>
                                            <input
                                                type="number"
                                                value={pulse}
                                                onChange={(e) => setPulse(e.target.value)}
                                                placeholder="72"
                                                required
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                                                <Thermometer size={14} color="#f59e0b" /> Temp (°C)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={temp}
                                                onChange={(e) => setTemp(e.target.value)}
                                                placeholder="36.6"
                                                required
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                        <div style={{ gridColumn: 'span 3' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                                                <FileText size={14} color="var(--text-muted)" /> Nursing Notes
                                            </label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Enter any observations or nursing notes..."
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', minHeight: '80px' }}
                                            />
                                        </div>
                                        <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                type="submit"
                                                style={{ background: 'var(--accent)', color: 'white', padding: '10px 24px', borderRadius: '8px', fontWeight: '600' }}
                                                className="card-hover"
                                            >
                                                Save Vitals
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Vitals History */}
                                <div className="glass" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <History size={18} color="var(--primary)" /> Vitals History
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {patientVitals.length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No history available.</p>
                                        ) : (
                                            patientVitals.slice().reverse().map((v, i) => (
                                                <div key={i} style={{
                                                    padding: '16px',
                                                    background: 'var(--background)',
                                                    borderRadius: '12px',
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                                    border: isCritical(v) ? '1px solid #fee2e2' : '1px solid var(--border)'
                                                }}>
                                                    <div>
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>BP</p>
                                                        <p style={{ fontWeight: '700' }}>{v.bloodPressure}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>PULSE</p>
                                                        <p style={{ fontWeight: '700', color: v.pulse > 100 || v.pulse < 50 ? '#ef4444' : 'inherit' }}>{v.pulse} bpm</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>TEMP</p>
                                                        <p style={{ fontWeight: '700', color: v.temperature > 38 ? '#ef4444' : 'inherit' }}>{v.temperature}°C</p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>RECORDED AT</p>
                                                        <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>{v.recordedAt}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
