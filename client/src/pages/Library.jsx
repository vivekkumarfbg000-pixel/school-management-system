import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Book as BookIcon, UserPlus, ArrowLeftRight, Search, PlusCircle, Calendar, ListFilter, X, BookOpen, Activity } from 'lucide-react'

const Library = () => {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showIssueModal, setShowIssueModal] = useState(false)
    const [selectedBook, setSelectedBook] = useState(null)
    const [activeTab, setActiveTab] = useState('catalog')

    // Form states
    const [newBook, setNewBook] = useState({ accession_no: '', title: '', author: '', category: 'General', quantity: 1, shelf_location: '' })
    const [issueData, setIssueData] = useState({ studentId: '', dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] })

    const { data: books = [], isLoading } = useQuery({
        queryKey: ['books'],
        queryFn: async () => {
            const { data } = await axios.get('/library/books', {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data
        }
    })

    const { data: students = [] } = useQuery({
        queryKey: ['students-mini'],
        queryFn: async () => {
            const { data } = await axios.get('/students', {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data
        }
    })

    const addMutation = useMutation({
        mutationFn: async (book) => axios.post('/library/add', book, {
            headers: { Authorization: `Bearer ${token}` }
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] })
            toast.success('Book added to catalog')
            setShowAddModal(false)
            setNewBook({ accession_no: '', title: '', author: '', category: 'General', quantity: 1, shelf_location: '' })
        }
    })

    const issueMutation = useMutation({
        mutationFn: async (data) => axios.post('/library/issue', data, {
            headers: { Authorization: `Bearer ${token}` }
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] })
            toast.success('Book issued successfully')
            setShowIssueModal(false)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to issue book')
    })

    const { data: issues = [], isLoading: isIssuesLoading } = useQuery({
        queryKey: ['book-issues'],
        queryFn: async () => {
            const { data } = await axios.get('/library/issues', {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data
        }
    })

    const returnMutation = useMutation({
        mutationFn: async (issueId) => axios.post('/library/return', { issueId }, {
            headers: { Authorization: `Bearer ${token}` }
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] })
            queryClient.invalidateQueries({ queryKey: ['book-issues'] })
            toast.success('Book returned to library')
        }
    })

    const filtered = books.filter(b => 
        b.title.toLowerCase().includes(search.toLowerCase()) || 
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        b.accession_no.toLowerCase().includes(search.toLowerCase())
    )

    const handleReturn = (issueId) => {
        if (window.confirm('Mark this book as returned?')) {
            returnMutation.mutate(issueId)
        }
    }

    const handleIssueClick = (book) => {
        if (book.available <= 0) return toast.error('No copies available for issue')
        setSelectedBook(book)
        setShowIssueModal(true)
    }

    return (
        <div className="fade-in">
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>📖 Library Hub</h3>
                <button className="quick-action-btn" onClick={() => setShowAddModal(true)} style={{ background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white' }}>
                    <PlusCircle size={16} /> Add New Title
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-value">{isLoading ? '...' : books.length}</div>
                    <div className="stat-label">Total Titles</div>
                </div>
                <div className="stat-card">
                   <div className="stat-value" style={{color: 'var(--accent)'}}>{isLoading ? '...' : books.reduce((acc, b) => acc + b.available, 0)}</div>
                   <div className="stat-label">Available</div>
                </div>
                <div className="stat-card">
                   <div className="stat-value" style={{color: 'var(--info)'}}>{isLoading ? '...' : books.reduce((acc, b) => acc + (b.quantity - b.available), 0)}</div>
                   <div className="stat-label">Issued</div>
                </div>
                <div className="stat-card">
                   <div className="stat-value" style={{color: 'var(--danger)'}}>{issues.filter(i => i.status === 'Issued' && new Date(i.due_date) < new Date()).length}</div>
                   <div className="stat-label">Overdue</div>
                </div>
            </div>

            <div className="card glass-card">
                <div className="card-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{display: 'flex', gap: '0.75rem'}}>
                       <button className={`filter-btn ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>Catalog</button>
                       <button className={`filter-btn ${activeTab === 'issued' ? 'active' : ''}`} onClick={() => setActiveTab('issued')}>History</button>
                    </div>
                    <div className="search-box-pro" style={{ width: '300px' }}>
                        <Search size={16} />
                        <input type="text" className="glass-input" placeholder="Search by title, author..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="table-wrapper">
                    {activeTab === 'catalog' ? (
                        <table>
                            <thead><tr><th>Acc No</th><th>Title & Author</th><th>Category</th><th>Inventory</th><th>Shelf</th><th>Actions</th></tr></thead>
                            <tbody>
                                {filtered.map((b) => (
                                    <tr key={b.id}>
                                        <td className="font-mono" style={{ fontSize: '0.8rem' }}>{b.accession_no}</td>
                                        <td>
                                            <div className="font-bold">{b.title}</div>
                                            <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{b.author}</div>
                                        </td>
                                        <td><span className="badge badge-purple">{b.category}</span></td>
                                        <td>
                                            <div style={{fontSize: '0.85rem'}}>
                                               <span style={{fontWeight: 800, color: b.available > 0 ? 'var(--accent)' : 'var(--danger)'}}>{b.available}</span>
                                               <span style={{color: 'var(--text-muted)'}}> / {b.quantity}</span>
                                            </div>
                                        </td>
                                        <td className="font-mono" style={{ fontSize: '0.8rem' }}>{b.shelf_location}</td>
                                        <td>
                                            <button className="badge badge-glass" onClick={() => handleIssueClick(b)} style={{ cursor: 'pointer', border: '1px solid var(--accent)' }}>Issue</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table>
                           <thead><tr><th>Book Info</th><th>Student</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead>
                           <tbody>
                              {issues.map((i) => (
                                 <tr key={i.id}>
                                    <td>
                                       <div className="font-bold">{i.books?.title}</div>
                                       <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{i.books?.accession_no}</div>
                                    </td>
                                    <td>
                                       <div className="font-bold">{i.students?.name}</div>
                                       <div style={{fontSize: '0.65rem', color: 'var(--text-muted)'}}>{i.students?.class_name}-{i.students?.section}</div>
                                    </td>
                                    <td style={{color: new Date(i.due_date) < new Date() && i.status === 'Issued' ? 'var(--danger)' : 'inherit'}}>
                                       {new Date(i.due_date).toLocaleDateString()}
                                    </td>
                                    <td><span className={`badge ${i.status === 'Returned' ? 'badge-success' : 'badge-warning'}`}>{i.status}</span></td>
                                    <td>
                                       {i.status === 'Issued' && <button className="badge badge-glass" onClick={() => handleReturn(i.id)}>Return</button>}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ADD BOOK MODAL */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-card glass-card fade-in" style={{ width: '450px' }}>
                        <div className="card-header">
                            <h3 className="card-title">Add New Title</h3>
                            <button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(newBook); }} style={{ padding: '1.5rem' }}>
                            <div className="form-group">
                                <label>Accession No</label>
                                <input className="glass-input" required value={newBook.accession_no} onChange={e => setNewBook({...newBook, accession_no: e.target.value})} placeholder="LIB-2024-001" />
                            </div>
                            <div className="form-group">
                                <label>Book Title</label>
                                <input className="glass-input" required value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
                            </div>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                <div className="form-group">
                                    <label>Author</label>
                                    <input className="glass-input" required value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input type="number" className="glass-input" required value={newBook.quantity} onChange={e => setNewBook({...newBook, quantity: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Shelf Location</label>
                                <input className="glass-input" value={newBook.shelf_location} onChange={e => setNewBook({...newBook, shelf_location: e.target.value})} placeholder="R-12, S-2" />
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                                <button type="button" className="btn-glass w-full" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary w-full" disabled={addMutation.isPending}>Save Title</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ISSUE BOOK MODAL */}
            {showIssueModal && (
                <div className="modal-overlay">
                    <div className="modal-card glass-card fade-in" style={{ width: '400px' }}>
                        <div className="card-header">
                            <h3 className="card-title">Issue Book</h3>
                            <button className="btn-icon" onClick={() => setShowIssueModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); issueMutation.mutate({ bookId: selectedBook.id, ...issueData }); }} style={{ padding: '1.5rem' }}>
                            <div style={{marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                <div className="font-bold" style={{color: 'var(--accent)'}}>{selectedBook?.title}</div>
                                <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{selectedBook?.accession_no}</div>
                            </div>
                            <div className="form-group">
                                <label>Student</label>
                                <select className="glass-select" required value={issueData.studentId} onChange={e => setIssueData({...issueData, studentId: e.target.value})}>
                                    <option value="">-- Choose Student --</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class_name}-{s.section})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Due Date</label>
                                <input type="date" className="glass-input" required value={issueData.dueDate} onChange={e => setIssueData({...issueData, dueDate: e.target.value})} />
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                                <button type="button" className="btn-glass w-full" onClick={() => setShowIssueModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary w-full" disabled={issueMutation.isPending}>Issue</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Library
