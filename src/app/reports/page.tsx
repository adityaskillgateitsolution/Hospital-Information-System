'use client';

import { useState } from 'react';
import { useHISStore, Report, Patient } from '@/store/hisStore';
import {
    FileText,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    Send,
    Download,
    AlertTriangle,
    Plus,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import Navbar from '@/components/Navbar';

export default function ReportsPage() {
    const { reports, patients, addReport, updateReportStatus } = useHISStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<Report['status'] | 'All'>('All');

    // Form State
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [testName, setTestName] = useState('');
    const [result, setResult] = useState('');

    const filteredReports = reports.filter(r => {
        const matchesSearch = r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.testName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleAddReport = (e: React.FormEvent) => {
        e.preventDefault();
        const patient = patients.find(p => p.id === selectedPatientId);
        if (!patient) return;

        const newReport: Report = {
            id: 'REP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            patientId: selectedPatientId,
            patientName: patient.name,
            testName,
            result,
            status: 'Processing',
            date: new Date().toLocaleDateString()
        };

        addReport(newReport);
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setSelectedPatientId('');
        setTestName('');
        setResult('');
    };

    const generateReportPDF = (report: Report) => {
        const doc = new jsPDF();
        const margin = 20;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(30, 58, 138);
        doc.text('MEDISYNC DIAGNOSTICS', margin, 30);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Laboratory & Radio-Imaging Division', margin, 38);
        doc.text('Certified medical laboratory services', margin, 43);

        // Patient Info
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('PATIENT REPORT SUMMARY', margin, 60);

        doc.setFontSize(11);
        doc.text(`Patient Name: ${report.patientName}`, margin, 70);
        doc.text(`Patient ID: ${report.patientId}`, margin, 75);
        doc.text(`Report ID: ${report.id}`, margin, 80);
        doc.text(`Date of Analysis: ${report.date}`, margin, 85);

        // Results Box
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, 100, 170, 60, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, 100, 170, 60, 'D');

        doc.setFont('helvetica', 'bold');
        doc.text(`INVESTIGATION: ${report.testName.toUpperCase()}`, margin + 5, 110);

        doc.setFont('helvetica', 'normal');
        doc.text('Clinical Observations & Results:', margin + 5, 125);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(report.result, margin + 5, 135);

        // Footer & Signature
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Electronically Verified by:', 140, 180);
        doc.setFont('helvetica', 'bold');
        doc.text('Dr. Sarah Connor, MD', 140, 185);
        doc.setFontSize(9);
        doc.text('Chief Pathologist', 140, 190);

        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150);
        doc.text('This is a computer-generated report and does not require a physical signature.', 105, 270, { align: 'center' });

        doc.save(`${report.id}_${report.patientName.replace(' ', '_')}.pdf`);
    };

    const isCritical = (result: string) => {
        return result.toLowerCase().includes('critical') ||
            result.toLowerCase().includes('positive') ||
            result.toLowerCase().includes('high risk');
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Report Dispatch</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage diagnostic results and patient report delivery.</p>
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
                        <Plus size={20} /> Add Lab Result
                    </button>
                </div>

                {/* Filters */}
                <div className="glass" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ flex: 1, padding: '8px', background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Filter size={18} color="var(--text-muted)" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', fontSize: '0.875rem' }}
                        >
                            <option value="All">All Status</option>
                            <option value="Processing">Processing</option>
                            <option value="Verified">Verified</option>
                            <option value="Ready">Ready</option>
                            <option value="Dispatched">Dispatched</option>
                        </select>
                    </div>
                </div>

                {/* Report List */}
                <div style={{ display: 'grid', gap: '16px' }}>
                    {filteredReports.length === 0 ? (
                        <div className="glass" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <FileText size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                            <p>No diagnostic reports found.</p>
                        </div>
                    ) : (
                        filteredReports.map((rep) => (
                            <motion.div
                                layout
                                key={rep.id}
                                className="glass"
                                style={{
                                    padding: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '24px',
                                    borderLeft: isCritical(rep.result) ? '4px solid var(--error)' : '1px solid var(--border)'
                                }}
                            >
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: isCritical(rep.result) ? 'var(--error-bg)' : 'rgba(var(--primary-rgb), 0.1)',
                                    color: isCritical(rep.result) ? 'var(--error)' : 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {isCritical(rep.result) ? <AlertTriangle size={24} /> : <FileText size={24} />}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                        <h3 style={{ fontWeight: '700', fontSize: '1.1rem' }}>{rep.testName}</h3>
                                        {isCritical(rep.result) && (
                                            <span style={{ fontSize: '0.7rem', background: 'var(--error)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>CRITICAL</span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        {rep.patientName} ({rep.patientId}) • {rep.date}
                                    </p>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>STATUS</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        {rep.status === 'Processing' && <Clock size={16} color="var(--warning)" />}
                                        {rep.status === 'Verified' && <ShieldCheck size={16} color="var(--primary)" />}
                                        {rep.status === 'Ready' && <CheckCircle2 size={16} color="var(--success)" />}
                                        {rep.status === 'Dispatched' && <Send size={16} color="#8b5cf6" />}
                                        <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{rep.status}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {rep.status === 'Processing' && (
                                        <button onClick={() => updateReportStatus(rep.id, 'Verified')} className="card-hover" style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>Verify</button>
                                    )}
                                    {rep.status === 'Verified' && (
                                        <button onClick={() => updateReportStatus(rep.id, 'Ready')} className="card-hover" style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>Make Ready</button>
                                    )}
                                    {rep.status === 'Ready' && (
                                        <button onClick={() => updateReportStatus(rep.id, 'Dispatched')} className="card-hover" style={{ background: '#8b5cf6', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>Dispatch</button>
                                    )}
                                    {(rep.status === 'Ready' || rep.status === 'Dispatched') && (
                                        <button onClick={() => generateReportPDF(rep)} title="Download Report" style={{ padding: '8px', color: 'var(--text-muted)' }}>
                                            <Download size={20} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </main>

            {/* Add Report Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, padding: '24px'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass"
                            style={{ width: '100%', maxWidth: '500px', padding: '32px' }}
                        >
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Add Diagnostic Result</h2>

                            <form onSubmit={handleAddReport} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Patient</label>
                                    <select
                                        value={selectedPatientId}
                                        onChange={(e) => setSelectedPatientId(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                    >
                                        <option value="">Select a patient</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Test Name</label>
                                    <input
                                        type="text"
                                        value={testName}
                                        onChange={(e) => setTestName(e.target.value)}
                                        placeholder="e.g. Complete Blood Count"
                                        required
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Observation / Result</label>
                                    <textarea
                                        value={result}
                                        onChange={(e) => setResult(e.target.value)}
                                        placeholder="e.g. Hb: 14.2 g/dL (Normal). Use keyword 'Critical' for high importance."
                                        required
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', minHeight: '100px' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: '600' }}>Cancel</button>
                                    <button type="submit" style={{ flex: 1, background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: '600' }}>Add Result</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
