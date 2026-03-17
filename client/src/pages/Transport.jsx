import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Bus, MapPin, User, Navigation, PlusCircle, Users, Phone, MoreHorizontal } from 'lucide-react'

const Transport = () => {
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
            const { data } = await axios.get('/api/transport/vehicles')
            return data
        }
    })

    const { data: students = [] } = useQuery({
        queryKey: ['students-mini'],
        queryFn: async () => {
            const { data } = await axios.get('/api/students')
            return data
        }
    })

    const addMutation = useMutation({
        mutationFn: async (vehicle) => axios.post('/api/transport/add', vehicle),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] })
            toast.success('Vehicle added to fleet')
            setShowAddModal(false)
            setNewVehicle({ vehicle_no: '', type: 'Bus', capacity: 40, driver_name: '', driver_phone: '', route_name: '', stops: [] })
        }
    })

    const assignMutation = useMutation({
        mutationFn: async (data) => axios.post('/api/transport/assign', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] })
            toast.success('Student assigned to vehicle')
            setShowAssignModal(false)
        }
    })

    const addStop = () => {
        if (stopInput.trim()) {
            setNewVehicle({...newVehicle, stops: [...newVehicle.stops, stopInput.trim()]})
            setStopInput('')
        }
    }

    return (
        <div className="fade-in">
            <div className="dashboard-hero" style={{marginBottom: '2rem', padding: '1.5rem 2rem'}}>
                <div className="hero-content">
                    <h1>🚌 Transport Center</h1>
                    <p>Monitor routes, fleet status, and student commutes in real-time.</p>
                </div>
                <div className="hero-actions">
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        <PlusCircle size={18} />
                        <span>Add Vehicle</span>
                    </button>
                    <button className="btn-glass" onClick={() => setShowAssignModal(true)}>
                        <Users size={18} />
                        <span>Assign Student</span>
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-value">{isLoading ? '...' : vehicles.length}</div>
                    <div className="stat-label">Total Vehicles</div>
                </div>
                <div className="stat-card">
                   <div className="stat-value" style={{color: 'var(--accent)'}}>{isLoading ? '...' : new Set(vehicles.map(v => v.route_name)).size}</div>
                   <div className="stat-label">Active Routes</div>
                </div>
                <div className="stat-card">
                   <div className="stat-value" style={{color: 'var(--info)'}}>{isLoading ? '...' : vehicles.reduce((acc, v) => acc + (v.occupancy || 0), 0)}</div>
                   <div className="stat-label">Commuting Students</div>
                </div>
                <div className="stat-card">
                   <div className="stat-value" style={{color: 'var(--success)'}}>100%</div>
                   <div className="stat-label">Safety Compliance</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Vehicle Fleet</h3>
                </div>
                <div className="table-wrapper">
                    {isLoading ? (
                        <div style={{padding: '2rem'}}>
                            {[...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{height: '60px', marginBottom: '10px'}} />)}
                        </div>
                    ) : vehicles.length === 0 ? (
                        <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>No vehicles registered.</div>
                    ) : (
                        <table>
                            <thead><tr><th>Vehicle Details</th><th>Route & Driver</th><th>Capacity</th><th>Tracking</th><th>Status</th></tr></thead>
                            <tbody>
                                {vehicles.map((v, i) => (
                                    <tr key={v.id || i}>
                                        <td>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                                <div className="task-icon blue" style={{width: '32px', height: '32px'}}><Bus size={16} /></div>
                                                <div>
                                                    <div className="font-bold">{v.vehicle_no}</div>
                                                    <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{v.type}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-bold">{v.route_name}</div>
                                            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{v.driver_name} • {v.driver_phone}</div>
                                        </td>
                                        <td>
                                            <div style={{fontSize: '0.85rem'}}>
                                               <span className="font-bold" style={{color: (v.occupancy || 0) >= v.capacity ? 'var(--danger)' : 'var(--accent)'}}>{v.occupancy || 0}</span>
                                               <span style={{color: 'var(--text-muted)'}}> / {v.capacity}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{display: 'flex', gap: '0.25rem'}}>
                                                {v.stops?.slice(0, 3).map((s, idx) => (
                                                    <span key={idx} className="badge badge-glass" style={{fontSize: '0.6rem'}}>{s}</span>
                                                ))}
                                                {v.stops?.length > 3 && <span style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>+ {v.stops.length - 3} more</span>}
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
                    <div className="modal-card fade-in">
                        <div className="card-header"><h3 className="card-title">Register New Vehicle</h3></div>
                        <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(newVehicle); }} className="modal-body">
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                <div className="form-group">
                                    <label>Vehicle No</label>
                                    <input type="text" className="form-control" required value={newVehicle.vehicle_no} onChange={e => setNewVehicle({...newVehicle, vehicle_no: e.target.value})} placeholder="UP14-BT-XXXX" />
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select className="form-control" value={newVehicle.type} onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}>
                                        <option>Bus</option><option>Van</option><option>SUV</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Driver Name</label>
                                <input type="text" className="form-control" required value={newVehicle.driver_name} onChange={e => setNewVehicle({...newVehicle, driver_name: e.target.value})} />
                            </div>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                <div className="form-group">
                                    <label>Driver Phone</label>
                                    <input type="text" className="form-control" required value={newVehicle.driver_phone} onChange={e => setNewVehicle({...newVehicle, driver_phone: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Capacity</label>
                                    <input type="number" className="form-control" required value={newVehicle.capacity} onChange={e => setNewVehicle({...newVehicle, capacity: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Route Name</label>
                                <input type="text" className="form-control" required value={newVehicle.route_name} onChange={e => setNewVehicle({...newVehicle, route_name: e.target.value})} placeholder="e.g. Downtown Express" />
                            </div>
                            <div className="form-group">
                                <label>Add Stops</label>
                                <div style={{display: 'flex', gap: '0.5rem'}}>
                                    <input type="text" className="form-control" value={stopInput} onChange={e => setStopInput(e.target.value)} placeholder="Stop name..." />
                                    <button type="button" onClick={addStop} className="btn-glass">Add</button>
                                </div>
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem'}}>
                                    {newVehicle.stops.map((s, i) => <span key={i} className="badge badge-purple">{s}</span>)}
                                </div>
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                                <button type="button" className="btn-glass" style={{flex: 1}} onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{flex: 1}} disabled={addMutation.isPending}>Save Vehicle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ASSIGN STUDENT MODAL */}
            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-card fade-in">
                        <div className="card-header"><h3 className="card-title">Assign Student to Transport</h3></div>
                        <form onSubmit={(e) => { e.preventDefault(); assignMutation.mutate(assignData); }} className="modal-body">
                            <div className="form-group">
                                <label>Select Student</label>
                                <select className="form-control" required value={assignData.studentId} onChange={e => setAssignData({...assignData, studentId: e.target.value})}>
                                    <option value="">-- Choose Student --</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class_name}-{s.section})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Select Vehicle / Route</label>
                                <select className="form-control" required value={assignData.vehicleId} onChange={e => setAssignData({...assignData, vehicleId: e.target.value})}>
                                    <option value="">-- Choose Route --</option>
                                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.route_name} ({v.vehicle_no})</option>)}
                                </select>
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                                <button type="button" className="btn-glass" style={{flex: 1}} onClick={() => setShowAssignModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{flex: 1}} disabled={assignMutation.isPending}>Confirm Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Transport
