'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useHISStore, Appointment } from '@/store/hisStore';
import Navbar from '@/components/Navbar';
import FilterBar from '@/components/appointments/FilterBar';
import QueuePanel from '@/components/appointments/QueuePanel';
import AppointmentModal from '@/components/appointments/AppointmentModal';
import EventPreview from '@/components/appointments/EventPreview';
import { STATUS_COLORS } from '@/utils/appointmentUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { a } from 'framer-motion/client';

export default function AppointmentsPage() {
    const calendarRef = useRef<FullCalendar>(null);
    const { appointments, updateAppointment } = useHISStore();

    // UI state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState<Partial<Appointment> | null>(null);
    const [currentDateLabel, setCurrentDateLabel] = useState('');
    // Hover state
    const [hoverAppt, setHoverAppt] = useState<Appointment | null>(null);
    const [hoverPos, setHoverPos] = useState<{ x: number, y: number } | null>(null);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('All');
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [currentView, setCurrentView] = useState('timeGridDay');

    // Sync labels on mount
    useEffect(() => {
        if (calendarRef.current) {
            setCurrentDateLabel(calendarRef.current.getApi().view.title);
        }
    }, []);

    // Derived data for filters
    const availableDoctors = useMemo(() => Array.from(new Set(appointments.map(a => a.doctorName))), [appointments]);
    const availableDepts = useMemo(() => Array.from(new Set(appointments.map(a => a.department))), [appointments]);
    const availableStatuses = useMemo(() => Array.from(new Set(appointments.map(a => a.status))), [appointments]);

    // Filtered events
    const filteredEvents = useMemo(() => {
        return appointments.filter(appt => {
            const matchesSearch = appt.patientName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDoctor = selectedDoctor === 'All' || appt.doctorName === selectedDoctor;
            const matchesDept = selectedDept === 'All' || appt.department === selectedDept;
            const matchesStatus = selectedStatus === 'All' || appt.status === selectedStatus;
            return matchesSearch && matchesDoctor && matchesDept && matchesStatus;
        }).map(appt => ({
            id: appt.id,
            title: `${appt.patientName} (${appt.visitType})`,
            start: appt.start,
            end: appt.end,
            backgroundColor: STATUS_COLORS[appt.status] || 'var(--primary)',
            borderColor: 'transparent',
            extendedProps: appt,
            className: appt.priority === 'Emergency' ? 'emergency-pulse' : '',
            editable: new Date(appt.start) >= new Date()
        }));
    }, [appointments, searchTerm, selectedDoctor, selectedDept, selectedStatus]);

    // Calendar Handlers
    const handleDateSelect = (selectInfo: any) => {
        setSelectedAppt({
            start: selectInfo.startStr,
            end: selectInfo.endStr
        });
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo: any) => {
        const appt = clickInfo.event.extendedProps as Appointment;
        setSelectedAppt(appt);
        setIsModalOpen(true);
    };

    const handleEventDrop = (dropInfo: any) => {
        const { event } = dropInfo;
        updateAppointment(event.id, {
            start: event.startStr,
            end: event.endStr
        });
    };

    const handleEventResize = (resizeInfo: any) => {
        const { event } = resizeInfo;
        updateAppointment(event.id, {
            start: event.startStr,
            end: event.endStr
        });
    };

    const updateTitle = () => {
        if (calendarRef.current) {
            setCurrentDateLabel(calendarRef.current.getApi().view.title);
        }
    };

    const handleEventMouseEnter = (info: any) => {
        const appt = info.event.extendedProps as Appointment;
        setHoverAppt(appt);
        setHoverPos({ x: info.jsEvent.clientX, y: info.jsEvent.clientY });
    };

    const handleEventMouseLeave = () => {
        setHoverAppt(null);
        setHoverPos(null);
    };

    const handleViewChange = (view: string) => {
        if (calendarRef.current) {
            calendarRef.current.getApi().changeView(view);
            setCurrentView(view);
            updateTitle();
        }
    };

    const handleDateChange = (dateStr: string) => {
        if (calendarRef.current && dateStr) {
            calendarRef.current.getApi().gotoDate(dateStr);
            updateTitle();
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
            <Navbar />

            <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>Clinical Appointments</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Enterprise hospital schedule management system.</p>
                </div>

                <FilterBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedDoctor={selectedDoctor}
                    setSelectedDoctor={setSelectedDoctor}
                    selectedDept={selectedDept}
                    setSelectedDept={setSelectedDept}
                    selectedStatus={selectedStatus}
                    setSelectedStatus={setSelectedStatus}
                    doctors={availableDoctors}
                    departments={availableDepts}
                    statuses={availableStatuses}
                    onPrevDay={() => { calendarRef.current?.getApi().prev(); updateTitle(); }}
                    onNextDay={() => { calendarRef.current?.getApi().next(); updateTitle(); }}
                    onToday={() => { calendarRef.current?.getApi().today(); updateTitle(); }}
                    onDateChange={handleDateChange}
                    currentDateLabel={currentDateLabel}
                    currentView={currentView}
                    onViewChange={handleViewChange}
                />

                <div style={{ display: 'flex', gap: '24px', alignItems: 'start' }}>
                    <div className="glass" style={{ flex: 1, padding: '24px', minHeight: '800px' }}>
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="timeGridDay"
                            headerToolbar={false}
                            selectable={true}
                            selectMirror={true}
                            dayMaxEvents={true}
                            weekends={true}
                            events={filteredEvents}
                            select={handleDateSelect}
                            eventClick={handleEventClick}
                            eventDrop={handleEventDrop}
                            eventResize={handleEventResize}
                            eventMouseEnter={handleEventMouseEnter}
                            eventMouseLeave={handleEventMouseLeave}
                            editable={true}
                            selectAllow={(selectInfo) => {
                                return new Date(selectInfo.start) >= new Date();
                            }}
                            height="auto"
                            slotMinTime="09:00:00"
                            slotMaxTime="18:00:00"
                            allDaySlot={false}
                            slotEventOverlap={false}
                            nowIndicator={true}
                            views={{
                                workWeek: {
                                    type: 'timeGridWeek',
                                    hiddenDays: [0, 6],
                                    buttonText: 'Work Week'
                                }
                            }}
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                meridiem: 'short'
                            }}
                        />
                    </div>

                    <QueuePanel appointments={appointments} />
                </div>
            </main>

            <AppointmentModal
                isOpen={isModalOpen}
                initialData={selectedAppt}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedAppt(null);
                }}
            />

            <AnimatePresence>
                {hoverAppt && <EventPreview appointment={hoverAppt} position={hoverPos} />}
            </AnimatePresence>

            <style jsx global>{`
                .fc { --fc-border-color: var(--border); --fc-button-bg-color: var(--primary); --fc-today-bg-color: var(--primary)05; }
                .fc .fc-toolbar-title { font-weight: 800; color: var(--primary); }
                .fc .fc-col-header-cell { padding: 12px 0; background: var(--background); font-weight: 700; color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; }
                .fc .fc-timegrid-slot { height: 60px !important; border-bottom: 1px dashed var(--border); }
                .fc .fc-timegrid-axis-cushion { font-weight: 600; color: var(--text-muted); font-size: 0.8rem; }
                .fc-event { cursor: pointer; border-radius: 8px !important; padding: 4px 8px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: none !important; transition: transform 0.2s ease; }
                .fc-event:hover { transform: scale(1.02); z-index: 100 !important; }
                .fc-v-event .fc-event-main { color: white !important; font-weight: 600; font-size: 0.85rem; }
                
                @keyframes pulse-emergency {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                .emergency-pulse { animation: pulse-emergency 2s infinite; border: 2px solid #ef4444 !important; }

                /* Premium Calendar Shadows & Blurs */
                .fc-theme-standard td, .fc-theme-standard th { border: 1px solid var(--border); }
                .fc .fc-scrollgrid { border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
            `}</style>
        </div>
    );
}
