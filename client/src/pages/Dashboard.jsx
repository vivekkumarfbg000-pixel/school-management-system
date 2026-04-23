import React from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'
import { 
  Users, Wallet, ArrowUpRight, TrendingUp, Activity,
  Loader2, Sparkles, CheckCircle, ArrowRight, Clock, TriangleAlert,
  BookOpen, Calendar, Plus, FileText, UserPlus, CreditCard,
  ClipboardCheck, ChartBarBig, Library, Bell, RefreshCw
} from 'lucide-react'

// Chart Colors 
const ATTENDANCE_COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()

  const { data: dashData, isLoading, error: dashError, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { data } = await axios.get('dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return data
    },
    retry: 2,
    staleTime: 30000,
  })

  const enrollmentData = dashData?.charts?.enrollment || []
  const attData = dashData?.charts?.attendance || []
  const feeData = dashData?.charts?.revenue || []
  const todayEvents = dashData?.todayEvents || []
  const pendingTasks = dashData?.pendingTasks || { unpaidFees: 0, overdueBooks: 0, total: 0 }

  const { data: pulseData, isLoading: isPulseLoading } = useQuery({
    queryKey: ['schoolPulse'],
    queryFn: async () => {
      const { data } = await axios.get('ai/pulse', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return data.pulses
    },
    refetchInterval: 30000,
    retry: 1,
  })

  const { data: predictionsData, isLoading: isPredictionsLoading } = useQuery({
    queryKey: ['aiPredictions'],
    queryFn: async () => {
      const { data } = await axios.get('ai/predictions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return data.predictions || []
    },
    refetchInterval: 300000,
    retry: 1,
  })

  // Determine if this is a new/empty school
  const isNewSchool = !isLoading && dashData && 
    dashData.stats?.totalStudents === 0 && 
    dashData.stats?.totalStaff === 0;

  // Framer Motion variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  const handleEmergencyAlert = async () => {
    const msg = window.prompt("🚨 EMERGENCY ALERT\n\nEnter the message to send to ALL parents and staff:");
    if (!msg) return;

    if (!window.confirm("Are you sure? This will send a WhatsApp message to every parent and staff member instantly.")) return;

    const toastId = toast.loading("Broadcasting emergency alert...");
    try {
      await axios.post('/api/broadcast/emergency', { message: msg }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Emergency alert broadcasted successfully! 🚨", { id: toastId });
    } catch (err) {
      toast.error("Failed to send broadcast.", { id: toastId });
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Quick Action items
  const quickActions = [
    { icon: <UserPlus size={20} />, label: 'Admit Student', path: '/students', color: 'purple' },
    { icon: <CreditCard size={20} />, label: 'Collect Fees', path: '/finance', color: 'green' },
    { icon: <ClipboardCheck size={20} />, label: 'Mark Attendance', path: '/attendance', color: 'amber' },
    { icon: <FileText size={20} />, label: 'Generate Report', path: '/reports', color: 'blue' },
  ]

  // ── Error State ──
  if (dashError) {
    return (
      <div className="dashboard-v3" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="card glass-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px' }}>
          <AlertTriangle size={48} className="text-danger" style={{ marginBottom: '1rem', color: 'var(--danger)' }} />
          <h2>Dashboard Offline</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            We couldn't load your school's analytics. This might be due to a network connectivity error or a temporary server timeout.
          </p>
          <button onClick={() => refetch()} className="login-btn" style={{ width: 'auto', display: 'inline-flex', gap: '8px', padding: '0.75rem 1.5rem', margin: '0 auto' }}>
            <RefreshCw size={18} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // ── Onboarding Empty State ──
  if (isNewSchool) {
    return (
      <motion.div variants={containerVars} initial="hidden" animate="show" className="dashboard-v3">
        <motion.div variants={itemVars} className="dashboard-hero-section">
          <div className="hero-content">
            <h1>Welcome to EduStream, {user?.name?.split(' ')[0] || 'Admin'} 🎉</h1>
            <p className="hero-subtitle">Let's set up your school. Complete these steps to get started.</p>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="onboarding-grid">
          <div className="onboard-card" onClick={() => navigate('/students')}>
            <div className="onboard-icon purple"><UserPlus size={28} /></div>
            <h3>Add Your First Students</h3>
            <p>Import or manually add student records to get started with attendance, fees, and academics.</p>
            <span className="onboard-cta">Get Started <ArrowRight size={14} /></span>
          </div>
          <div className="onboard-card" onClick={() => navigate('/staff')}>
            <div className="onboard-icon green"><Users size={28} /></div>
            <h3>Register Teaching Staff</h3>
            <p>Add teachers and staff to enable timetable generation, payroll, and communication.</p>
            <span className="onboard-cta">Add Staff <ArrowRight size={14} /></span>
          </div>
          <div className="onboard-card" onClick={() => navigate('/academics')}>
            <div className="onboard-icon amber"><BookOpen size={28} /></div>
            <h3>Set Up Class Structure</h3>
            <p>Define your classes, sections, and subjects to organize your entire academic framework.</p>
            <span className="onboard-cta">Configure <ArrowRight size={14} /></span>
          </div>
          <div className="onboard-card" onClick={() => navigate('/finance')}>
            <div className="onboard-icon blue"><Wallet size={28} /></div>
            <h3>Configure Fee Structure</h3>
            <p>Set up fee types, payment plans, and start collecting fees with integrated payments.</p>
            <span className="onboard-cta">Set Up Fees <ArrowRight size={14} /></span>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      variants={containerVars} initial="hidden" animate="show"
      className="dashboard-v3"
    >
      {/* ── Hero Section ── */}
      <motion.div variants={itemVars} className="dashboard-hero-section">
        <div className="hero-content">
          <h1>{getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}</h1>
          <p className="hero-subtitle">
            Here's what's happening at <strong>{user?.school || 'EduStream'}</strong> today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="hero-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user?.role === 'PRINCIPAL' && (
            <button 
              className="btn-glass" 
              style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}
              onClick={handleEmergencyAlert}
            >
              <AlertTriangle size={18} /> Emergency Panic
            </button>
          )}
          {pendingTasks.total > 0 && (
            <div className="hero-alert">
              <AlertTriangle size={16} />
              <span>{pendingTasks.total} task{pendingTasks.total > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div variants={itemVars} className="quick-actions-bar">
        {quickActions.map((action, i) => (
          <button 
            key={i} 
            className={`quick-action-btn ${action.color}`}
            onClick={() => navigate(action.path)}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </motion.div>

      {/* ── KPI Stats Grid ── */}
      <motion.div variants={itemVars} className="stats-grid">
        <div className="stat-card premium-card glow-indigo">
          <div className="card-icon-floating"><Users size={80} /></div>
          <div className="stat-icon purple"><Users size={24} /></div>
          <div className="stat-value">{isLoading ? <span className="stat-skeleton" /> : dashData?.stats?.totalStudents || 0}</div>
          <div className="stat-label">Total Enrollment</div>
          <div className="stat-trend-indicator">
            <ArrowUpRight size={12} /> Active students
          </div>
        </div>
        <div className="stat-card premium-card glow-emerald">
          <div className="card-icon-floating"><CheckCircle size={80} /></div>
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div className="stat-value">{isLoading ? <span className="stat-skeleton" /> : `${dashData?.stats?.attendanceRate ?? 0}%`}</div>
          <div className="stat-label">Today's Attendance</div>
          <div className="stat-trend-indicator" style={ (dashData?.stats?.attendanceRate ?? 0) < 90 ? { background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' } : {}}>
            {(dashData?.stats?.attendanceRate ?? 0) < 90 ? 'Below threshold' : 'Healthy'}
          </div>
        </div>
        <div className="stat-card premium-card glow-amber">
          <div className="card-icon-floating"><Wallet size={80} /></div>
          <div className="stat-icon amber"><Wallet size={24} /></div>
          <div className="stat-value">{isLoading ? <span className="stat-skeleton" /> : `₹${(dashData?.stats?.monthlyRevenue || 0).toLocaleString('en-IN')}`}</div>
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-trend-indicator">
            {pendingTasks.unpaidFees > 0 
              ? <><AlertTriangle size={12} /> {pendingTasks.unpaidFees} pending</>
              : <><ArrowUpRight size={12} /> All collected</>
            }
          </div>
        </div>
        <div className="stat-card premium-card">
          <div className="card-icon-floating"><Activity size={80} /></div>
          <div className="stat-icon blue"><Activity size={24} /></div>
          <div className="stat-value">{isLoading ? <span className="stat-skeleton" /> : dashData?.stats?.totalStaff || 0}</div>
          <div className="stat-label">Active Staff</div>
          <div className="stat-trend-indicator" style={{ background: 'rgba(142,142,142,0.1)', color: 'var(--text-secondary)' }}>
            Operational
          </div>
        </div>
      </motion.div>

      {/* ── Charts Row: Enrollment + Attendance Donut + AI Pulse ── */}
      <motion.div variants={itemVars} className="analytics-overview-grid">
        {/* Enrollment Velocity Chart */}
        <div className="card analytics-card premium-card glow-indigo" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h3 className="card-title"><TrendingUp size={16} className="text-primary" style={{ marginRight: '8px' }}/> Enrollment Velocity</h3>
            <span className="card-badge">6 months</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            {isLoading ? (
              <div className="shimmer" style={{height: '100%', borderRadius: '12px'}}></div>
            ) : enrollmentData.length === 0 ? (
              <div className="chart-empty-state">
                <TrendingUp size={32} />
                <p>Enrollment data will appear here after adding students</p>
              </div>
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
                    contentStyle={{ background: 'hsla(222, 47%, 18%, 0.95)', border: '1px solid var(--glass-border-bright)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: 'white' }}
                    labelStyle={{ color: 'var(--text-muted)' }}
                  />
                  <Area type="monotone" dataKey="students" stroke="var(--primary)" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attendance Distribution Donut */}
        <div className="card analytics-card attendance-donut-card premium-card glow-emerald">
          <div className="card-header">
            <h3 className="card-title"><CheckCircle size={16} className="text-accent" style={{ marginRight: '8px' }}/> Attendance</h3>
            <span className="card-badge">Today</span>
          </div>
          {isLoading ? (
            <div className="shimmer" style={{height: '160px', borderRadius: '12px'}}></div>
          ) : attData.every(d => d.value === 0) ? (
            <div className="chart-empty-state">
              <ClipboardCheck size={32} />
              <p>No attendance marked yet today</p>
            </div>
          ) : (
            <div className="donut-container">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie 
                    data={attData} 
                    dataKey="value" 
                    innerRadius={42} 
                    outerRadius={62} 
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {attData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'hsla(222, 47%, 18%, 0.95)', border: '1px solid var(--glass-border-bright)', borderRadius: '12px' }}
                    formatter={(value) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-legend">
                {attData.map((entry, i) => (
                  <div key={i} className="legend-row">
                    <span className="legend-dot" style={{ background: ATTENDANCE_COLORS[i] }} />
                    <span className="legend-text">{entry.name}</span>
                    <span className="legend-value">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── AI Pulse + Today's Schedule Row ── */}
      <motion.div variants={itemVars} className="dashboard-dual-grid">
        {/* AI School Pulse */}
        <div className="card school-pulse-card">
          <div className="card-header">
            <h3 className="card-title text-accent"><Sparkles size={16} style={{ marginRight: '8px' }}/> School Pulse AI</h3>
            <div className="pulse-live-badge"><span className="live-dot" /> Live</div>
          </div>
          <div className="pulse-insights">
            <AnimatePresence mode='popLayout'>
              {isPulseLoading ? (
                <div className="pulse-item shimmer-pulse">
                  <Loader2 className="animate-spin" size={14} />
                  <p>Analyzing system health...</p>
                </div>
              ) : (pulseData || []).length === 0 ? (
                <div className="pulse-item">
                  <div className="pulse-indicator info"></div>
                  <p>All systems operational. No anomalies detected.</p>
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

        {/* Today's Schedule */}
        <div className="card today-schedule-card">
          <div className="card-header">
            <h3 className="card-title"><Calendar size={16} className="text-primary" style={{ marginRight: '8px' }}/> Today's Schedule</h3>
            <button className="card-link-btn" onClick={() => navigate('/timetable')}>View All</button>
          </div>
          <div className="schedule-list">
            {isLoading ? (
              [1,2,3].map(i => <div key={i} className="shimmer" style={{height: '52px', marginBottom: '8px', borderRadius: '8px'}}></div>)
            ) : todayEvents.length === 0 ? (
              <div className="chart-empty-state" style={{ padding: '1.5rem' }}>
                <Calendar size={28} />
                <p>No classes scheduled today</p>
              </div>
            ) : todayEvents.map((event, i) => (
              <div key={i} className="schedule-row">
                <div className="schedule-time">{event.time}</div>
                <div className="schedule-info">
                  <div className="schedule-subject">{event.subject}</div>
                  <div className="schedule-class">{event.class} • {event.teacher}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Predictive Risk Radar ── */}
      {!isPredictionsLoading && (predictionsData || []).length > 0 && (
        <motion.div variants={itemVars} className="card ai-radar-card">
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} className="text-primary" /> AI Predictive Risk Radar
              </h3>
              <p className="card-desc">Real-time ML forecasts based on school telemetry</p>
            </div>
          </div>
          <div className="radar-grid">
            {(predictionsData || []).map((pred, i) => (
              <div key={i} className="radar-item" style={{ 
                borderTop: `3px solid var(--${pred.severity === 'critical' ? 'danger' : pred.severity === 'success' ? 'success' : pred.severity === 'warning' ? 'warning' : 'primary'})` 
              }}>
                <div className="radar-category">{pred.category}</div>
                <h4 className="radar-title">{pred.title}</h4>
                <p className="radar-desc">{pred.description}</p>
                <div className="radar-action">
                  <ArrowRight size={14} className="text-primary" /> {pred.action}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Bottom Grid: Operation Feed + Revenue Chart ── */}
      <motion.div variants={itemVars} className="command-center-grid">
        <div className="main-workspace">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Live Operation Feed</h3>
              <button className="card-link-btn" onClick={() => navigate('/students')}>View All</button>
            </div>
            <div className="activity-feed">
              {isLoading ? (
                [1,2,3].map(i => <div key={i} className="shimmer" style={{height: '60px', marginBottom: '10px', borderRadius: '8px'}}></div>)
              ) : (dashData?.activity || []).length === 0 ? (
                <div className="chart-empty-state">
                  <Bell size={28} />
                  <p>No recent operations. Activity will appear here as you use EduStream.</p>
                </div>
              ) : (dashData?.activity || []).map((act, i) => (
                <div key={i} className="feed-item">
                  <div className="feed-icon"><UserPlus size={16} /></div>
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
              <h3 className="card-title"><BarChart3 size={16} style={{ marginRight: '8px' }}/> Fee Collection</h3>
              <span className="card-badge">4 weeks</span>
            </div>
            <div style={{ width: '100%', height: 200 }}>
              {isLoading ? (
                <div className="shimmer" style={{height: '100%', borderRadius: '12px'}}></div>
              ) : feeData.every(d => d.collected === 0) ? (
                <div className="chart-empty-state">
                  <Wallet size={28} />
                  <p>No fee collections yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={feeData}>
                    <Bar dataKey="collected" fill="var(--accent)" radius={[6, 6, 0, 0]}>
                      {feeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === feeData.length - 1 ? 'var(--primary)' : 'hsla(238, 81%, 67%, 0.35)'} />
                      ))}
                    </Bar>
                    <Tooltip 
                      cursor={{fill: 'hsla(0,0%,100%,0.05)'}}
                      contentStyle={{ background: 'hsla(222, 47%, 18%, 0.95)', border: '1px solid var(--glass-border-bright)', borderRadius: '12px' }}
                      formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Collected']}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pending Tasks Mini */}
          {pendingTasks.total > 0 && (
            <div className="card pending-tasks-card">
              <div className="card-header">
                <h3 className="card-title"><AlertTriangle size={16} style={{ marginRight: '8px', color: 'var(--warning)' }}/> Pending Tasks</h3>
              </div>
              <div className="pending-list">
                {pendingTasks.unpaidFees > 0 && (
                  <div className="pending-item" onClick={() => navigate('/finance')}>
                    <CreditCard size={16} />
                    <span>{pendingTasks.unpaidFees} unpaid fee invoice{pendingTasks.unpaidFees > 1 ? 's' : ''}</span>
                    <ArrowRight size={14} />
                  </div>
                )}
                {pendingTasks.overdueBooks > 0 && (
                  <div className="pending-item" onClick={() => navigate('/library')}>
                    <Library size={16} />
                    <span>{pendingTasks.overdueBooks} overdue book{pendingTasks.overdueBooks > 1 ? 's' : ''}</span>
                    <ArrowRight size={14} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard
