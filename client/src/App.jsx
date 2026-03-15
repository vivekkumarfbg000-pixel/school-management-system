import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
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
  const { token, user, logout } = useAuth()

  if (!token) return <Login />

  return (
    <Routes>
      <Route element={<MainLayout user={user} handleLogout={logout} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/academics" element={<Academics />} />
        <Route path="/communication" element={<Communication />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/transport" element={<Transport />} />
        <Route path="/library" element={<Library />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
