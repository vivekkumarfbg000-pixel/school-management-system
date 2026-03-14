import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Students from './pages/Students'
import Attendance from './pages/Attendance'
import Finance from './pages/Finance'
import Academics from './pages/Academics'
import Communication from './pages/Communication'
import Staff from './pages/Staff'
import Timetable from './pages/Timetable'
import Transport from './pages/Transport'
import Library from './pages/Library'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null)
  const [activeTab, setActiveTab] = useState('dashboard')

  const setAuth = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  if (!token) return <Login setAuth={setAuth} />

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'students', icon: '🎓', label: 'Students' },
    { id: 'attendance', icon: '✅', label: 'Attendance' },
    { id: 'finance', icon: '💰', label: 'Finance' },
    { id: 'academics', icon: '📚', label: 'Academics' },
    { id: 'communication', icon: '📢', label: 'Broadcast' },
    { id: 'staff', icon: '👨‍🏫', label: 'Staff' },
    { id: 'timetable', icon: '🗓️', label: 'Timetable' },
    { id: 'transport', icon: '🚌', label: 'Transport' },
    { id: 'library', icon: '📖', label: 'Library' },
    { id: 'reports', icon: '📈', label: 'Reports' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]

  const Dashboard = () => {
    const [dashData, setDashData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const fetchDash = async () => {
        try {
          const { data } = await axios.get('/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` }
          })
          setDashData(data)
        } catch (err) {
          console.error("Dash error", err)
        } finally {
          setLoading(false)
        }
      }
      fetchDash()
    }, [])

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
            <div className="user-avatar" onClick={handleLogout} style={{cursor: 'pointer'}} title="Logout">
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
              <div className="stat-value">{loading ? '...' : stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="content-grid">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Recent Activity</h3><span className="card-action" onClick={() => setActiveTab('students')}>View All →</span></div>
            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>Syncing with cloud...</div>
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
              <button className="quick-action-btn" onClick={() => setActiveTab('students')}>➕ Admission</button>
              <button className="quick-action-btn" onClick={() => setActiveTab('attendance')}>✅ Attendance</button>
              <button className="quick-action-btn" onClick={() => setActiveTab('finance')}>💰 Collect Fee</button>
              <button className="quick-action-btn" onClick={() => setActiveTab('communication')}>📢 Broadcast</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'students': return <Students />
      case 'attendance': return <Attendance />
      case 'finance': return <Finance />
      case 'academics': return <Academics />
      case 'communication': return <Communication />
      case 'staff': return <Staff />
      case 'timetable': return <Timetable />
      case 'transport': return <Transport />
      case 'library': return <Library />
      case 'reports': return <Reports />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="app-layout">
      {/* MOBILE TOP BAR */}
      <div className="mobile-top-bar">
        <div className="brand-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>🎓</div>
        <div className="brand-text" style={{ fontSize: '1.1rem', fontWeight: 800 }}>EduStream</div>
        <div className="user-avatar" onClick={handleLogout} style={{ width: '32px', height: '32px', marginLeft: 'auto', fontSize: '0.7rem' }}>
          {user?.name ? user.name.split(' ').map(n=>n[0]).join('') : 'AD'}
        </div>
      </div>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🎓</div>
          <div><div className="brand-text">EduStream</div><div className="brand-subtitle">SaaS Edition</div></div>
        </div>

        <nav className="nav-section">
          {navItems.map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </div>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        {renderPage()}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav">
        <div className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <span className="mobile-nav-icon">📊</span>
          <span>Home</span>
        </div>
        <div className={`mobile-nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
          <span className="mobile-nav-icon">🎓</span>
          <span>Students</span>
        </div>
        <div className={`mobile-nav-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
          <span className="mobile-nav-icon">✅</span>
          <span>Attnd.</span>
        </div>
        <div className={`mobile-nav-item ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
          <span className="mobile-nav-icon">💰</span>
          <span>Fees</span>
        </div>
        <div className={`mobile-nav-item ${['communication', 'staff', 'transport', 'library', 'reports', 'settings', 'academics', 'timetable'].includes(activeTab) && activeTab !== 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <span className="mobile-nav-icon">⚙️</span>
          <span>Menu</span>
        </div>
      </nav>
    </div>
  )
}

export default App
