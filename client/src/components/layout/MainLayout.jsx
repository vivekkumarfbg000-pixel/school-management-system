import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Users, 
  CheckCircle, 
  Wallet, 
  Banknote,
  BookOpen, 
  Megaphone, 
  SquareUser, 
  Calendar, 
  Bus, 
  Library, 
  ChartBarBig, 
  Settings,
  LogOut,
  Bell,
  Search,
  Sparkles,
  UserSearch,
  IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatBubble from '../ai/AIChatBubble';

const MainLayout = ({ user, handleLogout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState({ students: [], staff: [], books: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const { data } = await axios.get(`/api/search?q=${searchQuery}`);
          setResults(data);
          setShowResults(true);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults({ students: [], staff: [], books: [] });
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { id: 'ai-studio', icon: <Sparkles size={20} />, label: 'AI Studio', path: '/ai-studio' },
    { id: 'students', icon: <Users size={20} />, label: 'Students', path: '/students' },
    { id: 'attendance', icon: <CheckCircle size={20} />, label: 'Attendance', path: '/attendance' },
    { id: 'finance', icon: <Wallet size={20} />, label: 'Finance', path: '/finance' },
    { id: 'academics', icon: <BookOpen size={20} />, label: 'Academics', path: '/academics' },
    { id: 'communication', icon: <Megaphone size={20} />, label: 'Broadcast', path: '/communication' },
    { id: 'staff', icon: <SquareUser size={20} />, label: 'Staff', path: '/staff' },
    { id: 'payroll', icon: <Banknote size={20} />, label: 'Payroll', path: '/payroll' },
    { id: 'timetable', icon: <Calendar size={20} />, label: 'Timetable', path: '/timetable' },
    { id: 'transport', icon: <Bus size={20} />, label: 'Transport', path: '/transport' },

    { id: 'reports', icon: <ChartBarBig size={20} />, label: 'Reports', path: '/reports' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  ];

  const growthNavItems = [
    { id: 'enquiries', icon: <UserSearch size={20} />, label: 'Enquiries', path: '/enquiries' },
    { id: 'expenses', icon: <IndianRupee size={20} />, label: 'Expenses & P&L', path: '/expenses' },
    { id: 'magic-import', icon: <Sparkles size={20} />, label: 'Magic Import', path: '/magic-import' },
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

            <nav className="nav-section" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <div className="nav-section-label" style={{ color: 'var(--accent)' }}>Growth Tools ✨</div>
              {growthNavItems.map(item => (
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
        <header className="omnisearch-wrapper">
          <div className="omnisearch-container">
            <div className="omnisearch-bar">
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search students, staff, or books..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                onFocus={() => setShowResults(true)}
              />
            </div>

            <AnimatePresence>
              {showResults && searchQuery.length >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="omnisearch-results"
                >
                  {isSearching ? (
                    <div style={{padding: '2rem', textAlign: 'center'}}><Sparkles className="animate-spin" /></div>
                  ) : (
                    <>
                      {results.students.length > 0 && (
                        <div className="search-section">
                          <div className="search-section-label">Students</div>
                          {results.students.map(s => (
                            <div key={s.id} className="search-result-item" onClick={() => navigate('/students')}>
                              <div className="feed-icon" style={{width: '32px', height: '32px'}}><Users size={16} /></div>
                              <div className="search-result-info">
                                <h4>{s.name}</h4>
                                <p>{s.class_name}-{s.section} • {s.admission_no}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {results.staff.length > 0 && (
                        <div className="search-section">
                          <div className="search-section-label">Staff</div>
                          {results.staff.map(s => (
                            <div key={s.id} className="search-result-item" onClick={() => navigate('/staff')}>
                              <div className="feed-icon" style={{width: '32px', height: '32px'}}><UserSquare size={16} /></div>
                              <div className="search-result-info">
                                <h4>{s.name}</h4>
                                <p>{s.designation} • {s.staff_id}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!results.students.length && !results.staff.length && (
                        <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>No results found for "{searchQuery}"</div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="header-user-section">
            <div className="notification-bell">
              <Bell size={20} />
              <div className="bell-dot" />
            </div>
            <div className="btn-glass" style={{display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)'}}>
               <div style={{width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900}}>
                  {user?.name?.[0] || 'A'}
               </div>
               <span style={{fontSize: '0.9rem', fontWeight: 700}}>{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        <div style={{padding: '2.5rem', minHeight: 'calc(100vh - 85px)', overflowY: 'auto'}}>
          <AnimatePresence mode="wait">
             <motion.div
               key={window.location.pathname}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3, ease: 'easeInOut' }}
             >
               <Outlet />
             </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav glass-nav">
        <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard className="mobile-nav-icon" size={22} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/students" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Users className="mobile-nav-icon" size={22} />
          <span>Students</span>
        </NavLink>
        <NavLink to="/attendance" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <CheckCircle className="mobile-nav-icon" size={22} />
          <span>Attnd.</span>
        </NavLink>
        <NavLink to="/quick-collect" className={({ isActive }) => `mobile-nav-item collect-nav-item ${isActive ? 'active' : ''}`}>
          <div className="collect-btn-wrapper">
             <Wallet size={24} color="white" />
          </div>
          <span>Collect</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Settings className="mobile-nav-icon" size={22} />
          <span>Menu</span>
        </NavLink>
      </nav>
      
      <AIChatBubble />
    </div>
  );
};

export default MainLayout;
