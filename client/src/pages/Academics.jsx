import React, { useState, useEffect } from 'react'
import axios from 'axios'

const Academics = () => {
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    
    // Create Exam Modal
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        className: '10'
    })
    const [submitting, setSubmitting] = useState(false)

    const fetchExams = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const { data } = await axios.get('http://localhost:5000/api/academics/exams', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setExams(data)
        } catch (error) {
            console.error("Error fetching exams", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchExams()
    }, [])

    const handleCreateExam = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            // NOTE: We'll need a backend route for POST /api/academics/exams if literal creation is needed
            // For now, let's assume we can add it via Supabase or a new route.
            // I will create a new route if needed, but first let's implement the UI.
            const token = localStorage.getItem('token')
            await axios.post('http://localhost:5000/api/academics/exams', formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            alert("✅ Exam created successfully!")
            setShowModal(false)
            fetchExams()
        } catch (error) {
            console.error(error)
            alert("❌ Failed to create exam (Make sure the route exists)")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>📚 Academics & Exams</h3>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="quick-action-btn" 
                    style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }}
                >
                    📝 Create Exam
                </button>
            </div>

            <div className="content-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Exam Schedule</h3></div>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading exams...</div>
                    ) : exams.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No exams scheduled.</div>
                    ) : (
                        exams.map((e, i) => (
                            <div key={e.id || i} className="event-item">
                                <div className="event-date-box" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)', fontSize: '1.2rem' }}>📝</div>
                                <div className="event-info" style={{ flex: 1 }}>
                                    <h4>{e.name}</h4>
                                    <p>{new Date(e.date).toLocaleDateString()} • Class {e.class_name}</p>
                                </div>
                                <span className="badge badge-info">Scheduled</span>
                            </div>
                        ))
                    )}
                </div>
                
                <div className="card">
                    <div className="card-header"><h3 className="card-title">🏆 School Toppers (Prototype)</h3></div>
                    <div className="staff-item">
                        <div style={{ fontSize: '1.5rem' }}>🥇</div>
                        <div className="staff-info"><h4>Kavya Mishra</h4><p>Class 10-A</p></div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-light)' }}>96.4%</div>
                    </div>
                    <div className="staff-item">
                        <div style={{ fontSize: '1.5rem' }}>🥈</div>
                        <div className="staff-info"><h4>Aarav Sharma</h4><p>Class 10-A</p></div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-light)' }}>94.8%</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Recent Exam Analytics (Static)</h3>
                    <span className="card-action">📄 Print Report Cards →</span>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead><tr><th>Subject</th><th>Class Avg</th><th>Highest</th><th>Lowest</th><th>Pass %</th><th>Performance</th></tr></thead>
                        <tbody>
                            <tr><td style={{ fontWeight: 600 }}>Mathematics</td><td style={{ fontWeight: 700 }}>72%</td><td>98</td><td>28</td><td><span className="badge badge-success">91%</span></td><td style={{ width: '25%' }}><div className="progress-bar" style={{ height: '8px' }}><div className="progress-fill purple" style={{ width: '72%' }}></div></div></td></tr>
                            <tr><td style={{ fontWeight: 600 }}>Science</td><td style={{ fontWeight: 700 }}>68%</td><td>95</td><td>22</td><td><span className="badge badge-warning">85%</span></td><td style={{ width: '25%' }}><div className="progress-bar" style={{ height: '8px' }}><div className="progress-fill green" style={{ width: '68%' }}></div></div></td></tr>
                            <tr><td style={{ fontWeight: 600 }}>English</td><td style={{ fontWeight: 700 }}>75%</td><td>96</td><td>35</td><td><span className="badge badge-success">93%</span></td><td style={{ width: '25%' }}><div className="progress-bar" style={{ height: '8px' }}><div className="progress-fill blue" style={{ width: '75%' }}></div></div></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE EXAM MODAL */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card fade-in" style={{ width: '400px', border: '1px solid var(--border)' }}>
                        <div className="card-header"><h3 className="card-title">📝 Create New Exam</h3></div>
                        <form onSubmit={handleCreateExam} style={{ padding: '1rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Exam Name</label>
                                <input required placeholder="Unit Test - I" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Date</label>
                                <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Class</label>
                                <input required placeholder="10" value={formData.className} onChange={e=>setFormData({...formData, className: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{submitting ? 'Creating...' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Academics
