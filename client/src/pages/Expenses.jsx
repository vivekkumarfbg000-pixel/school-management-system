import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, Plus, X, Download, IndianRupee,
  AlertCircle, CheckCircle, Receipt
} from 'lucide-react'

const CATEGORIES = ['Salary', 'Electricity', 'Maintenance', 'Events', 'Supplies', 'Rent', 'Other']
const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'UPI', 'Cheque']

const CATEGORY_COLORS = {
  Salary: '#6366f1', Electricity: '#f59e0b', Maintenance: '#ef4444',
  Events: '#8b5cf6', Supplies: '#10b981', Rent: '#3b82f6', Other: '#94a3b8'
}

const formatINR = (n) => `₹${(n || 0).toLocaleString('en-IN')}`

const Expenses = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const headers = { Authorization: `Bearer ${token}` }
  const [showAdd, setShowAdd] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7))
  const [form, setForm] = useState({ category: 'Salary', description: '', amount: '', date: new Date().toISOString().split('T')[0], paidTo: '', paymentMode: 'Cash' })

  const { data: pnl, isLoading: pnlLoading } = useQuery({
    queryKey: ['pnl', selectedMonth],
    queryFn: async () => {
      const { data } = await axios.get(`/expenses/pnl?month=${selectedMonth}`, { headers })
      return data
    }
  })

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', selectedMonth],
    queryFn: async () => {
      const { data } = await axios.get(`/expenses?month=${selectedMonth}`, { headers })
      return data
    }
  })

  const addMutation = useMutation({
    mutationFn: async (vars) => {
      const { data } = await axios.post('/expenses', vars, { headers })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['pnl'] })
      toast.success('Expense recorded!')
      setShowAdd(false)
      setForm({ category: 'Salary', description: '', amount: '', date: new Date().toISOString().split('T')[0], paidTo: '', paymentMode: 'Cash' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add expense')
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => axios.delete(`/expenses/${id}`, { headers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['pnl'] })
      toast.success('Expense deleted')
    }
  })

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const itemVars = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

  const profitColor = (pnl?.netProfit || 0) >= 0 ? 'var(--success)' : 'var(--danger)'
  const chartData = pnl?.monthlyChart || []

  // Pie-like data for category breakdown
  const categoryData = Object.entries(pnl?.categoryBreakdown || {}).map(([name, value]) => ({ name, value }))

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="page-workspace">
      {/* Header */}
      <motion.div variants={itemVars} className="page-header">
        <div className="header-text">
          <h1>Expenses & P&L</h1>
          <p>Track every rupee spent. Know your real profit in real-time.</p>
        </div>
        <div className="header-actions">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
          />
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={18} /> <span>Add Expense</span>
          </button>
        </div>
      </motion.div>

      {/* P&L KPI Cards */}
      <motion.div variants={itemVars} className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><Wallet size={22} /></div>
          <div className="stat-value text-success">{pnlLoading ? '...' : formatINR(pnl?.totalRevenue)}</div>
          <div className="stat-label">Fee Revenue</div>
          <div className="stat-trend-indicator"><CheckCircle size={11} /> Collected this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><TrendingDown size={22} /></div>
          <div className="stat-value text-danger">{pnlLoading ? '...' : formatINR(pnl?.totalExpenses)}</div>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-trend-indicator" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>{expenses.length} entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: (pnl?.netProfit || 0) >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
            <IndianRupee size={22} color={profitColor} />
          </div>
          <div className="stat-value" style={{ color: profitColor }}>{pnlLoading ? '...' : formatINR(pnl?.netProfit)}</div>
          <div className="stat-label">Net Profit</div>
          <div className="stat-trend-indicator" style={{ background: (pnl?.netProfit || 0) >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: profitColor }}>
            {(pnl?.netProfit || 0) >= 0 ? '↑' : '↓'} {pnl?.profitMargin || 0}% margin
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><TrendingUp size={22} /></div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{pnlLoading ? '...' : `${pnl?.profitMargin || 0}%`}</div>
          <div className="stat-label">Profit Margin</div>
          <div className="stat-trend-indicator">{selectedMonth}</div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVars} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* 6-Month Area Chart */}
        <div className="card analytics-card">
          <div className="card-header">
            <h3 className="card-title"><TrendingUp size={16} /> 6-Month Revenue vs Expenses</h3>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            {chartData.length === 0 ? (
              <div className="chart-empty-state"><TrendingUp size={32} /><p>No data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsla(222,47%,18%,0.95)', border: '1px solid var(--glass-border-bright)', borderRadius: '12px' }}
                    formatter={(val) => formatINR(val)}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--success)" fill="url(#colorRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="var(--danger)" fill="url(#colorExp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card glass-card">
          <div className="card-header">
            <h3 className="card-title"><Receipt size={16} /> By Category</h3>
          </div>
          <div style={{ padding: '0.5rem 0.5rem 1rem' }}>
            {categoryData.length === 0 ? (
              <div className="chart-empty-state" style={{ padding: '2rem' }}><AlertCircle size={28} /><p>No expenses this month</p></div>
            ) : (
              categoryData.map(({ name, value }) => {
                const pct = pnl?.totalExpenses > 0 ? Math.round((value / pnl.totalExpenses) * 100) : 0
                return (
                  <div key={name} style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatINR(value)}</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '4px' }}>
                      <div style={{ height: '4px', width: `${pct}%`, background: CATEGORY_COLORS[name] || 'var(--primary)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* Expenses Table */}
      <motion.div variants={itemVars} className="card">
        <div className="card-header">
          <h3 className="card-title"><Receipt size={16} /> Expense Ledger — {selectedMonth}</h3>
        </div>
        <div className="table-wrapper">
          {isLoading ? (
            <div className="sync-overlay"><Wallet className="animate-spin" /><span>Loading...</span></div>
          ) : expenses.length === 0 ? (
            <div className="chart-empty-state" style={{ padding: '3rem' }}>
              <Receipt size={40} />
              <p>No expenses recorded for {selectedMonth}. Click "Add Expense" to start tracking.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Paid To</th>
                  <th>Mode</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ background: `${CATEGORY_COLORS[exp.category]}22`, color: CATEGORY_COLORS[exp.category], border: `1px solid ${CATEGORY_COLORS[exp.category]}44` }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{exp.description}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{exp.paid_to || '—'}</td>
                    <td><span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{exp.payment_mode}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>−{formatINR(exp.amount)}</td>
                    <td>
                      <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => { if (confirm('Delete this expense?')) deleteMutation.mutate(exp.id) }}>
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td colSpan={5} style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Total Expenses</td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--danger)', padding: '0.75rem 1rem' }}>
                    −{formatINR(pnl?.totalExpenses)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </motion.div>

      {/* ADD EXPENSE MODAL */}
      <AnimatePresence>
        {showAdd && (
          <div className="modal-overlay" onClick={() => setShowAdd(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="modal-container glass-card"
              style={{ maxWidth: '480px', width: '95%' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="card-title"><Plus size={18} /> Record Expense</h3>
                <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <form onSubmit={e => { e.preventDefault(); addMutation.mutate(form) }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Category *</label>
                      <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Amount (₹) *</label>
                      <input type="number" className="form-control" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" min={1} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Description *</label>
                      <input className="form-control" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What was this for?" />
                    </div>
                    <div className="form-group">
                      <label>Date</label>
                      <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Payment Mode</label>
                      <select className="form-control" value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                        {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Paid To</label>
                      <input className="form-control" value={form.paidTo} onChange={e => setForm({ ...form, paidTo: e.target.value })} placeholder="Vendor / staff name (optional)" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" className="btn-glass w-full" onClick={() => setShowAdd(false)}>Cancel</button>
                    <button type="submit" className="btn-primary w-full" disabled={addMutation.isPending}>
                      {addMutation.isPending ? 'Saving...' : <><Download size={16} /> Record Expense</>}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Expenses
