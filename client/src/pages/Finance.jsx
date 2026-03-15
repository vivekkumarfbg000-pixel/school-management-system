import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'

const Finance = () => {
    const queryClient = useQueryClient()
    
    // Modal state for collecting fee
    const [showModal, setShowModal] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [feeType, setFeeType] = useState('Tuition')
    const [amount, setAmount] = useState('')

    // Modal state for generating a test fee
    const [showGenModal, setShowGenModal] = useState(false)
    const [genAmount, setGenAmount] = useState('')
    const [genType, setGenType] = useState('Tuition')
    const [genDate, setGenDate] = useState(new Date().toISOString().split('T')[0])

    const { data: financeData = [], isLoading } = useQuery({
        queryKey: ['fees'],
        queryFn: async () => {
            const { data } = await axios.get('/api/fees')
            return data
        }
    })

    const collectMutation = useMutation({
        mutationFn: async (variables) => {
            await axios.post('/api/fees/collect', variables)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fees'] })
            toast.success("Payment collected successfully!")
            setShowModal(false)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to collect payment")
        }
    })

    const generateMutation = useMutation({
        mutationFn: async (variables) => {
            await axios.post('/api/fees/generate', variables)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fees'] })
            toast.success("Bill generated successfully!")
            setShowGenModal(false)
        },
        onError: () => {
            toast.error("Failed to generate bill")
        }
    })

    const handleCollectClick = (student) => {
        if (student.balance === 0) return toast.error("This student has no pending dues.")
        setSelectedStudent(student)
        setAmount(student.balance)
        setShowModal(true)
    }

    const handleGenClick = (student) => {
        setSelectedStudent(student)
        setShowGenModal(true)
    }

    const submitPayment = (e) => {
        e.preventDefault()
        collectMutation.mutate({
            studentId: selectedStudent.id,
            feeType,
            amountPaid: parseFloat(amount),
            isFullPayment: parseFloat(amount) >= selectedStudent.balance
        })
    }

    const submitGenerate = (e) => {
        e.preventDefault()
        generateMutation.mutate({
            studentId: selectedStudent.id,
            amount: parseFloat(genAmount),
            feeType: genType,
            dueDate: genDate
        })
    }

    // derived stats
    const totalCollected = financeData.reduce((acc, curr) => acc + curr.totalPaid, 0)
    const totalPending = financeData.reduce((acc, curr) => acc + curr.balance, 0)
    const overdueCount = financeData.filter(f => f.status === 'Overdue').length
    
    const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`
    const statusBadge = (s) => s === 'Paid' ? 'badge-success' : s === 'Pending' ? 'badge-warning' : s === 'Overdue' ? 'badge-danger' : s === 'RTE' ? 'badge-info' : 'badge-purple'

    return (
        <div className="fade-in" style={{ position: 'relative' }}>
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>💰 Fee & Finance Hub</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--accent)' }}>{isLoading ? '...' : formatCurrency(totalCollected)}</div>
                    <div className="stat-label">Total Collected</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--warning)' }}>{isLoading ? '...' : formatCurrency(totalPending)}</div>
                    <div className="stat-label">Pending Dues</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--danger)' }}>{isLoading ? '...' : overdueCount}</div>
                    <div className="stat-label">Overdue Students</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--info)' }}>{isLoading ? '...' : financeData.filter(s=>s.isRTE).length}</div>
                    <div className="stat-label">RTE Waivers</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3 className="card-title">🚨 Student Fee Ledger</h3></div>
                <div className="table-wrapper table-responsive">
                    {isLoading ? (
                        <div style={{ padding: '2rem' }}>
                            {[...Array(5)].map((_, i) => <div key={i} className="shimmer" style={{ height: '40px', marginBottom: '10px' }} />)}
                        </div>
                    ) : (
                    <table>
                        <thead><tr><th>Student</th><th>Class</th><th>Total Billed</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {financeData.map((s, i) => (
                                <tr key={s.id || i}>
                                    <td style={{ fontWeight: 600 }}>{s.name} <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{s.admissionNo}</span></td>
                                    <td><span className="badge badge-purple">{s.className}-{s.section}</span></td>
                                    <td>{formatCurrency(s.totalDue)}</td>
                                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(s.totalPaid)}</td>
                                    <td style={{ fontWeight: 700, color: s.balance > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{formatCurrency(s.balance)}</td>
                                    <td><span className={`badge ${statusBadge(s.status)}`}><span className="badge-dot"></span>{s.status}</span></td>
                                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleCollectClick(s)} disabled={s.balance === 0 && !s.isRTE} style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: 'white', cursor: s.balance === 0 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Collect</button>
                                        <button onClick={() => handleGenClick(s)} style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>+ Bill</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card fade-in" style={{ width: '400px', border: '1px solid var(--border)' }}>
                        <div className="card-header"><h3 className="card-title">Collect Fee - {selectedStudent?.name}</h3></div>
                        <form onSubmit={submitPayment} style={{ padding: '1rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Fee Type</label>
                                <select value={feeType} onChange={e=>setFeeType(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                                    <option value="Tuition">Tuition</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Annual">Annual/Lab</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Amount</label>
                                <input type="number" required value={amount} onChange={e=>setAmount(e.target.value)} max={selectedStudent?.balance} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={collectMutation.isPending} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{collectMutation.isPending ? '...' : 'Confirm Payment'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showGenModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card fade-in" style={{ width: '400px', border: '1px solid var(--border)' }}>
                        <div className="card-header"><h3 className="card-title">Generate Bill - {selectedStudent?.name}</h3></div>
                        <form onSubmit={submitGenerate} style={{ padding: '1rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Fee Type</label>
                                <select value={genType} onChange={e=>setGenType(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                                    <option value="Tuition">Tuition</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Annual">Annual/Lab</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Amount</label>
                                <input type="number" required value={genAmount} onChange={e=>setGenAmount(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Due Date</label>
                                <input type="date" required value={genDate} onChange={e=>setGenDate(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowGenModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={generateMutation.isPending} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{generateMutation.isPending ? '...' : 'Create Bill'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Finance
