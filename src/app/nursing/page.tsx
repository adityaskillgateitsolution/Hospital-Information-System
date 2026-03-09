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
    History,
    Search,
    Filter,
    Stethoscope,
    User,
    Clock,
    Droplets,
    Wind,
    Scale,
    Pill,
    MessageSquare,
    ListTodo,
    ChevronRight,
    TrendingUp,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

export default function NursingPage() {
    const {
        appointments,
        patients,
        vitals,
        rooms,
        admissions,
        consultations,
        nursingNotes,
        nursingTasks,
        medicationLogs,
        addVitals,
        addNursingNote,
        addNursingTask,
        updateNursingTaskStatus,
        logMedication,
        dischargePatient
    } = useHISStore();

    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [wardFilter, setWardFilter] = useState('All');

    // Form States
    const [vitalsForm, setVitalsForm] = useState({
        bp: '',
        pulse: '',
        temp: '',
        spo2: '',
        rr: '',
        weight: ''
    });
    const [newNote, setNewNote] = useState('');
    const [activeSection, setActiveSection] = useState<'vitals' | 'meds' | 'notes' | 'tasks' | 'orders'>('vitals');

    // Selected Patient Data
    const selectedPatient = patients.find((p: Patient) => p.id === selectedPatientId);
    const selectedAdmission = admissions.find((a: any) => a.patientId === selectedPatientId && a.status === 'Admitted');
    const selectedRoom = rooms.find((r: any) => r.id === selectedAdmission?.roomId);
    const selectedVitals = vitals.filter((v: Vitals) => v.patientId === selectedPatientId);
    const selectedNotes = nursingNotes.filter((n: any) => n.patientId === selectedPatientId);
    const selectedTasks = nursingTasks.filter((t: any) => t.patientId === selectedPatientId);
    const selectedLogs = medicationLogs.filter((l: any) => l.patientId === selectedPatientId);

    // Latest consultation for prescriptions
    const patientConsultations = consultations.filter((c: any) => c.patientId === selectedPatientId);
    const latestConsultation = patientConsultations.length > 0
        ? patientConsultations.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;

    // Filtered Queue
    const queuePatients = patients.filter((p: Patient) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.nursingStatus === statusFilter;

        const admission = admissions.find((a: any) => a.patientId === p.id && a.status === 'Admitted');
        const room = rooms.find((r: any) => r.id === admission?.roomId);
        const matchesWard = wardFilter === 'All' || room?.wardType === wardFilter;

        // Either an active admission OR an appointment for today (Scheduled, Checked-in, or Waiting)
        const hasActiveAdmission = !!admission;
        const hasTodayAppointment = appointments.some((a: any) =>
            a.patientId === p.id &&
            ['Scheduled', 'Confirmed', 'Checked-in', 'Waiting'].includes(a.status) &&
            a.start.startsWith(new Date().toISOString().split('T')[0])
        );

        return matchesSearch && matchesStatus && matchesWard && (hasActiveAdmission || hasTodayAppointment);
    });

    // Analytics Dashboard Stats
    const stats = {
        total: queuePatients.length,
        critical: queuePatients.filter((p: Patient) => p.nursingStatus === 'Critical').length,
        vitalsToday: vitals.filter((v: Vitals) => v.recordedAt.startsWith(new Date().toLocaleDateString())).length,
        pendingTasks: nursingTasks.filter((t: any) => t.status === 'Pending').length,
        medsGiven: medicationLogs.filter((l: any) => l.status === 'Given' && l.timestamp.startsWith(new Date().toLocaleDateString())).length
    };

    const handleSaveVitals = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId) return;

        const newEntry: Vitals = {
            id: 'VIT-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            patientId: selectedPatientId,
            bloodPressure: vitalsForm.bp,
            pulse: parseInt(vitalsForm.pulse),
            temperature: parseFloat(vitalsForm.temp),
            oxygenSaturation: parseInt(vitalsForm.spo2),
            respiratoryRate: parseInt(vitalsForm.rr),
            weight: parseFloat(vitalsForm.weight),
            recordedAt: new Date().toLocaleString()
        };

        addVitals(newEntry);
        setVitalsForm({ bp: '', pulse: '', temp: '', spo2: '', rr: '', weight: '' });
    };

    const handleAddNote = () => {
        if (!selectedPatientId || !newNote.trim()) return;
        addNursingNote({
            id: 'NOTE-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            patientId: selectedPatientId,
            note: newNote,
            nurseName: 'Nurse J. Doe',
            timestamp: new Date().toLocaleString()
        });
        setNewNote('');
    };

    const handleMedAction = (medName: string, dosage: string, status: 'Given' | 'Skipped') => {
        if (!selectedPatientId) return;
        logMedication({
            id: 'MLOG-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            patientId: selectedPatientId,
            medicineName: medName,
            dosage: dosage,
            status,
            timestamp: new Date().toLocaleString()
        });
    };

    const isCritical = (p: Patient) => {
        return p.nursingStatus === 'Critical';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Critical': return '#ef4444';
            case 'Urgent': return '#f59e0b';
            case 'Stable': return '#10b981';
            case 'Observation': return '#3b82f6';
            case 'Discharged': return '#6b7280';
            default: return 'var(--text-muted)';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'Emergency': return '🔴';
            case 'Urgent': return '🟡';
            case 'Normal': return '🟢';
            default: return '⚪';
        }
    };

    const getTimeAgo = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr.replace(', ', ' ')); // Handle our custom date format if needed
        const timestamp = date.getTime();
        if (isNaN(timestamp)) return dateStr;

        const now = new Date().getTime();
        const diffInMins = Math.floor((now - timestamp) / 60000);

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins} min ago`;
        const diffInHrs = Math.floor(diffInMins / 60);
        if (diffInHrs < 24) return `${diffInHrs} hr ago`;
        return date.toLocaleDateString();
    };

    // Dynamic Care Timeline logic
    const timelineEvents = [
        ...(selectedNotes.map(n => ({ time: n.timestamp, event: `Observation: ${n.note.substring(0, 30)}...`, type: 'nurse', icon: MessageSquare }))),
        ...(selectedLogs.map(l => ({ time: l.timestamp, event: `Medication ${l.status}: ${l.medicineName}`, type: 'nurse', icon: Pill }))),
        ...(vitals.filter((v: Vitals) => v.patientId === selectedPatientId).map(v => ({ time: v.recordedAt, event: `Vitals recorded: ${v.temperature}°C, ${v.pulse} bpm`, type: 'nurse', icon: Activity }))),
        ...(consultations.filter((c: any) => c.patientId === selectedPatientId).map(c => ({ time: c.date, event: `Doctor Consultation: ${c.diagnosis}`, type: 'doctor', icon: Stethoscope }))),
        ...(selectedTasks.filter(t => t.status === 'Completed').map(t => ({ time: 'Completed', event: `Task Done: ${t.taskName}`, type: 'nurse', icon: CheckCircle2 })))
    ].sort((a, b) => {
        if (a.time === 'Completed' || b.time === 'Completed') return 0;
        return new Date(b.time.replace(', ', ' ')).getTime() - new Date(a.time.replace(', ', ' ')).getTime();
    }).slice(0, 10);

    // Alerts logic (Ward-wide clinical red flags)
    const alerts = vitals.filter((v: Vitals) => {
        return v.temperature > 39 || v.oxygenSaturation < 92 || v.pulse > 120 || v.pulse < 50;
    }).slice(-8).reverse();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background-soft)', paddingBottom: '40px' }}>
            <Navbar />

            <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 24px' }}>
                <style>{`
                    .row-hover:hover {
                        background: rgba(var(--primary-rgb), 0.04) !important;
                    }
                    .row-hover td {
                        transition: all 0.2s;
                    }
                    .row-hover:hover td {
                        color: var(--primary);
                    }
                `}</style>
                {/* Analytics Header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px', marginTop: '24px' }} className="mobile-grid-1">
                    {[
                        { label: 'Total Patients', value: stats.total, icon: User, color: 'var(--primary)' },
                        { label: 'Critical Cases', value: stats.critical, icon: AlertCircle, color: 'var(--error)' },
                        { label: 'Vitals Today', value: stats.vitalsToday, icon: Activity, color: 'var(--primary-glow)' },
                        { label: 'Meds Given', value: stats.medsGiven, icon: Pill, color: 'var(--success)' },
                        { label: 'Pending Tasks', value: stats.pendingTasks, icon: ListTodo, color: 'var(--warning)' }
                    ].map((stat, i) => (
                        <div key={i} className="glass" style={{ padding: '20px', borderLeft: `4px solid ${stat.color}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</p>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stat.value}</h3>
                                </div>
                                <stat.icon size={24} color={stat.color} style={{ opacity: 0.2 }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', minHeight: 'calc(100vh - 280px)' }}>

                    {/* Left Panel: Patient Queue (Table) */}
                    <div className="glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minWidth: '350px', maxHeight: '600px' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Patient Queue</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--background)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <Search size={14} color="var(--text-muted)" />
                                        <input
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', width: '120px', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.75rem', background: 'var(--background)' }}
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Stable">Stable</option>
                                        <option value="Observation">Observation</option>
                                        <option value="Critical">Critical</option>
                                        <option value="Waiting">Waiting</option>
                                        <option value="Discharged">Discharged</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                                            <th style={{ padding: '12px 8px' }}>Patient</th>
                                            <th style={{ padding: '12px 8px' }}>Room</th>
                                            <th style={{ padding: '12px 8px' }}>Doctor</th>
                                            <th style={{ padding: '12px 8px' }}>Status</th>
                                            <th style={{ padding: '12px 8px' }}>Priority</th>
                                            <th style={{ padding: '12px 8px' }}>Last Vitals</th>
                                            <th style={{ padding: '12px 8px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {queuePatients.map((p: Patient) => {
                                            const admission = admissions.find((a: any) => a.patientId === p.id && a.status === 'Admitted');
                                            const room = rooms.find((r: any) => r.id === admission?.roomId);
                                            const lastV = vitals.filter((v: Vitals) => v.patientId === p.id).slice(-1)[0];
                                            const appointment = appointments.find((a: any) => a.patientId === p.id && a.status !== 'Completed' && a.status !== 'Cancelled');

                                            return (
                                                <tr
                                                    key={p.id}
                                                    onClick={() => setSelectedPatientId(p.id)}
                                                    style={{
                                                        borderBottom: '1px solid var(--border)',
                                                        cursor: 'pointer',
                                                        background: selectedPatientId === p.id ? 'rgba(var(--primary-rgb), 0.08)' : 'transparent',
                                                        transition: 'background 0.2s',
                                                        borderLeft: p.nursingPriority === 'Emergency' ? '3px solid var(--error)' : 'none'
                                                    }}
                                                    className="row-hover"
                                                >
                                                    <td style={{ padding: '12px 8px' }}>
                                                        <div style={{ fontWeight: '700' }}>{p.name}</div>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{p.id}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 8px' }}>
                                                        {room ? (
                                                            <span>{room.roomNumber}-{room.bedNumber}</span>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)' }}>OP</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px 8px' }}>
                                                        <div style={{ fontSize: '0.75rem' }}>{appointment?.doctorName || 'Not Assigned'}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 8px' }}>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800',
                                                            background: getStatusColor(p.nursingStatus) + '15',
                                                            color: getStatusColor(p.nursingStatus)
                                                        }}>
                                                            {p.nursingStatus.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                        <span title={p.nursingPriority}>{getPriorityIcon(p.nursingPriority)}</span>
                                                    </td>
                                                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                                        {lastV ? getTimeAgo(lastV.recordedAt) : 'Never'}
                                                    </td>
                                                    <td style={{ padding: '12px 8px' }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedPatientId(p.id);
                                                            }}
                                                            style={{
                                                                padding: '4px 8px', borderRadius: '6px', background: 'var(--primary)',
                                                                color: 'white', fontSize: '0.7rem', fontWeight: '700', border: 'none'
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Center Panel: Active Care */}
                    <div style={{ flex: 2, minWidth: '400px', paddingRight: '4px' }} className="mobile-grid-1">
                        {!selectedPatient ? (
                            <div className="glass" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
                                <ClipboardCheck size={64} style={{ marginBottom: '20px', opacity: 0.1 }} />
                                <h3>Select a patient to begin clinical care</h3>
                                <p style={{ maxWidth: '300px' }}>Monitor vitals, record observations, and manage medication schedules.</p>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Patient Detail Header */}
                                <div className="glass" style={{ padding: '24px', background: 'linear-gradient(to right, rgba(var(--primary-rgb), 0.1), transparent)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={28} />
                                            </div>
                                            <div>
                                                <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{selectedPatient.name}</h2>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {selectedPatient.age}y • {selectedPatient.gender} • {selectedPatient.bloodGroup} • {selectedRoom ? `Ward: ${selectedRoom.wardType} (R-${selectedRoom.roomNumber})` : 'Outpatient'}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>ASSIGNED DOCTOR</p>
                                            <p style={{ fontWeight: '700' }}>
                                                {appointments.find(a => a.patientId === selectedPatientId && a.status !== 'Completed')?.doctorName || 'Not Assigned'}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '20px', padding: '12px', background: 'var(--background-soft)', borderRadius: '10px', display: 'flex', gap: '20px' }}>
                                        <div>
                                            <p style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)' }}>PRIMARY DIAGNOSIS</p>
                                            <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>{latestConsultation?.diagnosis || 'Pending Assessment'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs for Clinical Sections */}
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }} className="mobile-grid-1">
                                    <style>{`
                                        @media (max-width: 768px) {
                                            .mobile-tabs {
                                                display: grid !important;
                                                grid-template-columns: 1fr 1fr !important;
                                            }
                                        }
                                    `}</style>
                                    {[
                                        { id: 'vitals', label: 'Vitals', icon: Activity },
                                        { id: 'meds', label: 'Medication', icon: Pill },
                                        { id: 'notes', label: 'Observation Notes', icon: MessageSquare },
                                        { id: 'tasks', label: 'Nursing Tasks', icon: ListTodo },
                                        { id: 'orders', label: 'Doctor\'s Orders', icon: ClipboardCheck }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveSection(tab.id as any)}
                                            style={{
                                                flex: 1, padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                background: activeSection === tab.id ? 'var(--primary)' : 'var(--glass)',
                                                color: activeSection === tab.id ? 'white' : 'var(--text-main)',
                                                border: '1px solid var(--border)', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                                            }}
                                        >
                                            <tab.icon size={16} /> {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <AnimatePresence mode="wait">
                                    {activeSection === 'vitals' && (
                                        <motion.div key="vitals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                            <div className="glass" style={{ padding: '24px' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <TrendingUp size={18} color="var(--primary)" /> Clinical Vitals Recording
                                                </h3>
                                                <form onSubmit={handleSaveVitals} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }} className="mobile-grid-1">
                                                    {[
                                                        { id: 'bp', label: 'BP (mmHg)', icon: Activity, placeholder: '120/80' },
                                                        { id: 'pulse', label: 'Pulse (bpm)', icon: Heart, placeholder: '72' },
                                                        { id: 'temp', label: 'Temp (°C)', icon: Thermometer, placeholder: '36.6' },
                                                        { id: 'spo2', label: 'SpO2 (%)', icon: Wind, placeholder: '98' },
                                                        { id: 'rr', label: 'Resp. Rate', icon: Droplets, placeholder: '16' },
                                                        { id: 'weight', label: 'Weight (kg)', icon: Scale, placeholder: '70' }
                                                    ].map(field => (
                                                        <div key={field.id}>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>
                                                                <field.icon size={14} /> {field.label}
                                                            </label>
                                                            <input
                                                                value={(vitalsForm as any)[field.id]}
                                                                onChange={(e) => setVitalsForm({ ...vitalsForm, [field.id]: e.target.value })}
                                                                placeholder={field.placeholder}
                                                                required
                                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                                            />
                                                        </div>
                                                    ))}
                                                    <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end' }}>
                                                        <button type="submit" style={{ background: 'var(--primary)', color: 'white', padding: '12px 32px', borderRadius: '10px', fontWeight: '700' }} className="card-hover">Save Entry</button>
                                                    </div>
                                                </form>
                                            </div>

                                            <div className="glass" style={{ padding: '24px', marginTop: '24px' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '20px' }}>Vitals History</h3>
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                        <thead>
                                                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                                                                <th style={{ padding: '12px' }}>Time</th>
                                                                <th style={{ padding: '12px' }}>BP</th>
                                                                <th style={{ padding: '12px' }}>Pulse</th>
                                                                <th style={{ padding: '12px' }}>Temp</th>
                                                                <th style={{ padding: '12px' }}>SpO2</th>
                                                                <th style={{ padding: '12px' }}>RR</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedVitals.slice().reverse().map((v: Vitals, i: number) => (
                                                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                                    <td style={{ padding: '12px', fontWeight: '600' }}>{v.recordedAt.split(', ')[1]}</td>
                                                                    <td style={{ padding: '12px' }}>{v.bloodPressure}</td>
                                                                    <td style={{ padding: '12px' }}>{v.pulse}</td>
                                                                    <td style={{ padding: '12px', color: v.temperature > 38 ? '#ef4444' : 'inherit' }}>{v.temperature}°C</td>
                                                                    <td style={{ padding: '12px', color: v.oxygenSaturation < 94 ? '#ef4444' : 'inherit' }}>{v.oxygenSaturation}%</td>
                                                                    <td style={{ padding: '12px' }}>{v.respiratoryRate}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeSection === 'meds' && (
                                        <motion.div key="meds" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div className="glass" style={{ padding: '24px' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '20px' }}>Current Prescriptions</h3>
                                                {!latestConsultation ? (
                                                    <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                                                        <p style={{ color: 'var(--text-muted)' }}>No medications currently prescribed by doctor.</p>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                        {latestConsultation.prescription.map((m: any, i: number) => {
                                                            const isGiven = selectedLogs.some((l: any) => l.medicineName === m.medicine && l.status === 'Given' && l.timestamp.startsWith(new Date().toLocaleDateString()));
                                                            return (
                                                                <div key={i} style={{ padding: '16px', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div>
                                                                        <h4 style={{ fontWeight: '700' }}>{m.medicine}</h4>
                                                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dosage: {m.dosage} | Frequency: {m.frequency}</p>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                                        {isGiven ? (
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '700', fontSize: '0.85rem' }}>
                                                                                <CheckCircle2 size={16} /> GIVEN TODAY
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <button onClick={() => handleMedAction(m.medicine, m.dosage, 'Skipped')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700' }}>Skip</button>
                                                                                <button onClick={() => handleMedAction(m.medicine, m.dosage, 'Given')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontSize: '0.75rem', fontWeight: '700' }}>Mark Given</button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="glass" style={{ padding: '24px' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '20px' }}>Administration History</h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {selectedLogs.slice().reverse().map((l: any, i: number) => (
                                                        <div key={i} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid var(--border)' }}>
                                                            <span><strong>{l.medicineName}</strong> ({l.dosage}) - {l.status}</span>
                                                            <span style={{ color: 'var(--text-muted)' }}>{l.timestamp}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeSection === 'notes' && (
                                        <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                            <div className="glass" style={{ padding: '24px' }}>
                                                <textarea
                                                    placeholder="Write observation notes here..."
                                                    value={newNote}
                                                    onChange={(e) => setNewNote(e.target.value)}
                                                    style={{ width: '100%', minHeight: '120px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', marginBottom: '16px' }}
                                                />
                                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button onClick={handleAddNote} style={{ background: 'var(--primary)', color: 'white', padding: '10px 24px', borderRadius: '10px', fontWeight: '700' }}>Add Note</button>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {selectedNotes.slice().reverse().map((n: any, i: number) => (
                                                    <div key={i} className="glass" style={{ padding: '20px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                            <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>{n.nurseName}</span>
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{n.timestamp}</span>
                                                        </div>
                                                        <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{n.note}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeSection === 'tasks' && (
                                        <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                            <div className="glass" style={{ padding: '24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Pending Duty Tasks</h3>
                                                    <button
                                                        onClick={() => addNursingTask({
                                                            id: 'TSK-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                                                            patientId: selectedPatientId!,
                                                            taskName: 'Check Vitals',
                                                            time: 'Next hour',
                                                            status: 'Pending',
                                                            priority: 'Normal'
                                                        })}
                                                        style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '700' }}
                                                    >
                                                        + Add Task
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {selectedTasks.length === 0 ? (
                                                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No tasks scheduled.</p>
                                                    ) : (
                                                        selectedTasks.map((t: any, i: number) => (
                                                            <div key={i} style={{
                                                                padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: t.status === 'Completed' ? 'rgba(0,0,0,0.02)' : 'var(--background)',
                                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: t.status === 'Completed' ? 0.6 : 1
                                                            }}>
                                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                                    <button
                                                                        onClick={() => updateNursingTaskStatus(t.id, t.status === 'Completed' ? 'Pending' : 'Completed')}
                                                                        style={{
                                                                            width: '24px', height: '24px', borderRadius: '6px', border: '2px solid var(--primary)',
                                                                            background: t.status === 'Completed' ? 'var(--primary)' : 'transparent',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                                                        }}
                                                                    >
                                                                        {t.status === 'Completed' && <CheckCircle2 size={16} />}
                                                                    </button>
                                                                    <div>
                                                                        <h4 style={{ fontWeight: '700', fontSize: '0.9rem', textDecoration: t.status === 'Completed' ? 'line-through' : 'none' }}>{t.taskName}</h4>
                                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {t.time}</p>
                                                                    </div>
                                                                </div>
                                                                <div style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800', border: '1px solid var(--border)' }}>
                                                                    {t.priority}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                    {activeSection === 'orders' && (
                                        <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div className="glass" style={{ padding: '24px' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Stethoscope size={18} color="var(--primary)" /> Clinical Instructions
                                                </h3>
                                                <div style={{ background: 'var(--primary)05', padding: '20px', borderRadius: '12px', border: '1px solid var(--primary)15' }}>
                                                    <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)', fontStyle: latestConsultation?.nursingInstructions ? 'normal' : 'italic' }}>
                                                        {latestConsultation?.nursingInstructions || 'No specific nursing instructions provided in the latest consultation.'}
                                                    </p>
                                                    {latestConsultation && (
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '12px', fontWeight: '700' }}>
                                                            ORDERED ON: {new Date(latestConsultation.date).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="glass" style={{ padding: '24px' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Activity size={18} color="#8b5cf6" /> Diagnostic / Lab Orders
                                                </h3>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                    {latestConsultation?.labTests && latestConsultation.labTests.length > 0 ? (
                                                        latestConsultation.labTests.map((test: string, i: number) => (
                                                            <div key={i} style={{ padding: '12px', background: 'var(--background)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
                                                                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{test}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p style={{ gridColumn: 'span 2', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>No lab tests ordered.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Panel: Alerts & Monitoring */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', paddingRight: '4px', width: '300px', flexShrink: 0 }} className="mobile-stack tablet-stack">
                        <div className="glass mobile-padding" style={{ padding: '20px', borderTop: '4px solid var(--error)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Zap size={18} fill="var(--error)" /> WARD ALERTS
                                </h3>
                                <span style={{ padding: '2px 8px', borderRadius: '20px', background: 'var(--error-bg)', color: 'var(--error)', fontSize: '0.65rem', fontWeight: '800' }}>
                                    {alerts.length} ACTIVE
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <AnimatePresence>
                                    {alerts.map((a: Vitals, i: number) => {
                                        const p = patients.find((patient: Patient) => patient.id === a.patientId);
                                        return (
                                            <motion.div
                                                key={a.patientId + i}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                onClick={() => setSelectedPatientId(a.patientId)}
                                                style={{
                                                    padding: '12px', borderRadius: '12px', background: 'var(--error-bg)', border: '1px solid var(--error)',
                                                    display: 'flex', gap: '12px', cursor: 'pointer', position: 'relative', overflow: 'hidden'
                                                }}
                                                className="card-hover"
                                            >
                                                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: 'var(--error)' }} />
                                                <AlertCircle size={20} color="var(--error)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <p style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>{p?.name}</p>
                                                        <ChevronRight size={14} color="var(--text-muted)" />
                                                    </div>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: '700' }}>
                                                        {a.temperature > 39 ? `TEMP ${a.temperature}°C ` : ''}
                                                        {a.oxygenSaturation < 92 ? `SPO2 ${a.oxygenSaturation}% ` : ''}
                                                        {a.pulse > 120 ? `PULSE ${a.pulse}BPM ` : ''}
                                                    </p>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{getTimeAgo(a.recordedAt)}</span>
                                                        <motion.span
                                                            animate={{ opacity: [0.4, 1, 0.4] }}
                                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                                            style={{ fontSize: '0.65rem', color: 'var(--error)', fontWeight: '900' }}
                                                        >
                                                            LIVE
                                                        </motion.span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '20px', flex: 1, position: 'relative' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={16} color="var(--primary)" /> CARE TIMELINE
                            </h3>
                            {!selectedPatientId ? (
                                <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, textAlign: 'center' }}>
                                    <ListTodo size={32} style={{ marginBottom: '12px' }} />
                                    <p style={{ fontSize: '0.75rem' }}>Select a patient for timeline</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '15px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)', opacity: 0.5 }} />
                                    {timelineEvents.map((item, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}
                                        >
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '10px', background: 'var(--background)',
                                                border: `1px solid var(--border)`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                boxShadow: 'var(--shadow)'
                                            }}>
                                                <item.icon size={14} color={item.type === 'doctor' ? 'var(--primary)' : 'var(--success)'} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800' }}>
                                                        {item.time === 'Completed' ? 'INSTANT' : getTimeAgo(item.time)}
                                                    </p>
                                                    <span style={{
                                                        fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px',
                                                        background: item.type === 'doctor' ? 'rgba(var(--primary-rgb), 0.15)' : 'var(--success-bg)',
                                                        color: item.type === 'doctor' ? 'var(--primary)' : 'var(--success)',
                                                        fontWeight: '800'
                                                    }}>
                                                        {item.type.toUpperCase()}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '0.8rem', fontWeight: '600', lineHeight: '1.4', color: 'var(--text-main)' }}>{item.event}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                            <div style={{ marginTop: '24px', padding: '12px', background: 'var(--background-soft)', borderRadius: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                End of today's clinical logs
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
