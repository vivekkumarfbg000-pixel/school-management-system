import React from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { motion } from 'framer-motion'
import { User, Wallet, CheckCircle, Calendar, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const StudentPortal = () => {
  const { token } = useAuth()

  const { data: portalData, isLoading, error } = useQuery({
    queryKey: ['portal-me'],
    queryFn: async () => {
      const { data } = await axios.get('/api/portal/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return data
    }
  })

  // Framer Motion variants
  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVars = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }

  if (isLoading) return <div style={{ padding: '4rem', textAlign: 'center' }}><div className="shimmer" style={{ width: '100%', height: '300px', borderRadius: '12px' }}></div></div>
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>Failed to load profile. Please contact administration.</div>

  const { profile, attendance, fees, timetable } = portalData || {}

  // Calculate stats
  const presentDays = attendance?.filter(a => a.status === 'PRESENT').length || 0
  const totalDays = attendance?.length || 1
  const attendanceRate = Math.round((presentDays / totalDays) * 100)

  const pendingFees = fees?.filter(f => f.status === 'Pending').reduce((acc, f) => acc + (f.amount - (f.paid_amount||0)), 0) || 0

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="fade-in">
      <motion.div variants={itemVars} className="card-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>Welcome, {profile?.name}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Class {profile?.class_name}-{profile?.section} | ID: {profile?.admission_no}</p>
      </motion.div>

      <motion.div variants={itemVars} className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div className="stat-value">{attendanceRate}%</div>
          <div className="stat-label">Attendance Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Wallet size={24} /></div>
          <div className="stat-value">₹{pendingFees.toLocaleString()}</div>
          <div className="stat-label">Pending Dues</div>
        </div>
      </motion.div>

      <motion.div variants={itemVars} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Fees Overview */}
        <div className="card glass-card">
          <div className="card-header"><h3 className="card-title">Pending Invoices</h3></div>
          <div style={{ padding: '1rem' }}>
            {fees?.filter(f => f.status === 'Pending').length === 0 ? (
               <div style={{ textAlign: 'center', color: 'var(--success)' }}><CheckCircle size={24} style={{ margin: '0 auto 0.5rem' }}/> You are all caught up!</div>
            ) : (
                fees?.filter(f => f.status === 'Pending').map(f => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', borderLeft: '3px solid var(--danger)' }}>
                     <div>
                       <div style={{ fontWeight: 'bold' }}>{f.fee_type}</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Due: {new Date(f.due_date).toLocaleDateString()}</div>
                     </div>
                     <div style={{ fontWeight: 'bold' }}>₹{f.amount}</div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Timetable Overview */}
        <div className="card glass-card">
          <div className="card-header"><h3 className="card-title">My Schedule</h3></div>
          <div style={{ padding: '1rem' }}>
             {timetable?.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Schedule not yet published.</div>
             ) : (
                timetable?.slice(0, 5).map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>{t.period}</div>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: 'bold' }}>{t.subject}</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.staff?.name} | {t.room}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.start_time}</div>
                  </div>
                ))
             )}
          </div>
        </div>

      </motion.div>
    </motion.div>
  )
}

export default StudentPortal
