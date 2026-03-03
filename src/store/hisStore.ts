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
    visitHistory: { date: string; reason: string; notes: string }[];
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
    patientId: string;
    bloodPressure: string;
    pulse: number;
    temperature: number;
    recordedAt: string;
}

export interface Consultation {
    id: string;
    appointmentId: string;
    patientId: string;
    diagnosis: string;
    prescription: { medicine: string; dosage: string; frequency: string }[];
    labTests: string[];
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

export interface Report {
    id: string;
    patientId: string;
    patientName: string;
    testName: string;
    result: string;
    status: 'Processing' | 'Verified' | 'Ready' | 'Dispatched';
    date: string;
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

    // Vitals & Nursing
    vitals: Vitals[];
    addVitals: (vitals: Vitals) => void;

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
            addPatient: (patient) => set((state) => ({ patients: [...state.patients, patient] })),
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
                                type: appointment.patientType || p.type
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
                        visitHistory: [visitEntry]
                    };
                    updatedPatients.push(newPatient);
                }

                const finalAppointment = { ...appointment, patientId };
                return {
                    appointments: [...state.appointments, finalAppointment],
                    patients: updatedPatients
                };
            }),
            updateAppointment: (id, updates) =>
                set((state) => ({
                    appointments: state.appointments.map((a) =>
                        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
                    ),
                })),
            deleteAppointment: (id) =>
                set((state) => ({
                    appointments: state.appointments.filter((a) => a.id !== id),
                })),
            updateAppointmentStatus: (id, status) =>
                set((state) => ({
                    appointments: state.appointments.map((a) => (a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a)),
                })),

            // Vitals Initial State
            vitals: [],
            addVitals: (v) => set((state) => ({ vitals: [...state.vitals, v] })),

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
