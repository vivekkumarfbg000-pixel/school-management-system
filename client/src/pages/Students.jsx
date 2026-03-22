import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Users, UserPlus, Search, Trash2, ArrowRight, BadgeCheck, FileText } from 'lucide-react'

const Students = () => {
    const [search, setSearch] = useState('')
    const queryClient = useQueryClient()

    const { data: students = [], isLoading } = useQuery({
        queryKey: ['students'],
        queryFn: async () => {
            const { data } = await axios.get('/students')
            return data
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await axios.delete(`/students/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] })
            toast.success('Student removed successfully')
        },
        onError: () => {
            toast.error('Failed to delete student')
        }
    })

    const filtered = students.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.admissionNo.toLowerCase().includes(search.toLowerCase()) || 
        s.className.toLowerCase().includes(search.toLowerCase())
    )
    
    const handleDelete = (id) => {
        if (!window.confirm("Are you sure you want to remove this student?")) return;
        deleteMutation.mutate(id)
    }

    const handleGenerateID = (id) => {
        window.open(`/export/id-card/${id}`, '_blank')
    }

    const handleGenerateTC = (id) => {
        if (window.confirm("Generate a Transfer Certificate? This updates the student status automatically.")) {
            window.open(`/export/tc/${id}`, '_blank')
            setTimeout(() => queryClient.invalidateQueries({ queryKey: ['students'] }), 1500)
        }
    }

    const statusBadge = (s) => s === 'Active' ? 'badge-success' : s === 'TC Issued' ? 'badge-warning' : 'badge-danger'

    return (
        <div className="page-workspace">
            <div className="page-header">
                <div className="header-text">
                    <h1>Student Registry</h1>
                    <p>Manage and monitor student enrollment across all classes.</p>
                </div>
                <div className="header-actions">
                    <div className="omnisearch-bar" style={{ width: '320px' }}>
                        <Search size={18} className="text-muted" />
                        <input 
                            type="text" 
                            placeholder="Search by name, adm, class..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                        />
                    </div>
                    <button className="btn-primary">
                        <UserPlus size={18} />
                        <span>New Admission</span>
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple"><Users size={20} /></div>
                    <div className="stat-value">{isLoading ? '...' : students.length}</div>
                    <div className="stat-label">Total Enrollment</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><UserPlus size={20} /></div>
                    <div className="stat-value text-success">{isLoading ? '...' : students.filter(s=>s.status==='Active').length}</div>
                    <div className="stat-label">Academic Active</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon amber"><Trash2 size={20} /></div>
                    <div className="stat-value text-warning">{isLoading ? '...' : students.filter(s=>s.status==='TC Issued').length}</div>
                    <div className="stat-label">TC Records</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><ArrowRight size={20} /></div>
                    <div className="stat-value info">{isLoading ? '...' : students.filter(s=>s.isRTE).length}</div>
                    <div className="stat-label">RTE Quota</div>
                </div>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    {isLoading ? (
                        <div className="sync-overlay">
                            <Users className="animate-pulse" />
                            <span>Synchronizing Registry...</span>
                        </div>
                    ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Adm. No</th>
                                <th>Student Identity</th>
                                <th>Parental Info</th>
                                <th>Class Designation</th>
                                <th>Gender</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s, i) => (
                                <tr key={s.id || i}>
                                    <td className="text-muted font-mono">{s.admissionNo}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                                                {s.name[0]}
                                            </div>
                                            <span style={{ fontWeight: 700 }}>{s.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.8rem' }}>{s.fatherName}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Father</div>
                                    </td>
                                    <td>
                                        <span className="badge badge-purple">{s.className}-{s.section}</span>
                                    </td>
                                    <td>{s.gender === 'Male' ? '👦' : '👧'} <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{s.gender}</span></td>
                                    <td><span className={`badge ${statusBadge(s.status)}`}><span className="badge-dot"></span>{s.status}</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button className="btn-icon" onClick={() => handleGenerateID(s.id)} title="Print ID Card" style={{ color: 'var(--primary)' }}><BadgeCheck size={16} /></button>
                                            <button className="btn-icon" onClick={() => handleGenerateTC(s.id)} title="Issue TC" style={{ color: 'var(--warning)' }}><FileText size={16} /></button>
                                            <button 
                                                className="btn-icon danger" 
                                                onClick={() => handleDelete(s.id)} 
                                                disabled={deleteMutation.isPending}
                                                title="Remove Student"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No records matching search criteria.</td>
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
