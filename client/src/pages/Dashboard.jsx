import React from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'
import { 
  Users, 
  BarChart3, 
  Wallet, 
  UserSquare,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Loader2,
  Sparkles,
  Megaphone,
  CheckCircle,
  Calendar,
  Command,
  ArrowRight
} from 'lucide-react'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { data } = await axios.get('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return data
    }
  })

  // Use live data if available, otherwise fall back to empty structures
  const enrollmentData = dashData?.charts?.enrollment || []
  const attData = dashData?.charts?.attendance || []
  const feeData = dashData?.charts?.revenue || []

  const { data: pulseData, isLoading: isPulseLoading } = useQuery({
    queryKey: ['schoolPulse'],
    queryFn: async () => {
      const { data } = await axios.get('/api/ai/pulse', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return data.pulses
    },
    refetchInterval: 30000 
  })

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-v2"
    >
      <div className="dashboard-hero-v2">
        <div className="hero-main">
          <div className="hero-text">
             <motion.h1 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 }}
             >
               Welcome to Command Centre
             </motion.h1>
             <p>System status: <span className="text-success">Optimal</span> • {new Date().toDateString()}</p>
          </div>
          <div className="command-strip">
             <button className="command-btn" onClick={() => navigate('/students')}><Users size={18} /> Admit</button>
             <button className="command-btn" onClick={() => navigate('/finance')}><Wallet size={18} /> Fee</button>
             <button className="command-btn" onClick={() => navigate('/attendance')}><CheckCircle size={18} /> Attend</button>
             <button className="command-btn" onClick={() => navigate('/library')}><ArrowUpRight size={18} /> Library</button>
          </div>
        </div>
      </div>

      <div className="analytics-overview-grid">
        <div className="card analytics-card">
          <div className="card-header">
            <h3 className="card-title"><TrendingUp size={16} /> Enrollment Velocity</h3>
            {isLoading ? <span className="shimmer" style={{width: '60px', height: '20px'}}></span> : 
              <span className="badge badge-purple">Live Feed</span>
            }
          </div>
          <div style={{ width: '100%', height: 180 }}>
            {isLoading ? (
              <div className="shimmer" style={{height: '100%', borderRadius: '12px'}}></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enrollmentData}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Area type="monotone" dataKey="students" stroke="var(--primary)" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card analytics-card">
          <div className="card-header">
            <h3 className="card-title"><Activity size={16} /> Attendance Pulse</h3>
          </div>
          <div style={{ width: '100%', height: 180, display: 'flex', alignItems: 'center' }}>
            {isLoading ? (
              <div className="shimmer" style={{height: '100%', width: '100%', borderRadius: '12px'}}></div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attData}
                      cx="50%" cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {attData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                   {attData.map(d => (
                     <div key={d.name} className="legend-item">
                        <span className="dot" style={{ background: d.color }}></span>
                        <span className="lbl">{d.name} ({d.value}%)</span>
                     </div>
                   ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card school-pulse-card">
           <div className="card-header">
             <h3 className="card-title text-accent"><Sparkles size={16} /> School Pulse AI</h3>
           </div>
           <div className="pulse-insights">
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
      </div>

      <div className="command-center-grid">
        <div className="main-workspace">
           <div className="card">
              <div className="card-header">
                <h3 className="card-title">Live Operation Feed</h3>
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
                      <Bar dataKey="collected" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                      <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                 <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Revenue Target: {isLoading ? '...' : (dashData?.stats?.monthlyRevenue > 100000 ? '92%' : 'Active')}
                 </p>
              </div>
           </div>

           <div className="card ai-chat-prompt">
              <div className="ai-icon"><Sparkles size={24} /></div>
              <h4>Ask EduStream AI</h4>
              <p>Generate detailed performance reports or manage staff rosters instantly.</p>
              <button className="btn-primary w-full">Launch AI Studio</button>
           </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Dashboard
