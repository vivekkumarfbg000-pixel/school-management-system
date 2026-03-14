import React, { useState, useEffect } from 'react'
import axios from 'axios'

const Finance = () => {
    const [financeData, setFinanceData] = useState([])
    const [loading, setLoading] = useState(true)

    // Modal state for collecting fee
    const [showModal, setShowModal] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [feeType, setFeeType] = useState('Tuition')
    const [amount, setAmount] = useState('')
    const [collecting, setCollecting] = useState(false)

    // Modal state for generating a test fee
    const [showGenModal, setShowGenModal] = useState(false)
    const [genAmount, setGenAmount] = useState('')
    const [genType, setGenType] = useState('Tuition')
    const [genDate, setGenDate] = useState(new Date().toISOString().split('T')[0])

    const fetchFinanceData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const { data } = await axios.get('/api/fees', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setFinanceData(data)
        } catch (error) {
            console.error("Error fetching finance data", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFinanceData()
    }, [])

    const handleCollectClick = (student) => {
        if (student.balance === 0) return alert("This student has no pending dues.")
        setSelectedStudent(student)
        setAmount(student.balance)
        setShowModal(true)
    }

    const handleGenClick = (student) => {
        setSelectedStudent(student)
        setShowGenModal(true)
    }

    const submitPayment = async (e) => {
        e.preventDefault()
        setCollecting(true)
        try {
            const token = localStorage.getItem('token')
            await axios.post('/api/fees/collect', {
                studentId: selectedStudent.id,
                feeType,
                amountPaid: parseFloat(amount),
                isFullPayment: parseFloat(amount) >= selectedStudent.balance
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            alert("Payment collected successfully!")
            setShowModal(false)
            fetchFinanceData()
        } catch (error) {
            console.error("Error collecting payment", error)
            alert(error.response?.data?.message || "Failed to collect payment")
        } finally {
            setCollecting(false)
        }
    }

    const submitGenerate = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            await axios.post('/api/fees/generate', {
                studentId: selectedStudent.id,
                amount: parseFloat(genAmount),
                feeType: genType,
                dueDate: genDate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            alert("Test Fee Generated!")
            setShowGenModal(false)
            fetchFinanceData()
        } catch (error) {
            console.error(error)
            alert("Failed to generate fee")
        }
    }

    // derived stats
    const totalCollected = financeData.reduce((acc, curr) => acc + curr.totalPaid, 0)
    const totalPending = financeData.reduce((acc, curr) => acc + curr.balance, 0)
    const overdueCount = financeData.filter(f => f.status === 'Overdue').length
    
    // Sort defaulters
    const feeDefaulters = [...financeData].filter(f => f.balance > 0).sort((a,b) => b.balance - a.balance)
    
    const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`
    const statusBadge = (s) => s === 'Paid' ? 'badge-success' : s === 'Pending' ? 'badge-warning' : s === 'Overdue' ? 'badge-danger' : s === 'RTE' ? 'badge-info' : 'badge-purple'

    return (
        <div className="fade-in" style={{ position: 'relative' }}>
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>💰 Fee & Finance Hub</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--accent)' }}>{formatCurrency(totalCollected)}</div><div className="stat-label">Total Collected</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--warning)' }}>{formatCurrency(totalPending)}</div><div className="stat-label">Pending Dues</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--danger)' }}>{overdueCount}</div><div className="stat-label">Overdue Students</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--info)' }}>{financeData.filter(s=>s.isRTE).length}</div><div className="stat-label">RTE Waivers</div></div>
            </div>

            <div className="card">
                <div className="card-header"><h3 className="card-title">🚨 Student Fee Ledger</h3><span className="card-action">Send Reminders →</span></div>
                <div className="table-wrapper table-responsive">
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading ledger...</div>
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
                            {financeData.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>

            {/* QUICK MODAL STYLES INLINE FOR SIMPLICITY */}
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
                                <button type="submit" disabled={collecting} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{collecting ? 'Processing...' : 'Confirm Payment'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* GENERATE FEE MODAL */}
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
                                <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Create Bill</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Finance
