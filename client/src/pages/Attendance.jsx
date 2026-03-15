import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'

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

    // Sync local state when query data changes
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
            toast.success('Attendance saved successfully')
        },
        onError: () => {
            toast.error('Failed to save attendance')
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
        if (dirtyRecords.length === 0) return toast.error("Nothing to save.")

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
    const colors = { P: 'var(--accent)', A: 'var(--danger)', L: 'var(--warning)' }
    const labels = { P: 'Present', A: 'Absent', L: 'Late' }
    const hasUnsavedChanges = localStudents.some(s => s.isDirty)

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>✅ Attendance Management</h3>
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>{isLoading ? '...' : counts.P}</div>
                    <div className="stat-label">Present</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>{isLoading ? '...' : counts.A}</div>
                    <div className="stat-label">Absent</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--warning)' }}>{isLoading ? '...' : counts.L}</div>
                    <div className="stat-label">Late</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }} className="hide-scrollbar">
                {classes.map(c => (
                    <button key={c} onClick={() => setSelectedClass(c)}
                        style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid ' + (selectedClass === c ? 'var(--primary)' : 'var(--glass-border)'), background: selectedClass === c ? 'rgba(99,102,241,0.15)' : 'transparent', color: selectedClass === c ? 'var(--primary-light)' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {c}
                    </button>
                ))}
            </div>

            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 className="card-title">Class {selectedClass} — Tap to mark</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{counts.P}/{localStudents.length} present</span>
                    </div>
                    {hasUnsavedChanges && (
                        <button 
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary)', color: 'white', cursor: saveMutation.isPending ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.85rem', opacity: saveMutation.isPending ? 0.7 : 1 }}
                        >
                            {saveMutation.isPending ? '...' : '💾 Save'}
                        </button>
                    )}
                </div>
                
                {isLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', padding: '1rem' }}>
                        {[...Array(8)].map((_, i) => <div key={i} className="shimmer" style={{ height: '110px', borderRadius: 'var(--radius-lg)' }} />)}
                    </div>
                ) : localStudents.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No students found for {selectedClass}.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', paddingBottom: '1rem' }}>
                        {localStudents.map((s, i) => (
                            <div key={s.id || i} onClick={() => toggle(i)}
                                style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', border: `2px solid ${colors[s.status]}30`, background: `${colors[s.status]}08`, cursor: 'pointer', textAlign: 'center', transition: 'var(--transition)', userSelect: 'none', position: 'relative', minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                {s.isDirty && <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} title="Unsaved change" />}
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${colors[s.status]}20`, color: colors[s.status], display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.4rem', fontWeight: 700, fontSize: '0.9rem' }}>
                                    {s.name.charAt(0)}
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name.split(' ')[0]}</div>
                                <span className={`badge badge-${s.status === 'P' ? 'success' : s.status === 'A' ? 'danger' : 'warning'}`} style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>{labels[s.status]}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Attendance
