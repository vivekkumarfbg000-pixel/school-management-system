import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Home, LogOut, BookOpen, Calendar, ShieldCheck, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

const PortalLayout = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const navItems = [
        { path: '/portal', label: 'My Dashboard', icon: Home },
        { path: '/portal/academics', label: 'Academics', icon: BookOpen },
        { path: '/portal/timetable', label: 'Timetable', icon: Calendar },
    ]

    return (
        <div className="layout-wrapper">
            <motion.aside 
                className="sidebar"
                initial={{ x: -280 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div className="brand-icon" style={{ 
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', 
                        width: 36, height: 36, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold'
                    }}>E</div>
                    <div>
                        <div className="brand-text" style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>EduStream</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Student Portal</div>
                    </div>
                </div>

                <div style={{ padding: '1.5rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user?.name || 'Student View'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {user?.username}</div>
                        </div>
                    </div>

                    <nav className="nav-menu">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'hsla(170, 75%, 40%, 0.1)', border: '1px solid hsla(170, 75%, 40%, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                        <ShieldCheck size={20} style={{ color: 'var(--accent)', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Secure Session</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Zero-knowledge architecture.</div>
                    </div>
                    <button className="nav-item" onClick={logout} style={{ width: '100%', color: 'var(--danger)' }}>
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </motion.aside>
            
            <main className="main-content" style={{ padding: '2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                   <Outlet />
                </div>
            </main>
        </div>
    )
}

export default PortalLayout
