import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Megaphone, MessageSquare, Plus, Bell, Send, Trash2, X } from 'lucide-react'

const Communication = () => {
    const { user, token } = useAuth()
    const queryClient = useQueryClient()
    const [showBroadcastModal, setShowBroadcastModal] = useState(false)
    const [showNoticeModal, setShowNoticeModal] = useState(false)
    const [broadcastData, setBroadcastData] = useState({
        target: 'all',
        className: '',
        section: '',
        message: '',
        channels: ['whatsapp', 'sms']
    })
    const [noticeData, setNoticeData] = useState({
        title: '',
        content: '',
        priority: 'Medium',
        audience: 'All',
        icon: '📢'
    })

    // 1. Fetch Live Notices
    const { data: notices = [], isLoading: isLoadingNotices } = useQuery({
        queryKey: ['notices'],
        queryFn: async () => {
            const { data } = await axios.get('/notifications/notices', {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data
        }
    })

    // 2. Broadcast SMS Mutation
    const broadcastMutation = useMutation({
        mutationFn: async (variables) => {
            const { data } = await axios.post('/notifications/broadcast', variables, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data
        },
        onSuccess: (data) => {
            toast.success(data.message || "Broadcast sent successfully!")
            setShowBroadcastModal(false)
            setBroadcastData({ target: 'all', className: '', section: '', message: '', channels: ['whatsapp', 'sms'] })
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to send broadcast")
        }
    })

    // 3. Create Notice Mutation
    const createNoticeMutation = useMutation({
        mutationFn: async (variables) => {
            const { data } = await axios.post('/notifications/notices', variables, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notices'] })
            toast.success("Notice published successfully!")
            setShowNoticeModal(false)
            setNoticeData({ title: '', content: '', priority: 'Medium', audience: 'All', icon: '📢' })
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to publish notice")
        }
    })

    const handleBroadcast = (e) => {
        e.preventDefault()
        broadcastMutation.mutate(broadcastData)
    }

    const handleCreateNotice = (e) => {
        e.preventDefault()
        createNoticeMutation.mutate(noticeData)
    }

    const isAuthorized = user?.role === 'ADMIN' || user?.role === 'PRINCIPAL'

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>📢 Communication Hub</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setShowBroadcastModal(true)} className="quick-action-btn" style={{ background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white' }}>
                        <Send size={16} /> Broadcast Msg
                    </button>
                    {isAuthorized && (
                        <button onClick={() => setShowNoticeModal(true)} className="quick-action-btn" style={{ background: 'rgba(59,130,246,0.15)', borderColor: 'var(--info)', color: 'var(--info)' }}>
                            <Plus size={16} /> Add Notice
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem' }}>1,150</div><div className="stat-label">Verified Numbers</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>98</div><div className="stat-label">MSGs Sent Today</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--warning)' }}>485</div><div className="stat-label">Wallet Balance (₹)</div></div>
            </div>

            <div className="content-grid">
                <div className="card glass-card">
                    <div className="card-header"><h3 className="card-title">📋 Active Notices</h3></div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                        {isLoadingNotices ? (
                            <div className="shimmer" style={{ height: '80px', marginBottom: '10px' }}></div>
                        ) : notices.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No active notices.</div>
                        ) : (
                            notices.map((n) => (
                                <div key={n.id} className="event-item glass-item" style={{ marginBottom: '1rem' }}>
                                    <div className="event-date-box" style={{ background: 'hsla(0,0%,100%,0.05)', color: 'var(--primary-light)', fontSize: '1.3rem' }}>{n.icon || '📢'}</div>
                                    <div className="event-info" style={{ flex: 1 }}>
                                        <h4 style={{ fontWeight: 700 }}>{n.title}</h4>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{n.content}</p>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            <span>{new Date(n.created_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>Target: {n.audience}</span>
                                        </div>
                                    </div>
                                    <span className={`badge ${n.priority === 'High' ? 'badge-danger' : 'badge-warning'}`}>{n.priority}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card glass-card">
                    <div className="card-header"><h3 className="card-title">📨 Automated Alerts</h3></div>
                    <div className="event-item">
                        <div className="event-date-box" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)', fontSize: '1.1rem' }}>💬</div>
                        <div className="event-info" style={{ flex: 1 }}>
                            <h4>Absence Alert — System</h4>
                            <p>Enabled for all classes</p>
                        </div>
                        <span className="badge badge-success">Active</span>
                    </div>
                    <div className="event-item" style={{ marginTop: '1rem' }}>
                        <div className="event-date-box" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent)', fontSize: '1.1rem' }}>💰</div>
                        <div className="event-info" style={{ flex: 1 }}>
                            <h4>Fee Reminders</h4>
                            <p>Monthly automated triggers</p>
                        </div>
                        <span className="badge badge-success">Active</span>
                    </div>
                </div>
            </div>

            {/* BROADCAST MODAL */}
            {showBroadcastModal && (
                <div className="modal-overlay">
                    <div className="modal-card glass-card fade-in" style={{ width: '450px' }}>
                        <div className="card-header">
                            <h3 className="card-title">📤 Send SMS Broadcast</h3>
                            <button className="btn-icon" onClick={() => setShowBroadcastModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleBroadcast} style={{ padding: '1.5rem' }}>
                            <div className="form-group">
                                <label>Target Audience</label>
                                <select className="glass-select" value={broadcastData.target} onChange={e=>setBroadcastData({...broadcastData, target: e.target.value})}>
                                    <option value="all">All Students</option>
                                    <option value="class">Specific Class</option>
                                    <option value="staff">Staff Only</option>
                                </select>
                            </div>
                            {broadcastData.target === 'class' && (
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <input placeholder="Class (10)" className="glass-input" value={broadcastData.className} onChange={e=>setBroadcastData({...broadcastData, className: e.target.value})} />
                                    <input placeholder="Section (A)" className="glass-input" value={broadcastData.section} onChange={e=>setBroadcastData({...broadcastData, section: e.target.value})} />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Message</label>
                                <textarea rows="3" className="glass-input" required value={broadcastData.message} onChange={e=>setBroadcastData({...broadcastData, message: e.target.value})} placeholder="Type message..." />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ marginBottom: '0.75rem' }}>Delivery Channels</label>
                                <div style={{ display: 'flex', gap: '1.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                                        <input type="checkbox" checked={broadcastData.channels.includes('whatsapp')} onChange={(e) => {
                                            const channels = e.target.checked ? [...broadcastData.channels, 'whatsapp'] : broadcastData.channels.filter(c => c !== 'whatsapp');
                                            setBroadcastData({...broadcastData, channels})
                                        }} />
                                        WhatsApp 💬
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                                        <input type="checkbox" checked={broadcastData.channels.includes('sms')} onChange={(e) => {
                                            const channels = e.target.checked ? [...broadcastData.channels, 'sms'] : broadcastData.channels.filter(c => c !== 'sms');
                                            setBroadcastData({...broadcastData, channels})
                                        }} />
                                        Standard SMS 📱
                                    </label>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-glass w-full" onClick={() => setShowBroadcastModal(false)}>Cancel</button>
                                <button type="submit" disabled={broadcastMutation.isPending || broadcastData.channels.length === 0} className="btn-primary w-full">
                                    {broadcastMutation.isPending ? 'Sending...' : 'Dispatch Broadcast'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD NOTICE MODAL */}
            {showNoticeModal && (
                <div className="modal-overlay">
                    <div className="modal-card glass-card fade-in" style={{ width: '450px' }}>
                        <div className="card-header">
                            <h3 className="card-title">📝 Publish New Notice</h3>
                            <button className="btn-icon" onClick={() => setShowNoticeModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateNotice} style={{ padding: '1.5rem' }}>
                            <div className="form-group">
                                <label>Title</label>
                                <input className="glass-input" required value={noticeData.title} onChange={e=>setNoticeData({...noticeData, title: e.target.value})} placeholder="Annual Sports Day" />
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select className="glass-select" value={noticeData.priority} onChange={e=>setNoticeData({...noticeData, priority: e.target.value})}>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Target Audience</label>
                                <input className="glass-input" value={noticeData.audience} onChange={e=>setNoticeData({...noticeData, audience: e.target.value})} placeholder="e.g. All Classes / Parents" />
                            </div>
                            <div className="form-group">
                                <label>Content</label>
                                <textarea rows="4" className="glass-input" required value={noticeData.content} onChange={e=>setNoticeData({...noticeData, content: e.target.value})} placeholder="Enter notice details..." />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-glass w-full" onClick={() => setShowNoticeModal(false)}>Cancel</button>
                                <button type="submit" disabled={createNoticeMutation.isPending} className="btn-primary w-full">
                                    {createNoticeMutation.isPending ? 'Publishing...' : 'Publish Notice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Communication
