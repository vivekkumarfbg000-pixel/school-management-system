import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
    Calendar, Wallet, CheckCircle, Clock, 
    CircleX, ChevronRight, FileText, Sparkles, Loader2 
} from 'lucide-react';
import { motion } from 'framer-motion';

const ParentPortal = () => {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`/api/portal/trust/${token}`);
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.message || "Invalid portal link.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#030712' }}>
            <Loader2 className="animate-spin text-primary" size={48} />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Parent Portal...</p>
        </div>
    );

    if (error) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#030712', padding: '2rem', textAlign: 'center' }}>
            <CircleX size={64} color="var(--danger)" />
            <h2 style={{ marginTop: '1.5rem' }}>Link Expired</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '300px' }}>This portal link is no longer valid. Please contact the school office for a new link.</p>
        </div>
    );

    const { profile, attendance, fees, marks, schoolName } = data;

    return (
        <div className="parent-portal-mobile" style={{ background: '#030712', minHeight: '100vh', color: 'white' }}>
            {/* Header */}
            <div style={{ padding: '2rem 1.5rem', background: 'linear-gradient(135deg, hsla(238, 81%, 67%, 0.1), transparent)', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles size={20} color="white" />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>{schoolName || 'EduStream'}</span>
                    </div>
                </div>
                
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.25rem' }}>{profile.name}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Class {profile.class_name}-{profile.section} • {profile.admission_no}</p>
            </div>

            <div style={{ padding: '1.5rem' }}>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="premium-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Attendance</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)' }}>
                            {Math.round((attendance.filter(a => a.status === 'Present').length / (attendance.length || 1)) * 100)}%
                        </div>
                    </div>
                    <div className="premium-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Dues</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: fees.some(f => f.status === 'Pending') ? 'var(--danger)' : 'var(--success)' }}>
                            ₹{fees.filter(f => f.status === 'Pending').reduce((acc, f) => acc + (f.amount - f.paid_amount), 0).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Fees Section */}
                <section style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><Wallet size={18} /> Fee History</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {fees.map(fee => (
                            <div key={fee.id} style={{ padding: '1rem', background: 'hsla(0,0%,100%,0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fee.fee_type}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {new Date(fee.due_date).toLocaleDateString()}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800 }}>₹{fee.amount.toLocaleString()}</div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: fee.status === 'Paid' ? 'var(--success)' : 'var(--danger)' }}>{fee.status.toUpperCase()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Attendance Section */}
                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1rem' }}><Calendar size={18} /> Attendance (Last 10 Days)</h3>
                    <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {attendance.slice(0, 10).map((a, i) => (
                            <div key={i} style={{ 
                                minWidth: '45px', height: '60px', 
                                background: a.status === 'Present' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                border: `1px solid ${a.status === 'Present' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(a.date).getDate()}</span>
                                <span style={{ fontWeight: 900, color: a.status === 'Present' ? 'var(--success)' : 'var(--danger)' }}>{a.status[0]}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Academic Section */}
                <section>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1rem' }}><FileText size={18} /> Performance</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {marks.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', background: 'hsla(0,0%,100%,0.02)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent exam results.</div>
                        ) : marks.map((m, i) => (
                            <div key={i} style={{ padding: '1rem', background: 'hsla(0,0%,100%,0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.subject}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.exams?.name}</div>
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-light)' }}>
                                    {m.obtained}/{m.max_marks}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            
            <footer style={{ padding: '3rem 1.5rem', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                Powered by EduStream Principal's Assistant
            </footer>
        </div>
    );
};

export default ParentPortal;
