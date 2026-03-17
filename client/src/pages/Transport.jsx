import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Bus, MapPin, User, Navigation, PlusCircle, Users, Phone, MoreHorizontal, X, Send, Activity } from 'lucide-react'

const Transport = () => {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const [showAddModal, setShowAddModal] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)

    // Form states
    const [newVehicle, setNewVehicle] = useState({ vehicle_no: '', type: 'Bus', capacity: 40, driver_name: '', driver_phone: '', route_name: '', stops: [] })
    const [assignData, setAssignData] = useState({ studentId: '', vehicleId: '' })
    const [stopInput, setStopInput] = useState('')

    const { data: vehicles = [], isLoading } = useQuery({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const { data } = await axios.get('/api/transport/vehicles', {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data
        }
    })

    const { data: students = [] } = useQuery({
        queryKey: ['students-mini'],
        queryFn: async () => {
            const { data } = await axios.get('/api/students', {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data
        }
    })

    const addMutation = useMutation({
        mutationFn: async (vehicle) => axios.post('/api/transport/add', vehicle, {
            headers: { Authorization: `Bearer ${token}` }
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] })
            toast.success('Vehicle added to fleet')
            setShowAddModal(false)
            setNewVehicle({ vehicle_no: '', type: 'Bus', capacity: 40, driver_name: '', driver_phone: '', route_name: '', stops: [] })
        },
        onError: () => toast.error('Failed to add vehicle')
    })

    const assignMutation = useMutation({
        mutationFn: async (data) => axios.post('/api/transport/assign', data, {
            headers: { Authorization: `Bearer ${token}` }
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] })
            toast.success('Student assigned successfully')
            setShowAssignModal(false)
        },
        onError: () => toast.error('Assignment failed')
    })

    const addStop = () => {
        if (stopInput.trim()) {
            setNewVehicle({...newVehicle, stops: [...newVehicle.stops, stopInput.trim()]})
            setStopInput('')
        }
    }

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>🚌 Transport Center</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="quick-action-btn" onClick={() => setShowAddModal(true)} style={{ background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white' }}>
                        <PlusCircle size={16} /> Add Vehicle
                    </button>
                    <button className="quick-action-btn" onClick={() => setShowAssignModal(true)} style={{ background: 'rgba(59,130,246,0.15)', borderColor: 'var(--info)', color: 'var(--info)' }}>
                        <Users size={16} /> Assign Student
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-value">{isLoading ? '...' : vehicles.length}</div>
                    <div className="stat-label">Total Fleet</div>
                </div>
                <div className="stat-card">
                   <div className="stat-value" style={{color: 'var(--accent)'}}>{isLoading ? '...' : new Set(vehicles.map(v => v.route_name)).size}</div>
                   <div className="stat-label">Active Routes</div>
                </div>
                <div className="stat-card">
                   <div className="stat-value" style={{color: 'var(--info)'}}>{isLoading ? '...' : vehicles.reduce((acc, v) => acc + (v.occupancy || 0), 0)}</div>
                   <div className="stat-label">Commuters</div>
                </div>
                <div className="stat-card">
                   <div className="stat-value" style={{color: 'var(--success)'}}>100%</div>
                   <div className="stat-label">Compliance</div>
                </div>
            </div>

            <div className="card glass-card">
                <div className="card-header"><h3 className="card-title"><Activity size={16} /> Fleet Management</h3></div>
                <div className="table-wrapper">
                    {isLoading ? (
                        <div className="shimmer" style={{ height: '200px', margin: '1rem' }}></div>
                    ) : vehicles.length === 0 ? (
                        <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No vehicles registered.</div>
                    ) : (
                        <table>
                            <thead><tr><th>Vehicle</th><th>Route & Personnel</th><th>Capacity</th><th>Status</th></tr></thead>
                            <tbody>
                                {vehicles.map((v) => (
                                    <tr key={v.id}>
                                        <td>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                                <div className="task-icon blue" style={{width: '32px', height: '32px'}}><Bus size={16} /></div>
                                                <div>
                                                    <div className="font-bold">{v.vehicle_no}</div>
                                                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{v.type}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-bold">{v.route_name}</div>
                                            <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{v.driver_name} • {v.driver_phone}</div>
                                        </td>
                                        <td>
                                            <div style={{fontSize: '0.85rem'}}>
                                               <span className="font-bold" style={{color: (v.occupancy || 0) >= v.capacity ? 'var(--danger)' : 'var(--accent)'}}>{v.occupancy || 0}</span>
                                               <span style={{color: 'var(--text-muted)'}}> / {v.capacity}</span>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${v.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{v.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ADD VEHICLE MODAL */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-card glass-card fade-in" style={{ width: '500px' }}>
                        <div className="card-header">
                            <h3 className="card-title">Register New Vehicle</h3>
                            <button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(newVehicle); }} style={{ padding: '1.5rem' }}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                <div className="form-group">
                                    <label>Vehicle No</label>
                                    <input className="glass-input" required value={newVehicle.vehicle_no} onChange={e => setNewVehicle({...newVehicle, vehicle_no: e.target.value})} placeholder="UP14-BT-XXXX" />
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select className="glass-select" value={newVehicle.type} onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}>
                                        <option>Bus</option><option>Van</option><option>SUV</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Driver Name</label>
                                <input className="glass-input" required value={newVehicle.driver_name} onChange={e => setNewVehicle({...newVehicle, driver_name: e.target.value})} />
                            </div>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                <div className="form-group">
                                    <label>Driver Phone</label>
                                    <input className="glass-input" required value={newVehicle.driver_phone} onChange={e => setNewVehicle({...newVehicle, driver_phone: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Capacity</label>
                                    <input type="number" className="glass-input" required value={newVehicle.capacity} onChange={e => setNewVehicle({...newVehicle, capacity: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Route Name</label>
                                <input className="glass-input" required value={newVehicle.route_name} onChange={e => setNewVehicle({...newVehicle, route_name: e.target.value})} placeholder="Downtown Express" />
                            </div>
                            <div className="form-group">
                                <label>Stops</label>
                                <div style={{display: 'flex', gap: '0.5rem'}}>
                                    <input className="glass-input" value={stopInput} onChange={e => setStopInput(e.target.value)} placeholder="Stop name..." />
                                    <button type="button" onClick={addStop} className="btn-glass" style={{ height: '42px' }}>Add</button>
                                </div>
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem'}}>
                                    {newVehicle.stops.map((s, i) => <span key={i} className="badge badge-purple">{s}</span>)}
                                </div>
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                                <button type="button" className="btn-glass w-full" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary w-full" disabled={addMutation.isPending}>Save Vehicle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ASSIGN STUDENT MODAL */}
            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-card glass-card fade-in" style={{ width: '400px' }}>
                        <div className="card-header">
                            <h3 className="card-title">Assign Student</h3>
                            <button className="btn-icon" onClick={() => setShowAssignModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); assignMutation.mutate(assignData); }} style={{ padding: '1.5rem' }}>
                            <div className="form-group">
                                <label>Student</label>
                                <select className="glass-select" required value={assignData.studentId} onChange={e => setAssignData({...assignData, studentId: e.target.value})}>
                                    <option value="">-- Choose Student --</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class_name}-{s.section})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Route / Vehicle</label>
                                <select className="glass-select" required value={assignData.vehicleId} onChange={e => setAssignData({...assignData, vehicleId: e.target.value})}>
                                    <option value="">-- Choose Route --</option>
                                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.route_name} ({v.vehicle_no})</option>)}
                                </select>
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                                <button type="button" className="btn-glass w-full" onClick={() => setShowAssignModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary w-full" disabled={assignMutation.isPending}>Assign</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Transport
