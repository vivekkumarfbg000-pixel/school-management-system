import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  UserPlus, Phone, TrendingUp, ArrowRight, X, ChevronRight,
  CheckCircle, Clock, AlertCircle, Target, BarChart3, Filter
} from 'lucide-react'

const STAGES = ['New', 'Contacted', 'Test Scheduled', 'Admitted', 'Lost']
const SOURCES = ['walk-in', 'website', 'referral', 'social-media', 'ad']

const STAGE_COLORS = {
  'New': 'badge-info',
  'Contacted': 'badge-warning',
  'Test Scheduled': 'badge-purple',
  'Admitted': 'badge-success',
  'Lost': 'badge-danger',
}
const STAGE_ICONS = {
  'New': '🆕', 'Contacted': '📞', 'Test Scheduled': '📝', 'Admitted': '🎓', 'Lost': '❌'
}

const Enquiries = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const headers = { Authorization: `Bearer ${token}` }

  const [showAdd, setShowAdd] = useState(false)
  const [selectedEnquiry, setSelectedEnquiry] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState({
    studentName: '', parentName: '', phone: '', email: '',
    classApplied: '', source: 'walk-in', notes: '', followUpDate: ''
  })

  const { data: pipeline = { pipeline: [], sourceStats: {}, total: 0, conversionRate: 0 } } = useQuery({
    queryKey: ['enquiries-pipeline'],
    queryFn: async () => {
      const { data } = await axios.get('/enquiries/pipeline', { headers })
      return data
    }
  })

  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ['enquiries', filterStatus],
    queryFn: async () => {
      const url = filterStatus === 'all' ? '/enquiries' : `/enquiries?status=${filterStatus}`
      const { data } = await axios.get(url, { headers })
      return data
    }
  })

  const addMutation = useMutation({
    mutationFn: async (vars) => {
      const { data } = await axios.post('/enquiries', vars, { headers })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] })
      queryClient.invalidateQueries({ queryKey: ['enquiries-pipeline'] })
      toast.success('Enquiry registered!')
      setShowAdd(false)
      setForm({ studentName: '', parentName: '', phone: '', email: '', classApplied: '', source: 'walk-in', notes: '', followUpDate: '' })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add enquiry')
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...vars }) => {
      const { data } = await axios.put(`/enquiries/${id}`, vars, { headers })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] })
      queryClient.invalidateQueries({ queryKey: ['enquiries-pipeline'] })
      toast.success('Enquiry updated!')
      setSelectedEnquiry(null)
    }
  })

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const itemVars = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="page-workspace">
      {/* Header */}
      <motion.div variants={itemVars} className="page-header">
        <div className="header-text">
          <h1>Admission Enquiries</h1>
          <p>Track every enquiry from walk-in to enrolled student. Never lose a lead again.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <UserPlus size={18} /> <span>New Enquiry</span>
          </button>
        </div>
      </motion.div>

      {/* Pipeline Stats */}
      <motion.div variants={itemVars} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {pipeline.pipeline.map((stage) => (
          <div
            key={stage.stage}
            className={`stat-card ${filterStatus === stage.stage ? 'active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === stage.stage ? 'all' : stage.stage)}
            style={{ cursor: 'pointer', border: filterStatus === stage.stage ? '1px solid var(--primary)' : undefined }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{STAGE_ICONS[stage.stage]}</div>
            <div className="stat-value" style={{ fontSize: '1.6rem' }}>{stage.count}</div>
            <div className="stat-label">{stage.stage}</div>
          </div>
        ))}
      </motion.div>

      {/* Conversion KPI Row */}
      <motion.div variants={itemVars} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="stat-icon green"><Target size={20} /></div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--success)' }}>{pipeline.conversionRate}%</div>
              <div className="stat-label">Conversion Rate</div>
            </div>
          </div>
        </div>
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="stat-icon blue"><BarChart3 size={20} /></div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{pipeline.total}</div>
              <div className="stat-label">Total Enquiries</div>
            </div>
          </div>
        </div>
        <div className="card glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="stat-icon purple"><TrendingUp size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="stat-label" style={{ marginBottom: '0.4rem' }}>Sources</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {Object.entries(pipeline.sourceStats || {}).map(([src, cnt]) => (
                  <span key={src} className="badge badge-purple">{src}: {cnt}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filter Strip */}
      <motion.div variants={itemVars} className="filter-strip" style={{ marginBottom: '1rem' }}>
        <div className="filter-scroll">
          <button className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
            <Filter size={14} style={{ display: 'inline', marginRight: '6px' }} /> All
          </button>
          {STAGES.map(s => (
            <button key={s} className={`filter-btn ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
              {STAGE_ICONS[s]} {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Enquiry Table */}
      <motion.div variants={itemVars} className="card">
        <div className="card-header">
          <h3 className="card-title"><Phone size={16} /> Enquiry Register</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{enquiries.length} records</span>
        </div>
        <div className="table-wrapper">
          {isLoading ? (
            <div className="sync-overlay"><Clock className="animate-spin" /><span>Loading...</span></div>
          ) : enquiries.length === 0 ? (
            <div className="chart-empty-state" style={{ padding: '3rem' }}>
              <UserPlus size={40} />
              <p>No enquiries yet. Click "New Enquiry" to register a walk-in.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student / Parent</th>
                  <th>Phone</th>
                  <th>Class</th>
                  <th>Source</th>
                  <th>Follow-up</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{e.student_name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Parent: {e.parent_name}</div>
                    </td>
                    <td><a href={`tel:${e.phone}`} style={{ color: 'var(--primary-light)' }}>{e.phone}</a></td>
                    <td><span className="badge badge-purple">Class {e.class_applied}</span></td>
                    <td><span className="badge badge-info">{e.source}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {e.follow_up_date ? new Date(e.follow_up_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td><span className={`badge ${STAGE_COLORS[e.status]}`}><span className="badge-dot" />{e.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-glass btn-sm" onClick={() => setSelectedEnquiry(e)}>
                        <ChevronRight size={14} /> Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* ADD ENQUIRY MODAL */}
      <AnimatePresence>
        {showAdd && (
          <div className="modal-overlay" onClick={() => setShowAdd(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="modal-container glass-card"
              style={{ maxWidth: '520px', width: '95%' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="card-title"><UserPlus size={18} /> New Enquiry</h3>
                <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <form onSubmit={e => { e.preventDefault(); addMutation.mutate(form) }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Student Name *</label>
                      <input className="form-control" required value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} placeholder="Student full name" />
                    </div>
                    <div className="form-group">
                      <label>Parent Name *</label>
                      <input className="form-control" required value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} placeholder="Father/Mother name" />
                    </div>
                    <div className="form-group">
                      <label>Phone *</label>
                      <input className="form-control" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" maxLength={10} />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Optional" />
                    </div>
                    <div className="form-group">
                      <label>Class Applying For *</label>
                      <input className="form-control" required value={form.classApplied} onChange={e => setForm({ ...form, classApplied: e.target.value })} placeholder="e.g. 8, 10, Nursery" />
                    </div>
                    <div className="form-group">
                      <label>Source</label>
                      <select className="form-control" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                        {SOURCES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Follow-up Date</label>
                      <input type="date" className="form-control" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Notes</label>
                      <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Previous school, any specific requirements..." />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" className="btn-glass w-full" onClick={() => setShowAdd(false)}>Cancel</button>
                    <button type="submit" className="btn-primary w-full" disabled={addMutation.isPending}>
                      {addMutation.isPending ? 'Saving...' : <><CheckCircle size={16} /> Register Enquiry</>}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* UPDATE STATUS MODAL */}
        {selectedEnquiry && (
          <div className="modal-overlay" onClick={() => setSelectedEnquiry(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="modal-container glass-card"
              style={{ maxWidth: '480px', width: '95%' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="card-title">Update Enquiry</h3>
                <button className="btn-icon" onClick={() => setSelectedEnquiry(null)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedEnquiry.student_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Parent: {selectedEnquiry.parent_name} • {selectedEnquiry.phone}</div>
                </div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Pipeline Stage</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {STAGES.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedEnquiry({ ...selectedEnquiry, status: s })}
                          className={`filter-btn ${selectedEnquiry.status === s ? 'active' : ''}`}
                          style={{ fontSize: '0.8rem' }}
                        >
                          {STAGE_ICONS[s]} {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Follow-up Date</label>
                    <input type="date" className="form-control"
                      value={selectedEnquiry.follow_up_date ? selectedEnquiry.follow_up_date.split('T')[0] : ''}
                      onChange={e => setSelectedEnquiry({ ...selectedEnquiry, follow_up_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea className="form-control" rows={3}
                      value={selectedEnquiry.notes || ''}
                      onChange={e => setSelectedEnquiry({ ...selectedEnquiry, notes: e.target.value })}
                    />
                  </div>
                  {selectedEnquiry.status === 'Lost' && (
                    <div className="form-group">
                      <label>Reason Lost</label>
                      <select className="form-control" value={selectedEnquiry.lost_reason || ''}
                        onChange={e => setSelectedEnquiry({ ...selectedEnquiry, lost_reason: e.target.value })}
                      >
                        <option value="">Select reason...</option>
                        <option>Fees too high</option>
                        <option>Distance / location</option>
                        <option>Chose another school</option>
                        <option>No follow-up done</option>
                        <option>Other</option>
                      </select>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="btn-glass w-full" onClick={() => setSelectedEnquiry(null)}>Cancel</button>
                  <button className="btn-primary w-full"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({
                      id: selectedEnquiry.id,
                      status: selectedEnquiry.status,
                      followUpDate: selectedEnquiry.follow_up_date || null,
                      notes: selectedEnquiry.notes,
                      lostReason: selectedEnquiry.lost_reason,
                    })}
                  >
                    {updateMutation.isPending ? 'Saving...' : <><ArrowRight size={16} /> Save Changes</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Enquiries
