import React, { useState, useEffect } from 'react'
import axios from 'axios'

const Library = () => {
    const [search, setSearch] = useState('')
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchBooks = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const { data } = await axios.get('/api/library/books', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setBooks(data)
        } catch (error) {
            console.error("Error fetching books", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBooks()
    }, [])

    const filtered = books.filter(b => 
        b.title.toLowerCase().includes(search.toLowerCase()) || 
        b.author.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>📖 Library Management</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input 
                        type="text" 
                        placeholder="🔍 Search books..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', width: '250px', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }} 
                    />
                    <button className="quick-action-btn" style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }}>➕ Add Book</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem' }}>{books.length}</div><div className="stat-label">Total Titles</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>2,180</div><div className="stat-label">Available Copies</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--info)' }}>270</div><div className="stat-label">Currently Issued</div></div>
                <div className="stat-card"><div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>12</div><div className="stat-label">Overdue Returns</div></div>
            </div>

            <div className="content-grid">
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Book Catalog</h3></div>
                    <div className="table-wrapper">
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading catalog...</div>
                        ) : (
                        <table>
                            <thead><tr><th>Acc. No</th><th>Title</th><th>Author</th><th>Category</th><th>Available</th><th>Shelf</th></tr></thead>
                            <tbody>
                                {filtered.map((b, i) => (
                                    <tr key={b.id || i}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.accession_no}</td>
                                        <td style={{ fontWeight: 600 }}>{b.title}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{b.author}</td>
                                        <td><span className="badge badge-purple">{b.category}</span></td>
                                        <td><span style={{ fontWeight: 700, color: b.available_copies < 5 ? 'var(--danger)' : 'var(--accent)' }}>{b.available_copies}</span>/{b.total_copies}</td>
                                        <td style={{ fontFamily: 'monospace' }}>{b.shelf_location}</td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No books found.</td></tr>
                                )}
                            </tbody>
                        </table>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3 className="card-title">Recent Activity (Prototype)</h3></div>
                    <div className="event-item">
                        <div className="event-date-box" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)', fontSize: '1rem' }}>📕</div>
                        <div className="event-info" style={{ flex: 1 }}>
                            <h4>Aarav Sharma <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(10-A)</span></h4>
                            <p>Wings of Fire • Due: 15 Mar</p>
                        </div>
                        <span className="badge badge-info">Issued</span>
                    </div>
                    <div className="event-item">
                        <div className="event-date-box" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', fontSize: '1rem' }}>📕</div>
                        <div className="event-info" style={{ flex: 1 }}>
                            <h4>Priya Patel <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(12-B)</span></h4>
                            <p>Godan • Due: 10 Mar</p>
                        </div>
                        <span className="badge badge-danger">Overdue</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Library
