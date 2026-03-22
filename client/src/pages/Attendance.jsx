import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, XCircle, Clock, Save, Calendar, Filter, Users, ChevronRight, Download, CheckCheck } from 'lucide-react'

const Attendance = () => {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const [selectedClass, setSelectedClass] = useState('10-A')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [localStudents, setLocalStudents] = useState([])
    const [viewMode, setViewMode] = useState('daily') // 'daily' or 'summary'
    const [summaryMonth, setSummaryMonth] = useState(new Date().toISOString().substring(0, 7))
    
    const classes = ['10-A', '10-B', '12-A', '12-B', '9-C', '11-A', '8-B', '7-A', '6-B']
    const headers = { Authorization: `Bearer ${token}` }

    const { data: attendanceData = [], isLoading } = useQuery({
        queryKey: ['attendance', selectedClass, selectedDate],
        queryFn: async () => {
            const [className, section] = selectedClass.split('-')
            const { data } = await axios.get(`/attendance?className=${className}&section=${section}&date=${selectedDate}`, { headers })
            return data.map(s => ({
                ...s,
                status: s.status === 'Present' ? 'P' : s.status === 'Absent' ? 'A' : s.status === 'Late' ? 'L' : 'P',
                isDirty: false
            }))
        },
        enabled: viewMode === 'daily'
    })

    const { data: summaryData, isLoading: loadingSummary } = useQuery({
        queryKey: ['attendance-summary', selectedClass, summaryMonth],
        queryFn: async () => {
            const [className, section] = selectedClass.split('-')
            const { data } = await axios.get(`/attendance/summary?className=${className}&section=${section}&month=${summaryMonth}`, { headers })
            return data
        },
        enabled: viewMode === 'summary'
    })

    useEffect(() => {
        setLocalStudents(attendanceData)
    }, [attendanceData])

    const saveMutation = useMutation({
        mutationFn: async (records) => {
            await axios.post('/attendance/batch', { records, date: selectedDate }, { headers })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
            toast.success('Attendance records saved successfully.')
        },
        onError: () => toast.error('Failed to save attendance.')
    })

    const toggle = (i) => {
        const next = [...localStudents]
        next[i].status = next[i].status === 'P' ? 'A' : next[i].status === 'A' ? 'L' : 'P'
        next[i].isDirty = true
        setLocalStudents(next)
    }

    const markAllPresent = () => {
        const next = localStudents.map(s => ({ ...s, status: 'P', isDirty: true }))
        setLocalStudents(next)
        toast.success('All marked Present. Click Commit to save.')
    }

    const handleSave = () => {
        const dirtyRecords = localStudents.filter(s => s.isDirty)
        if (dirtyRecords.length === 0) return toast.error("No modifications detected.")
        const records = dirtyRecords.map(s => ({
            studentId: s.id,
            status: s.status === 'P' ? 'Present' : s.status === 'A' ? 'Absent' : 'Late'
        }))
        saveMutation.mutate(records)
    }

    const handleExportAttendance = () => {
        const [className, section] = selectedClass.split('-')
        window.open(`/export/attendance?className=${className}&section=${section}&month=${summaryMonth}`, '_blank')
    }

    const counts = { 
        P: localStudents.filter(a => a.status === 'P').length, 
        A: localStudents.filter(a => a.status === 'A').length, 
        L: localStudents.filter(a => a.status === 'L').length 
    }
    const colors = { P: 'var(--success)', A: 'var(--danger)', L: 'var(--warning)' }
    const icons = { P: <CheckCircle size={14} />, A: <XCircle size={14} />, L: <Clock size={14} /> }
    const labels = { P: 'Present', A: 'Absent', L: 'Late' }
    const hasUnsavedChanges = localStudents.some(s => s.isDirty)

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 className="card-title" style={{ fontSize: '1.25rem' }}>🎯 Daily Presence</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Class: {selectedClass} • {viewMode === 'daily' ? `Date: ${new Date(selectedDate).toLocaleDateString()}` : `Month: ${summaryMonth}`}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {viewMode === 'daily' && (
                        <>
                            <input type="date" className="glass-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: 'auto', padding: '0.4rem 0.75rem' }} />
                            <button className="btn-glass btn-sm" onClick={markAllPresent} title="Mark All Present" style={{ color: 'var(--success)' }}>
                                <CheckCheck size={16} /> All Present
                            </button>
                        </>
                    )}
                    {viewMode === 'summary' && (
                        <>
                            <input type="month" className="glass-input" value={summaryMonth} onChange={e => setSummaryMonth(e.target.value)} style={{ width: 'auto', padding: '0.4rem 0.75rem' }} />
                            <button className="btn-glass btn-sm" onClick={handleExportAttendance} style={{ color: 'var(--info)' }}>
                                <Download size={16} /> Export Excel
                            </button>
                        </>
                    )}
                    {hasUnsavedChanges && (
                        <button className="btn-primary" onClick={handleSave} disabled={saveMutation.isPending}>
                            <Save size={16} /> {saveMutation.isPending ? 'Syncing...' : 'Commit'}
                        </button>
                    )}
                </div>
            </div>

            {/* View Toggle & Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card glass-card" style={{ cursor: 'pointer', border: viewMode === 'daily' ? '1px solid var(--primary)' : undefined }} onClick={() => setViewMode('daily')}>
                    <div className="stat-value text-success">{isLoading ? '...' : counts.P}</div>
                    <div className="stat-label">Present</div>
                </div>
                <div className="stat-card glass-card" style={{ cursor: 'pointer', border: viewMode === 'daily' ? '1px solid var(--primary)' : undefined }} onClick={() => setViewMode('daily')}>
                    <div className="stat-value text-danger">{isLoading ? '...' : counts.A}</div>
                    <div className="stat-label">Absent</div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-value text-warning">{isLoading ? '...' : counts.L}</div>
                    <div className="stat-label">Late</div>
                </div>
                <div className="stat-card glass-card" style={{ cursor: 'pointer', border: viewMode === 'summary' ? '1px solid var(--info)' : undefined }} onClick={() => setViewMode('summary')}>
                    <div className="stat-value" style={{color: 'var(--info)'}}>
                        {viewMode === 'summary' && summaryData?.totals?.percentage !== undefined ? `${summaryData.totals.percentage}%` : 
                         isLoading ? '...' : `${Math.round((counts.P / (localStudents.length || 1)) * 100)}%`}
                    </div>
                    <div className="stat-label">{viewMode === 'summary' ? 'Monthly %' : 'Pulse Rate'}</div>
                </div>
            </div>

            {/* Class Filter */}
            <div className="filter-strip" style={{ marginBottom: '1.5rem' }}>
                <div className="filter-scroll">
                    {classes.map(c => (
                        <button key={c} onClick={() => setSelectedClass(c)} className={`filter-btn ${selectedClass === c ? 'active' : ''}`}>{c}</button>
                    ))}
                </div>
            </div>

            {/* DAILY VIEW */}
            {viewMode === 'daily' && (
                <div className="presence-grid">
                    {isLoading ? (
                        <div className="shimmer" style={{ gridColumn: '1/-1', height: '200px' }}></div>
                    ) : localStudents.length === 0 ? (
                        <div className="empty-state" style={{ gridColumn: '1/-1', padding: '4rem' }}>
                            <Users size={48} className="text-muted" style={{ marginBottom: '1rem' }} />
                            <p>No students enrolled in {selectedClass}.</p>
                        </div>
                    ) : (
                        localStudents.map((s, i) => (
                            <div key={s.id || i} onClick={() => toggle(i)} className={`student-presence-card glass-card ${s.isDirty ? 'dirty' : ''}`} style={{ borderLeft: `4px solid ${colors[s.status]}` }}>
                                <div className="presence-avatar"><span className="initial">{s.name.charAt(0)}</span></div>
                                <div className="presence-info">
                                    <h3>{s.name}</h3>
                                    <div className={`presence-badge ${s.status}`}>
                                        {icons[s.status]}
                                        <span>{labels[s.status]}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* MONTHLY SUMMARY VIEW */}
            {viewMode === 'summary' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title"><Calendar size={16} /> Monthly Attendance Summary</h3>
                        {summaryData?.totals && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                P: {summaryData.totals.present} | A: {summaryData.totals.absent} | L: {summaryData.totals.late}
                            </span>
                        )}
                    </div>
                    <div className="table-wrapper table-responsive">
                        {loadingSummary ? (
                            <div style={{ padding: '2rem' }}>{[...Array(5)].map((_, i) => <div key={i} className="shimmer" style={{ height: '40px', marginBottom: '10px' }} />)}</div>
                        ) : !summaryData?.students || summaryData.students.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No attendance data for this month.</div>
                        ) : (
                            <table>
                                <thead><tr><th>Name</th><th>Adm. No</th><th>Present</th><th>Absent</th><th>Late</th><th>Total Days</th><th>Attendance %</th></tr></thead>
                                <tbody>
                                    {summaryData.students.map(s => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.admission_no}</td>
                                            <td style={{ color: 'var(--success)', fontWeight: 700 }}>{s.present}</td>
                                            <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{s.absent}</td>
                                            <td style={{ color: 'var(--warning)', fontWeight: 700 }}>{s.late}</td>
                                            <td>{s.total}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1, height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${s.percentage}%`, height: '100%', background: s.percentage >= 75 ? 'var(--success)' : s.percentage >= 50 ? 'var(--warning)' : 'var(--danger)', borderRadius: '3px', transition: 'width 0.3s' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: '35px' }}>{s.percentage}%</span>
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
        </div>
    )
}

export default Attendance
