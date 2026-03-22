import React from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { Download, BarChart3, Users, CheckCircle, Wallet, BookOpen } from 'lucide-react'

const Reports = () => {
    const { token } = useAuth()
    const headers = { Authorization: `Bearer ${token}` }

    const { data: overview = {}, isLoading } = useQuery({
        queryKey: ['reports-overview'],
        queryFn: async () => { const { data } = await axios.get('/reports/overview', { headers }); return data }
    })

    const kpis = [
        { label: 'Overall Attendance', value: isLoading ? '...' : `${overview.attendanceRate || 0}%`, icon: <CheckCircle size={20} />, color: 'var(--success)' },
        { label: 'Fee Collection Rate', value: isLoading ? '...' : `${overview.feeCollectionRate || 0}%`, icon: <Wallet size={20} />, color: 'var(--warning)' },
        { label: 'Exam Pass Rate', value: isLoading ? '...' : `${overview.examPassRate || 0}%`, icon: <BookOpen size={20} />, color: 'var(--info)' },
        { label: 'Active Students', value: isLoading ? '...' : overview.studentCount || 0, icon: <Users size={20} />, color: 'var(--primary)' },
    ]

    const reportCards = [
        { icon: '🎓', title: 'Student List', desc: 'Complete student directory with details', type: 'Student', action: () => window.open('/export/students', '_blank') },
        { icon: '✅', title: 'Attendance Report', desc: 'Monthly class-wise attendance summary', type: 'Attendance', action: null },
        { icon: '💰', title: 'Daily Fee Collection', desc: 'Today\'s fee collection receipts', type: 'Finance', action: () => window.open('/export/fee-report?type=daily', '_blank') },
        { icon: '📊', title: 'Monthly Fee Report', desc: 'This month\'s complete fee summary', type: 'Finance', action: () => window.open('/export/fee-report?type=monthly', '_blank') },
        { icon: '👨‍🏫', title: 'Staff Report', desc: 'Staff directory and attendance', type: 'HR' },
        { icon: '🚌', title: 'Transport Report', desc: 'Route-wise students, vehicles', type: 'Transport' },
        { icon: '📖', title: 'Library Report', desc: 'Most issued books, overdue register', type: 'Library' },
        { icon: '📋', title: 'UDISE+ Export', desc: 'Government data submission format', type: 'Compliance' },
        { icon: '🏫', title: 'RTE Compliance Report', desc: 'RTE seat allocation, category-wise', type: 'Compliance' },
    ]

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>📈 Reports & Analytics</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {kpis.map((k, i) => (
                    <div key={i} className="stat-card">
                        <div style={{ color: k.color, marginBottom: '0.5rem' }}>{k.icon}</div>
                        <div className="stat-value" style={{ fontSize: '1.5rem', color: k.color }}>{k.value}</div>
                        <div className="stat-label">{k.label}</div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Available Reports</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to generate & download</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {reportCards.map((r, i) => (
                        <div key={i} 
                            style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', cursor: r.action ? 'pointer' : 'default', transition: 'var(--transition)', opacity: r.action ? 1 : 0.6 }}
                            onClick={r.action || undefined}
                            onMouseEnter={e => { if (r.action) { e.currentTarget.style.borderColor = 'var(--glass-border-hover)'; e.currentTarget.style.background = 'rgba(99,102,241,0.05)' }}}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'transparent' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{r.icon}</div>
                                {r.action && <Download size={14} style={{ color: 'var(--text-muted)' }} />}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{r.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                            <span className="badge badge-purple" style={{ marginTop: '0.5rem' }}>{r.type}</span>
                            {!r.action && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Coming in Phase 2</div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Reports
