import React from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'
import { 
  Users, Wallet, ArrowUpRight, TrendingUp, Activity,
  Loader2, Sparkles, CheckCircle, ArrowRight
} from 'lucide-react'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { data } = await axios.get('/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return data
    }
  })

  const enrollmentData = dashData?.charts?.enrollment || []
  const attData = dashData?.charts?.attendance || []
  const feeData = dashData?.charts?.revenue || []

  const { data: pulseData, isLoading: isPulseLoading } = useQuery({
    queryKey: ['schoolPulse'],
    queryFn: async () => {
      const { data } = await axios.get('/ai/pulse', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return data.pulses
    },
    refetchInterval: 30000 
  })

  const { data: predictionsData, isLoading: isPredictionsLoading } = useQuery({
    queryKey: ['aiPredictions'],
    queryFn: async () => {
      const { data } = await axios.get('/ai/predictions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return data.predictions || []
    },
    refetchInterval: 300000 // 5 mins
  })

  // Framer Motion variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      variants={containerVars} initial="hidden" animate="show"
      className="dashboard-v3"
    >
      <motion.div variants={itemVars} className="dashboard-hero" style={{ padding: 0, background: 'transparent', border: 'none', marginBottom: '2.5rem' }}>
        <div className="hero-content">
           <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'}, {user?.name?.split(' ')[0] || 'Admin'}</h1>
           <p style={{ color: 'var(--text-muted)' }}>Here is what's happening at EduStream today.</p>
        </div>
        <div className="hero-actions" style={{ display: 'flex', gap: '0.75rem' }}>
           <button className="btn-glass" onClick={() => navigate('/students')}><Users size={16} /> Admit Student</button>
           <button className="btn-primary" onClick={() => navigate('/finance')}><Wallet size={16} /> Collect Fees</button>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <motion.div variants={itemVars} className="stats-grid">
         <div className="stat-card">
            <div className="stat-icon purple"><Users size={24} /></div>
            <div className="stat-value">{isLoading ? '...' : (dashData?.stats?.totalStudents || 842)}</div>
            <div className="stat-label">Total Enrollment</div>
            <div className="stat-trend-indicator">+12 this month</div>
         </div>
         <div className="stat-card">
            <div className="stat-icon green"><CheckCircle size={24} /></div>
            <div className="stat-value">{isLoading ? '...' : (dashData?.stats?.attendanceToday || '94%')}</div>
            <div className="stat-label">Today's Attendance</div>
            <div className="stat-trend-indicator" style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--warning)' }}>-2% vs yesterday</div>
         </div>
         <div className="stat-card">
            <div className="stat-icon amber"><Wallet size={24} /></div>
            <div className="stat-value">{isLoading ? '...' : `₹${(dashData?.stats?.monthlyRevenue || 425000).toLocaleString()}`}</div>
            <div className="stat-label">Monthly Revenue</div>
            <div className="stat-trend-indicator">+18% YoY</div>
         </div>
         <div className="stat-card">
            <div className="stat-icon blue"><Activity size={24} /></div>
            <div className="stat-value">{isLoading ? '...' : (dashData?.stats?.activestaff || 45)}</div>
            <div className="stat-label">Active Staff</div>
            <div className="stat-trend-indicator" style={{ background: 'rgba(142,142,142,0.1)', color: 'var(--text-secondary)' }}>Stable</div>
         </div>
      </motion.div>

      <motion.div variants={itemVars} className="analytics-overview-grid" style={{ marginBottom: '2rem' }}>
        {/* Enrollment Chart */}
        <div className="card analytics-card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h3 className="card-title"><TrendingUp size={16} className="text-primary" style={{ marginRight: '8px' }}/> Enrollment Velocity</h3>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            {isLoading ? (
              <div className="shimmer" style={{height: '100%', borderRadius: '12px'}}></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enrollmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ background: 'hsla(222, 47%, 18%, 0.9)', border: '1px solid var(--glass-border-bright)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Area type="monotone" dataKey="students" stroke="var(--primary)" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pulse AI */}
        <div className="card school-pulse-card" style={{ display: 'flex', flexDirection: 'column' }}>
           <div className="card-header" style={{ marginBottom: '1rem' }}>
             <h3 className="card-title text-accent"><Sparkles size={16} style={{ marginRight: '8px' }}/> School Pulse AI</h3>
           </div>
           <div className="pulse-insights" style={{ flex: 1, overflowY: 'auto' }}>
              <AnimatePresence mode='popLayout'>
                {isPulseLoading ? (
                  <div className="pulse-item shimmer-pulse">
                     <Loader2 className="animate-spin" size={14} />
                     <p>Analyzing system health...</p>
                  </div>
                ) : (pulseData || []).map((pulse, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.1 }}
                    className="pulse-item"
                  >
                     <div className={`pulse-indicator ${pulse.type}`}></div>
                     <p>{pulse.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>
      </motion.div>

      {/* Predictive Risk Radar (Groq ML) */}
      <motion.div variants={itemVars} className="card ai-radar-card" style={{ marginBottom: '2rem', background: 'linear-gradient(145deg, hsla(238, 81%, 20%, 0.1), hsla(170, 75%, 20%, 0.05))', border: '1px solid var(--primary-glow)' }}>
        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Activity size={20} className="text-primary" /> AI Predictive Risk Radar
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Real-time machine learning forecasts based on deep aggregate telemetry</p>
        </div>
        <div className="radar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {isPredictionsLoading ? (
             [1,2,3].map(i => <div key={i} className="shimmer" style={{ height: '180px', borderRadius: 'var(--radius-md)' }}></div>)
          ) : (predictionsData || []).length === 0 ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>AI Engine is gathering telemetry...</div>
          ) : (predictionsData || []).map((pred, i) => (
             <div key={i} className="radar-item" style={{ 
                 padding: '1.25rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', 
                 borderTop: `3px solid var(--${pred.severity === 'critical' ? 'danger' : pred.severity === 'success' ? 'success' : pred.severity === 'warning' ? 'warning' : 'primary'})` 
             }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>{pred.category}</div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{pred.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>{pred.description}</p>
                <div style={{ padding: '0.6rem 0.8rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)' }}>
                   <ArrowRight size={14} className="text-primary" /> {pred.action}
                </div>
             </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVars} className="command-center-grid">
        <div className="main-workspace">
           <div className="card">
              <div className="card-header">
                <h3 className="card-title">Live Operation Feed</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer' }}>View All</span>
              </div>
              <div className="activity-feed">
                 {isLoading ? (
                    [1,2,3].map(i => <div key={i} className="shimmer" style={{height: '60px', marginBottom: '10px', borderRadius: '8px'}}></div>)
                 ) : (dashData?.activity || []).length === 0 ? (
                    <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>No recent activity found.</div>
                 ) : (dashData?.activity || []).map((act, i) => (
                    <div key={i} className="feed-item">
                       <div className="feed-icon"><Users size={16} /></div>
                       <div className="feed-info">
                          <h4>{act.title}</h4>
                          <p>{act.desc} • {new Date(act.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                       </div>
                       <ArrowRight size={14} className="feed-arrow" />
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="sidebar-workspace">
           <div className="card glass-card">
              <div className="card-header">
                <h3 className="card-title">Collection Momentum</h3>
              </div>
              <div style={{ width: '100%', height: 200 }}>
                {isLoading ? (
                  <div className="shimmer" style={{height: '100%', borderRadius: '12px'}}></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feeData}>
                      <Bar dataKey="collected" fill="var(--accent)" radius={[4, 4, 0, 0]}>
                        {feeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === feeData.length - 1 ? 'var(--primary)' : 'var(--glass-border-bright)'} />
                        ))}
                      </Bar>
                      <Tooltip 
                        cursor={{fill: 'hsla(0,0%,100%,0.05)'}}
                        contentStyle={{ background: 'hsla(222, 47%, 18%, 0.9)', border: '1px solid var(--glass-border-bright)', borderRadius: '12px' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
           </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard
