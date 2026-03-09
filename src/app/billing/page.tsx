'use client';

import { useState, useMemo } from 'react';
import { useHISStore, Invoice, Patient } from '@/store/hisStore';
import {
    CreditCard,
    Plus,
    Trash2,
    FileText,
    Download,
    DollarSign,
    CheckCircle,
    Search,
    User,
    Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import Navbar from '@/components/Navbar';

export default function BillingPage() {
    const { invoices, patients, addInvoice, updateInvoiceStatus } = useHISStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [items, setItems] = useState([{ description: '', amount: 0 }]);
    const [discount, setDiscount] = useState(0);

    const filteredInvoices = invoices.filter(inv =>
        inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.amount, 0), [items]);
    const total = useMemo(() => subtotal - discount, [subtotal, discount]);

    const handleAddItem = () => {
        setItems([...items, { description: '', amount: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = field === 'amount' ? parseFloat(value) || 0 : value;
        setItems(newItems);
    };

    const handleCreateInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        const patient = patients.find(p => p.id === selectedPatientId);
        if (!patient) return;

        const newInvoice: Invoice = {
            id: 'INV-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            patientId: selectedPatientId,
            patientName: patient.name,
            date: new Date().toLocaleDateString(),
            items: items.filter(item => item.description),
            total: subtotal,
            discount,
            finalAmount: total,
            status: 'Unpaid'
        };

        addInvoice(newInvoice);
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setSelectedPatientId('');
        setItems([{ description: '', amount: 0 }]);
        setDiscount(0);
    };

    const generatePDF = (invoice: Invoice) => {
        const doc = new jsPDF();
        const margin = 20;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(30, 58, 138); // Primary color
        doc.text('MEDISYNC ENTERPRISE HIS', margin, 30);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('123 Medical Avenue, Healthcare City, HC 12345', margin, 38);
        doc.text('Contact: +1 (555) 000-0000 | Email: billing@medisync.com', margin, 43);

        // Invoice Info
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text(`INVOICE: ${invoice.id}`, margin, 60);

        doc.setFontSize(11);
        doc.text(`Patient: ${invoice.patientName}`, margin, 70);
        doc.text(`Patient ID: ${invoice.patientId}`, margin, 75);
        doc.text(`Date: ${invoice.date}`, margin, 80);
        doc.text(`Status: ${invoice.status}`, 140, 70);

        // Table Header
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, 90, 170, 10, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Description', margin + 5, 96);
        doc.text('Amount (₹)', 160, 96);

        // Items
        doc.setFont('helvetica', 'normal');
        let y = 106;
        invoice.items.forEach((item) => {
            doc.text(item.description, margin + 5, y);
            doc.text(item.amount.toFixed(2), 160, y);
            y += 10;
        });

        // Summary
        const summaryX = 130;
        y += 10;
        doc.line(margin, y - 5, 190, y - 5);
        doc.text('Subtotal:', summaryX, y);
        doc.text(`₹${invoice.total.toFixed(2)}`, 160, y);

        y += 8;
        doc.text('Discount:', summaryX, y);
        doc.text(`-₹${invoice.discount.toFixed(2)}`, 160, y);

        y += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Amount:', summaryX, y);
        doc.text(`₹${invoice.finalAmount.toFixed(2)}`, 160, y);

        // Footer
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150);
        doc.text('Thank you for choosing MediSync Healthcare Services.', 105, 270, { align: 'center' });

        doc.save(`${invoice.id}.pdf`);
    };

    const handleMarkAsPaid = (id: string, method: 'Cash' | 'Card') => {
        updateInvoiceStatus(id, 'Paid', method);
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            <Navbar />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Billing & Invoices</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Process payments and manage financial records.</p>
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
                        <Plus size={20} /> Create Invoice
                    </button>
                </div>

                {/* Stats Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
                    <div className="glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ padding: '12px', background: 'var(--primary)15', borderRadius: '12px', color: 'var(--primary)' }}>
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL REVENUE</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                                ₹{invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.finalAmount, 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                    <div className="glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ padding: '12px', background: '#ef444415', borderRadius: '12px', color: '#ef4444' }}>
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>UNPAID AMOUNT</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                                ₹{invoices.filter(i => i.status === 'Unpaid').reduce((acc, curr) => acc + curr.finalAmount, 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                    <div className="glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ padding: '12px', background: 'var(--accent)15', borderRadius: '12px', color: 'var(--accent)' }}>
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>PAID INVOICES</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                                {invoices.filter(i => i.status === 'Paid').length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & List */}
                <div className="glass" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search by patient name or invoice ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ flex: 1, padding: '8px', background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }}
                        />
                    </div>
                </div>

                <div className="glass" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--background)', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                            <tr>
                                <th style={{ padding: '16px 24px' }}>INVOICE ID</th>
                                <th style={{ padding: '16px 24px' }}>PATIENT</th>
                                <th style={{ padding: '16px 24px' }}>DATE</th>
                                <th style={{ padding: '16px 24px' }}>AMOUNT</th>
                                <th style={{ padding: '16px 24px' }}>STATUS</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>No invoices found.</td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} style={{ borderTop: '1px solid var(--border)' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: '600' }}>{inv.id}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontWeight: '600' }}>{inv.patientName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.patientId}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '0.9rem' }}>{inv.date}</td>
                                        <td style={{ padding: '16px 24px', fontWeight: '700' }}>₹{inv.finalAmount.toFixed(2)}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: '700',
                                                background: inv.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                                                color: inv.status === 'Paid' ? '#166534' : '#991b1b'
                                            }}>
                                                {inv.status} {inv.paymentMethod && `(${inv.paymentMethod})`}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                                {inv.status === 'Unpaid' && (
                                                    <>
                                                        <button onClick={() => handleMarkAsPaid(inv.id, 'Cash')} style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: '600' }}>Paid Cash</button>
                                                        <button onClick={() => handleMarkAsPaid(inv.id, 'Card')} style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '600' }}>Paid Card</button>
                                                    </>
                                                )}
                                                <button onClick={() => generatePDF(inv)} style={{ color: 'var(--text-main)' }}>
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Create Invoice Modal */}
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
                            style={{ width: '100%', maxWidth: '700px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px' }}>Generate New Invoice</h2>

                            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

                                <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Service Items</h3>
                                        <button type="button" onClick={handleAddItem} style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Plus size={16} /> Add Item
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {items.map((item, idx) => (
                                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', gap: '12px', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                                    placeholder="Service description"
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                                                />
                                                <input
                                                    type="number"
                                                    value={item.amount}
                                                    onChange={(e) => handleUpdateItem(idx, 'amount', e.target.value)}
                                                    placeholder="Price"
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-main)' }}
                                                />
                                                <button type="button" onClick={() => handleRemoveItem(idx)} style={{ color: '#ef4444' }} disabled={items.length === 1}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>
                                            <Percent size={14} /> Applied Discount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                                        />
                                    </div>

                                    <div className="glass" style={{ padding: '16px', borderRadius: '12px', background: 'var(--primary)05' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                            <span>Subtotal:</span>
                                            <span style={{ fontWeight: '700' }}>₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', color: '#ef4444' }}>
                                            <span>Discount:</span>
                                            <span>-₹{discount.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
                                            <span>Total:</span>
                                            <span>₹{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontWeight: '700' }}>Cancel</button>
                                    <button type="submit" style={{ flex: 1, background: 'var(--primary)', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: '700' }} className="card-hover">Generate Invoice</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
