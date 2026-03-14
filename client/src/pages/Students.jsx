import React, { useState, useEffect } from 'react'
import axios from 'axios'

const Students = () => {
    const [search, setSearch] = useState('')
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get('/api/students', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudents(data);
            } catch (error) {
                console.error("Error fetching students", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStudents();
    }, [])

    const filtered = students.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.admissionNo.toLowerCase().includes(search.toLowerCase()) || 
        s.className.toLowerCase().includes(search.toLowerCase())
    )
    
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this student?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/students/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(students.filter(s => s.id !== id));
        } catch (error) {
            console.error("Delete error", error);
            alert("Failed to delete student");
        }
    }

    const statusBadge = (s) => s === 'Active' ? 'badge-success' : s === 'TC Issued' ? 'badge-warning' : 'badge-danger'

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>👥 Student Management</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input type="text" placeholder="🔍 Search by name, admission no, class..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', width: '300px', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }} />
                    <button className="quick-action-btn" style={{ background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' }}>➕ New Admission</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem' }}>{students.length}</div><div className="stat-label">Total Students</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>{students.filter(s=>s.status==='Active').length}</div><div className="stat-label">Active</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--warning)' }}>{students.filter(s=>s.status==='TC Issued').length}</div><div className="stat-label">TC Issued</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--info)' }}>{students.filter(s=>s.isRTE).length}</div><div className="stat-label">RTE Students</div></div>
            </div>

            <div className="card">
                <div className="table-wrapper table-responsive">
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading students...</div>
                    ) : (
                    <table>
                        <thead>
                            <tr><th>Adm. No</th><th>Student Name</th><th>Father's Name</th><th>Class</th><th>Gender</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map((s, i) => (
                                <tr key={s.id || i}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.admissionNo}</td>
                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{s.fatherName}</td>
                                    <td><span className="badge badge-purple">{s.className}-{s.section}</span></td>
                                    <td>{s.gender === 'Male' ? '👦' : '👧'}</td>
                                    <td><span className={`badge ${statusBadge(s.status)}`}><span className="badge-dot"></span>{s.status}</span></td>
                                    <td>
                                        <button onClick={() => handleDelete(s.id)} style={{ padding: '0.3rem 0.6rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No students found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Students
