import React from 'react'

const Reports = () => {
    const reportCards = [
        { icon: '🎓', title: 'Student Strength Report', desc: 'Class-wise, category-wise, gender-wise', type: 'Student' },
        { icon: '✅', title: 'Attendance Report', desc: 'Monthly/weekly, class-wise, defaulters list', type: 'Attendance' },
        { icon: '💰', title: 'Fee Collection Report', desc: 'Daily, monthly, defaulters, receipt register', type: 'Finance' },
        { icon: '📊', title: 'Exam Results Report', desc: 'Subject-wise, class-wise, toppers, fail list', type: 'Academics' },
        { icon: '👨‍🏫', title: 'Staff Attendance & Payroll', desc: 'Monthly attendance, salary disbursement', type: 'HR' },
        { icon: '🚌', title: 'Transport Report', desc: 'Route-wise students, vehicle maintenance', type: 'Transport' },
        { icon: '📖', title: 'Library Report', desc: 'Most issued books, overdue register', type: 'Library' },
        { icon: '📋', title: 'UDISE+ Export', desc: 'Government data submission format', type: 'Compliance' },
        { icon: '🏫', title: 'RTE Compliance Report', desc: 'RTE seat allocation, category-wise', type: 'Compliance' },
    ]
    const kpis = [
        { label: 'Overall Attendance', value: '94.2%', change: '+1.3%', status: 'up' },
        { label: 'Fee Collection Rate', value: '78%', change: '-2%', status: 'down' },
        { label: 'Exam Pass Rate', value: '91%', change: '+3%', status: 'up' },
        { label: 'Staff Retention', value: '96%', change: '+0.5%', status: 'up' },
    ]

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>📈 Reports & Analytics</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {kpis.map((k, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-value" style={{ fontSize: '1.5rem' }}>{k.value}</div>
                        <div className="stat-label">{k.label}</div>
                        <span className={`stat-trend ${k.status}`} style={{ marginTop: '0.4rem', display: 'inline-block' }}>{k.change}</span>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header"><h3 className="card-title">Available Reports</h3><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to generate</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {reportCards.map((r, i) => (
                        <div key={i} style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'var(--transition)' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--glass-border-hover)'; e.currentTarget.style.background = 'rgba(99,102,241,0.05)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'transparent' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{r.icon}</div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{r.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                            <span className="badge badge-purple" style={{ marginTop: '0.5rem' }}>{r.type}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Reports
