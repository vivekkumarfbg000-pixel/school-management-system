import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Award, BarChart3, Plus, Calendar, FileText, X, Trophy } from 'lucide-react'

const Academics = () => {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        className: '10'
    })

    const { data: exams = [], isLoading: isLoadingExams } = useQuery({
        queryKey: ['exams'],
        queryFn: async () => {
            const { data } = await axios.get('/api/academics/exams', {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data
        }
    })

    const { data: toppers = [], isLoading: isLoadingToppers } = useQuery({
        queryKey: ['toppers'],
        queryFn: async () => {
            const { data } = await axios.get('/api/academics/toppers', {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data
        }
    })

    const { data: stats = [], isLoading: isLoadingStats } = useQuery({
        queryKey: ['academic-stats'],
        queryFn: async () => {
            const { data } = await axios.get('/api/academics/stats', {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data
        }
    })

    const createExamMutation = useMutation({
        mutationFn: async (variables) => {
            await axios.post('/api/academics/exams', variables, {
                headers: { Authorization: `Bearer ${token}` }
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] })
            toast.success("Exam created successfully!")
            setShowModal(false)
        },
        onError: () => {
            toast.error("Failed to create exam")
        }
    })

    const handleCreateExam = (e) => {
        e.preventDefault()
        createExamMutation.mutate(formData)
    }

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>📚 Academics & Exams</h3>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="quick-action-btn" 
                    style={{ background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white' }}
                >
                    <Plus size={16} /> Create Exam
                </button>
            </div>

            <div className="content-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="card glass-card">
                    <div className="card-header"><h3 className="card-title"><Calendar size={16} /> Exam Schedule</h3></div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {isLoadingExams ? (
                            <div className="shimmer" style={{ height: '60px', margin: '1rem' }}></div>
                        ) : exams.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No exams scheduled.</div>
                        ) : (
                            exams.map((e) => (
                                <div key={e.id} className="event-item">
                                    <div className="event-date-box" style={{ background: 'hsla(0,0%,100%,0.05)', color: 'var(--info)', fontSize: '1.2rem' }}><FileText size={18} /></div>
                                    <div className="event-info" style={{ flex: 1 }}>
                                        <h4 style={{ fontWeight: 700 }}>{e.name}</h4>
                                        <p>{new Date(e.date).toLocaleDateString()} • Class {e.class_name}</p>
                                    </div>
                                    <span className="badge badge-info">Scheduled</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                <div className="card glass-card">
                    <div className="card-header"><h3 className="card-title"><Trophy size={16} /> School Toppers</h3></div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {isLoadingToppers ? (
                            <div className="shimmer" style={{ height: '60px', margin: '1rem' }}></div>
                        ) : toppers.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No toppers data available yet.</div>
                        ) : (
                            toppers.map((t, idx) => (
                                <div key={t.student_id} className="staff-item glass-item">
                                    <div style={{ fontSize: '1.5rem' }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                                    <div className="staff-info">
                                        <h4 style={{ fontWeight: 700 }}>{t.students?.name}</h4>
                                        <p>Class {t.students?.class_name}-{t.students?.section}</p>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent)' }}>
                                        {Math.round((t.obtained/t.max_marks)*100)}%
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="card glass-card">
                <div className="card-header">
                    <h3 className="card-title"><BarChart3 size={16} /> Performance Analytics</h3>
                    <span className="card-action">📄 Export Batch Report →</span>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead><tr><th>Subject</th><th>Class Avg</th><th>Pass %</th><th>Performance</th></tr></thead>
                        <tbody>
                            {isLoadingStats ? (
                                <tr><td colSpan="4"><div className="shimmer" style={{ height: '30px', margin: '0.5rem' }}></div></td></tr>
                            ) : stats.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>No performance data collected.</td></tr>
                            ) : (
                                stats.map((s, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{s.subject}</td>
                                        <td style={{ fontWeight: 700 }}>{s.avg}%</td>
                                        <td>
                                            <span className={`badge ${s.passRate > 80 ? 'badge-success' : 'badge-warning'}`}>
                                                {s.passRate}%
                                            </span>
                                        </td>
                                        <td style={{ width: '25%' }}>
                                            <div className="progress-bar" style={{ height: '8px' }}>
                                                <div 
                                                    className={`progress-fill ${s.avg > 75 ? 'green' : 'purple'}`} 
                                                    style={{ width: `${s.avg}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE EXAM MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-card glass-card fade-in" style={{ width: '400px' }}>
                        <div className="card-header">
                            <h3 className="card-title">📝 Create New Exam</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateExam} style={{ padding: '1.5rem' }}>
                            <div className="form-group">
                                <label>Exam Name</label>
                                <input className="glass-input" required placeholder="Unit Test - I" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" className="glass-input" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Class</label>
                                <input required className="glass-input" placeholder="e.g. 10" value={formData.className} onChange={e=>setFormData({...formData, className: e.target.value})} />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-glass w-full" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" disabled={createExamMutation.isPending} className="btn-primary w-full">
                                    {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Academics
