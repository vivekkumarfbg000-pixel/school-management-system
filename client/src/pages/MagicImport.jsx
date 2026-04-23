import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, FileSpreadsheet, Check, CircleAlert, Loader2, Sparkles, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const MagicImport = () => {
    const { token } = useAuth();
    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [mapping, setMapping] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Success

    const fileInputRef = useRef(null);

    const targetFields = [
        { key: 'name', label: 'Student Name', required: true },
        { key: 'class_name', label: 'Class', required: true },
        { key: 'section', label: 'Section', required: false },
        { key: 'phone', label: 'WhatsApp Number', required: true },
        { key: 'monthly_fee', label: 'Monthly Fee', required: false }
    ];

    const fuzzyMatch = (header) => {
        const h = header.toLowerCase().replace(/[^a-z]/g, '');
        if (h.includes('name') || h.includes('student')) return 'name';
        if (h.includes('class') || h.includes('grade')) return 'class_name';
        if (h.includes('sec')) return 'section';
        if (h.includes('phone') || h.includes('whatsapp') || h.includes('mobile') || h.includes('contact')) return 'phone';
        if (h.includes('fee') || h.includes('amount') || h.includes('charge')) return 'monthly_fee';
        return '';
    };

    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files[0];
        if (!uploadedFile) return;
        setFile(uploadedFile);

        Papa.parse(uploadedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const cols = Object.keys(results.data[0]);
                setData(results.data);
                setHeaders(cols);
                
                // Auto-mapping logic
                const newMapping = {};
                cols.forEach(col => {
                    const match = fuzzyMatch(col);
                    if (match && !Object.values(newMapping).includes(match)) {
                        newMapping[col] = match;
                    }
                });
                setMapping(newMapping);
                setStep(2);
            }
        });
    };

    const handleImport = async () => {
        setIsProcessing(true);
        try {
            // Transform data based on mapping
            const students = data.map(row => {
                const student = {};
                Object.keys(mapping).forEach(col => {
                    student[mapping[col]] = row[col];
                });
                return student;
            }).filter(s => s.name && s.phone); // Basic validation

            await axios.post('/api/bulk/students', { students }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`Imported ${students.length} students successfully!`);
            setStep(3);
        } catch (err) {
            toast.error(err.response?.data?.message || "Import failed");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div className="header-text">
                    <h1><Sparkles className="text-primary" size={24} style={{ display: 'inline', marginRight: '0.5rem' }} /> Magic Importer</h1>
                    <p>Onboard your school in seconds. Drop any messy Excel/CSV and let AI handle the rest.</p>
                </div>
            </div>

            <div className="import-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="card glass-card" style={{ padding: '4rem', textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px' }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" style={{ display: 'none' }} />
                            <div className="ai-icon" style={{ marginBottom: '2rem', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                                <Upload size={32} />
                            </div>
                            <h2 style={{ marginBottom: '1rem' }}>Upload Student List</h2>
                            <p className="text-muted">Drop your .csv file here or click to browse.</p>
                            <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Tip: Messy headers like "P. No", "Name of Student", or "Amt" are fine!
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="card glass-card" style={{ padding: '2rem' }}>
                                <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <h3 className="card-title"><FileSpreadsheet size={18} /> Confirm Mapping</h3>
                                    <span className="card-badge">{data.length} Rows Detected</span>
                                </div>

                                <div className="mapping-grid" style={{ display: 'grid', gap: '1rem' }}>
                                    {headers.map(header => (
                                        <div key={header} className="mapping-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Column in File</div>
                                                <div style={{ fontWeight: 700 }}>{header}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Preview: {data[0][header]}</div>
                                            </div>
                                            <ArrowRight size={20} className="text-muted" />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>EduStream Field</div>
                                                <select 
                                                    className="glass-select" 
                                                    value={mapping[header] || ''} 
                                                    onChange={(e) => setMapping({...mapping, [header]: e.target.value})}
                                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                                >
                                                    <option value="">(Ignore Column)</option>
                                                    {targetFields.map(f => (
                                                        <option key={f.key} value={f.key}>{f.label} {f.required ? '*' : ''}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                                    <button className="btn-glass" style={{ flex: 1 }} onClick={() => setStep(1)}>Cancel</button>
                                    <button 
                                        className="btn-primary" 
                                        style={{ flex: 2 }} 
                                        onClick={handleImport}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? <><Loader2 className="animate-spin" /> Processing...</> : <><Check size={18} /> Start Magic Import</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                            <div className="ai-icon" style={{ marginBottom: '2rem', background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                                <Check size={32} />
                            </div>
                            <h2>Onboarding Complete! 🚀</h2>
                            <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
                                Your school data has been imported and fee ledgers have been automatically generated for all students.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button className="btn-glass" onClick={() => setStep(1)}>Import More</button>
                                <button className="btn-primary" onClick={() => window.location.href = '/'}>Go to Dashboard</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const ArrowRight = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
);

export default MagicImport;
