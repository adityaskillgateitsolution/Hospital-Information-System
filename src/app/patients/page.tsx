'use client';

import { useState } from 'react';
import { useHISStore, Patient } from '@/store/hisStore';
import {
    Users,
    Plus,
    Search,
    UserPlus,
    Clipboard,
    History,
    FilePlus,
    Edit2,
    ChevronRight,
    User as UserIcon,
    Trash2,
    RotateCcw,
    X as CloseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

export default function PatientsPage() {
    const { patients, addPatient, updatePatient } = useHISStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
    const [bloodGroup, setBloodGroup] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [patientType, setPatientType] = useState<'OP' | 'IP'>('OP');
    const [isEditMode, setIsEditMode] = useState(false);

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteCountdown, setDeleteCountdown] = useState(0);
    const [deleteTimer, setDeleteTimer] = useState<NodeJS.Timeout | null>(null);
    const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm)
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditMode && selectedPatient) {
            updatePatient(selectedPatient.id, {
                name,
                age: parseInt(age),
                gender,
                bloodGroup,
                phone,
                address,
                type: patientType
            });
            // Update local selected state to reflect changes
            setSelectedPatient({ ...selectedPatient, name, age: parseInt(age), gender, bloodGroup, phone, address, type: patientType });
        } else {
            const newPatient: Patient = {
                id: 'P' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                name,
                age: parseInt(age),
                gender,
                bloodGroup,
                phone,
                address,
                type: patientType,
                medicalHistory: [],
                visitHistory: []
            };
            addPatient(newPatient);
        }
        setIsModalOpen(false);
        resetForm();
    };

    const handleEditClick = (p: Patient) => {
        setIsEditMode(true);
        setName(p.name);
        setAge(p.age.toString());
        setGender(p.gender);
        setBloodGroup(p.bloodGroup);
        setPhone(p.phone);
        setAddress(p.address);
        setPatientType(p.type);
        setIsModalOpen(true);
    };

    const handleAddCondition = () => {
        if (!selectedPatient) return;
        const condition = window.prompt('Enter new medical condition:');
        if (condition) {
            updatePatient(selectedPatient.id, {
                medicalHistory: [...selectedPatient.medicalHistory, condition]
            });
            setSelectedPatient({
                ...selectedPatient,
                medicalHistory: [...selectedPatient.medicalHistory, condition]
            });
        }
    };

    const handleDeleteRequest = () => {
        if (!selectedPatient) return;
        const id = selectedPatient.id;
        setDeleteId(id);
        setDeleteCountdown(5);

        const interval = setInterval(() => {
            setDeleteCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        setCountdownInterval(interval);

        const timer = setTimeout(() => {
            const { deletePatient } = useHISStore.getState();
            deletePatient(id);
            setDeleteId(null);
            setSelectedPatient(null);
            setDeleteCountdown(0);
        }, 5000);

        setDeleteTimer(timer);
    };

    const handleUndoDelete = () => {
        if (deleteTimer) clearTimeout(deleteTimer);
        if (countdownInterval) clearInterval(countdownInterval);
        setDeleteId(null);
        setDeleteCountdown(0);
    };

    const resetForm = () => {
        setName('');
        setAge('');
        setGender('Male');
        setBloodGroup('');
        setPhone('');
        setAddress('');
        setPatientType('OP');
        setIsEditMode(false);
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Patient Records</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage and view patient medical information.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            background: 'var(--primary)',
                            color: 'white',
                            padding: '12px 20px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: '600'
                        }}
                        className="card-hover"
                    >
                        <UserPlus size={20} /> Add Patient
                    </button>
                </div>

                {/* Search */}
                <div className="glass" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search by name or phone number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '8px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-main)',
                                fontSize: '0.95rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '1fr 1fr 1.5fr' : '1fr 1fr', gap: '24px' }}>
                    {/* Outpatients Column */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '0 8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }} />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Outpatients (OP)</h2>
                            <span style={{ fontSize: '0.8rem', background: 'var(--border)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-muted)' }}>
                                {filteredPatients.filter(p => p.type === 'OP').length}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredPatients.filter(p => p.type === 'OP').length === 0 ? (
                                <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <p>No outpatients found.</p>
                                </div>
                            ) : (
                                filteredPatients.filter(p => p.type === 'OP').map((p) => (
                                    <div
                                        key={p.id}
                                        className="glass card-hover"
                                        onClick={() => setSelectedPatient(p)}
                                        style={{
                                            padding: '16px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            border: selectedPatient?.id === p.id ? '2px solid var(--primary)' : '1px solid var(--border)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                background: 'var(--background)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#3b82f6'
                                            }}>
                                                <UserIcon size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontWeight: '700', fontSize: '0.9rem' }}>{p.name}</h3>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.id} • {p.age}y</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} color="var(--text-muted)" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Inner Patients Column */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '0 8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Inner Patients (IP)</h2>
                            <span style={{ fontSize: '0.8rem', background: 'var(--border)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-muted)' }}>
                                {filteredPatients.filter(p => p.type === 'IP').length}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredPatients.filter(p => p.type === 'IP').length === 0 ? (
                                <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <p>No inner patients found.</p>
                                </div>
                            ) : (
                                filteredPatients.filter(p => p.type === 'IP').map((p) => (
                                    <div
                                        key={p.id}
                                        className="glass card-hover"
                                        onClick={() => setSelectedPatient(p)}
                                        style={{
                                            padding: '16px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            border: selectedPatient?.id === p.id ? '2px solid var(--primary)' : '1px solid var(--border)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                background: 'var(--background)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#ef4444'
                                            }}>
                                                <UserIcon size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontWeight: '700', fontSize: '0.9rem' }}>{p.name}</h3>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.id} • {p.age}y</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} color="var(--text-muted)" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Patient Details */}
                    {selectedPatient && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass"
                            style={{ padding: '32px', position: 'sticky', top: '100px', height: 'fit-content' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        background: 'var(--primary)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}>
                                        <UserIcon size={32} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{selectedPatient.name}</h2>
                                        <p style={{ color: 'var(--text-muted)' }}>{selectedPatient.id} • {selectedPatient.phone}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleEditClick(selectedPatient)}
                                        style={{ color: 'var(--primary)', padding: '8px', borderRadius: '8px', background: 'var(--primary)10' }}
                                        className="card-hover"
                                        title="Edit Patient"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button
                                        onClick={handleDeleteRequest}
                                        style={{ color: '#ef4444', padding: '8px', borderRadius: '8px', background: '#ef444410' }}
                                        className="card-hover"
                                        title="Delete Patient"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {deleteId === selectedPatient.id && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: '#fee2e2',
                                        color: '#ef4444',
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        marginBottom: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        border: '1px solid #fecaca'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                            {deleteCountdown}
                                        </div>
                                        <span>Deleting patient in {deleteCountdown} seconds...</span>
                                    </div>
                                    <button
                                        onClick={handleUndoDelete}
                                        style={{
                                            background: '#ef4444',
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        <RotateCcw size={14} /> Undo
                                    </button>
                                </motion.div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                                <div style={{ padding: '12px', background: 'var(--background)', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>AGE</p>
                                    <p style={{ fontWeight: '700' }}>{selectedPatient.age} Years</p>
                                </div>
                                <div style={{ padding: '12px', background: 'var(--background)', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>GENDER</p>
                                    <p style={{ fontWeight: '700' }}>{selectedPatient.gender}</p>
                                </div>
                                <div style={{ padding: '12px', background: 'var(--background)', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>BLOOD GROUP</p>
                                    <p style={{ fontWeight: '700', color: '#ef4444' }}>{selectedPatient.bloodGroup || 'N/A'}</p>
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <Clipboard size={18} color="var(--primary)" />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Medical History</h3>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {selectedPatient.medicalHistory.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No medical history recorded.</p>
                                    ) : (
                                        selectedPatient.medicalHistory.map((h, i) => (
                                            <span key={i} style={{
                                                padding: '4px 12px',
                                                background: 'var(--primary)10',
                                                color: 'var(--primary)',
                                                borderRadius: '20px',
                                                fontSize: '0.875rem',
                                                fontWeight: '600'
                                            }}>{h}</span>
                                        ))
                                    )}
                                    <button
                                        onClick={handleAddCondition}
                                        style={{
                                            padding: '4px 12px',
                                            border: '1px dashed var(--border)',
                                            borderRadius: '20px',
                                            fontSize: '0.875rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            color: 'var(--text-muted)'
                                        }}
                                    >
                                        <Plus size={14} /> Add Condition
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <History size={18} color="var(--primary)" />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Visit History</h3>
                                </div>
                                {selectedPatient.visitHistory.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No previous visits recorded.</p>
                                ) : (
                                    <div style={{ borderLeft: '2px solid var(--border)', marginLeft: '10px', paddingLeft: '20px' }}>
                                        {selectedPatient.visitHistory.map((v, i) => (
                                            <div key={i} style={{ position: 'relative', marginBottom: '20px' }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '-27px',
                                                    top: '4px',
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    background: 'var(--primary)'
                                                }} />
                                                <p style={{ fontSize: '0.875rem', fontWeight: '700' }}>{v.date}</p>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{v.reason}</p>
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{v.notes}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Add Patient Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '24px'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass"
                            style={{ width: '100%', maxWidth: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-muted)' }}
                                className="card-hover"
                            >
                                <CloseIcon size={24} />
                            </button>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>
                                {isEditMode ? 'Update Patient Details' : 'Register New Patient'}
                            </h2>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--background)',
                                            color: 'var(--text-main)'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Age</label>
                                        <input
                                            type="number"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            placeholder="35"
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                background: 'var(--background)',
                                                color: 'var(--text-main)'
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Gender</label>
                                        <select
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value as any)}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                background: 'var(--background)',
                                                color: 'var(--text-main)'
                                            }}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Phone Number</label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+1 (555) 000-0000"
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                background: 'var(--background)',
                                                color: 'var(--text-main)'
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Blood Group</label>
                                        <input
                                            type="text"
                                            value={bloodGroup}
                                            onChange={(e) => setBloodGroup(e.target.value)}
                                            placeholder="O+"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                background: 'var(--background)',
                                                color: 'var(--text-main)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Address</label>
                                    <textarea
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="123 Medical St, Health City"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--background)',
                                            color: 'var(--text-main)',
                                            minHeight: '80px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Patient Type</label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {(['OP', 'IP'] as const).map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setPatientType(t)}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border)',
                                                    fontWeight: '700',
                                                    background: patientType === t ? 'var(--primary)' : 'var(--background)',
                                                    color: patientType === t ? 'white' : 'var(--text-main)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {t === 'OP' ? 'Outpatient (OP)' : 'Inner Patient (IP)'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            flex: 1,
                                            background: 'var(--primary)',
                                            color: 'white',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {isEditMode ? 'Update Details' : 'Register Patient'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
