import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Clock, Save, Calendar, Filter, Users } from 'lucide-react'

const Attendance = () => {
    const queryClient = useQueryClient()
    const [selectedClass, setSelectedClass] = useState('10-A')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [localStudents, setLocalStudents] = useState([])
    
    const classes = ['10-A', '10-B', '12-A', '12-B', '9-C', '11-A', '8-B', '7-A', '6-B']

    const { data: attendanceData = [], isLoading } = useQuery({
        queryKey: ['attendance', selectedClass, selectedDate],
        queryFn: async () => {
            const [className, section] = selectedClass.split('-')
            const { data } = await axios.get(`/api/attendance?className=${className}&section=${section}&date=${selectedDate}`)
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
        <div className="page-workspace">
            <div className="page-header">
                <div className="header-text">
                    <h1>Daily Presence</h1>
                    <p>Class: <span className="text-accent">{selectedClass}</span> • Session Date: {new Date(selectedDate).toLocaleDateString()}</p>
                </div>
                <div className="header-actions">
                    <div className="omnisearch-bar" style={{ width: 'auto' }}>
                        <Calendar size={18} className="text-muted" />
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={e => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon green"><CheckCircle size={20} /></div>
                    <div className="stat-value text-success">{isLoading ? '...' : counts.P}</div>
                    <div className="stat-label">Total Present</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><XCircle size={20} /></div>
                    <div className="stat-value text-danger">{isLoading ? '...' : counts.A}</div>
                    <div className="stat-label">Total Absent</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon amber"><Clock size={20} /></div>
                    <div className="stat-value text-warning">{isLoading ? '...' : counts.L}</div>
                    <div className="stat-label">Total Late</div>
                </div>
            </div>

            <div className="filter-strip">
                <div className="filter-label"><Filter size={14} /> Classes:</div>
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
                <div style={{ marginLeft: 'auto' }}>
                    {hasUnsavedChanges && (
                        <button 
                            className="btn-primary" 
                            onClick={handleSave} 
                            disabled={saveMutation.isPending}
                        >
                            <Save size={18} />
                            <span>{saveMutation.isPending ? 'Syncing...' : 'Commit Changes'}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="presence-grid">
                {isLoading ? (
                    <div className="sync-overlay w-full" style={{ gridColumn: '1/-1', height: '300px' }}>
                        <Users className="animate-bounce" />
                        <span>Synchronizing Roll Call...</span>
                    </div>
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
                            className="student-presence-card glass-card"
                            style={{ '--accent-color': colors[s.status] }}
                        >
                            {s.isDirty && <div className="dirty-dot" title="Modified" />}
                            <div className="presence-avatar">
                                <span className="initial">{s.name.charAt(0)}</span>
                                <div className="status-ring"></div>
                            </div>
                            <div className="presence-info">
                                <h3>{s.name.split(' ')[0]}</h3>
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
