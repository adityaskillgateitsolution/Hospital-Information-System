'use client';

import { useState } from 'react';
import { useHISStore, Consultation, Patient, Appointment } from '@/store/hisStore';
import {
    Stethoscope,
    User,
    Clipboard,
    Pill,
    FileText,
    Calendar,
    Save,
    History,
    Activity,
    Plus,
    Trash2,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

export default function DoctorPage() {
    const { appointments, patients, vitals, consultations, addConsultation, updateAppointmentStatus } = useHISStore();
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

    // Consultation form state
    const [diagnosis, setDiagnosis] = useState('');
    const [medicines, setMedicines] = useState([{ medicine: '', dosage: '', frequency: '' }]);
    const [labTests, setLabTests] = useState<string[]>([]);
    const [followUpDate, setFollowUpDate] = useState('');

    const todayQueue = appointments.filter(a => a.status === 'Checked-in' || a.status === 'Scheduled');
    const currentAppointment = appointments.find(a => a.id === selectedAppointmentId);
    const currentPatient = currentAppointment ? patients.find(p => p.id === currentAppointment.patientId) : null;
    const currentVitals = currentPatient ? vitals.filter(v => v.patientId === currentPatient.id).slice(-1)[0] : null;
    const patientHistory = currentPatient ? consultations.filter(c => c.patientId === currentPatient.id) : [];

    const handleAddMedicine = () => {
        setMedicines([...medicines, { medicine: '', dosage: '', frequency: '' }]);
    };

    const handleRemoveMedicine = (index: number) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const handleUpdateMedicine = (index: number, field: string, value: string) => {
        const newMedicines = [...medicines];
        (newMedicines[index] as any)[field] = value;
        setMedicines(newMedicines);
    };

    const handleSaveConsultation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentAppointment || !currentPatient) return;

        const newConsultation: Consultation = {
            id: 'C' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            appointmentId: currentAppointment.id,
            patientId: currentPatient.id,
            diagnosis,
            prescription: medicines.filter(m => m.medicine),
            labTests,
            followUpDate,
            date: new Date().toLocaleDateString()
        };

        addConsultation(newConsultation);
        updateAppointmentStatus(currentAppointment.id, 'Completed');
        setSelectedAppointmentId(null);
        resetForm();
    };

    const resetForm = () => {
        setDiagnosis('');
        setMedicines([{ medicine: '', dosage: '', frequency: '' }]);
        setLabTests([]);
        setFollowUpDate('');
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Doctor's Workbench</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Hospital consultation and digital prescription system.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', alignItems: 'start' }}>
                    {/* Appointment Queue */}
                    <div className="glass" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={18} color="var(--primary)" /> Today's Queue
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {todayQueue.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No patients in queue.</p>
                            ) : (
                                todayQueue.map((app) => (
                                    <div
                                        key={app.id}
                                        className="card-hover"
                                        onClick={() => setSelectedAppointmentId(app.id)}
                                        style={{
                                            padding: '16px',
                                            background: selectedAppointmentId === app.id ? 'var(--primary)05' : 'var(--background)',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            border: selectedAppointmentId === app.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            background: 'var(--primary)15',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--primary)'
                                        }}>
                                            <User size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontWeight: '700', fontSize: '0.9rem' }}>{app.patientName}</h4>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.status} • {new Date(app.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <ChevronRight size={16} color="var(--text-muted)" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Consultation Interface */}
                    <div>
                        {!selectedAppointmentId ? (
                            <div className="glass" style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Stethoscope size={64} style={{ marginBottom: '20px', opacity: 0.2 }} />
                                <p>Select a patient from the queue to start consultation.</p>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                            >
                                {/* Patient Case Summary */}
                                <div className="glass" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1px 1fr 1px 1fr', gap: '20px', alignItems: 'center' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{currentPatient?.name}</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{currentPatient?.id} | {currentPatient?.age}y | {currentPatient?.gender}</p>
                                    </div>
                                    <div style={{ background: 'var(--border)', height: '100%' }} />
                                    <div>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>VITALS</p>
                                        {currentVitals ? (
                                            <div>
                                                <p style={{ fontSize: '0.9rem', fontWeight: '700' }}>{currentVitals.bloodPressure} mmHg</p>
                                                <p style={{ fontSize: '0.8rem' }}>{currentVitals.pulse} bpm | {currentVitals.temperature}°C</p>
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '0.85rem', color: '#f59e0b' }}>Pending triage</p>
                                        )}
                                    </div>
                                    <div style={{ background: 'var(--border)', height: '100%' }} />
                                    <div>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>APPOINTMENT</p>
                                        <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>Dr. {currentAppointment?.doctorName}</p>
                                        <p style={{ fontSize: '0.8rem' }}>{new Date(currentAppointment!.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>

                                {/* Main Consultation Form */}
                                <form onSubmit={handleSaveConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div className="glass" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FileText size={18} color="var(--primary)" /> Clinical Notes & Diagnosis
                                        </h3>
                                        <textarea
                                            value={diagnosis}
                                            onChange={(e) => setDiagnosis(e.target.value)}
                                            required
                                            placeholder="Enter patient complaints, observations and final diagnosis..."
                                            style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-main)', minHeight: '120px', resize: 'vertical' }}
                                        />
                                    </div>

                                    <div className="glass" style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Pill size={18} color="var(--accent)" /> Digital Prescription
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={handleAddMedicine}
                                                style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Plus size={16} /> Add Medicine
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {medicines.map((med, idx) => (
                                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 40px', gap: '12px', alignItems: 'end' }}>
                                                    <div>
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>MEDICINE NAME</p>
                                                        <input
                                                            type="text"
                                                            value={med.medicine}
                                                            onChange={(e) => handleUpdateMedicine(idx, 'medicine', e.target.value)}
                                                            placeholder="e.g. Paracetamol 500mg"
                                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>DOSAGE</p>
                                                        <input
                                                            type="text"
                                                            value={med.dosage}
                                                            onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                                                            placeholder="1 tab"
                                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>FREQUENCY</p>
                                                        <input
                                                            type="text"
                                                            value={med.frequency}
                                                            onChange={(e) => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                                                            placeholder="1-0-1 (After Food)"
                                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMedicine(idx)}
                                                        style={{ padding: '10px', color: '#ef4444' }}
                                                        disabled={medicines.length === 1}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '24px' }}>
                                        <div className="glass" style={{ flex: 1, padding: '24px' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Activity size={18} color="#8b5cf6" /> Lab Investigations
                                            </h3>
                                            <input
                                                type="text"
                                                placeholder="e.g. Blood Count, Thyroid Profile"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = (e.target as HTMLInputElement).value;
                                                        if (val) {
                                                            setLabTests([...labTests, val]);
                                                            (e.target as HTMLInputElement).value = '';
                                                        }
                                                    }
                                                }}
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                            />
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                                {labTests.map((test, i) => (
                                                    <span key={i} style={{ padding: '4px 12px', borderRadius: '20px', background: '#8b5cf615', color: '#8b5cf6', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {test} <Trash2 size={12} onClick={() => setLabTests(labTests.filter((_, idx) => idx !== i))} style={{ cursor: 'pointer' }} />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="glass" style={{ flex: 1, padding: '24px' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={18} color="#f59e0b" /> Follow-up
                                            </h3>
                                            <input
                                                type="date"
                                                value={followUpDate}
                                                onChange={(e) => setFollowUpDate(e.target.value)}
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAppointmentId(null)}
                                            style={{ padding: '14px 32px', borderRadius: '12px', border: '1px solid var(--border)', fontWeight: '700' }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            style={{ background: 'var(--primary)', color: 'white', padding: '14px 48px', borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            className="card-hover"
                                        >
                                            <Save size={20} /> Complete Consultation
                                        </button>
                                    </div>
                                </form>

                                {/* Patient Medical History Accordion (Simplified) */}
                                <div className="glass" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <History size={18} color="var(--text-muted)" /> Previous Consultations
                                    </h3>
                                    {patientHistory.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No previous records found.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {patientHistory.map((history, i) => (
                                                <div key={i} style={{ padding: '16px', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                    <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>{history.date}</p>
                                                    <p style={{ fontSize: '0.85rem' }}><strong>Diagnosis:</strong> {history.diagnosis}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
