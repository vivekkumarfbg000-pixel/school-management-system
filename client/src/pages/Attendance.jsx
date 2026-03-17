import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, XCircle, Clock, Save, Calendar, Filter, Users, ChevronRight } from 'lucide-react'

const Attendance = () => {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const [selectedClass, setSelectedClass] = useState('10-A')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [localStudents, setLocalStudents] = useState([])
    
    const classes = ['10-A', '10-B', '12-A', '12-B', '9-C', '11-A', '8-B', '7-A', '6-B']

    const { data: attendanceData = [], isLoading } = useQuery({
        queryKey: ['attendance', selectedClass, selectedDate],
        queryFn: async () => {
            const [className, section] = selectedClass.split('-')
            const { data } = await axios.get(`/api/attendance?className=${className}&section=${section}&date=${selectedDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data.map(s => ({
                ...s,
                status: s.status === 'Present' ? 'P' : s.status === 'Absent' ? 'A' : s.status === 'Late' ? 'L' : 'P',
                isDirty: false
            }))
        }
    })

    useEffect(() => {
        setLocalStudents(attendanceData)
    }, [attendanceData])

    const saveMutation = useMutation({
        mutationFn: async (records) => {
            await axios.post('/api/attendance/batch', {
                records,
                date: selectedDate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
            toast.success('Attendance records internalized.')
        },
        onError: () => {
            toast.error('System synchronization failure.')
        }
    })

    const toggle = (i) => {
        const next = [...localStudents]
        next[i].status = next[i].status === 'P' ? 'A' : next[i].status === 'A' ? 'L' : 'P'
        next[i].isDirty = true
        setLocalStudents(next)
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
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Class: {selectedClass} • Session Date: {new Date(selectedDate).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input 
                        type="date" 
                        className="glass-input"
                        value={selectedDate} 
                        onChange={e => setSelectedDate(e.target.value)}
                        style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
                    />
                    {hasUnsavedChanges && (
                        <button className="btn-primary" onClick={handleSave} disabled={saveMutation.isPending}>
                            <Save size={16} /> {saveMutation.isPending ? 'Syncing...' : 'Commit'}
                        </button>
                    )}
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card glass-card">
                    <div className="stat-value text-success">{isLoading ? '...' : counts.P}</div>
                    <div className="stat-label">Present</div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-value text-danger">{isLoading ? '...' : counts.A}</div>
                    <div className="stat-label">Absent</div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-value text-warning">{isLoading ? '...' : counts.L}</div>
                    <div className="stat-label">Late</div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-value" style={{color: 'var(--info)'}}>{isLoading ? '...' : Math.round((counts.P / (localStudents.length || 1)) * 100)}%</div>
                    <div className="stat-label">Pulse Rate</div>
                </div>
            </div>

            <div className="filter-strip" style={{ marginBottom: '1.5rem' }}>
                <div className="filter-scroll">
                    {classes.map(c => (
                        <button 
                            key={c} 
                            onClick={() => setSelectedClass(c)}
                            className={`filter-btn ${selectedClass === c ? 'active' : ''}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

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
                        <div 
                            key={s.id || i} 
                            onClick={() => toggle(i)}
                            className={`student-presence-card glass-card ${s.isDirty ? 'dirty' : ''}`}
                            style={{ borderLeft: `4px solid ${colors[s.status]}` }}
                        >
                            <div className="presence-avatar">
                                <span className="initial">{s.name.charAt(0)}</span>
                            </div>
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
        </div>
    )
}

export default Attendance
