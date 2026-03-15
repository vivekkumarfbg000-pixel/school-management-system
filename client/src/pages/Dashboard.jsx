import React from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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

  const dynamicStats = [
    { label: 'Total Students', value: dashData?.stats.totalStudents || '0', icon: '🎓', theme: 'purple' },
    { label: 'Attendance Today', value: (dashData?.stats.attendanceRate || '0') + '%', icon: '📊', theme: 'green' },
    { label: 'Monthly Revenue', value: '₹' + (dashData?.stats.monthlyRevenue || '0').toLocaleString('en-IN'), icon: '💰', theme: 'amber' },
    { label: 'Active Staff', value: dashData?.stats.totalStaff || '0', icon: '👨‍🏫', theme: 'blue' },
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
          <div key={i} className="stat-card fade-in-d1">
            <div className="stat-header">
              <div className={`stat-icon ${stat.theme}`}>{stat.icon}</div>
            </div>
            <div className="stat-value">{isLoading ? '...' : stat.value}</div>
            <div className="stat-label">{stat.label}</div>
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
          <div className="card-header"><h3 className="card-title">Quick Actions</h3></div>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => navigate('/students')}>➕ Admission</button>
            <button className="quick-action-btn" onClick={() => navigate('/attendance')}>✅ Attendance</button>
            <button className="quick-action-btn" onClick={() => navigate('/finance')}>💰 Collect Fee</button>
            <button className="quick-action-btn" onClick={() => navigate('/communication')}>📢 Broadcast</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
