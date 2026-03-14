import React, { useState, useEffect } from 'react'
import axios from 'axios'

const Timetable = () => {
    const [view, setView] = useState('class')
    const [selectedClass, setSelectedClass] = useState('10')
    const [selectedSection, setSelectedSection] = useState('A')
    const [timetableData, setTimetableData] = useState([])
    const [loading, setLoading] = useState(true)

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

    const fetchTimetable = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const { data } = await axios.get(`/api/timetable?className=${selectedClass}&section=${selectedSection}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setTimetableData(data)
        } catch (error) {
            console.error("Error fetching timetable", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTimetable()
    }, [selectedClass, selectedSection])

    const getSlot = (day, period) => {
        return timetableData.find(s => s.day === day && s.period === period)
    }

    // Color mapping for subjects
    const colorMap = {
        'Maths': { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
        'Science': { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
        'English': { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
        'Hindi': { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
        'Social Studies': { bg: 'rgba(239,68,68,0.12)', text: '#f87171' },
        'Physics': { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
        'Chemistry': { bg: 'rgba(236,72,153,0.12)', text: '#f472b6' },
        'Biology': { bg: 'rgba(20,184,166,0.12)', text: '#2dd4bf' },
    }

    const getStyle = (subject) => {
        return colorMap[subject] || { bg: 'rgba(100,116,139,0.1)', text: 'var(--text-muted)' }
    }

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>🗓️ Timetable Management</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border)' }}>
                            {['6','7','8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                        <select value={selectedSection} onChange={e=>setSelectedSection(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border)' }}>
                            {['A','B','C'].map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                    </div>
                    <button className="quick-action-btn" style={{ background: 'var(--primary)', borderColor: 'var(--primary)', padding: '0.4rem 1rem' }}>✏️ Edit Schedule</button>
                </div>
            </div>

            <div className="card" style={{ overflow: 'auto' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading schedule...</div>
                ) : (
                <table style={{ borderCollapse: 'separate', borderSpacing: '0.5rem' }}>
                    <thead>
                        <tr>
                            <th style={{ minWidth: '100px', background: 'transparent' }}>Period</th>
                            {days.map(d => <th key={d} style={{ minWidth: '130px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>{d}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {periods.map((p, pi) => (
                            <tr key={pi}>
                                <td style={{ textAlign: 'center', padding: '1rem' }}>
                                    {p.label ? (
                                        <div style={{ color: 'var(--warning)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em' }}>{p.label}</div>
                                    ) : (
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>P{p.num}</div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{p.time}</div>
                                        </div>
                                    )}
                                </td>
                                {days.map((d, di) => {
                                    if (p.label) return <td key={di} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}></td>
                                    const slot = getSlot(d, p.num)
                                    const style = slot ? getStyle(slot.subject) : { bg: 'transparent', text: 'transparent' }
                                    
                                    return (
                                        <td key={di} style={{ minWidth: '130px' }}>
                                            {slot ? (
                                                <div style={{ background: style.bg, borderRadius: 'var(--radius-md)', padding: '0.75rem', border: `1px solid ${style.text}20`, textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: style.text, marginBottom: '0.2rem' }}>{slot.subject}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{slot.staff?.name.split(' ')[0]}</div>
                                                    <div style={{ fontSize: '0.6rem', color: style.text, opacity: 0.6, marginTop: '0.3rem' }}>{slot.room || 'Room 101'}</div>
                                                </div>
                                            ) : (
                                                <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.6rem' }}>
                                                    Free
                                                </div>
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>
        </div>
    )
}

export default Timetable
