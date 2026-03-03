import { Appointment } from '@/store/hisStore';

export const WORKING_HOURS = {
    start: 9, // 9 AM
    end: 18,  // 6 PM
};

export const STATUS_COLORS: Record<string, string> = {
    'Scheduled': '#3b82f6',     // Blue
    'Confirmed': '#6366f1',     // Indigo
    'Checked-in': '#0d9488',    // Teal
    'Waiting': '#f59e0b',        // Amber
    'In Consultation': '#ec4899', // Pink
    'Completed': '#22c55e',      // Green
    'Cancelled': '#ef4444',      // Red
    'No-show': '#94a3b8',        // Slate
    'Emergency': '#7f1d1d',      // Maroon
};

export const validateConflict = (
    newAppt: Partial<Appointment>,
    existingAppts: Appointment[],
    excludeId?: string
): { conflict: boolean; message: string } => {
    if (!newAppt.start || !newAppt.end || !newAppt.doctorId) {
        return { conflict: false, message: '' };
    }

    const start = new Date(newAppt.start);
    const end = new Date(newAppt.end);

    // 1. Validate Working Hours (9AM - 6PM)
    const startHour = start.getHours();
    const endHour = end.getHours();

    if (newAppt.priority !== 'Emergency') {
        if (startHour < WORKING_HOURS.start || (endHour >= WORKING_HOURS.end && end.getMinutes() > 0) || startHour >= WORKING_HOURS.end) {
            return {
                conflict: true,
                message: `Booking must be within 9 AM - 6 PM. Emergency cases only for overrides.`
            };
        }
    }

    // 2. Prevent Double Booking for same doctor
    const isOverlapping = existingAppts.some(appt => {
        if (appt.id === excludeId) return false;
        if (appt.doctorId !== newAppt.doctorId) return false;
        if (appt.status === 'Cancelled') return false;

        const apptStart = new Date(appt.start);
        const apptEnd = new Date(appt.end);

        return (start < apptEnd && end > apptStart);
    });

    if (isOverlapping) {
        return {
            conflict: true,
            message: `Conflict detected: Doctor ${newAppt.doctorName} is already booked for this time slot.`
        };
    }

    return { conflict: false, message: '' };
};
