import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Banknote, FileText, CalendarOff, Clock, Plus, X, CheckCircle, XCircle, Download } from 'lucide-react'

const TABS = ['Salary Slips', 'Leave Management', 'Staff Attendance']

const Payroll = () => {
    const { token, user } = useAuth()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState(0)
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [showLeaveModal, setShowLeaveModal] = useState(false)
    const [genData, setGenData] = useState({ staffId: '', month: '' })
    const [leaveData, setLeaveData] = useState({ staffId: '', type: 'CL', fromDate: '', toDate: '', days: '', reason: '' })
    const [attendanceMonth, setAttendanceMonth] = useState(new Date().toISOString().substring(0, 7))

    const headers = { Authorization: `Bearer ${token}` }

    // Queries
    const { data: slips = [], isLoading: loadingSlips } = useQuery({
        queryKey: ['payroll-slips'],
        queryFn: async () => { const { data } = await axios.get('/api/payroll/slips', { headers }); return data }
    })

    const { data: leaves = [], isLoading: loadingLeaves } = useQuery({
        queryKey: ['payroll-leaves'],
        queryFn: async () => { const { data } = await axios.get('/api/payroll/leaves', { headers }); return data }
    })

    const { data: staffList = [] } = useQuery({
        queryKey: ['staff'],
        queryFn: async () => { const { data } = await axios.get('/api/staff', { headers }); return data }
    })

    const { data: staffAttendance = [], isLoading: loadingAttendance } = useQuery({
        queryKey: ['staff-attendance', attendanceMonth],
        queryFn: async () => { const { data } = await axios.get(`/api/payroll/staff-attendance?month=${attendanceMonth}`, { headers }); return data }
    })

    // Mutations
    const generateMutation = useMutation({
        mutationFn: async (vars) => { const { data } = await axios.post('/api/payroll/generate', vars, { headers }); return data },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payroll-slips'] }); toast.success('Salary slip generated!'); setShowGenerateModal(false) },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate')
    })

    const payMutation = useMutation({
        mutationFn: async (id) => { await axios.put(`/api/payroll/slips/${id}/pay`, {}, { headers }) },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payroll-slips'] }); toast.success('Marked as paid') },
        onError: () => toast.error('Failed to update')
    })

    const leaveApplyMutation = useMutation({
        mutationFn: async (vars) => { const { data } = await axios.post('/api/payroll/leaves/apply', vars, { headers }); return data },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payroll-leaves'] }); toast.success('Leave applied!'); setShowLeaveModal(false) },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to apply leave')
    })

    const leaveActionMutation = useMutation({
        mutationFn: async ({ id, status }) => { await axios.put(`/api/payroll/leaves/${id}`, { status }, { headers }) },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payroll-leaves'] }); toast.success('Leave updated') },
        onError: () => toast.error('Failed to update leave')
    })

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT' || user?.role === 'PRINCIPAL'

    const totalPaid = slips.filter(s => s.status === 'Paid').reduce((a, s) => a + (s.net_salary || 0), 0)
    const totalPending = slips.filter(s => s.status === 'Generated').reduce((a, s) => a + (s.net_salary || 0), 0)
    const pendingLeaves = leaves.filter(l => l.status === 'Pending').length

    const handleDownloadSlip = (id) => {
        window.open(`/api/export/salary-slip/${id}`, '_blank')
    }

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 className="card-title" style={{ fontSize: '1.25rem' }}>💰 Payroll & HR</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Salary generation, leave management, and staff attendance</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {activeTab === 0 && isAdmin && (
                        <button onClick={() => setShowGenerateModal(true)} className="quick-action-btn" style={{ background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white' }}>
                            <Plus size={16} /> Generate Slip
                        </button>
                    )}
                    {activeTab === 1 && (
                        <button onClick={() => setShowLeaveModal(true)} className="quick-action-btn" style={{ background: 'rgba(59,130,246,0.15)', borderColor: 'var(--info)', color: 'var(--info)' }}>
                            <CalendarOff size={16} /> Apply Leave
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>₹{totalPaid.toLocaleString('en-IN')}</div><div className="stat-label">Paid This Month</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--warning)' }}>₹{totalPending.toLocaleString('en-IN')}</div><div className="stat-label">Pending Payouts</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem' }}>{slips.length}</div><div className="stat-label">Slips Generated</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>{pendingLeaves}</div><div className="stat-label">Pending Leaves</div></div>
            </div>

            {/* Tabs */}
            <div className="filter-strip" style={{ marginBottom: '1.5rem' }}>
                <div className="filter-scroll">
                    {TABS.map((t, i) => (
                        <button key={t} onClick={() => setActiveTab(i)} className={`filter-btn ${activeTab === i ? 'active' : ''}`}>{t}</button>
                    ))}
                </div>
            </div>

            {/* TAB 0: SALARY SLIPS */}
            {activeTab === 0 && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title"><FileText size={16} /> Salary Slips</h3></div>
                    <div className="table-wrapper table-responsive">
                        {loadingSlips ? (
                            <div style={{ padding: '2rem' }}>{[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: '40px', marginBottom: '10px' }} />)}</div>
                        ) : slips.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No salary slips generated yet. Click "Generate Slip" to create one.</div>
                        ) : (
                            <table>
                                <thead><tr><th>Staff</th><th>Designation</th><th>Month</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                                <tbody>
                                    {slips.map(s => (
                                        <tr key={s.id}>
                                            <td><div style={{ fontWeight: 700 }}>{s.staff?.name || '-'}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.staff?.staff_id}</div></td>
                                            <td>{s.staff?.designation || '-'}</td>
                                            <td><span className="badge badge-purple">{s.month}</span></td>
                                            <td>₹{(s.gross_salary || 0).toLocaleString('en-IN')}</td>
                                            <td style={{ color: 'var(--danger)' }}>-₹{(s.total_deductions || 0).toLocaleString('en-IN')}</td>
                                            <td style={{ fontWeight: 900 }}>₹{(s.net_salary || 0).toLocaleString('en-IN')}</td>
                                            <td><span className={`badge ${s.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}><span className="badge-dot"></span>{s.status}</span></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    {s.status === 'Generated' && isAdmin && (
                                                        <button className="btn-glass btn-sm" style={{ color: 'var(--success)' }} onClick={() => payMutation.mutate(s.id)} disabled={payMutation.isPending}>
                                                            <Banknote size={14} /><span>Pay</span>
                                                        </button>
                                                    )}
                                                    <button className="btn-glass btn-sm" onClick={() => handleDownloadSlip(s.id)}>
                                                        <Download size={14} /><span>PDF</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 1: LEAVE MANAGEMENT */}
            {activeTab === 1 && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title"><CalendarOff size={16} /> Leave Requests</h3></div>
                    <div className="table-wrapper table-responsive">
                        {loadingLeaves ? (
                            <div style={{ padding: '2rem' }}>{[...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: '40px', marginBottom: '10px' }} />)}</div>
                        ) : leaves.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No leave requests found.</div>
                        ) : (
                            <table>
                                <thead><tr><th>Staff</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th>{isAdmin && <th>Actions</th>}</tr></thead>
                                <tbody>
                                    {leaves.map(l => (
                                        <tr key={l.id}>
                                            <td style={{ fontWeight: 600 }}>{l.staff?.name || '-'}</td>
                                            <td><span className="badge badge-purple">{l.type}</span></td>
                                            <td>{new Date(l.from_date).toLocaleDateString('en-IN')}</td>
                                            <td>{new Date(l.to_date).toLocaleDateString('en-IN')}</td>
                                            <td style={{ fontWeight: 600 }}>{l.days}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason || '-'}</td>
                                            <td><span className={`badge ${l.status === 'Approved' ? 'badge-success' : l.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}><span className="badge-dot"></span>{l.status}</span></td>
                                            {isAdmin && (
                                                <td>
                                                    {l.status === 'Pending' && (
                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                            <button className="btn-glass btn-sm" style={{ color: 'var(--success)' }} onClick={() => leaveActionMutation.mutate({ id: l.id, status: 'Approved' })} disabled={leaveActionMutation.isPending}>
                                                                <CheckCircle size={14} />
                                                            </button>
                                                            <button className="btn-glass btn-sm" style={{ color: 'var(--danger)' }} onClick={() => leaveActionMutation.mutate({ id: l.id, status: 'Rejected' })} disabled={leaveActionMutation.isPending}>
                                                                <XCircle size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: STAFF ATTENDANCE */}
            {activeTab === 2 && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title"><Clock size={16} /> Staff Attendance</h3>
                        <input type="month" className="glass-input" value={attendanceMonth} onChange={e => setAttendanceMonth(e.target.value)} style={{ width: 'auto', padding: '0.4rem 0.75rem' }} />
                    </div>
                    <div className="table-wrapper table-responsive">
                        {loadingAttendance ? (
                            <div style={{ padding: '2rem' }}>{[...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: '40px', marginBottom: '10px' }} />)}</div>
                        ) : staffAttendance.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No staff attendance records for this month.</div>
                        ) : (
                            <table>
                                <thead><tr><th>Staff</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
                                <tbody>
                                    {staffAttendance.map(a => (
                                        <tr key={a.id}>
                                            <td style={{ fontWeight: 600 }}>{a.staff?.name || '-'}</td>
                                            <td>{new Date(a.date).toLocaleDateString('en-IN')}</td>
                                            <td>{a.check_in ? new Date(a.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                            <td>{a.check_out ? new Date(a.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                            <td><span className={`badge ${a.status === 'Present' ? 'badge-success' : a.status === 'Absent' ? 'badge-danger' : 'badge-warning'}`}><span className="badge-dot"></span>{a.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* GENERATE SLIP MODAL */}
            {showGenerateModal && (
                <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
                    <div className="modal-card glass-card fade-in" style={{ width: '420px' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">💳 Generate Salary Slip</h3>
                            <button className="btn-icon" onClick={() => setShowGenerateModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={e => { e.preventDefault(); generateMutation.mutate(genData) }} style={{ padding: '1.5rem' }}>
                            <div className="form-group">
                                <label>Staff Member</label>
                                <select className="glass-select" required value={genData.staffId} onChange={e => setGenData({ ...genData, staffId: e.target.value })}>
                                    <option value="">Select staff...</option>
                                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.staff_id})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Month</label>
                                <input className="glass-input" required placeholder="March 2026" value={genData.month} onChange={e => setGenData({ ...genData, month: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-glass w-full" onClick={() => setShowGenerateModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary w-full" disabled={generateMutation.isPending}>{generateMutation.isPending ? 'Generating...' : 'Generate'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* APPLY LEAVE MODAL */}
            {showLeaveModal && (
                <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
                    <div className="modal-card glass-card fade-in" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">📋 Apply For Leave</h3>
                            <button className="btn-icon" onClick={() => setShowLeaveModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={e => { e.preventDefault(); leaveApplyMutation.mutate(leaveData) }} style={{ padding: '1.5rem' }}>
                            <div className="form-group">
                                <label>Staff Member</label>
                                <select className="glass-select" required value={leaveData.staffId} onChange={e => setLeaveData({ ...leaveData, staffId: e.target.value })}>
                                    <option value="">Select staff...</option>
                                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.staff_id})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Leave Type</label>
                                <select className="glass-select" value={leaveData.type} onChange={e => setLeaveData({ ...leaveData, type: e.target.value })}>
                                    <option value="CL">Casual Leave</option>
                                    <option value="EL">Earned Leave</option>
                                    <option value="Medical">Medical Leave</option>
                                    <option value="Maternity">Maternity Leave</option>
                                    <option value="Duty">Duty Leave</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>From</label>
                                    <input type="date" className="glass-input" required value={leaveData.fromDate} onChange={e => setLeaveData({ ...leaveData, fromDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>To</label>
                                    <input type="date" className="glass-input" required value={leaveData.toDate} onChange={e => setLeaveData({ ...leaveData, toDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Number of Days</label>
                                <input type="number" className="glass-input" required min="1" value={leaveData.days} onChange={e => setLeaveData({ ...leaveData, days: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Reason (optional)</label>
                                <textarea className="glass-input" rows="2" value={leaveData.reason} onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })} placeholder="Reason for leave..." />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-glass w-full" onClick={() => setShowLeaveModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary w-full" disabled={leaveApplyMutation.isPending}>{leaveApplyMutation.isPending ? 'Applying...' : 'Apply Leave'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Payroll
