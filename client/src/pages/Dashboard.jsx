import React from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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
  Calendar
} from 'lucide-react'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()

  const { data: dashData, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { data } = await axios.get('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return data
    }
  })

  const { data: aiInsights, isLoading: isInsightsLoading } = useQuery({
    queryKey: ['aiInsights'],
    queryFn: async () => {
      const { data } = await axios.get('/api/ai/insights')
      return data
    }
  })

  const dynamicStats = [
    { label: 'Total Students', value: dashData?.stats.totalStudents || '0', icon: <Users size={24} />, theme: 'purple' },
    { label: 'Attendance Today', value: (dashData?.stats.attendanceRate || '0') + '%', icon: <Activity size={24} />, theme: 'green' },
    { label: 'Monthly Revenue', value: '₹' + (dashData?.stats.monthlyRevenue || '0').toLocaleString('en-IN'), icon: <Wallet size={24} />, theme: 'amber' },
    { label: 'Active Staff', value: dashData?.stats.totalStaff || '0', icon: <UserSquare size={24} />, theme: 'blue' },
  ]

  return (
    <div className="fade-in">
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋</h1>
          <p>Here's what's happening at {user?.schoolName || 'your school'} today.</p>
        </div>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate('/students?add=true')}>
            <Users size={18} />
            <span>Add Student</span>
          </button>
          <button className="btn-glass" onClick={() => navigate('/finance?collect=true')}>
            <Wallet size={18} />
            <span>Collect Fee</span>
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {dynamicStats.map((stat, i) => (
          <div key={i} className={`stat-card fade-in-d${i+1}`}>
            <div className={`stat-icon ${stat.theme}`}>{stat.icon}</div>
            <div className="stat-content">
               <div className="stat-value">{isLoading ? '...' : stat.value}</div>
               <div className="stat-label">{stat.label}</div>
            </div>
            <div className="stat-trend-indicator">
               <TrendingUp size={12} />
               <span>+12%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="command-center-grid">
        <div className="main-workspace">
          {/* Quick Tasks Hub */}
          <div className="card task-hub">
            <div className="card-header">
              <h3 className="card-title"><Activity size={18} /> Daily Operations</h3>
            </div>
            <div className="task-actions-grid">
               <button className="task-action-item">
                  <div className="task-icon purple"><CheckCircle size={20} /></div>
                  <span>Attendance</span>
               </button>
               <button className="task-action-item">
                  <div className="task-icon green"><Megaphone size={20} /></div>
                  <span>Broadcast</span>
               </button>
               <button className="task-action-item">
                  <div className="task-icon amber"><Calendar size={20} /></div>
                  <span>Exams</span>
               </button>
               <button className="task-action-item">
                  <div className="task-icon blue"><BarChart3 size={20} /></div>
                  <span>Reports</span>
               </button>
            </div>
          </div>

          {/* Activity Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Student Activity</h3>
              <span className="card-action" onClick={() => navigate('/students')}>View Registry →</span>
            </div>
            <div className="table-wrapper">
              {isLoading ? (
                <div className="sync-overlay">
                  <Loader2 className="animate-spin" />
                  <span>Syncing registry...</span>
                </div>
              ) : (
                <table className="pro-table">
                  <thead><tr><th>Date</th><th>Student</th><th>Class</th><th>Status</th></tr></thead>
                  <tbody>
                    {(dashData?.recentStudents || []).map((s, i) => (
                      <tr key={s.id || i}>
                        <td>{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="font-bold">{s.name}</td>
                        <td><span className="badge badge-purple">{s.class_name}</span></td>
                        <td><span className="badge badge-success">Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-workspace">
          {/* Today's Schedule Mini-View */}
          <div className="card schedule-mini">
            <div className="card-header">
              <h3 className="card-title"><Calendar size={18} /> Today's Schedule</h3>
            </div>
            <div className="mini-schedule-list">
               <div className="schedule-item active">
                  <span className="time">09:00 AM</span>
                  <div className="details">
                     <p className="subject">Mathematics</p>
                     <p className="class">Class 10-A</p>
                  </div>
               </div>
               <div className="schedule-item">
                  <span className="time">11:00 AM</span>
                  <div className="details">
                     <p className="subject">Physics Lab</p>
                     <p className="class">Class 12-B</p>
                  </div>
               </div>
               <div className="schedule-item">
                  <span className="time">01:30 PM</span>
                  <div className="details">
                     <p className="subject">Staff Meeting</p>
                     <p className="class">Conference Hall</p>
                  </div>
               </div>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="card ai-card-pro">
            <div className="card-header">
              <h3 className="card-title"><Sparkles size={18} /> AI Strategy Hub</h3>
            </div>
            <div className="ai-insights-list">
              {isInsightsLoading ? (
                <div className="shimmer-list">
                  <div className="shimmer-item"></div>
                  <div className="shimmer-item"></div>
                </div>
              ) : aiInsights?.insights?.slice(0, 3).map((insight, i) => (
                <div key={i} className={`insight-card insight-${insight.type}`}>
                  <p>{insight.text}</p>
                </div>
              ))}
            </div>
            <button className="btn-glass-full" style={{marginTop: '1rem'}}>
              Generate New Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
