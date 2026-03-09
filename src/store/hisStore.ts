import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Patient {
    id: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    bloodGroup: string;
    phone: string;
    address: string;
    type: 'OP' | 'IP';
    medicalHistory: string[];
    allergies: string[];
    surgeries?: string[];
    visitHistory: { date: string; reason: string; notes: string }[];
    // Clinical Vitals & Info
    temperature?: string;
    weight?: string;
    bloodPressure?: string;
    admissionCause?: string;
    diseases?: string;
    tokenNumber?: number;
    registrationDate: string;
    nursingStatus: 'Stable' | 'Observation' | 'Waiting' | 'Critical' | 'Discharged';
    nursingPriority: 'Normal' | 'Urgent' | 'Emergency';
}

export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    patientType: 'OP' | 'IP';
    doctorId: string;
    doctorName: string;
    department: string;
    visitType: string;
    tokenNumber?: number;
    status: 'Scheduled' | 'Confirmed' | 'Checked-in' | 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No-show' | 'Emergency';
    paymentStatus: 'Paid' | 'Pending';
    priority: 'Normal' | 'Urgent' | 'Emergency';
    insurance: boolean;
    notes: string;
    phone: string;
    age?: number;
    gender?: 'Male' | 'Female' | 'Other';
    bloodGroup?: string;
    address?: string;
    start: string;
    end: string;
    createdAt: string;
    updatedAt: string;
}

export interface Vitals {
    id: string;
    patientId: string;
    bloodPressure: string;
    pulse: number;
    temperature: number;
    oxygenSaturation: number;
    respiratoryRate: number;
    weight: number;
    recordedAt: string;
}

export interface NursingNote {
    id: string;
    patientId: string;
    note: string;
    nurseName: string;
    timestamp: string;
}

export interface NursingTask {
    id: string;
    patientId: string;
    taskName: string;
    description?: string;
    time: string;
    status: 'Pending' | 'Completed';
    priority: 'Normal' | 'Urgent' | 'Emergency';
}

export interface MedicationLog {
    id: string;
    patientId: string;
    medicineName: string;
    dosage: string;
    status: 'Given' | 'Skipped';
    note?: string;
    timestamp: string;
}

export interface Consultation {
    id: string;
    appointmentId: string;
    patientId: string;
    symptoms: string;
    observation: string;
    diagnosis: string;
    treatmentPlan: string;
    prescription: {
        medicine: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions: string;
    }[];
    labTests: string[];
    nursingInstructions?: string;
    followUpDate?: string;
    date: string;
}

export interface Invoice {
    id: string;
    patientId: string;
    patientName: string;
    date: string;
    items: { description: string; amount: number }[];
    total: number;
    discount: number;
    finalAmount: number;
    status: 'Paid' | 'Unpaid';
    paymentMethod?: 'Cash' | 'Card';
}

export interface Room {
    id: string;
    wardType: 'General' | 'Semi-Private' | 'Private' | 'ICU';
    roomNumber: string;
    bedNumber: string;
    status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';
    dailyCharge: number;
}

export interface Admission {
    id: string;
    patientId: string;
    appointmentId: string;
    roomId: string;
    admissionDate: string;
    dischargeDate?: string;
    status: 'Admitted' | 'Discharged';
    totalBill?: number;
}

interface HISState {
    // Auth
    isAuthenticated: boolean;
    user: { username: string } | null;
    login: (username: string) => void;
    logout: () => void;

    // Patients
    patients: Patient[];
    addPatient: (patient: Patient) => void;
    updatePatient: (id: string, updates: Partial<Patient>) => void;
    deletePatient: (id: string) => void;

    // Appointments
    appointments: Appointment[];
    addAppointment: (appointment: Appointment) => void;
    updateAppointment: (id: string, updates: Partial<Appointment>) => void;
    deleteAppointment: (id: string) => void;
    updateAppointmentStatus: (id: string, status: Appointment['status']) => void;

    // Rooms & Admissions
    rooms: Room[];
    admissions: Admission[];
    allocateRoom: (roomId: string, patientId: string, appointmentId: string) => void;
    dischargePatient: (admissionId: string) => void;

    // Vitals & Nursing
    vitals: Vitals[];
    nursingNotes: NursingNote[];
    nursingTasks: NursingTask[];
    medicationLogs: MedicationLog[];
    addVitals: (vitals: Vitals) => void;
    addNursingNote: (note: NursingNote) => void;
    addNursingTask: (task: NursingTask) => void;
    updateNursingTaskStatus: (taskId: string, status: 'Pending' | 'Completed') => void;
    logMedication: (log: MedicationLog) => void;

    // Consultations
    consultations: Consultation[];
    addConsultation: (consultation: Consultation) => void;

    // Billing
    invoices: Invoice[];
    addInvoice: (invoice: Invoice) => void;
    updateInvoiceStatus: (id: string, status: Invoice['status'], method?: Invoice['paymentMethod']) => void;

    // Reports
    reports: Report[];
    addReport: (report: Report) => void;
    updateReportStatus: (id: string, status: Report['status']) => void;

    // UI State
    darkMode: boolean;
    toggleDarkMode: (value?: boolean) => void;
}

export interface Report {
    id: string;
    patientId: string;
    patientName: string;
    testName: string;
    result: string;
    status: 'Processing' | 'Verified' | 'Ready' | 'Dispatched';
    date: string;
}

export const useHISStore = create<HISState>()(
    persist(
        (set) => ({
            // Auth Initial State
            isAuthenticated: false,
            user: null,
            login: (username) => set({ isAuthenticated: true, user: { username } }),
            logout: () => set({ isAuthenticated: false, user: null }),

            // Patients Initial State
            patients: [],
            addPatient: (patient) => set((state) => {
                // Ensure room range IP-100 to IP-106 exists if it doesn't already
                const requiredRooms = ['IP-100', 'IP-101', 'IP-102', 'IP-103', 'IP-104', 'IP-105', 'IP-106'];
                const missingRooms = requiredRooms.filter(id => !state.rooms.find(r => r.id === id));

                let updatedRooms = state.rooms;
                if (missingRooms.length > 0) {
                    const newRooms: Room[] = [
                        { id: 'IP-100', wardType: 'General', roomNumber: '100', bedNumber: '1', status: 'Available', dailyCharge: 500 },
                        { id: 'IP-101', wardType: 'General', roomNumber: '101', bedNumber: '3', status: 'Available', dailyCharge: 500 },
                        { id: 'IP-102', wardType: 'General', roomNumber: '102', bedNumber: '3', status: 'Available', dailyCharge: 500 },
                        { id: 'IP-103', wardType: 'General', roomNumber: '103', bedNumber: '3', status: 'Available', dailyCharge: 500 },
                        { id: 'IP-104', wardType: 'General', roomNumber: '104', bedNumber: '2', status: 'Available', dailyCharge: 500 },
                        { id: 'IP-105', wardType: 'General', roomNumber: '105', bedNumber: '1', status: 'Available', dailyCharge: 500 },
                        { id: 'IP-106', wardType: 'General', roomNumber: '106', bedNumber: '1', status: 'Available', dailyCharge: 500 },
                    ] as Room[];
                    const filteredNewRooms = newRooms.filter(nr => missingRooms.includes(nr.id));
                    updatedRooms = [...state.rooms, ...filteredNewRooms];
                }

                let tokenNumber = patient.tokenNumber;
                if (!tokenNumber && patient.type === 'OP') {
                    const today = new Date().toISOString().split('T')[0];
                    const opPatientsToday = state.patients.filter(p =>
                        p.type === 'OP' &&
                        p.registrationDate.startsWith(today)
                    );
                    tokenNumber = opPatientsToday.length + 1;
                }
                const newPatient = {
                    ...patient,
                    tokenNumber,
                    registrationDate: patient.registrationDate || new Date().toISOString()
                };
                return {
                    patients: [...state.patients, newPatient],
                    rooms: updatedRooms
                };
            }),
            updatePatient: (id, updates) =>
                set((state) => ({
                    patients: state.patients.map((p) => (p.id === id ? { ...p, ...updates } : p)),
                })),
            deletePatient: (id) =>
                set((state) => ({
                    patients: state.patients.filter((p) => p.id !== id),
                    appointments: state.appointments.filter((a) => a.patientId !== id),
                })),

            // Appointments Initial State
            appointments: [],
            addAppointment: (appointment) => set((state) => {
                const sameDayAppts = state.appointments.filter(a =>
                    a.doctorId === appointment.doctorId &&
                    a.start.split('T')[0] === appointment.start.split('T')[0]
                );
                const tokenNumber = appointment.visitType !== 'IP Admission' ? sameDayAppts.length + 1 : undefined;

                const existingPatient = state.patients.find(p => p.id === appointment.patientId || p.name === appointment.patientName);

                let updatedPatients = [...state.patients];
                let patientId = appointment.patientId;

                const visitEntry = {
                    date: appointment.start,
                    reason: appointment.visitType,
                    notes: appointment.notes
                };

                if (existingPatient) {
                    patientId = existingPatient.id;
                    updatedPatients = state.patients.map(p =>
                        p.id === patientId
                            ? {
                                ...p,
                                visitHistory: [...p.visitHistory, visitEntry],
                                age: appointment.age || p.age,
                                gender: appointment.gender || p.gender,
                                bloodGroup: appointment.bloodGroup || p.bloodGroup,
                                address: appointment.address || p.address,
                                type: appointment.patientType || p.type,
                                // Sync Nursing Status/Priority
                                nursingStatus: appointment.status === 'Emergency' ? 'Critical' : (appointment.status === 'Checked-in' || appointment.status === 'Waiting') ? 'Waiting' : p.nursingStatus,
                                nursingPriority: appointment.priority || p.nursingPriority
                            }
                            : p
                    );
                } else {
                    if (!patientId) {
                        patientId = 'P-' + Math.random().toString(36).substr(2, 6).toUpperCase();
                    }
                    const newPatient: Patient = {
                        id: patientId,
                        name: appointment.patientName,
                        age: appointment.age || 0,
                        gender: appointment.gender || 'Other',
                        bloodGroup: appointment.bloodGroup || 'Unknown',
                        phone: appointment.phone,
                        address: appointment.address || '',
                        type: appointment.patientType || 'OP',
                        medicalHistory: [],
                        allergies: [],
                        visitHistory: [visitEntry],
                        registrationDate: new Date().toISOString(),
                        nursingStatus: appointment.status === 'Emergency' ? 'Critical' : (appointment.status === 'Checked-in' || appointment.status === 'Waiting') ? 'Waiting' : 'Waiting',
                        nursingPriority: appointment.priority || 'Normal'
                    };
                    updatedPatients.push(newPatient);
                }

                const finalAppointment = { ...appointment, patientId, tokenNumber };
                return {
                    appointments: [...state.appointments, finalAppointment],
                    patients: updatedPatients
                };
            }),
            updateAppointment: (id, updates) =>
                set((state) => {
                    const appointment = state.appointments.find(a => a.id === id);
                    const patientId = appointment?.patientId;

                    let updatedPatients = state.patients;
                    if (patientId && (updates.status || updates.priority)) {
                        updatedPatients = state.patients.map(p => p.id === patientId ? {
                            ...p,
                            nursingStatus: updates.status === 'Emergency' ? 'Critical' : (updates.status === 'Checked-in' || updates.status === 'Waiting') ? 'Waiting' : p.nursingStatus,
                            nursingPriority: updates.priority || p.nursingPriority
                        } : p);
                    }

                    return {
                        appointments: state.appointments.map((a) =>
                            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
                        ),
                        patients: updatedPatients
                    };
                }),
            deleteAppointment: (id) =>
                set((state) => ({
                    appointments: state.appointments.filter((a) => a.id !== id),
                })),
            updateAppointmentStatus: (id, status) =>
                set((state) => {
                    const appointment = state.appointments.find(a => a.id === id);
                    const patientId = appointment?.patientId;

                    let updatedPatients = state.patients;
                    if (patientId) {
                        updatedPatients = state.patients.map(p => p.id === patientId ? {
                            ...p,
                            nursingStatus: status === 'Emergency' ? 'Critical' : (status === 'Checked-in' || status === 'Waiting') ? 'Waiting' : p.nursingStatus
                        } : p);
                    }

                    return {
                        appointments: state.appointments.map((a) => (a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a)),
                        patients: updatedPatients
                    };
                }),

            // Rooms & Admissions Initial State
            rooms: [
                // General Ward
                { id: 'R-101', wardType: 'General', roomNumber: '101', bedNumber: '1', status: 'Available', dailyCharge: 500 },
                { id: 'R-102', wardType: 'General', roomNumber: '101', bedNumber: '2', status: 'Occupied', dailyCharge: 500 },
                { id: 'R-103', wardType: 'General', roomNumber: '102', bedNumber: '1', status: 'Available', dailyCharge: 500 },
                { id: 'R-104', wardType: 'General', roomNumber: '102', bedNumber: '2', status: 'Available', dailyCharge: 500 },
                { id: 'R-105', wardType: 'General', roomNumber: '103', bedNumber: '1', status: 'Occupied', dailyCharge: 500 },
                // Semi-Private
                { id: 'R-201', wardType: 'Semi-Private', roomNumber: '201', bedNumber: '1', status: 'Available', dailyCharge: 1200 },
                { id: 'R-202', wardType: 'Semi-Private', roomNumber: '201', bedNumber: '2', status: 'Available', dailyCharge: 1200 },
                { id: 'R-203', wardType: 'Semi-Private', roomNumber: '202', bedNumber: '1', status: 'Occupied', dailyCharge: 1200 },
                { id: 'R-204', wardType: 'Semi-Private', roomNumber: '202', bedNumber: '2', status: 'Available', dailyCharge: 1200 },
                // Private
                { id: 'R-301', wardType: 'Private', roomNumber: '301', bedNumber: '1', status: 'Occupied', dailyCharge: 2500 },
                { id: 'R-302', wardType: 'Private', roomNumber: '302', bedNumber: '1', status: 'Available', dailyCharge: 2500 },
                { id: 'R-303', wardType: 'Private', roomNumber: '303', bedNumber: '1', status: 'Available', dailyCharge: 2500 },
                // ICU
                { id: 'R-401', wardType: 'ICU', roomNumber: '401', bedNumber: '1', status: 'Available', dailyCharge: 5000 },
                { id: 'R-402', wardType: 'ICU', roomNumber: '402', bedNumber: '1', status: 'Occupied', dailyCharge: 5000 },
                // Additional Rooms
                { id: 'R-106', wardType: 'General', roomNumber: '103', bedNumber: '2', status: 'Available', dailyCharge: 500 },
                { id: 'R-107', wardType: 'General', roomNumber: '104', bedNumber: '1', status: 'Available', dailyCharge: 500 },
                { id: 'R-205', wardType: 'Semi-Private', roomNumber: '203', bedNumber: '1', status: 'Available', dailyCharge: 1200 },
                { id: 'R-206', wardType: 'Semi-Private', roomNumber: '203', bedNumber: '2', status: 'Available', dailyCharge: 1200 },
                { id: 'R-304', wardType: 'Private', roomNumber: '304', bedNumber: '1', status: 'Available', dailyCharge: 2500 },
                // IP 100-106 Range
                { id: 'IP-100', wardType: 'General', roomNumber: '100', bedNumber: '1', status: 'Available', dailyCharge: 500 },
                { id: 'IP-101', wardType: 'General', roomNumber: '101', bedNumber: '3', status: 'Available', dailyCharge: 500 },
                { id: 'IP-102', wardType: 'General', roomNumber: '102', bedNumber: '3', status: 'Available', dailyCharge: 500 },
                { id: 'IP-103', wardType: 'General', roomNumber: '103', bedNumber: '3', status: 'Available', dailyCharge: 500 },
                { id: 'IP-104', wardType: 'General', roomNumber: '104', bedNumber: '2', status: 'Available', dailyCharge: 500 },
                { id: 'IP-105', wardType: 'General', roomNumber: '105', bedNumber: '1', status: 'Available', dailyCharge: 500 },
                { id: 'IP-106', wardType: 'General', roomNumber: '106', bedNumber: '1', status: 'Available', dailyCharge: 500 },
            ],
            admissions: [],
            allocateRoom: (roomId, patientId, appointmentId) => set((state) => {
                const newAdmission: Admission = {
                    id: 'ADM-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                    patientId,
                    appointmentId,
                    roomId,
                    admissionDate: new Date().toISOString(),
                    status: 'Admitted'
                };
                return {
                    admissions: [...state.admissions, newAdmission],
                    rooms: state.rooms.map(r => r.id === roomId ? { ...r, status: 'Occupied' } : r),
                    patients: state.patients.map(p => p.id === patientId ? { ...p, nursingStatus: 'Stable', type: 'IP' } : p)
                };
            }),
            dischargePatient: (admissionId) => set((state) => {
                const admission = state.admissions.find(a => a.id === admissionId);
                if (!admission) return state;

                const patient = state.patients.find(p => p.id === admission.patientId);
                const room = state.rooms.find(r => r.id === admission.roomId);
                const dischargeDate = new Date().toISOString();
                const totalDays = Math.ceil((new Date(dischargeDate).getTime() - new Date(admission.admissionDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
                const totalBill = room ? room.dailyCharge * totalDays : 0;

                const newInvoice: Invoice = {
                    id: 'INV-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                    patientId: admission.patientId,
                    patientName: patient?.name || 'Unknown Patient',
                    date: dischargeDate,
                    items: [
                        { description: `Room Charges (Room ${room?.roomNumber}, ${totalDays} days)`, amount: totalBill }
                    ],
                    total: totalBill,
                    discount: 0,
                    finalAmount: totalBill,
                    status: 'Unpaid'
                };

                return {
                    admissions: state.admissions.map(a => a.id === admissionId ? { ...a, status: 'Discharged', dischargeDate, totalBill } : a),
                    rooms: state.rooms.map(r => r.id === admission.roomId ? { ...r, status: 'Available' } : r),
                    invoices: [...state.invoices, newInvoice]
                };
            }),

            // Vitals & Nursing Initial State
            vitals: [],
            nursingNotes: [],
            nursingTasks: [],
            medicationLogs: [],
            addVitals: (v) => set((state) => ({
                vitals: [...state.vitals, v],
                patients: state.patients.map(p => p.id === v.patientId ? { ...p, nursingStatus: (v.temperature > 39 || v.oxygenSaturation < 90) ? 'Critical' : 'Stable' } : p)
            })),
            addNursingNote: (note) => set((state) => ({ nursingNotes: [...state.nursingNotes, note] })),
            addNursingTask: (task) => set((state) => ({ nursingTasks: [...state.nursingTasks, task] })),
            updateNursingTaskStatus: (taskId, status) => set((state) => ({
                nursingTasks: state.nursingTasks.map(t => t.id === taskId ? { ...t, status } : t)
            })),
            logMedication: (log) => set((state) => ({ medicationLogs: [...state.medicationLogs, log] })),

            // Consultations Initial State
            consultations: [],
            addConsultation: (c) => set((state) => ({ consultations: [...state.consultations, c] })),

            // Billing Initial State
            invoices: [],
            addInvoice: (invoice) => set((state) => ({ invoices: [...state.invoices, invoice] })),
            updateInvoiceStatus: (id, status, method) =>
                set((state) => ({
                    invoices: state.invoices.map((inv) => (inv.id === id ? { ...inv, status, paymentMethod: method } : inv)),
                })),

            // Reports Initial State
            reports: [],
            addReport: (report) => set((state) => ({ reports: [...state.reports, report] })),
            updateReportStatus: (id, status) =>
                set((state) => ({
                    reports: state.reports.map((r) => (r.id === id ? { ...r, status } : r)),
                })),

            // UI Initial State
            darkMode: false,
            toggleDarkMode: (value) => set((state) => ({ darkMode: value !== undefined ? value : !state.darkMode })),
        }),
        {
            name: 'his-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
