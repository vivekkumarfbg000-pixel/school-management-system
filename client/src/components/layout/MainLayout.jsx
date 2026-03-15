import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import AIChatBubble from '../ai/AIChatBubble';

const MainLayout = ({ user, handleLogout }) => {
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/' },
    { id: 'students', icon: '🎓', label: 'Students', path: '/students' },
    { id: 'attendance', icon: '✅', label: 'Attendance', path: '/attendance' },
    { id: 'finance', icon: '💰', label: 'Finance', path: '/finance' },
    { id: 'academics', icon: '📚', label: 'Academics', path: '/academics' },
    { id: 'communication', icon: '📢', label: 'Broadcast', path: '/communication' },
    { id: 'staff', icon: '👨‍🏫', label: 'Staff', path: '/staff' },
    { id: 'timetable', icon: '🗓️', label: 'Timetable', path: '/timetable' },
    { id: 'transport', icon: '🚌', label: 'Transport', path: '/transport' },
    { id: 'library', icon: '📖', label: 'Library', path: '/library' },
    { id: 'reports', icon: '📈', label: 'Reports', path: '/reports' },
    { id: 'settings', icon: '⚙️', label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="app-layout">
      {/* MOBILE TOP BAR */}
      <div className="mobile-top-bar">
        <div className="brand-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>🎓</div>
        <div className="brand-text" style={{ fontSize: '1.1rem', fontWeight: 800 }}>EduStream</div>
        <div className="user-avatar" onClick={handleLogout} style={{ width: '32px', height: '32px', marginLeft: 'auto', fontSize: '0.7rem', cursor: 'pointer' }}>
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
            <NavLink 
              key={item.id} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav">
        <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <span className="mobile-nav-icon">📊</span>
          <span>Home</span>
        </NavLink>
        <NavLink to="/students" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <span className="mobile-nav-icon">🎓</span>
          <span>Students</span>
        </NavLink>
        <NavLink to="/attendance" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <span className="mobile-nav-icon">✅</span>
          <span>Attnd.</span>
        </NavLink>
        <NavLink to="/finance" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <span className="mobile-nav-icon">💰</span>
          <span>Fees</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <span className="mobile-nav-icon">⚙️</span>
          <span>Menu</span>
        </NavLink>
      </nav>
      
      <AIChatBubble />
    </div>
  );
};

export default MainLayout;
