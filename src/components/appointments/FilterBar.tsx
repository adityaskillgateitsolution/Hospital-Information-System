'use client';

import { Search, Filter, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

interface FilterBarProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    selectedDoctor: string;
    setSelectedDoctor: (val: string) => void;
    selectedDept: string;
    setSelectedDept: (val: string) => void;
    selectedStatus: string;
    setSelectedStatus: (val: string) => void;
    doctors: string[];
    departments: string[];
    statuses: string[];
    onPrevDay: () => void;
    onNextDay: () => void;
    onToday: () => void;
    onDateChange: (date: string) => void;
    currentDateLabel: string;
    currentView: string;
    onViewChange: (view: string) => void;
}

export default function FilterBar({
    searchTerm, setSearchTerm,
    selectedDoctor, setSelectedDoctor,
    selectedDept, setSelectedDept,
    selectedStatus, setSelectedStatus,
    doctors, departments, statuses,
    onPrevDay, onNextDay, onToday, onDateChange,
    currentDateLabel,
    currentView, onViewChange
}: FilterBarProps) {
    const dateInputRef = useRef<HTMLInputElement>(null);

    const handleDateClick = () => {
        if (dateInputRef.current) {
            try {
                // Try to use modern showPicker API
                (dateInputRef.current as any).showPicker();
            } catch (e) {
                // Fallback for older browsers
                dateInputRef.current.focus();
                dateInputRef.current.click();
            }
        }
    };

    return (
        <div className="glass" style={{
            padding: '16px 24px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            alignItems: 'center',
            position: 'sticky',
            top: '80px',
            zIndex: 10
        }}>
            {/* Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '10px' }}>
                <button onClick={onPrevDay} className="card-hover" style={{ padding: '8px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--border)' }}>
                    <ChevronLeft size={18} />
                </button>
                <button onClick={onToday} className="card-hover" style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--border)', fontWeight: '600', fontSize: '0.85rem' }}>
                    Today
                </button>
                <button onClick={onNextDay} className="card-hover" style={{ padding: '8px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--border)' }}>
                    <ChevronRight size={18} />
                </button>

                <div
                    onClick={handleDateClick}
                    className="card-hover"
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: 'var(--primary)08',
                        padding: '8px 20px',
                        borderRadius: '12px',
                        border: '1px solid var(--primary)30',
                        marginLeft: '12px',
                        boxShadow: '0 2px 8px rgba(var(--primary-rgb), 0.1)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <input
                        ref={dateInputRef}
                        type="date"
                        onChange={(e) => onDateChange(e.target.value)}
                        style={{
                            position: 'absolute',
                            opacity: 0,
                            top: 10, // Adjust position internally
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none' // Let the container handle click
                        }}
                    />
                    <span style={{
                        fontWeight: '800',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '1rem',
                        letterSpacing: '-0.01em'
                    }}>
                        <CalendarIcon size={20} />
                        {currentDateLabel}
                    </span>
                </div>

                <select
                    value={currentView}
                    onChange={(e) => onViewChange(e.target.value)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: 'var(--background)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        outline: 'none',
                        boxShadow: 'var(--shadow)'
                    }}
                >
                    <option value="timeGridDay">Day</option>
                    <option value="workWeek">Work Week</option>
                    <option value="timeGridWeek">Week</option>
                    <option value="dayGridMonth">Month</option>
                </select>
            </div>

            {/* Search */}
            <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--background)', padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <Search size={18} color="var(--text-muted)" />
                <input
                    type="text"
                    placeholder="Search patient name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', width: '100%', outline: 'none', color: 'var(--text-main)', fontSize: '0.9rem' }}
                />
            </div>

            {/* Selects */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                >
                    <option value="All">All Doctors</option>
                    {doctors.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                >
                    <option value="All">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                >
                    <option value="All">All Status</option>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        </div>
    );
}
