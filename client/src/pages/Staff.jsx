import React, { useState, useEffect } from 'react'
import axios from 'axios'

const Staff = () => {
    const [staffList, setStaffList] = useState([])
    const [loading, setLoading] = useState(true)
    
    // Add Staff Modal State
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        staffId: '',
        name: '',
        designation: 'Teacher',
        type: 'Teaching',
        qualification: '',
        phone: '',
        basicSalary: '',
        subjects: '',
        joiningDate: new Date().toISOString().split('T')[0]
    })
    const [submitting, setSubmitting] = useState(false)

    const fetchStaff = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const { data } = await axios.get('/api/staff', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setStaffList(data)
        } catch (error) {
            console.error("Error fetching staff", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStaff()
    }, [])

    const handleAddStaff = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const token = localStorage.getItem('token')
            await axios.post('http://localhost:5000/api/staff', formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            alert("✅ Staff added successfully!")
            setShowModal(false)
            setFormData({
                staffId: '', name: '', designation: 'Teacher', type: 'Teaching',
                qualification: '', phone: '', basicSalary: '', subjects: '',
                joiningDate: new Date().toISOString().split('T')[0]
            })
            fetchStaff()
        } catch (error) {
            console.error(error)
            alert("❌ Failed to add staff")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate this staff record?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/staff/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaffList(staffList.filter(s => s.id !== id));
        } catch (error) {
            console.error("Delete error", error);
            alert("Failed to deactivate staff");
        }
    }

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>👨‍🏫 Staff & HR Management</h3>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="quick-action-btn" 
                    style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }}
                >
                    ➕ Add Staff
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem' }}>{totalStaff}</div><div className="stat-label">Total Staff</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>{teachingCount}</div><div className="stat-label">Teaching</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--info)' }}>{nonTeachingCount}</div><div className="stat-label">Non-Teaching</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>0</div><div className="stat-label">On Leave Today</div></div>
            </div>

            <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="card-header"><h3 className="card-title">Staff Directory</h3><span className="card-action">Export CSV →</span></div>
                <div className="table-wrapper table-responsive">
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading staff...</div>
                    ) : (
                        <table>
                            <thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Subject</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {staffList.map((s, i) => (
                                    <tr key={s.id || i}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.staff_id}</td>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td>{s.designation}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{s.subjects || '-'}</td>
                                        <td style={{ fontWeight: 600 }}>₹{s.basic_salary?.toLocaleString()}</td>
                                        <td><span className={`badge ${s.status === 'Active' ? 'badge-success' : 'badge-warning'}`}><span className="badge-dot"></span>{s.status || 'Active'}</span></td>
                                        <td>
                                            <button onClick={() => handleDelete(s.id)} style={{ padding: '0.3rem 0.6rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {staffList.length === 0 && (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No members found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ADD STAFF MODAL */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card fade-in" style={{ width: '500px', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="card-header"><h3 className="card-title">➕ Add New Staff</h3></div>
                        <form onSubmit={handleAddStaff} style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Staff ID</label>
                                <input required placeholder="STF101" value={formData.staffId} onChange={e=>setFormData({...formData, staffId: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Full Name</label>
                                <input required placeholder="Rajesh Kumar" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Designation</label>
                                <input required placeholder="Senior Teacher" value={formData.designation} onChange={e=>setFormData({...formData, designation: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Type</label>
                                <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                                    <option value="Teaching">Teaching</option>
                                    <option value="Non-Teaching">Non-Teaching</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Joining Date</label>
                                <input type="date" value={formData.joiningDate} onChange={e=>setFormData({...formData, joiningDate: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Phone</label>
                                <input required placeholder="91XXXXXXXX" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Basic Salary</label>
                                <input type="number" required placeholder="25000" value={formData.basicSalary} onChange={e=>setFormData({...formData, basicSalary: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Qualification</label>
                                <input placeholder="M.Sc B.Ed" value={formData.qualification} onChange={e=>setFormData({...formData, qualification: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Subjects (Optional)</label>
                                <input placeholder="Maths, Physics" value={formData.subjects} onChange={e=>setFormData({...formData, subjects: e.target.value})} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{submitting ? 'Saving...' : 'Save Staff'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Staff
