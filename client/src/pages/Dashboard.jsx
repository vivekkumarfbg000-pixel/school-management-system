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
  Activity
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
      <div className="page-header">
        <div>
          <h1>Hello, {user?.name?.split(' ')[0] || 'Admin'} 👋</h1>
          <p className="subtitle">School Status Dashboard</p>
        </div>
        <div className="header-right">
          <div className="header-date">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            Session 2025-26
          </div>
          <div className="user-avatar" style={{cursor: 'pointer'}} title="Logout">
              {user?.name ? user.name.split(' ').map(n=>n[0]).join('') : 'AD'}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {dynamicStats.map((stat, i) => (
          <div key={i} className={`stat-card fade-in-d${i+1}`}>
            <div className={`stat-icon ${stat.theme}`}>{stat.icon}</div>
            <div className="stat-value">{isLoading ? '...' : stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-trend-indicator">
               <TrendingUp size={12} />
               <span>+12% this month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <span className="card-action" onClick={() => navigate('/students')}>View All →</span>
          </div>
          <div className="table-wrapper">
            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Syncing with cloud...</div>
            ) : isError ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>Failed to fetch data</div>
            ) : (
              <table className="table-responsive">
                <thead><tr><th>Adm. Date</th><th>Student Name</th><th>Class</th><th>ID</th></tr></thead>
                <tbody>
                  {(dashData?.recentStudents || []).map((s, i) => (
                    <tr key={s.id || i}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td><span className="badge badge-purple">{s.class_name}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{s.id.split('-')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">✨ AI Insights</h3>
          </div>
          <div className="ai-insights-list">
            {isInsightsLoading ? (
              <div className="shimmer" style={{ height: '100px', width: '100%' }}></div>
            ) : aiInsights?.insights?.map((insight, i) => (
              <div key={i} className={`event-item fade-in-d${i+1}`}>
                <div className={`badge badge-${insight.type}`}>
                  <div className="badge-dot"></div>
                </div>
                <div className="event-info">
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{insight.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
