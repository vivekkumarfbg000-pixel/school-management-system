import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Wallet, TrendingUp, AlertCircle, Sparkles, Receipt, Plus, X, ArrowRight, DollarSign, Download, Save, CreditCard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const Finance = () => {
    const { token } = useAuth()
    const headers = { Authorization: `Bearer ${token}` }
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
            toast.success("Payment internalized successfully.")
            setShowModal(false)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Internal sync failure.")
        }
    })

    const generateMutation = useMutation({
        mutationFn: async (variables) => {
            await axios.post('/api/fees/generate', variables)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fees'] })
            toast.success("Billing record generated.")
            setShowGenModal(false)
        },
        onError: () => {
            toast.error("Ledger update failure.")
        }
    })

    const handleCollectClick = (student) => {
        if (student.balance === 0) return toast.error("Account balance is zero.")
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

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleRazorpayCheckout = async () => {
        if (!amount || amount <= 0) return toast.error("Enter a valid amount")
        const res = await loadRazorpayScript();
        if (!res) return toast.error("Razorpay SDK failed to load. Are you online?");

        try {
            const { data: order } = await axios.post('/api/pay/create-order', {
                expectedAmount: parseFloat(amount),
                feeId: selectedStudent.id
            }, { headers });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_mock123",
                amount: order.amount,
                currency: order.currency,
                name: "EduStream SaaS",
                description: `Fee Payment - ${feeType}`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await axios.post('/api/pay/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            studentId: selectedStudent.id,
                            amountPaid: parseFloat(amount),
                            feeType
                        }, { headers });

                        if (verifyRes.data.verified) {
                            toast.success("Online Payment Successful!");
                            queryClient.invalidateQueries({ queryKey: ['fees'] });
                            setShowModal(false);
                        }
                    } catch (err) {
                        toast.error(err.response?.data?.message || "Payment verification failed");
                    }
                },
                prefill: {
                    name: selectedStudent?.name,
                    email: `${selectedStudent?.admissionNo}@edustream.com`,
                    contact: "9999999999",
                },
                theme: { color: "#6366f1" }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (error) {
            toast.error("Failed to initiate secure checkout");
        }
    }

    // derived stats
    const totalCollected = financeData.reduce((acc, curr) => acc + curr.totalPaid, 0)
    const totalPending = financeData.reduce((acc, curr) => acc + curr.balance, 0)
    const overdueCount = financeData.filter(f => f.status === 'Overdue').length
    
    const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`
    const statusBadge = (s) => s === 'Paid' ? 'badge-success' : s === 'Pending' ? 'badge-warning' : s === 'Overdue' ? 'badge-danger' : s === 'RTE' ? 'badge-info' : 'badge-purple'

    return (
        <div className="page-workspace">
            <div className="page-header">
                <div className="header-text">
                    <h1>Revenue command</h1>
                    <p>Global financial health and student fee reconciliation ledger.</p>
                </div>
                <div className="header-actions">
                    <button className="btn-glass" onClick={() => window.open('/api/export/fee-report?type=daily', '_blank')}>
                        <Download size={16} />
                        <span>Daily Report (Excel)</span>
                    </button>
                    <button className="btn-glass">
                        <TrendingUp size={16} />
                        <span>Financial Report</span>
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon green"><Wallet size={20} /></div>
                    <div className="stat-value text-success">{isLoading ? '...' : formatCurrency(totalCollected)}</div>
                    <div className="stat-label">Total Realized</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon amber"><TrendingUp size={20} /></div>
                    <div className="stat-value text-warning">{isLoading ? '...' : formatCurrency(totalPending)}</div>
                    <div className="stat-label">Projected Receivables</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><AlertCircle size={20} /></div>
                    <div className="stat-value text-danger">{isLoading ? '...' : overdueCount}</div>
                    <div className="stat-label">Delinquent Accounts</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><Sparkles size={20} /></div>
                    <div className="stat-value info">{isLoading ? '...' : financeData.filter(s=>s.isRTE).length}</div>
                    <div className="stat-label">RTE Social Credits</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title"><Receipt size={16} /> Student Fee Registry</h3>
                </div>
                <div className="table-wrapper">
                    {isLoading ? (
                        <div className="sync-overlay">
                            <Wallet className="animate-spin" />
                            <span>Synchronizing Ledger...</span>
                        </div>
                    ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Student Identity</th>
                                <th>Designation</th>
                                <th>Gross Billed</th>
                                <th>Realized</th>
                                <th>Outstanding</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {financeData.map((s, i) => (
                                <tr key={s.id || i}>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>{s.name}</div>
                                        <div className="text-muted font-mono" style={{ fontSize: '0.7rem' }}>{s.admissionNo}</div>
                                    </td>
                                    <td><span className="badge badge-purple">{s.className}-{s.section}</span></td>
                                    <td>{formatCurrency(s.totalDue)}</td>
                                    <td className="text-success" style={{ fontWeight: 700 }}>{formatCurrency(s.totalPaid)}</td>
                                    <td style={{ fontWeight: 900, color: s.balance > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{formatCurrency(s.balance)}</td>
                                    <td><span className={`badge ${statusBadge(s.status)}`}><span className="badge-dot"></span>{s.status}</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button 
                                                className="btn-glass btn-sm" 
                                                onClick={() => handleCollectClick(s)} 
                                                disabled={s.balance === 0 && !s.isRTE}
                                                style={{ color: 'var(--success)' }}
                                            >
                                                <DollarSign size={14} />
                                                <span>Collect</span>
                                            </button>
                                            <button 
                                                className="btn-glass btn-sm" 
                                                onClick={() => handleGenClick(s)}
                                            >
                                                <Plus size={14} />
                                                <span>Bill</span>
                                            </button>
                                            {s.fees && s.fees.filter(f => f.status === 'Paid' && f.receipt_no).length > 0 && (
                                                <button 
                                                    className="btn-glass btn-sm" 
                                                    style={{ color: 'var(--info)' }}
                                                    onClick={() => {
                                                        const paidFee = s.fees.find(f => f.status === 'Paid' && f.receipt_no)
                                                        if (paidFee) window.open(`/api/export/fee-receipt/${paidFee.id}`, '_blank')
                                                    }}
                                                >
                                                    <Download size={14} />
                                                    <span>Receipt</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="modal-container glass-card"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3 className="card-title">Process Transaction</h3>
                                <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                            </div>
                            <div className="modal-body">
                                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                    <div className="feed-icon green" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}><DollarSign size={24} /></div>
                                    <h4>{selectedStudent?.name}</h4>
                                    <p className="text-muted">Balance: {formatCurrency(selectedStudent?.balance || 0)}</p>
                                </div>
                                <form onSubmit={submitPayment}>
                                    <div className="form-group">
                                        <label>Ledger Category</label>
                                        <select className="form-control" value={feeType} onChange={e=>setFeeType(e.target.value)}>
                                            <option value="Tuition">Tuition Fee</option>
                                            <option value="Transport">Transport Service</option>
                                            <option value="Annual">Annual Maintenance</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Amount to Realize</label>
                                        <input className="form-control" type="number" required value={amount} onChange={e=>setAmount(e.target.value)} max={selectedStudent?.balance} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                        <button type="submit" className="btn-glass w-full" style={{ color: 'var(--success)', border: '1px solid var(--success)' }} disabled={collectMutation.isPending}>
                                            <Save size={18} />
                                            <span>Cash / Cheque</span>
                                        </button>
                                        <button type="button" className="btn-primary w-full" onClick={handleRazorpayCheckout}>
                                            <CreditCard size={18} />
                                            <span>Pay Online</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showGenModal && (
                    <div className="modal-overlay" onClick={() => setShowGenModal(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="modal-container glass-card"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3 className="card-title">Institute Billing</h3>
                                <button className="btn-icon" onClick={() => setShowGenModal(false)}><X size={18} /></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={submitGenerate}>
                                    <div className="form-group">
                                        <label>Service Type</label>
                                        <select className="form-control" value={genType} onChange={e=>setGenType(e.target.value)}>
                                            <option value="Tuition">Instructional Fee</option>
                                            <option value="Transport">Fleet Logistics</option>
                                            <option value="Annual">Academic Ancillary</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Billing Amount</label>
                                        <input className="form-control" type="number" required value={genAmount} onChange={e=>setGenAmount(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Maturity Date (Due)</label>
                                        <input className="form-control" type="date" required value={genDate} onChange={e=>setGenDate(e.target.value)} />
                                    </div>
                                    <button type="submit" className="btn-primary w-full" style={{ marginTop: '1rem' }} disabled={generateMutation.isPending}>
                                        <Plus size={18} />
                                        <span>{generateMutation.isPending ? 'Generating...' : 'Confirm Invoice'}</span>
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Finance
