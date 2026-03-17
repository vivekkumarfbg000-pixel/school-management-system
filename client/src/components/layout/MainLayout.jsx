import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CheckCircle, 
  Wallet, 
  BookOpen, 
  Megaphone, 
  UserSquare, 
  Calendar, 
  Bus, 
  Library, 
  BarChart3, 
  Settings,
  LogOut,
  Bell,
  Search,
  Sparkles
} from 'lucide-react';
import AIChatBubble from '../ai/AIChatBubble';

const MainLayout = ({ user, handleLogout }) => {
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { id: 'students', icon: <Users size={20} />, label: 'Students', path: '/students' },
    { id: 'attendance', icon: <CheckCircle size={20} />, label: 'Attendance', path: '/attendance' },
    { id: 'finance', icon: <Wallet size={20} />, label: 'Finance', path: '/finance' },
    { id: 'academics', icon: <BookOpen size={20} />, label: 'Academics', path: '/academics' },
    { id: 'communication', icon: <Megaphone size={20} />, label: 'Broadcast', path: '/communication' },
    { id: 'staff', icon: <UserSquare size={20} />, label: 'Staff', path: '/staff' },
    { id: 'timetable', icon: <Calendar size={20} />, label: 'Timetable', path: '/timetable' },
    { id: 'transport', icon: <Bus size={20} />, label: 'Transport', path: '/transport' },
    { id: 'library', icon: <Library size={20} />, label: 'Library', path: '/library' },
    { id: 'reports', icon: <BarChart3 size={20} />, label: 'Reports', path: '/reports' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="app-layout">
      {/* MOBILE TOP BAR */}
      <div className="mobile-top-bar">
        <div className="brand-logo-small">
          <Sparkles className="logo-sparkle" size={20} />
        </div>
        <div className="brand-text">EduStream</div>
        <button className="mobile-user-btn" onClick={handleLogout}>
          {user?.name ? user.name.split(' ').map(n=>n[0]).join('') : 'AD'}
        </button>
      </div>

      <aside className="sidebar-container">
        <div className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <Sparkles size={24} color="white" />
            </div>
            <div className="brand-info">
              <div className="brand-text">EduStream</div>
              <div className="brand-subtitle">SaaS Edition</div>
            </div>
          </div>

          <div className="sidebar-scroll">
            <nav className="nav-section">
              <div className="nav-section-label">Main Menu</div>
              {navItems.map(item => (
                <NavLink 
                  key={item.id} 
                  to={item.path} 
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
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
