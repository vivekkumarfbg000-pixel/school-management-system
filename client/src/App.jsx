import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import MainLayout from './components/layout/MainLayout'
import PortalLayout from './components/layout/PortalLayout'
import StudentPortal from './pages/StudentPortal'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Attendance from './pages/Attendance'
import Finance from './pages/Finance'
import Academics from './pages/Academics'
import Communication from './pages/Communication'
import Staff from './pages/Staff'
import Payroll from './pages/Payroll'
import Timetable from './pages/Timetable'
import Transport from './pages/Transport'

import Reports from './pages/Reports'
import Settings from './pages/Settings'
import AIStudio from './pages/AIStudio'
import Enquiries from './pages/Enquiries'
import Expenses from './pages/Expenses'
import Login from './pages/Login'
import QuickCollect from './pages/QuickCollect'
import MagicImport from './pages/MagicImport'
import ParentPortal from './pages/ParentPortal'

const App = () => {
  const { token, user, logout } = useAuth()

  useEffect(() => {
    const theme = localStorage.getItem('edustream-theme') || 'dark'
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme')
    } else {
      document.documentElement.classList.remove('light-theme')
    }
  }, [])

  // Public Routes (Trust Portal)
  if (window.location.pathname.startsWith('/p/')) {
    return (
      <Routes>
        <Route path="/p/:token" element={<ParentPortal />} />
      </Routes>
    )
  }

  if (!token) return <Login />

  // Strict UI Bifurcation
  if (user?.role === 'STUDENT' || user?.role === 'PARENT') {
    return (
      <Routes>
        <Route element={<PortalLayout />}>
          <Route path="/portal" element={<StudentPortal />} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Route>
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<MainLayout user={user} handleLogout={logout} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai-studio" element={<AIStudio />} />
        <Route path="/students" element={<Students />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/academics" element={<Academics />} />
        <Route path="/communication" element={<Communication />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/transport" element={<Transport />} />

        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        {/* Phase 1 — New Pages */}
        <Route path="/enquiries" element={<Enquiries />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/magic-import" element={<MagicImport />} />
        <Route path="/quick-collect" element={<QuickCollect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
