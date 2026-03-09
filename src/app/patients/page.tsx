'use client';

import { useState } from 'react';
import { useHISStore, Patient, Room } from '@/store/hisStore';
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
    const { patients, addPatient, updatePatient, rooms, allocateRoom, admissions } = useHISStore();
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
    const [temperature, setTemperature] = useState('');
    const [weight, setWeight] = useState('');
    const [bloodPressure, setBloodPressure] = useState('');
    const [admissionCause, setAdmissionCause] = useState('');
    const [diseases, setDiseases] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    // Room Allocation State (for IP)
    const [selectedWard, setSelectedWard] = useState('General');
    const [selectedRoomId, setSelectedRoomId] = useState('');

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteCountdown, setDeleteCountdown] = useState(0);
    const [deleteTimer, setDeleteTimer] = useState<NodeJS.Timeout | null>(null);
    const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm)
    );

    const sortedOP = filteredPatients
        .filter(p => p.type === 'OP')
        .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

    const sortedIP = filteredPatients
        .filter(p => p.type === 'IP')
        .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const patientId = isEditMode && selectedPatient ? selectedPatient.id : 'P' + Math.random().toString(36).substr(2, 6).toUpperCase();

        if (isEditMode && selectedPatient) {
            updatePatient(patientId, {
                name,
                age: parseInt(age),
                gender,
                bloodGroup,
                phone,
                address,
                type: patientType,
                temperature,
                weight,
                bloodPressure,
                admissionCause,
                diseases
            });
            // Update local selected state to reflect changes
            setSelectedPatient({
                ...selectedPatient,
                name,
                age: parseInt(age),
                gender,
                bloodGroup,
                phone,
                address,
                type: patientType,
                temperature,
                weight,
                bloodPressure,
                admissionCause,
                diseases
            });
        } else {
            const newPatient: Patient = {
                id: patientId,
                name,
                age: parseInt(age),
                gender,
                bloodGroup,
                phone,
                address,
                type: patientType,
                medicalHistory: [],
                allergies: [],
                visitHistory: [],
                temperature,
                weight,
                bloodPressure,
                admissionCause,
                diseases,
                registrationDate: new Date().toISOString(),
                nursingStatus: 'Waiting',
                nursingPriority: 'Normal'
            };
            addPatient(newPatient);

            if (patientType === 'IP' && selectedRoomId) {
                // For registration without an appointment yet, we pass a dummy appointmentId or modify allocateRoom
                allocateRoom(selectedRoomId, patientId, 'REG-' + patientId);
                alert(`Patient Registered!\nID: ${patientId}\nRoom Allocated successfully.`);
            } else {
                alert(`Patient Registered!\nID: ${patientId}`);
            }
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
        setTemperature(p.temperature || '');
        setWeight(p.weight || '');
        setBloodPressure(p.bloodPressure || '');
        setAdmissionCause(p.admissionCause || '');
        setDiseases(p.diseases || '');
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
        setTemperature('');
        setWeight('');
        setBloodPressure('');
        setAdmissionCause('');
        setDiseases('');
        setIsEditMode(false);
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }} className="mobile-padding">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="mobile-stack">
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
                <div className="glass mobile-stack" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
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

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }} className="mobile-grid-1">
                    {/* Outpatients Column */}
                    <div style={{ flex: 1, minWidth: '350px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '0 8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }} />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Outpatients (OP)</h2>
                            <span style={{ fontSize: '0.8rem', background: 'var(--border)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-muted)' }}>
                                {sortedOP.length}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {sortedOP.length === 0 ? (
                                <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <p>No outpatients found.</p>
                                </div>
                            ) : (
                                sortedOP.map((p) => (
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
                                                color: '#3b82f6',
                                                position: 'relative'
                                            }}>
                                                <UserIcon size={20} />
                                                {p.tokenNumber && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '-5px',
                                                        right: '-5px',
                                                        background: 'var(--primary)',
                                                        color: 'white',
                                                        fontSize: '0.65rem',
                                                        padding: '2px 6px',
                                                        borderRadius: '8px',
                                                        fontWeight: '800',
                                                        border: '2px solid var(--glass-bg)'
                                                    }}>
                                                        #{p.tokenNumber}
                                                    </div>
                                                )}
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
                    <div style={{ flex: 1, minWidth: '350px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '0 8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Inner Patients (IP)</h2>
                            <span style={{ fontSize: '0.8rem', background: 'var(--border)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-muted)' }}>
                                {sortedIP.length}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {sortedIP.length === 0 ? (
                                <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <p>No inner patients found.</p>
                                </div>
                            ) : (
                                sortedIP.map((p) => (
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
                            className="glass mobile-padding"
                            style={{ padding: '32px', flex: 1.5, minWidth: '350px', height: 'fit-content' }}
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <p style={{ color: 'var(--text-muted)' }}>{selectedPatient.id} • {selectedPatient.phone}</p>
                                            {selectedPatient.tokenNumber && (
                                                <span style={{
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '800'
                                                }}>
                                                    TOKEN #{selectedPatient.tokenNumber}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleEditClick(selectedPatient)}
                                        style={{ color: 'var(--primary)', padding: '8px', borderRadius: '8px', background: 'rgba(var(--primary-rgb), 0.1)' }}
                                        className="card-hover"
                                        title="Edit Patient"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button
                                        onClick={handleDeleteRequest}
                                        style={{ color: 'var(--error)', padding: '8px', borderRadius: '8px', background: 'var(--error-bg)' }}
                                        className="card-hover"
                                        title="Delete Patient"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Current Admission Details for IP Patients */}
                            {selectedPatient.type === 'IP' && (
                                (() => {
                                    const admission = admissions.find(a => a.patientId === selectedPatient.id && a.status === 'Admitted');
                                    const room = rooms.find(r => r.id === admission?.roomId);
                                    if (!admission || !room) return null;

                                    return (
                                        <div style={{
                                            marginBottom: '24px',
                                            padding: '24px',
                                            background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.15), rgba(var(--primary-rgb), 0.05))',
                                            borderRadius: '20px',
                                            border: '1px solid rgba(var(--primary-rgb), 0.3)',
                                            boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.1)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                                                <h3 style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '0.1em' }}>CURRENT IP ADMISSION</h3>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                                                <div>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>WARD & ROOM</p>
                                                    <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>{room.wardType} • R-{room.roomNumber}</p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>BED NUMBER</p>
                                                    <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>Bed {room.bedNumber}</p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>ADMISSION DATE</p>
                                                    <p style={{ fontWeight: '700', fontSize: '0.95rem' }}>{new Date(admission.admissionDate).toLocaleDateString()} at {new Date(admission.admissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>DAILY RATE</p>
                                                    <p style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--primary)' }}>₹{room.dailyCharge}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()
                            )}

                            {deleteId === selectedPatient.id && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: 'var(--error-bg)',
                                        color: 'var(--error)',
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        marginBottom: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        border: '1px solid var(--error)'
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

                            {/* Vitals & Clinical Info Display */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                                <div style={{ padding: '12px', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '12px', border: '1px solid rgba(var(--primary-rgb), 0.15)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>TEMPERATURE</p>
                                    <p style={{ fontWeight: '700' }}>{selectedPatient.temperature || '—'} °C</p>
                                </div>
                                <div style={{ padding: '12px', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '12px', border: '1px solid rgba(var(--primary-rgb), 0.15)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>WEIGHT</p>
                                    <p style={{ fontWeight: '700' }}>{selectedPatient.weight || '—'} kg</p>
                                </div>
                                <div style={{ padding: '12px', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '12px', border: '1px solid rgba(var(--primary-rgb), 0.15)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>BLOOD PRESSURE</p>
                                    <p style={{ fontWeight: '700' }}>{selectedPatient.bloodPressure || '—'} mmHg</p>
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ padding: '16px', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Admission Cause</h4>
                                        <p style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{selectedPatient.admissionCause || 'No admission cause recorded.'}</p>
                                    </div>
                                    <div style={{ padding: '16px', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Affected Diseases</h4>
                                        <p style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{selectedPatient.diseases || 'No major diseases recorded.'}</p>
                                    </div>
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
                                                background: 'rgba(var(--primary-rgb), 0.1)',
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
                                            onChange={(e) => setBloodGroup(e.target.value.toUpperCase())}
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

                                {/* New Vitals Section */}
                                <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--primary)' }}>Registration Vitals</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px' }}>Temp (°C)</label>
                                            <input
                                                type="text"
                                                value={temperature}
                                                onChange={(e) => setTemperature(e.target.value)}
                                                placeholder="37.2"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px' }}>Weight (kg)</label>
                                            <input
                                                type="text"
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value)}
                                                placeholder="70"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px' }}>BP (mmHg)</label>
                                            <input
                                                type="text"
                                                value={bloodPressure}
                                                onChange={(e) => setBloodPressure(e.target.value)}
                                                placeholder="120/80"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Clinical Info Section */}
                                <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--primary)' }}>Clinical Information</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px' }}>Cause of Admitting / Normal Causes</label>
                                            <textarea
                                                value={admissionCause}
                                                onChange={(e) => setAdmissionCause(e.target.value)}
                                                placeholder="Enter reason for admission..."
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', minHeight: '60px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px' }}>Any Diseases Affected Patient</label>
                                            <textarea
                                                value={diseases}
                                                onChange={(e) => setDiseases(e.target.value)}
                                                placeholder="Enter existing diseases or conditions..."
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', minHeight: '60px' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Patient Type</label>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
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

                                    {patientType === 'IP' && !isEditMode && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            style={{
                                                padding: '20px',
                                                background: 'var(--primary)05',
                                                borderRadius: '12px',
                                                border: '1px dashed var(--primary)30',
                                                marginTop: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '16px'
                                            }}
                                        >
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                Room Allocation
                                            </h4>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px' }}>Ward Type</label>
                                                    <select
                                                        value={selectedWard}
                                                        onChange={(e) => {
                                                            setSelectedWard(e.target.value);
                                                            setSelectedRoomId('');
                                                        }}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                                    >
                                                        <option value="">Select Ward</option>
                                                        <option value="General">General</option>
                                                        <option value="Semi-Private">Semi-Private</option>
                                                        <option value="Private">Private</option>
                                                        <option value="ICU">ICU</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px' }}>Bed Number</label>
                                                    <select
                                                        value={selectedRoomId}
                                                        onChange={(e) => setSelectedRoomId(e.target.value)}
                                                        disabled={!selectedWard}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                                    >
                                                        <option value="">Select Bed</option>
                                                        {(() => {
                                                            const filtered = rooms.filter(r => r.wardType === selectedWard && r.status === 'Available');

                                                            let finalSuggestions = filtered;
                                                            if (selectedWard === 'General') {
                                                                // Specifically target the requested range for General ward
                                                                const inRange = filtered.filter(r => {
                                                                    const roomNum = parseInt(r.roomNumber);
                                                                    return roomNum >= 101 && roomNum <= 106;
                                                                });
                                                                // Always show at least some suggestions if possible
                                                                if (inRange.length > 0) {
                                                                    finalSuggestions = inRange;
                                                                }
                                                            }

                                                            return finalSuggestions.slice(0, 5).map((r: Room) => (
                                                                <option key={r.id} value={r.id}>
                                                                    Room {r.roomNumber} - Bed {r.bedNumber} (₹{r.dailyCharge}/day)
                                                                </option>
                                                            ));
                                                        })()}
                                                    </select>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
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
