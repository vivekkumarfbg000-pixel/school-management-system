import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'

const Communication = () => {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        target: 'all',
        className: '',
        section: '',
        message: ''
    })

    const notices = [
        { date: '10 Mar', title: 'Annual Sports Day — All Students Participate', priority: 'High', audience: 'All Classes', icon: '🏅' },
        { date: '08 Mar', title: 'Fee Payment Deadline Extended to 20 March', priority: 'Medium', audience: 'Parents', icon: '💰' },
        { date: '01 Mar', title: 'Holi Vacation: 28 Mar - 06 Apr (School Reopens 07 Apr)', priority: 'High', audience: 'All', icon: '🎨' },
    ]

    const broadcastMutation = useMutation({
        mutationFn: async (variables) => {
            const { data } = await axios.post('/api/notifications/broadcast', variables)
            return data
        },
        onSuccess: (data) => {
            toast.success(data.message || "Broadcast sent successfully!")
            setShowModal(false)
            setFormData({ target: 'all', className: '', section: '', message: '' })
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to send broadcast")
        }
    })

    const handleBroadcast = (e) => {
        e.preventDefault()
        broadcastMutation.mutate(formData)
    }

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>📢 Communication Hub</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setShowModal(true)} className="quick-action-btn" style={{ background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white' }}>📤 Broadcast SMS</button>
                    <button className="quick-action-btn" style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)', color: 'var(--accent)' }}>📱 WhatsApp Blast</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem' }}>1,150</div><div className="stat-label">Verified Numbers</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>98</div><div className="stat-label">MSGs Sent Today</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--warning)' }}>485</div><div className="stat-label">Wallet Balance (₹)</div></div>
            </div>

            <div className="content-grid">
                <div className="card">
                    <div className="card-header"><h3 className="card-title">📋 Active Notices</h3><span className="card-action">Add Notice →</span></div>
                    {notices.map((n, i) => (
                        <div key={i} className="event-item">
                            <div className="event-date-box" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-light)', fontSize: '1.3rem' }}>{n.icon}</div>
                            <div className="event-info" style={{ flex: 1 }}>
                                <h4>{n.title}</h4>
                                <p>{n.date} • {n.audience}</p>
                            </div>
                            <span className={`badge ${n.priority === 'High' ? 'badge-danger' : 'badge-warning'}`}>{n.priority}</span>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="card-header"><h3 className="card-title">📨 Recent Broadcasts</h3><span className="card-action">View History →</span></div>
                    <div className="event-item">
                        <div className="event-date-box" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)', fontSize: '1.1rem' }}>💬</div>
                        <div className="event-info" style={{ flex: 1 }}>
                            <h4>Absence Alert — Auto</h4>
                            <p>To: 12 parents • 10 mins ago</p>
                        </div>
                        <span className="badge badge-success">Delivered</span>
                    </div>
                </div>
            </div>

            {/* BROADCAST MODAL */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card fade-in" style={{ width: '450px', border: '1px solid var(--border)' }}>
                        <div className="card-header"><h3 className="card-title">📤 Send SMS Broadcast</h3></div>
                        <form onSubmit={handleBroadcast} style={{ padding: '1rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem' }}>Target Audience</label>
                                <select value={formData.target} onChange={e=>setFormData({...formData, target: e.target.value})} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white' }}>
                                    <option value="all">All Students</option>
                                    <option value="class">Specific Class</option>
                                    <option value="staff">Staff Only</option>
                                </select>
                            </div>
                            {formData.target === 'class' && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input placeholder="Class (e.g. 10)" value={formData.className} onChange={e=>setFormData({...formData, className: e.target.value})} style={{ flex: 1, padding: '0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
                                    <input placeholder="Section (A/B)" value={formData.section} onChange={e=>setFormData({...formData, section: e.target.value})} style={{ width: '100px', padding: '0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white' }} />
                                </div>
                            )}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem' }}>Message (Max 160 chars)</label>
                                <textarea required rows="4" placeholder="Enter your message here..." value={formData.message} onChange={e=>setFormData({...formData, message: e.target.value})} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'white', fontFamily: 'inherit' }} />
                                <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{formData.message.length}/160 characters</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1rem', background: 'transparent', color: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={broadcastMutation.isPending} style={{ padding: '0.6rem 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>{broadcastMutation.isPending ? 'Sending...' : '🚀 Blast SMS'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Communication
