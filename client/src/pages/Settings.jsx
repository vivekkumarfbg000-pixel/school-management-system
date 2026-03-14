import React, { useState, useEffect } from 'react'
import axios from 'axios'

const Settings = () => {
    const [school, setSchool] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            // Using the auth/me endpoint or similar to get user and school context
            const { data } = await axios.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
            // data.school might contain the school profile from the join
            setSchool(data.school)
        } catch (error) {
            console.error("Error fetching profile", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    const roles = [
        { role: 'Admin', users: 2, permissions: 'Full Access' },
        { role: 'Principal', users: 1, permissions: 'All Modules (Read/Write)' },
        { role: 'Teacher', users: 32, permissions: 'Attendance, Academics, Timetable' },
        { role: 'Accountant', users: 2, permissions: 'Fee & Finance, Payroll' },
    ]

    const feeTemplate = [
        { class: 'Class 1-5', tuition: '₹2,500', transport: '₹1,500', annual: '₹5,000' },
        { class: 'Class 6-8', tuition: '₹3,000', transport: '₹1,500', annual: '₹5,500' },
        { class: 'Class 9-10', tuition: '₹4,000', transport: '₹2,000', annual: '₹6,000' },
        { class: 'Class 11-12', tuition: '₹5,500', transport: '₹2,000', annual: '₹7,500' },
    ]

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>⚙️ Settings & Configuration</h3>
            </div>

            <div className="content-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="card">
                    <div className="card-header"><h3 className="card-title">🏫 School Profile</h3><span className="card-action">Edit Profile →</span></div>
                    {loading ? (
                        <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading school details...</div>
                    ) : (
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🏫</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{school?.name || 'EduStream Academy'}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{school?.address || 'B-12, Gomti Nagar, Lucknow'}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Contact: {school?.id ? 'Verified Project' : 'Sample Project'}</div>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Plan</div><div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent)' }}>Professional SaaS</div></div>
                        <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Session</div><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>2025-26</div></div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3 className="card-title">👤 User Roles</h3></div>
                    <div className="table-wrapper table-responsive">
                        <table>
                            <thead><tr><th>Role</th><th>Users</th><th>Permissions</th></tr></thead>
                            <tbody>
                                {roles.map((r, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{r.role}</td>
                                        <td><span className="badge badge-purple">{r.users}</span></td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.permissions}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3 className="card-title">💰 Default Fee Structures</h3><span className="card-action">Manage Templates →</span></div>
                <div className="table-wrapper table-responsive">
                    <table>
                        <thead><tr><th>Class Group</th><th>Tuition/mo</th><th>Transport/mo</th><th>Annual Charges</th></tr></thead>
                        <tbody>
                            {feeTemplate.map((f, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{f.class}</td>
                                    <td>{f.tuition}</td><td>{f.transport}</td><td>{f.annual}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card" style={{ marginTop: '1.25rem' }}>
                <div className="card-header"><h3 className="card-title">💬 SMS & Notification Settings</h3></div>
                <div style={{ padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', borderBottom: '1px solid var(--border)' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Auto Absent Alert</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Send SMS to parent when student is absent</div>
                        </div>
                        <div style={{ width: '40px', height: '20px', background: 'var(--primary)', borderRadius: '20px', position: 'relative', cursor: 'pointer' }}>
                            <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }}></div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', borderBottom: '1px solid var(--border)' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Fee Generation Alert</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Notify parents when new bills are created</div>
                        </div>
                        <div style={{ width: '40px', height: '20px', background: 'var(--bg-elevated)', borderRadius: '20px', position: 'relative', cursor: 'pointer' }}>
                            <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', left: '2px', top: '2px' }}></div>
                        </div>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>SMS Provider</label>
                        <select style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white' }}>
                            <option value="mock">Log/Mock Mode (Free)</option>
                            <option value="msg91">Msg91 (India)</option>
                            <option value="fast2sms">Fast2SMS (India)</option>
                            <option value="twilio">Twilio (Global)</option>
                        </select>
                    </div>
                    <div style={{ padding: '0 1rem 1rem' }}>
                        <button className="quick-action-btn" style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '0.6rem' }}>Configure API Credentials</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings
