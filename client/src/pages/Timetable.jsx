import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, X, ShieldAlert, Check } from 'lucide-react'

const Timetable = () => {
    const queryClient = useQueryClient()
    const [selectedClass, setSelectedClass] = useState('10')
    const [selectedSection, setSelectedSection] = useState('A')
    const [showModal, setShowModal] = useState(false)
    const [editingSlot, setEditingSlot] = useState(null)

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const periods = [
        { num: 1, time: '08:00 - 08:45' },
        { num: 2, time: '08:45 - 09:30' },
        { num: 3, time: '09:30 - 10:15' },
        { num: 0, time: '10:15 - 10:30', label: 'BREAK' },
        { num: 4, time: '10:30 - 11:15' },
        { num: 5, time: '11:15 - 12:00' },
        { num: 6, time: '12:00 - 12:45' },
        { num: 0, time: '12:45 - 01:30', label: 'LUNCH' },
        { num: 7, time: '01:30 - 02:15' },
        { num: 8, time: '02:15 - 03:00' },
    ]

    const { data: timetableData = [], isLoading } = useQuery({
        queryKey: ['timetable', selectedClass, selectedSection],
        queryFn: async () => {
            const { data } = await axios.get(`/api/timetable?className=${selectedClass}&section=${selectedSection}`)
            return data
        }
    })

    const { data: staffList = [] } = useQuery({
        queryKey: ['timetable-staff'],
        queryFn: async () => {
            const { data } = await axios.get('/api/timetable/staff')
            return data
        }
    })

    const saveMutation = useMutation({
        mutationFn: async (slotData) => axios.post('/api/timetable', slotData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timetable'] })
            toast.success('Timetable updated')
            setShowModal(false)
        },
        onError: () => toast.error('Failed to update slot')
    })

    const handleSlotClick = (day, periodObj) => {
        const existing = timetableData.find(s => s.day === day && s.period === periodObj.num)
        setEditingSlot({
            day,
            period: periodObj.num,
            start_time: periodObj.time.split(' - ')[0],
            end_time: periodObj.time.split(' - ')[1],
            subject: existing?.subject || '',
            staff_id: existing?.staff_id || '',
            room: existing?.room || '',
            class_name: selectedClass,
            section: selectedSection
        })
        setShowModal(true)
    }

    const getSlot = (day, period) => {
        return timetableData.find(s => s.day === day && s.period === period)
    }

    const colorMap = {
        'Maths': { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
        'Science': { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
        'English': { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
        'Hindi': { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
        'Social Studies': { bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
    }

    const getStyle = (subject) => {
        return colorMap[subject] || { bg: 'rgba(100,116,139,0.1)', text: 'var(--text-muted)' }
    }

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>🗓️ Timetable Hub</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass-pill" style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem' }}>
                        <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} className="glass-select">
                            {['6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                        <select value={selectedSection} onChange={e=>setSelectedSection(e.target.value)} className="glass-select">
                            {['A','B','C'].map(s => <option key={s} value={s}>Sec {s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="card glass-card" style={{ overflow: 'auto', padding: '1rem' }}>
                {isLoading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div className="shimmer" style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-lg)' }}></div>
                    </div>
                ) : (
                <table style={{ borderCollapse: 'separate', borderSpacing: '0.75rem' }}>
                    <thead>
                        <tr>
                            <th style={{ minWidth: '80px', background: 'transparent' }}>Period</th>
                            {days.map(d => <th key={d} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {periods.map((p, pi) => (
                            <tr key={pi}>
                                <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                                    {p.label ? (
                                        <div style={{ color: 'var(--warning)', fontWeight: 800, fontSize: '0.65rem', border: '1px solid var(--warning)', borderRadius: '4px', padding: '2px' }}>{p.label}</div>
                                    ) : (
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>P{p.num}</div>
                                            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{p.time.split(' ')[0]}</div>
                                        </div>
                                    )}
                                </td>
                                {days.map((d, di) => {
                                    if (p.label) return <td key={di} style={{ background: 'hsla(0,0%,100%,0.01)', borderRadius: 'var(--radius-sm)' }}></td>
                                    const slot = getSlot(d, p.num)
                                    const style = slot ? getStyle(slot.subject) : { bg: 'transparent', text: 'transparent' }
                                    
                                    return (
                                        <td key={di} style={{ minWidth: '140px' }}>
                                            <div 
                                                onClick={() => handleSlotClick(d, p)}
                                                className={`timetable-slot ${slot ? 'filled' : 'empty'}`}
                                                style={slot ? { background: style.bg, border: `1px solid ${style.text}40` } : {}}
                                            >
                                                {slot ? (
                                                    <>
                                                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: style.text }}>{slot.subject}</div>
                                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>{slot.staff?.name.split(' ')[0]}</div>
                                                        <div className="slot-room">{slot.room || 'R101'}</div>
                                                    </>
                                                ) : (
                                                    <Plus size={14} style={{ opacity: 0.3 }} />
                                                )}
                                            </div>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>

            {/* MANAGEMENT MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-card glass-card fade-in" style={{ width: '380px' }}>
                        <div className="card-header">
                            <h3 className="card-title">Edit Period</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '1.5rem' }}>
                            <div className="form-group">
                                <label>Subject</label>
                                <input 
                                    className="glass-input" 
                                    value={editingSlot.subject} 
                                    onChange={e => setEditingSlot({...editingSlot, subject: e.target.value})} 
                                    placeholder="e.g. Mathematics" 
                                />
                            </div>
                            <div className="form-group">
                                <label>Teacher</label>
                                <select 
                                    className="glass-select" 
                                    value={editingSlot.staff_id} 
                                    onChange={e => setEditingSlot({...editingSlot, staff_id: e.target.value})}
                                >
                                    <option value="">-- Select Staff --</option>
                                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Room No</label>
                                <input 
                                    className="glass-input" 
                                    value={editingSlot.room} 
                                    onChange={e => setEditingSlot({...editingSlot, room: e.target.value})} 
                                    placeholder="e.g. Lab-1" 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn-glass w-full" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn-primary w-full" onClick={() => saveMutation.mutate(editingSlot)}>Save Slot</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Timetable
