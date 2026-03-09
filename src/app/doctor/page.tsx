'use client';

import { useState, useMemo } from 'react';
import { useHISStore, Consultation, Patient, Appointment, Report, NursingTask } from '@/store/hisStore';
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
    Search,
    AlertCircle,
    CheckCircle2,
    Clock,
    Bed,
    TrendingUp,
    Users,
    CheckSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

export default function DoctorPage() {
    const {
        appointments,
        patients,
        vitals,
        consultations,
        reports,
        rooms,
        admissions,
        addConsultation,
        updateAppointmentStatus,
        updatePatient,
        allocateRoom,
        addReport,
        addNursingTask,
        addAppointment,
        invoices,
        nursingNotes,
        medicationLogs,
        nursingTasks
    } = useHISStore();

    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'queue' | 'history'>('queue');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDoctor, setFilterDoctor] = useState('All Doctors');
    const [filterDept, setFilterDept] = useState('All Departments');

    // Consultation form state
    const [symptoms, setSymptoms] = useState('');
    const [observation, setObservation] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [treatmentPlan, setTreatmentPlan] = useState('');
    const [medicines, setMedicines] = useState([{ medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    const [labTests, setLabTests] = useState<string[]>([]);
    const [nursingInst, setNursingInst] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpNotes, setFollowUpNotes] = useState('');

    // Filtered Queue
    const filteredQueue = useMemo(() => {
        return appointments.filter(a => {
            const matchesSearch = a.patientName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDoctor = filterDoctor === 'All Doctors' || a.doctorName === filterDoctor;
            const matchesDept = filterDept === 'All Departments' || a.department === filterDept;
            const isActive = a.status === 'Checked-in' || a.status === 'Waiting' || a.status === 'In Consultation';
            return matchesSearch && matchesDoctor && matchesDept && isActive;
        }).sort((a, b) => {
            // Sort by priority first
            const priorityMap = { 'Emergency': 0, 'Urgent': 1, 'Normal': 2 };
            return (priorityMap[a.priority as keyof typeof priorityMap] || 2) - (priorityMap[b.priority as keyof typeof priorityMap] || 2);
        });
    }, [appointments, searchTerm, filterDoctor, filterDept]);

    const doctors = useMemo(() => ['All Doctors', ...Array.from(new Set(appointments.map(a => a.doctorName)))], [appointments]);
    const depts = useMemo(() => ['All Departments', ...Array.from(new Set(appointments.map(a => a.department)))], [appointments]);

    const currentAppointment = appointments.find(a => a.id === selectedAppointmentId);
    const currentPatient = currentAppointment ? patients.find(p => p.id === currentAppointment.patientId) : null;
    const currentVitals = currentPatient ? vitals.filter(v => v.patientId === currentPatient.id).slice(-1)[0] : null;

    const isVitalsStale = useMemo(() => {
        if (!currentVitals || !currentPatient || currentPatient.type !== 'IP') return false;
        const lastRecorded = new Date(currentVitals.recordedAt).getTime();
        const fourHoursAgo = new Date().getTime() - (4 * 60 * 60 * 1000);
        return lastRecorded < fourHoursAgo;
    }, [currentVitals, currentPatient]);

    // Intelligence Data
    const patientConsultations = currentPatient ? consultations.filter(c => c.patientId === currentPatient.id) : [];
    const patientReports = currentPatient ? reports.filter(r => r.patientId === currentPatient.id) : [];
    const patientAdmissions = currentPatient ? admissions.filter(adm => adm.patientId === currentPatient.id) : [];
    const patientNursingNotes = currentPatient ? nursingNotes.filter(n => n.patientId === currentPatient.id) : [];
    const patientMedLogs = currentPatient ? medicationLogs.filter(l => l.patientId === currentPatient.id) : [];
    const patientInvoices = currentPatient ? invoices.filter(i => i.patientId === currentPatient.id) : [];
    const patientNursingTasks = currentPatient ? nursingTasks.filter(t => t.patientId === currentPatient.id) : [];

    // All consultations for history view
    const doctorConsultations = useMemo(() => {
        return consultations.slice().reverse();
    }, [consultations]);

    // Analytics
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayAppts = appointments.filter(a => a.start.startsWith(today));
        return {
            total: todayAppts.length,
            completed: todayAppts.filter(a => a.status === 'Completed').length,
            pending: todayAppts.filter(a => a.status === 'Checked-in' || a.status === 'Waiting').length,
            emergency: todayAppts.filter(a => a.priority === 'Emergency').length
        };
    }, [appointments]);

    const handleAddMedicine = () => {
        setMedicines([...medicines, { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };

    const handleRemoveMedicine = (index: number) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const handleUpdateMedicine = (index: number, field: string, value: string) => {
        const newMedicines = [...medicines];
        (newMedicines[index] as any)[field] = value;
        setMedicines(newMedicines);
    };

    const handleAdmitPatient = () => {
        if (!currentPatient || !currentAppointment) return;

        // Find an available room
        const availableRoom = rooms.find(r => r.status === 'Available');
        if (!availableRoom) {
            alert('No rooms available for admission!');
            return;
        }

        // Trigger admission
        // allocateRoom in hisStore already generates an ID, so I should check if I need to pass one or if hisStore handles it.
        // Looking at hisStore.ts, it generates its own ID. So I don't need to pass one.
        allocateRoom(availableRoom.id, currentPatient.id, currentAppointment.id);

        updatePatient(currentPatient.id, { type: 'IP' });

        // Notify nursing
        const taskId = 'T' + Date.now().toString(36).slice(-6).toUpperCase();
        const task: NursingTask = {
            id: taskId,
            patientId: currentPatient.id,
            taskName: 'Initial IP Assessment',
            description: `Patient admitted from OP. Reason: ${currentAppointment.visitType}. Assigned to Room ${availableRoom.roomNumber}.`,
            time: new Date().toISOString(),
            status: 'Pending',
            priority: 'Urgent'
        };
        addNursingTask(task);

        alert(`Patient ${currentPatient.name} admitted to Room ${availableRoom.roomNumber}`);
    };

    const handleSaveConsultation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentAppointment || !currentPatient) return;

        const consultationDate = new Date().toISOString();
        const consultationId = 'C' + Date.now().toString(36).slice(-6).toUpperCase();

        const newConsultation: Consultation = {
            id: consultationId,
            appointmentId: currentAppointment.id,
            patientId: currentPatient.id,
            symptoms,
            observation,
            diagnosis,
            treatmentPlan,
            prescription: medicines.filter(m => m.medicine),
            labTests,
            nursingInstructions: nursingInst,
            followUpDate,
            date: consultationDate
        };

        // 1. Add Consultation
        addConsultation(newConsultation);

        // 2. Mark Appointment as Completed
        updateAppointmentStatus(currentAppointment.id, 'Completed');

        // 3. Create Lab Reports if any
        labTests.forEach(test => {
            const reportId = 'R' + Date.now().toString(36).slice(-6).toUpperCase() + Math.floor(Math.random() * 100);
            const report: Report = {
                id: reportId,
                patientId: currentPatient.id,
                patientName: currentPatient.name,
                testName: test,
                result: 'Pending',
                status: 'Processing',
                date: consultationDate
            };
            addReport(report);
        });

        // 4. Create Nursing Tasks from instructions
        if (nursingInst) {
            const taskId = 'T' + Date.now().toString(36).slice(-6).toUpperCase();
            const task: NursingTask = {
                id: taskId,
                patientId: currentPatient.id,
                taskName: 'Doctor Order',
                description: nursingInst,
                time: consultationDate,
                status: 'Pending',
                priority: 'Normal'
            };
            addNursingTask(task);
        }

        // 5. Create Follow-up appointment if scheduled
        if (followUpDate) {
            const followUpId = 'A' + Date.now().toString(36).slice(-6).toUpperCase();
            const followUpAppt: Appointment = {
                id: followUpId,
                patientId: currentPatient.id,
                patientName: currentPatient.name,
                patientType: currentPatient.type,
                doctorId: currentAppointment.doctorId,
                doctorName: currentAppointment.doctorName,
                department: currentAppointment.department,
                visitType: 'Follow-up Visit',
                status: 'Scheduled',
                paymentStatus: 'Pending',
                priority: 'Normal',
                insurance: currentAppointment.insurance,
                notes: followUpNotes || 'Scheduled from consultation',
                phone: currentPatient.phone,
                start: `${followUpDate}T10:00:00`,
                end: `${followUpDate}T10:30:00`,
                createdAt: consultationDate,
                updatedAt: consultationDate
            };
            addAppointment(followUpAppt);
        }

        setSelectedAppointmentId(null);
        resetForm();
    };

    const resetForm = () => {
        setSymptoms('');
        setObservation('');
        setDiagnosis('');
        setTreatmentPlan('');
        setMedicines([{ medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
        setLabTests([]);
        setNursingInst('');
        setFollowUpDate('');
        setFollowUpNotes('');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
            <Navbar />

            <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '24px' }} className="mobile-padding">

                {/* LEFT COLUMN: NAVIGATION & QUEUE */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '320px', flexShrink: 0 }} className="mobile-stack tablet-stack">
                    {/* Doctor Analytics Panel */}
                    <div className="glass" style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={18} color="var(--primary)" /> Morning Stats
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(var(--primary-rgb), 0.2)' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--primary)' }}>{stats.total}</p>
                            </div>
                            <div style={{ background: 'var(--success-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--success)' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>DONE</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--success)' }}>{stats.completed}</p>
                            </div>
                            <div style={{ background: 'var(--warning-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--warning)' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>PENDING</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--warning)' }}>{stats.pending}</p>
                            </div>
                            <div style={{ background: 'var(--error-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--error)' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>URGENT</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--error)' }}>{stats.emergency}</p>
                            </div>
                        </div>
                    </div>

                    {/* Appointment Queue Sidebar */}
                    <div className="glass" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', background: 'var(--background)', padding: '4px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                                <button
                                    onClick={() => setViewMode('queue')}
                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', background: viewMode === 'queue' ? 'var(--primary)' : 'transparent', color: viewMode === 'queue' ? 'white' : 'var(--text-muted)', fontWeight: '700', fontSize: '0.8rem', border: 'none' }}
                                >
                                    Queue
                                </button>
                                <button
                                    onClick={() => setViewMode('history')}
                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', background: viewMode === 'history' ? 'var(--primary)' : 'transparent', color: viewMode === 'history' ? 'white' : 'var(--text-muted)', fontWeight: '700', fontSize: '0.8rem', border: 'none' }}
                                >
                                    My History
                                </button>
                            </div>

                            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {viewMode === 'queue' ? <Users size={18} color="var(--primary)" /> : <History size={18} color="var(--primary)" />}
                                {viewMode === 'queue' ? 'Patient Queue' : 'Consultation History'}
                            </h3>

                            <div style={{ position: 'relative', marginBottom: '12px' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder={viewMode === 'queue' ? "Search patient..." : "Search history..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '10px', background: 'var(--background)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                                />
                            </div>

                            {viewMode === 'queue' && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                        value={filterDoctor}
                                        onChange={(e) => setFilterDoctor(e.target.value)}
                                        style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--border)', fontSize: '0.75rem' }}
                                    >
                                        {doctors.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <select
                                        value={filterDept}
                                        onChange={(e) => setFilterDept(e.target.value)}
                                        style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--border)', fontSize: '0.75rem' }}
                                    >
                                        {depts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {viewMode === 'queue' ? (
                                filteredQueue.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                        <Clock size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                        <p style={{ fontSize: '0.85rem' }}>No patients in queue.</p>
                                    </div>
                                ) : (
                                    filteredQueue.map((app) => (
                                        <motion.div
                                            key={app.id}
                                            onClick={() => setSelectedAppointmentId(app.id)}
                                            whileHover={{ x: 4 }}
                                            style={{
                                                padding: '14px',
                                                background: selectedAppointmentId === app.id ? 'rgba(var(--primary-rgb), 0.08)' : 'var(--background)',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                border: selectedAppointmentId === app.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {app.priority === 'Emergency' && (
                                                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'var(--error)' }} />
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                                                    TOKEN #{app.tokenNumber}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: '700',
                                                    color: app.priority === 'Emergency' ? 'var(--error)' : app.priority === 'Urgent' ? 'var(--warning)' : 'var(--text-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    {app.priority === 'Emergency' && <AlertCircle size={10} />} {app.priority}
                                                </span>
                                            </div>
                                            <h4 style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '2px' }}>{app.patientName}</h4>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.visitType}</p>
                                                <p style={{ fontSize: '0.75rem', fontWeight: '600' }}>{new Date(app.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </motion.div>
                                    ))
                                )
                            ) : (
                                doctorConsultations.filter(c => patients.find(p => p.id === c.patientId)?.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                        <History size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                        <p style={{ fontSize: '0.85rem' }}>No history records.</p>
                                    </div>
                                ) : (
                                    doctorConsultations.filter(c => patients.find(p => p.id === c.patientId)?.name.toLowerCase().includes(searchTerm.toLowerCase())).map((cons) => (
                                        <div
                                            key={cons.id}
                                            style={{ padding: '12px', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>{new Date(cons.date).toLocaleDateString()}</span>
                                                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--primary)' }}>{cons.id}</span>
                                            </div>
                                            <h4 style={{ fontWeight: '800', fontSize: '0.85rem' }}>{patients.find(p => p.id === cons.patientId)?.name}</h4>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cons.diagnosis}</p>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>
                </aside>

                {/* CENTER COLUMN: CONSULTATION PANEL */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '400px' }} className="mobile-grid-1">
                    {!selectedAppointmentId ? (
                        <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', minHeight: '600px' }}>
                            <Stethoscope size={80} style={{ marginBottom: '24px', opacity: 0.1 }} />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Ready for Consultation</h2>
                            <p>Please select a patient from the queue to load records.</p>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                        >
                            {/* Patient Summary Header */}
                            <div className="glass" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', background: 'rgba(var(--primary-rgb), 0.15)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <User size={32} />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{currentPatient?.name}</h2>
                                            <span style={{ fontSize: '0.8rem', background: 'var(--primary)10', color: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', fontWeight: '700' }}>
                                                {currentPatient?.type} - {currentPatient?.id}
                                            </span>
                                        </div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {currentPatient?.age} yrs • {currentPatient?.gender} • Blood Group: <span style={{ color: 'var(--error)', fontWeight: '700' }}>{currentPatient?.bloodGroup}</span>
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={handleAdmitPatient}
                                        disabled={currentPatient?.type === 'IP'}
                                        style={{
                                            padding: '12px 20px',
                                            borderRadius: '12px',
                                            background: currentPatient?.type === 'IP' ? 'var(--border)' : 'rgba(var(--primary-rgb), 0.15)',
                                            color: currentPatient?.type === 'IP' ? 'var(--text-muted)' : 'var(--primary)',
                                            fontWeight: '700',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            border: 'none',
                                            cursor: currentPatient?.type === 'IP' ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <Bed size={18} /> Admit Patient
                                    </button>
                                </div>
                            </div>

                            {/* Current Vitals Section */}
                            <div className="glass" style={{ padding: '20px', background: 'rgba(var(--primary-rgb), 0.03)', border: '1px solid rgba(var(--primary-rgb), 0.15)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Activity size={18} color="var(--primary)" /> Triage Vitals
                                    </h3>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: isVitalsStale ? 'var(--error)' : 'var(--text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontWeight: isVitalsStale ? '800' : '400'
                                    }}>
                                        {isVitalsStale && <AlertCircle size={14} />}
                                        Last Recorded: {currentVitals ? (currentVitals.recordedAt.includes(',') ? currentVitals.recordedAt.split(', ')[1] : new Date(currentVitals.recordedAt).toLocaleTimeString()) : 'N/A'}
                                        {isVitalsStale && ' (Outdated)'}
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                    {[
                                        { label: 'BP', value: currentVitals?.bloodPressure || '--/--', unit: 'mmHg', icon: '💓' },
                                        { label: 'Pulse', value: currentVitals?.pulse || '--', unit: 'bpm', icon: '🫀' },
                                        { label: 'Temp', value: currentVitals?.temperature || '--', unit: '°C', icon: '🌡️' },
                                        { label: 'SpO2', value: currentVitals?.oxygenSaturation || '--', unit: '%', icon: '🫁' },
                                    ].map((v, i) => (
                                        <div key={i} style={{ background: 'var(--background)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>{v.label} {v.icon}</p>
                                            <p style={{ fontSize: '1.1rem', fontWeight: '800' }}>{v.value} <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>{v.unit}</span></p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Main Consultation Form */}
                            <form onSubmit={handleSaveConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="glass" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileText size={20} color="var(--primary)" /> Clinical Findings
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', display: 'block' }}>CHIEF COMPLAINTS / SYMPTOMS</label>
                                            <textarea
                                                value={symptoms}
                                                onChange={(e) => setSymptoms(e.target.value)}
                                                placeholder="e.g. Fever since 3 days, cough..."
                                                style={{ width: '100%', height: '100px', padding: '14px', borderRadius: '12px', background: 'var(--background)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', display: 'block' }}>CLINICAL OBSERVATION</label>
                                            <textarea
                                                value={observation}
                                                onChange={(e) => setObservation(e.target.value)}
                                                placeholder="General condition, heart sounds, lungs..."
                                                style={{ width: '100%', height: '100px', padding: '14px', borderRadius: '12px', background: 'var(--background)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', display: 'block' }}>FINAL DIAGNOSIS</label>
                                            <textarea
                                                value={diagnosis}
                                                onChange={(e) => setDiagnosis(e.target.value)}
                                                placeholder="e.g. Acute Viral Bronchitis"
                                                style={{ width: '100%', height: '100px', padding: '14px', borderRadius: '12px', background: 'var(--background)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '8px', display: 'block' }}>TREATMENT PLAN</label>
                                            <textarea
                                                value={treatmentPlan}
                                                onChange={(e) => setTreatmentPlan(e.target.value)}
                                                placeholder="Summary of therapeutic approach..."
                                                style={{ width: '100%', height: '100px', padding: '14px', borderRadius: '12px', background: 'var(--background)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Prescription Management */}
                                <div className="glass" style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Pill size={20} color="var(--accent)" /> Digital Prescription
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={handleAddMedicine}
                                            style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--primary)', color: 'white', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Plus size={16} /> Add Drug
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {medicines.map((med, idx) => (
                                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr 40px', gap: '12px', alignItems: 'end', background: 'var(--background)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>MEDICINE NAME</label>
                                                    <input
                                                        type="text"
                                                        value={med.medicine}
                                                        onChange={(e) => handleUpdateMedicine(idx, 'medicine', e.target.value)}
                                                        placeholder="e.g. Augmentin 625mg"
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>DOSAGE</label>
                                                    <input
                                                        type="text"
                                                        value={med.dosage}
                                                        onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                                                        placeholder="1 Tablet"
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>FREQ</label>
                                                    <input
                                                        type="text"
                                                        value={med.frequency}
                                                        onChange={(e) => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                                                        placeholder="1-0-1"
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>DUR</label>
                                                    <input
                                                        type="text"
                                                        value={med.duration}
                                                        onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                                                        placeholder="5 Days"
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>INSTRUCTIONS</label>
                                                    <input
                                                        type="text"
                                                        value={med.instructions}
                                                        onChange={(e) => handleUpdateMedicine(idx, 'instructions', e.target.value)}
                                                        placeholder="After breakfast & dinner"
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMedicine(idx)}
                                                    style={{ height: '40px', color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                    disabled={medicines.length === 1}
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    {/* Diagnostic Orders */}
                                    <div className="glass" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Activity size={20} color="#8b5cf6" /> Diagnostic Orders
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                            {['CBC (Blood Test)', 'X-Ray Chest', 'MRI Brain', 'CT Abdomen', 'Urine Analysis', 'ECG'].map(test => (
                                                <label key={test} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={labTests.includes(test)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setLabTests([...labTests, test]);
                                                            else setLabTests(labTests.filter(t => t !== test));
                                                        }}
                                                    />
                                                    {test}
                                                </label>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Other specific test..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const val = (e.target as HTMLInputElement).value;
                                                    if (val && !labTests.includes(val)) {
                                                        setLabTests([...labTests, val]);
                                                        (e.target as HTMLInputElement).value = '';
                                                    }
                                                }
                                            }}
                                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)' }}
                                        />
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                            {labTests.map(t => (
                                                <span key={t} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {t} <Trash2 size={12} onClick={() => setLabTests(labTests.filter(lab => lab !== t))} style={{ cursor: 'pointer' }} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Follow-up & Nursing */}
                                    <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={20} color="#f59e0b" /> Follow-up Schedule
                                            </h3>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <input
                                                    type="date"
                                                    value={followUpDate}
                                                    onChange={(e) => setFollowUpDate(e.target.value)}
                                                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Reason for follow-up"
                                                    value={followUpNotes}
                                                    onChange={(e) => setFollowUpNotes(e.target.value)}
                                                    style={{ flex: 1.5, padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)' }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <CheckSquare size={20} color="#10b981" /> Nursing Instructions
                                            </h3>
                                            <textarea
                                                value={nursingInst}
                                                onChange={(e) => setNursingInst(e.target.value)}
                                                placeholder="Instructions for ward nurses (e.g. Check vitals every 2 hours)..."
                                                style={{ width: '100%', height: '80px', padding: '14px', borderRadius: '12px', background: 'var(--background)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '40px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedAppointmentId(null)}
                                        style={{ padding: '16px 40px', borderRadius: '12px', background: 'var(--background)', border: '1px solid var(--border)', fontWeight: '800', cursor: 'pointer' }}
                                    >
                                        Disregard
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', padding: '16px 60px', borderRadius: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(var(--primary-rgb), 0.3)' }}
                                    >
                                        <CheckCircle2 size={24} /> Complete Consultation
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </div>

                {/* RIGHT COLUMN: PATIENT INTELLIGENCE */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '350px', flexShrink: 0 }} className="mobile-stack tablet-stack">
                    <div className="glass" style={{ padding: '24px', flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '900', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <History size={20} color="var(--primary)" /> Case Intelligence
                        </h3>

                        {!currentPatient ? (
                            <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
                                <AlertCircle size={40} style={{ marginBottom: '16px', opacity: 0.1 }} />
                                <p>Select patient for history</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                {/* Timeline Section */}
                                <section>
                                    <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        CARE TIMELINE <Clock size={12} />
                                    </h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflowY: 'auto', maxHeight: '500px', paddingRight: '10px' }}>
                                        <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)' }} />

                                        {/* Billing Alerts */}
                                        {patientInvoices.filter(i => i.status === 'Unpaid').map(inv => (
                                            <div key={inv.id} style={{ position: 'relative', paddingLeft: '32px' }}>
                                                <div style={{ position: 'absolute', left: '0', top: '4px', width: '24px', height: '24px', background: 'var(--error)', borderRadius: '50%', border: '4px solid var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                    <FileText size={10} />
                                                </div>
                                                <div style={{ background: 'var(--error-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--error)' }}>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--error)', fontWeight: '800' }}>UNPAID INVOICE</p>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>Amount Due: ₹{inv.finalAmount}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(inv.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Admissions */}
                                        {patientAdmissions.map(adm => (
                                            <div key={adm.id} style={{ position: 'relative', paddingLeft: '32px' }}>
                                                <div style={{ position: 'absolute', left: '0', top: '4px', width: '24px', height: '24px', background: '#3b82f6', borderRadius: '50%', border: '4px solid var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                    <Bed size={10} />
                                                </div>
                                                <div style={{ background: '#3b82f610', padding: '12px', borderRadius: '12px', border: '1px solid #3b82f620' }}>
                                                    <p style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: '800' }}>ADMISSION</p>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>Hospitalized (Room {rooms.find(r => r.id === adm.roomId)?.roomNumber})</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(adm.admissionDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Medication Logs */}
                                        {patientMedLogs.slice().reverse().map(log => (
                                            <div key={log.id} style={{ position: 'relative', paddingLeft: '32px' }}>
                                                <div style={{ position: 'absolute', left: '0', top: '4px', width: '24px', height: '24px', background: 'var(--success)', borderRadius: '50%', border: '4px solid var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                    <Pill size={10} />
                                                </div>
                                                <div style={{ background: 'var(--success-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--success)' }}>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: '800' }}>MEDICATION {log.status}</p>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>{log.medicineName} ({log.dosage})</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.timestamp}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Nursing Notes */}
                                        {patientNursingNotes.slice().reverse().map(note => (
                                            <div key={note.id} style={{ position: 'relative', paddingLeft: '32px' }}>
                                                <div style={{ position: 'absolute', left: '0', top: '4px', width: '24px', height: '24px', background: 'var(--warning)', borderRadius: '50%', border: '4px solid var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                    <Clipboard size={10} />
                                                </div>
                                                <div style={{ background: 'var(--warning-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--warning)' }}>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: '800' }}>NURSING NOTE</p>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{note.note}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{note.timestamp}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Consultations */}
                                        {patientConsultations.slice().reverse().map(cons => (
                                            <div key={cons.id} style={{ position: 'relative', paddingLeft: '32px' }}>
                                                <div style={{ position: 'absolute', left: '0', top: '4px', width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '50%', border: '4px solid var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                    <Stethoscope size={10} />
                                                </div>
                                                <div style={{ background: 'rgba(var(--primary-rgb), 0.05)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '800' }}>CONSULTATION</p>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: '800' }}>{cons.diagnosis}</p>
                                                    {cons.prescription.length > 0 && (
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Rx: {cons.prescription.map(p => p.medicine).join(', ')}</p>
                                                    )}
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(cons.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Reports */}
                                        {patientReports.slice().reverse().map(rep => (
                                            <div key={rep.id} style={{ position: 'relative', paddingLeft: '32px' }}>
                                                <div style={{ position: 'absolute', left: '0', top: '4px', width: '24px', height: '24px', background: '#8b5cf6', borderRadius: '50%', border: '4px solid var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                    <Activity size={10} />
                                                </div>
                                                <div style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                    <p style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: '800' }}>DIAGNOSTIC</p>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>{rep.testName}</p>
                                                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: rep.status === 'Ready' ? 'var(--success)' : 'var(--warning)' }}>
                                                        Status: {rep.status}
                                                    </p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(rep.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Nursing Tasks */}
                                        {patientNursingTasks.slice().reverse().map(task => (
                                            <div key={task.id} style={{ position: 'relative', paddingLeft: '32px' }}>
                                                <div style={{
                                                    position: 'absolute', left: '0', top: '4px', width: '24px', height: '24px',
                                                    background: task.status === 'Completed' ? 'var(--success)' : 'var(--text-muted)',
                                                    borderRadius: '50%', border: '4px solid var(--background)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                                }}>
                                                    <CheckSquare size={10} />
                                                </div>
                                                <div style={{ background: task.status === 'Completed' ? 'var(--success-bg)' : 'rgba(var(--text-muted-rgb), 0.05)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                    <p style={{ fontSize: '0.7rem', color: task.status === 'Completed' ? 'var(--success)' : 'var(--text-muted)', fontWeight: '800' }}>NURSING TASK {task.status.toUpperCase()}</p>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>{task.taskName}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.description}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Due: {task.time}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Blank state for timeline */}
                                        {patientConsultations.length === 0 && patientReports.length === 0 && patientAdmissions.length === 0 && patientNursingNotes.length === 0 && patientMedLogs.length === 0 && patientNursingTasks.length === 0 && (
                                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                New Patient - No past timeline records.
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Allergies & Alerts */}
                                <section style={{ marginTop: '12px' }}>
                                    <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--error)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        CRITICAL ALERTS <AlertCircle size={12} />
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '14px', borderRadius: '12px', border: '1px dashed rgba(239, 68, 68, 0.3)' }}>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--error)', fontWeight: '800', marginBottom: '4px' }}>KNOWN ALLERGIES</p>
                                            {currentPatient?.allergies && currentPatient.allergies.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {currentPatient.allergies.map(a => <span key={a} style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>{a}</span>)}
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>NKDA (No Known Drug Allergies)</p>
                                            )}
                                        </div>
                                    </div>
                                </section>

                            </div>
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
}
