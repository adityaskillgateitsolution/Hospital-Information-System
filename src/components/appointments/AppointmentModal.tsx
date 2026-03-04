'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, User, Stethoscope, Clock, FileText, Shield, AlertCircle, MessageSquare, Phone } from 'lucide-react';
import { Appointment, useHISStore, Patient, Room } from '@/store/hisStore';
import { validateConflict } from '@/utils/appointmentUtils';
import { openWhatsApp, generateAppointmentMessage } from '@/utils/whatsappUtils';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: Partial<Appointment> | null;
}

const DEPARTMENTS = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Dermatology', 'Oncology'];
const DOCTORS = [
    { name: 'Dr. Smith', dept: 'Cardiology', id: 'D-02' },
    { name: 'Dr. Johnson', dept: 'Neurology', id: 'D-03' },
    { name: 'Dr. Williams', dept: 'Pediatrics', id: 'D-04' },
    { name: 'Dr. Brown', dept: 'General Medicine', id: 'D-05' },
];

const STATUSES: Appointment['status'][] = ['Scheduled', 'Confirmed', 'Checked-in', 'Waiting', 'In Consultation', 'Completed', 'Cancelled', 'No-show', 'Emergency'];
const PRIORITIES: Appointment['priority'][] = ['Normal', 'Urgent', 'Emergency'];

export default function AppointmentModal({ isOpen, onClose, initialData }: AppointmentModalProps) {
    const { patients, appointments, rooms, addAppointment, updateAppointment, deleteAppointment, allocateRoom } = useHISStore();

    // Form State
    const [patientId, setPatientId] = useState('');
    const [patientName, setPatientName] = useState('');
    const [phone, setPhone] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [department, setDepartment] = useState('');
    const [visitType, setVisitType] = useState('Consultation');
    const [start, setStart] = useState('');
    const [duration, setDuration] = useState('30');
    const [status, setStatus] = useState<Appointment['status']>('Scheduled');
    const [priority, setPriority] = useState<Appointment['priority']>('Normal');
    const [insurance, setInsurance] = useState(false);
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
    const [bloodGroup, setBloodGroup] = useState('');
    const [address, setAddress] = useState('');
    const [patientType, setPatientType] = useState<'OP' | 'IP'>('OP');
    const [notes, setNotes] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    useEffect(() => {
        if (initialData) {
            setPatientId(initialData.patientId || '');
            setPatientName(initialData.patientName || '');
            setPhone(initialData.phone || '');
            setDoctorId(initialData.doctorId || '');
            setDoctorName(initialData.doctorName || '');
            setDepartment(initialData.department || '');
            setVisitType(initialData.visitType || 'Consultation');
            setStart(initialData.start ? initialData.start.slice(0, 16) : '');

            if (initialData.start && initialData.end) {
                const diff = (new Date(initialData.end).getTime() - new Date(initialData.start).getTime()) / 60000;
                setDuration(diff.toString());
            } else {
                setDuration('30');
            }

            setStatus(initialData.status || 'Scheduled');
            setPriority(initialData.priority || 'Normal');
            setInsurance(initialData.insurance || false);
            setAge(initialData.age?.toString() || '');
            setGender(initialData.gender || 'Male');
            setBloodGroup(initialData.bloodGroup || '');
            setAddress(initialData.address || '');
            setPatientType(initialData.patientType || 'OP');
            setNotes(initialData.notes || '');
        } else {
            reset();
        }
        setError('');
    }, [initialData, isOpen]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const reset = () => {
        setPatientId('');
        setPatientName('');
        setPhone('');
        setDoctorId('');
        setDoctorName('');
        setDepartment('');
        setVisitType('Consultation');
        setStart('');
        setDuration('30');
        setStatus('Scheduled');
        setPriority('Normal');
        setInsurance(false);
        setAge('');
        setGender('Male');
        setBloodGroup('');
        setAddress('');
        setPatientType('OP');
        setNotes('');
        setSelectedWard('');
        setSelectedRoomId('');
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const appointmentDate = new Date(start);
        const now = new Date();

        // Only enforce future dates for NEW appointments or when CHANGING the date of a future one.
        // If it's already a past appointment (read-only), isReadOnly will be true.
        if (appointmentDate < now && !isReadOnly) {
            setError('Appointments must be scheduled for the present or future.');
            return;
        }

        if (phone && !/^\d+$/.test(phone.replace(/\+/g, ''))) {
            setError('Please enter a valid phone number');
            return;
        }

        const endTime = new Date(new Date(start).getTime() + parseInt(duration) * 60000).toISOString();

        const apptData: Partial<Appointment> = {
            patientId,
            patientName,
            phone,
            doctorId,
            doctorName,
            department,
            visitType,
            status,
            priority,
            insurance,
            age: age ? parseInt(age) : undefined,
            gender,
            bloodGroup,
            address,
            patientType,
            notes,
            start: new Date(start).toISOString(),
            end: endTime,
        };

        const validation = validateConflict(apptData, appointments, initialData?.id);
        if (validation.conflict) {
            setError(validation.message);
            return;
        }

        if (initialData?.id) {
            updateAppointment(initialData.id, apptData);

            // Trigger WhatsApp if cancelled
            if (status === 'Cancelled' && initialData.status !== 'Cancelled') {
                const msg = generateAppointmentMessage('Cancelled', { patientName, doctorName, startTime: start });
                openWhatsApp(phone, msg);
                setToast('WhatsApp message prepared');
            }
        } else {
            const newAppt: Appointment = {
                ...apptData as Appointment,
                id: 'APT-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                paymentStatus: 'Pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            addAppointment(newAppt);

            // Notify user with Token and ID
            const tokenMsg = newAppt.tokenNumber ? ` | Token: ${newAppt.tokenNumber}` : '';
            alert(`Appointment Created!\nPatient ID: ${patientId}${tokenMsg}`);

            // Trigger WhatsApp if scheduled
            if (status === 'Scheduled') {
                const msg = generateAppointmentMessage('Scheduled', { patientName, doctorName, startTime: start });
                openWhatsApp(phone, msg);
                setToast('WhatsApp message prepared');
            }

            // Handle IP Admission
            if ((visitType === 'IP Admission' || patientType === 'IP') && selectedRoomId) {
                allocateRoom(selectedRoomId, newAppt.patientId, newAppt.id);
                setToast('Patient Admitted and Room Allocated');
            }
        }

        onClose();
    };

    const handleSendReminder = () => {
        if (!phone) {
            setError('Phone number is required to send reminder');
            return;
        }
        const msg = generateAppointmentMessage('Reminder', { patientName, doctorName, startTime: start });
        openWhatsApp(phone, msg);
        setToast('WhatsApp message prepared');
    };

    const handleDelete = () => {
        if (initialData?.id) {
            if (confirm('Are you sure you want to delete this appointment?')) {
                deleteAppointment(initialData.id);
                onClose();
            }
        }
    };

    const isReadOnly = initialData?.id ? new Date(initialData.start || '') < new Date() : false;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="glass"
                    style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}
                >
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                            {initialData?.id ? 'Edit Appointment' : 'New Appointment'}
                        </h2>
                        <button onClick={onClose} style={{ padding: '8px', opacity: 0.5 }} className="card-hover"><X size={20} /></button>
                    </div>

                    <form onSubmit={handleSave} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {error && (
                            <div style={{ background: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        {isReadOnly && (
                            <div style={{ background: '#fef3c7', color: '#92400e', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #fde68a' }}>
                                <AlertCircle size={16} /> Past appointments cannot be modified (Read-Only)
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Patient */}
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                                    <User size={16} color="var(--primary)" /> Patient Name
                                </label>
                                <input
                                    list="patients-list"
                                    value={patientName}
                                    onChange={(e) => {
                                        setPatientName(e.target.value);
                                        const p = patients.find(p => p.name === e.target.value);
                                        if (p) {
                                            setPatientId(p.id);
                                            setPhone(p.phone);
                                            setAge(p.age.toString());
                                            setGender(p.gender);
                                            setBloodGroup(p.bloodGroup);
                                            setAddress(p.address);
                                            setPatientType(p.type);
                                        }
                                    }}
                                    required
                                    disabled={isReadOnly}
                                    placeholder="Search or enter patient..."
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isReadOnly ? 'rgba(0,0,0,0.02)' : 'var(--background)', color: 'var(--text-main)', opacity: isReadOnly ? 0.7 : 1 }}
                                />
                                <datalist id="patients-list">
                                    {patients.map(p => <option key={p.id} value={p.name} />)}
                                </datalist>
                            </div>

                            {/* Phone */}
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                                    <Phone size={16} color="var(--primary)" /> Phone Number
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        disabled={isReadOnly}
                                        placeholder="+1234567890"
                                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isReadOnly ? 'rgba(0,0,0,0.02)' : 'var(--background)', color: 'var(--text-main)', opacity: isReadOnly ? 0.7 : 1 }}
                                    />
                                    {phone && (
                                        <button
                                            type="button"
                                            onClick={() => openWhatsApp(phone, `Hello ${patientName || 'there'}`)}
                                            style={{ padding: '8px', borderRadius: '10px', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Quick WhatsApp"
                                        >
                                            <MessageSquare size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Patient Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>Age</label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    disabled={isReadOnly}
                                    placeholder="Age"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isReadOnly ? 'rgba(0,0,0,0.02)' : 'var(--background)', color: 'var(--text-main)', opacity: isReadOnly ? 0.7 : 1 }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>Gender</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value as any)}
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isReadOnly ? 'rgba(0,0,0,0.02)' : 'var(--background)', color: 'var(--text-main)', opacity: isReadOnly ? 0.7 : 1 }}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>Blood Group</label>
                                <input
                                    type="text"
                                    value={bloodGroup}
                                    onChange={(e) => setBloodGroup(e.target.value)}
                                    disabled={isReadOnly}
                                    placeholder="O+"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isReadOnly ? 'rgba(0,0,0,0.02)' : 'var(--background)', color: 'var(--text-main)', opacity: isReadOnly ? 0.7 : 1 }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>Patient Type</label>
                                <div style={{ display: 'flex', gap: '10px', opacity: isReadOnly ? 0.7 : 1 }}>
                                    {(['OP', 'IP'] as const).map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => !isReadOnly && setPatientType(t)}
                                            disabled={isReadOnly}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700',
                                                background: patientType === t ? 'var(--primary)' : 'var(--background)',
                                                color: patientType === t ? 'white' : 'var(--text-main)',
                                                border: '1px solid var(--border)',
                                                cursor: isReadOnly ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {t === 'OP' ? 'Outpatient (OP)' : 'Inner Patient (IP)'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>Address</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    disabled={isReadOnly}
                                    placeholder="Patient Address"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isReadOnly ? 'rgba(0,0,0,0.02)' : 'var(--background)', color: 'var(--text-main)', opacity: isReadOnly ? 0.7 : 1 }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Doctor */}
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                                    <Stethoscope size={16} color="var(--primary)" /> Doctor
                                </label>
                                <select
                                    value={doctorId}
                                    onChange={(e) => {
                                        setDoctorId(e.target.value);
                                        const d = DOCTORS.find(d => d.id === e.target.value);
                                        if (d) {
                                            setDoctorName(d.name);
                                            setDepartment(d.dept);
                                        }
                                    }}
                                    required
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isReadOnly ? 'rgba(0,0,0,0.02)' : 'var(--background)', color: 'var(--text-main)', opacity: isReadOnly ? 0.7 : 1 }}
                                >
                                    <option value="">Select Doctor</option>
                                    {DOCTORS.map(d => <option key={d.id} value={d.id}>{d.name} ({d.dept})</option>)}
                                </select>
                            </div>

                            {/* Visit Type */}
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                                    Visit Type
                                </label>
                                <select
                                    value={visitType}
                                    onChange={(e) => {
                                        setVisitType(e.target.value);
                                        if (e.target.value === 'IP Admission') {
                                            setPatientType('IP');
                                        }
                                    }}
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isReadOnly ? 'rgba(0,0,0,0.02)' : 'var(--background)', color: 'var(--text-main)', opacity: isReadOnly ? 0.7 : 1 }}
                                >
                                    <option value="Consultation">Consultation</option>
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="Emergency">Emergency</option>
                                    <option value="Surgery">Surgery</option>
                                    <option value="Lab Test">Lab Test</option>
                                    <option value="IP Admission">IP Admission</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Start Time */}
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                                    <Clock size={16} color="var(--primary)" /> Start Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={start}
                                    onChange={(e) => setStart(e.target.value)}
                                    required
                                    disabled={isReadOnly}
                                    min={new Date().toISOString().slice(0, 16)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isReadOnly ? 'rgba(0,0,0,0.02)' : 'var(--background)', color: 'var(--text-main)', opacity: isReadOnly ? 0.7 : 1 }}
                                />
                            </div>

                            {/* Duration */}
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                                    Duration (Minutes)
                                </label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isReadOnly ? 'rgba(0,0,0,0.02)' : 'var(--background)', color: 'var(--text-main)', opacity: isReadOnly ? 0.7 : 1 }}
                                >
                                    <option value="15">15 Minutes</option>
                                    <option value="30">30 Minutes</option>
                                    <option value="45">45 Minutes</option>
                                    <option value="60">60 Minutes</option>
                                    <option value="120">2 Hours</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Status */}
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                                    Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => {
                                        const newStatus = e.target.value as Appointment['status'];
                                        setStatus(newStatus);
                                        // Sync Priority logic (Normal, Urgent, Emergency only)
                                        if (['Normal', 'Urgent', 'Emergency'].includes(newStatus)) {
                                            setPriority(newStatus as Appointment['priority']);
                                        }
                                    }}
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isReadOnly ? 'rgba(0,0,0,0.02)' : 'var(--background)', color: 'var(--text-main)', opacity: isReadOnly ? 0.7 : 1 }}
                                >
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* Priority */}
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                                    Priority
                                </label>
                                <div style={{ display: 'flex', gap: '10px', opacity: isReadOnly ? 0.7 : 1 }}>
                                    {PRIORITIES.map(p => {
                                        const isSelected = priority === p;
                                        return (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => !isReadOnly && setPriority(p)}
                                                disabled={isReadOnly}
                                                style={{
                                                    flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700',
                                                    background: isSelected ? 'var(--primary)' : 'var(--background)',
                                                    color: isSelected ? 'white' : 'var(--text-main)',
                                                    border: '1px solid var(--border)',
                                                    cursor: isReadOnly ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: isReadOnly ? 0.7 : 1 }}>
                            <input
                                type="checkbox"
                                id="insurance"
                                checked={insurance}
                                onChange={(e) => setInsurance(e.target.checked)}
                                disabled={isReadOnly}
                                style={{ width: '18px', height: '18px', cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
                            />
                            <label htmlFor="insurance" style={{ fontSize: '0.85rem', fontWeight: '600', cursor: isReadOnly ? 'not-allowed' : 'pointer' }}>Has Medical Insurance</label>
                        </div>

                        {visitType === 'IP Admission' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                style={{
                                    padding: '20px',
                                    borderRadius: '12px',
                                    background: 'rgba(var(--primary-rgb), 0.05)',
                                    border: '1px solid var(--primary)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}
                            >
                                <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Shield size={18} color="var(--primary)" /> Room Allocation
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>Ward Type</label>
                                        <select
                                            value={selectedWard}
                                            onChange={(e) => {
                                                setSelectedWard(e.target.value);
                                                setSelectedRoomId('');
                                            }}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                                        >
                                            <option value="">Select Ward</option>
                                            {Array.from(new Set(rooms.map(r => r.wardType))).map(w => <option key={w} value={w}>{w}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>Available Beds</label>
                                        <select
                                            value={selectedRoomId}
                                            onChange={(e) => setSelectedRoomId(e.target.value)}
                                            disabled={!selectedWard}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                                        >
                                            <option value="">Select Bed</option>
                                            {rooms
                                                .filter(r => r.wardType === selectedWard && r.status === 'Available')
                                                .map(r => (
                                                    <option key={r.id} value={r.id}>
                                                        Room {r.roomNumber} - Bed {r.bedNumber} (₹{r.dailyCharge}/day)
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                                <FileText size={16} color="var(--primary)" /> Clinical Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={isReadOnly}
                                placeholder="Add symptoms, reasons for visit, etc..."
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: isReadOnly ? 'rgba(0,0,0,0.02)' : 'var(--background)', color: 'var(--text-main)', minHeight: '80px', opacity: isReadOnly ? 0.7 : 1 }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            {initialData?.id && !isReadOnly && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #ef4444', color: '#ef4444', fontWeight: '700' }}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSendReminder}
                                        style={{ padding: '12px 24px', borderRadius: '12px', background: '#25D366', color: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        className="card-hover"
                                    >
                                        <MessageSquare size={18} /> Send Reminder
                                    </button>
                                </>
                            )}
                            <div style={{ flex: 1 }} />
                            <button
                                type="button"
                                onClick={onClose}
                                style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--border)', fontWeight: '700' }}
                            >
                                {isReadOnly ? 'Close' : 'Cancel'}
                            </button>
                            {!isReadOnly && (
                                <button
                                    type="submit"
                                    style={{ padding: '12px 32px', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: '700' }}
                                    className="card-hover"
                                >
                                    {initialData?.id ? 'Update Appointment' : 'Create Appointment'}
                                </button>
                            )}
                        </div>
                    </form>
                </motion.div>

                {/* Toast Notification */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            style={{
                                position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                                background: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 1100, fontWeight: '600'
                            }}
                        >
                            {toast}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AnimatePresence>
    );
}
