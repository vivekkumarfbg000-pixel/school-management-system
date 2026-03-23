import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Save, Plus, X } from 'lucide-react'

const Settings = () => {
    const { token, user } = useAuth()
    const queryClient = useQueryClient()
    const headers = { Authorization: `Bearer ${token}` }
    const [editMode, setEditMode] = useState(false)
    const [schoolForm, setSchoolForm] = useState({ name: '', address: '', phone: '', affiliationNo: '' })
    const [showSessionModal, setShowSessionModal] = useState(false)
    const [sessionForm, setSessionForm] = useState({ name: '', startDate: '', endDate: '', isActive: false })
    const [theme, setTheme] = useState(localStorage.getItem('edustream-theme') || 'dark')

    useEffect(() => {
        if (theme === 'light') {
            document.documentElement.classList.add('light-theme')
        } else {
            document.documentElement.classList.remove('light-theme')
        }
        localStorage.setItem('edustream-theme', theme)
    }, [theme])

    const { data: school, isLoading } = useQuery({
        queryKey: ['school-profile'],
        queryFn: async () => { const { data } = await axios.get('/settings/school', { headers }); return data }
    })

    const { data: sessions = [] } = useQuery({
        queryKey: ['academic-sessions'],
        queryFn: async () => { const { data } = await axios.get('/settings/sessions', { headers }); return data }
    })

    useEffect(() => {
        if (school) {
            // eslint-disable-next-line 
            setSchoolForm({
                name: school.name || '',
                address: school.address || '',
                phone: school.phone || '',
                affiliationNo: school.affiliation_no || ''
            })
        }
    }, [school])

    const updateSchoolMutation = useMutation({
        mutationFn: async (vars) => { const { data } = await axios.put('/settings/school', vars, { headers }); return data },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['school-profile'] }); toast.success('School profile updated!'); setEditMode(false) },
        onError: () => toast.error('Failed to update')
    })

    const createSessionMutation = useMutation({
        mutationFn: async (vars) => { const { data } = await axios.post('/settings/sessions', vars, { headers }); return data },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academic-sessions'] }); toast.success('Session created!'); setShowSessionModal(false) },
        onError: () => toast.error('Failed to create session')
    })

    const isAdmin = user?.role === 'ADMIN'

    const roles = [
        { role: 'Admin', users: 2, permissions: 'Full Access' },
        { role: 'Principal', users: 1, permissions: 'All Modules (Read/Write)' },
        { role: 'Teacher', users: 32, permissions: 'Attendance, Academics, Timetable' },
        { role: 'Accountant', users: 2, permissions: 'Fee & Finance, Payroll' },
    ]

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>⚙️ Settings & Configuration</h3>
            </div>

            <div className="content-grid" style={{ marginBottom: '1.25rem' }}>
                {/* School Profile — Now editable */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">🏫 School Profile</h3>
                        {isAdmin && !editMode && (
                            <span className="card-action" style={{ cursor: 'pointer' }} onClick={() => setEditMode(true)}>Edit Profile →</span>
                        )}
                        {editMode && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-glass btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                                <button className="btn-glass btn-sm" style={{ color: 'var(--success)' }} onClick={() => updateSchoolMutation.mutate(schoolForm)} disabled={updateSchoolMutation.isPending}>
                                    <Save size={14} /> {updateSchoolMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>
                    {isLoading ? (
                        <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading school details...</div>
                    ) : editMode ? (
                        <div style={{ padding: '0.5rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>School Name</label>
                                <input className="glass-input" value={schoolForm.name} onChange={e => setSchoolForm({ ...schoolForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Phone</label>
                                <input className="glass-input" value={schoolForm.phone} onChange={e => setSchoolForm({ ...schoolForm, phone: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Address</label>
                                <input className="glass-input" value={schoolForm.address} onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Affiliation No</label>
                                <input className="glass-input" value={schoolForm.affiliationNo} onChange={e => setSchoolForm({ ...schoolForm, affiliationNo: e.target.value })} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🏫</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{school?.name || 'EduStream Academy'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{school?.address || 'Address not set'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Phone: {school?.phone || 'N/A'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Plan</div><div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent)' }}>Professional SaaS</div></div>
                                <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Affiliation</div><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{school?.affiliation_no || 'N/A'}</div></div>
                            </div>
                        </>
                    )}
                </div>

                {/* User Roles */}
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

            {/* Academic Sessions */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="card-header">
                    <h3 className="card-title">📅 Academic Sessions</h3>
                    {isAdmin && <span className="card-action" style={{ cursor: 'pointer' }} onClick={() => setShowSessionModal(true)}>+ New Session</span>}
                </div>
                <div className="table-wrapper table-responsive">
                    <table>
                        <thead><tr><th>Session</th><th>Start Date</th><th>End Date</th><th>Status</th></tr></thead>
                        <tbody>
                            {sessions.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No sessions configured</td></tr>
                            ) : sessions.map((s, i) => (
                                <tr key={s.id || i}>
                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                    <td>{new Date(s.start_date).toLocaleDateString('en-IN')}</td>
                                    <td>{new Date(s.end_date).toLocaleDateString('en-IN')}</td>
                                    <td><span className={`badge ${s.is_active ? 'badge-success' : 'badge-purple'}`}><span className="badge-dot"></span>{s.is_active ? 'Active' : 'Closed'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Theme & Display Settings */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="card-header"><h3 className="card-title">🎨 Appearance</h3></div>
                <div style={{ padding: '0 0.5rem 0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>UI Theme</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Choose between Premium Midnight Slate or Light Frame</div>
                        </div>
                        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', padding: '0.25rem' }}>
                            <button 
                                onClick={() => setTheme('light')}
                                style={{ padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', border: 'none', background: theme === 'light' ? 'var(--primary)' : 'transparent', color: theme === 'light' ? 'white' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition-fast)' }}>
                                Light Frame
                            </button>
                            <button 
                                onClick={() => setTheme('dark')}
                                style={{ padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', border: 'none', background: theme === 'dark' ? 'var(--primary)' : 'transparent', color: theme === 'dark' ? 'white' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition-fast)' }}>
                                Midnight Slate
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SMS Settings */}
            <div className="card">
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

            {/* New Session Modal */}
            {showSessionModal && (
                <div className="modal-overlay" onClick={() => setShowSessionModal(false)}>
                    <div className="modal-card glass-card fade-in" style={{ width: '400px' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">📅 New Academic Session</h3>
                            <button className="btn-icon" onClick={() => setShowSessionModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={e => { e.preventDefault(); createSessionMutation.mutate(sessionForm) }} style={{ padding: '1.5rem' }}>
                            <div className="form-group">
                                <label>Session Name</label>
                                <input className="glass-input" required placeholder="2026-27" value={sessionForm.name} onChange={e => setSessionForm({ ...sessionForm, name: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input type="date" className="glass-input" required value={sessionForm.startDate} onChange={e => setSessionForm({ ...sessionForm, startDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input type="date" className="glass-input" required value={sessionForm.endDate} onChange={e => setSessionForm({ ...sessionForm, endDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" checked={sessionForm.isActive} onChange={e => setSessionForm({ ...sessionForm, isActive: e.target.checked })} />
                                <label style={{ margin: 0 }}>Set as active session</label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-glass w-full" onClick={() => setShowSessionModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary w-full" disabled={createSessionMutation.isPending}>{createSessionMutation.isPending ? 'Creating...' : 'Create Session'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Settings
