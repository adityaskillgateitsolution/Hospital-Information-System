/**
 * WhatsApp Utility functions for HIS
 */

export const formatWhatsAppLink = (phone: string, message: string) => {
    // Basic validation: remove non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return null;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const generateAppointmentMessage = (type: 'Scheduled' | 'Cancelled' | 'Reminder', data: {
    patientName: string;
    doctorName: string;
    startTime: string;
}) => {
    const formattedDate = new Date(data.startTime).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    switch (type) {
        case 'Scheduled':
            return `Hello ${data.patientName}, your appointment with ${data.doctorName} has been scheduled for ${formattedDate}. Thank you!`;
        case 'Cancelled':
            return `Hello ${data.patientName}, your appointment with ${data.doctorName} on ${formattedDate} has been cancelled. Please contact us for rescheduling.`;
        case 'Reminder':
            return `Reminder: Hello ${data.patientName}, you have an appointment with ${data.doctorName} in 1 hour (${formattedDate}). We look forward to seeing you.`;
        default:
            return '';
    }
};

export const openWhatsApp = (phone: string, message: string) => {
    const link = formatWhatsAppLink(phone, message);
    if (link) {
        window.open(link, '_blank');
        return true;
    }
    return false;
};
