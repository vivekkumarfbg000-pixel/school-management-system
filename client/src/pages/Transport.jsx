import React from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const Transport = () => {
    const { data: vehicles = [], isLoading } = useQuery({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const { data } = await axios.get('/api/transport/vehicles')
            return data
        }
    })

    const stops = ['Charbagh (08:00)', 'Aminabad (08:10)', 'Hazratganj (08:20)', 'Gomti Nagar (08:30)', 'School (08:45)']

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>🚌 Transport Management</h3>
                <button className="quick-action-btn" style={{ background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white' }}>➕ Add Vehicle</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.5rem' }}>{isLoading ? '...' : vehicles.length}</div>
                    <div className="stat-label">Total Vehicles</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>107</div>
                    <div className="stat-label">Students Tracked</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--info)' }}>{isLoading ? '...' : new Set(vehicles.map(v => v.route_name)).size}</div>
                    <div className="stat-label">Active Routes</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--warning)' }}>{isLoading ? '...' : vehicles.filter(v => v.status === 'On Route').length}</div>
                    <div className="stat-label">Buses On Route</div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="card-header"><h3 className="card-title">Vehicle Tracker</h3></div>
                <div className="table-wrapper">
                    {isLoading ? (
                        <div style={{ padding: '2rem' }}>
                            {[...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: '50px', marginBottom: '10px' }} />)}
                        </div>
                    ) : (
                    <table>
                        <thead><tr><th>Vehicle No</th><th>Type</th><th>Driver</th><th>Route</th><th>Occupancy</th><th>Status</th></tr></thead>
                        <tbody>
                            {vehicles.map((v, i) => (
                                <tr key={v.id || i}>
                                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{v.vehicle_no}</td>
                                    <td><span className="badge badge-info">{v.type}</span></td>
                                    <td>{v.driver_name}<br /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📞 {v.driver_phone}</span></td>
                                    <td style={{ fontSize: '0.8rem' }}>{v.route_name}</td>
                                    <td style={{ width: '15%' }}>
                                        <div style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>32/{v.capacity}</div>
                                        <div className="progress-bar" style={{ height: '6px' }}>
                                            <div className="progress-fill green" style={{ width: '75%' }}></div>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-success"><span className="badge-dot"></span>Ready</span></td>
                                </tr>
                            ))}
                            {vehicles.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No vehicles registered.</td></tr>
                            )}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3 className="card-title">📍 Route Visualization (Active)</h3></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1.5rem 0', overflowX: 'auto' }}>
                    {stops.map((s, i) => (
                        <React.Fragment key={i}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '110px' }}>
                                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: i === stops.length - 1 ? 'var(--accent)' : 'var(--primary)', border: '4px solid ' + (i === stops.length - 1 ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)') }}></div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.6rem', textAlign: 'center' }}>{s}</div>
                            </div>
                            {i < stops.length - 1 && <div style={{ flex: 1, height: '3px', background: 'var(--glass-border)', minWidth: '40px', borderRadius: '2px' }}></div>}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Transport
