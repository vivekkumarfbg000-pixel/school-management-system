import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Book as BookIcon, UserPlus, ArrowLeftRight, Search, PlusCircle, Calendar, ListFilter } from 'lucide-react'

const Library = () => {
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
            const { data } = await axios.get('/api/library/books')
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
        mutationFn: async (book) => axios.post('/api/library/add', book),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] })
            toast.success('Book added to catalog')
            setShowAddModal(false)
            setNewBook({ accession_no: '', title: '', author: '', category: 'General', quantity: 1, shelf_location: '' })
        }
    })

    const issueMutation = useMutation({
        mutationFn: async (data) => axios.post('/api/library/issue', data),
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
            const { data } = await axios.get('/api/library/issues')
            return data
        }
    })

    const returnMutation = useMutation({
        mutationFn: async (issueId) => axios.post('/api/library/return', { issueId }),
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
            <div className="dashboard-hero" style={{marginBottom: '2rem', padding: '1.5rem 2rem'}}>
                <div className="hero-content">
                    <h1>📖 Library Hub</h1>
                    <p>Manage your school's physical and digital knowledge base.</p>
                </div>
                <div className="hero-actions">
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        <PlusCircle size={18} />
                        <span>Add New Title</span>
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-value">{isLoading ? '...' : books.length}</div>
                    <div className="stat-label">Total Titles</div>
                </div>
                <div className="stat-card">
                   <div className="stat-value" style={{color: 'var(--accent)'}}>{isLoading ? '...' : books.reduce((acc, b) => acc + b.available, 0)}</div>
                   <div className="stat-label">Available Copies</div>
                </div>
                <div className="stat-card">
                   <div className="stat-value" style={{color: 'var(--info)'}}>{isLoading ? '...' : books.reduce((acc, b) => acc + (b.quantity - b.available), 0)}</div>
                   <div className="stat-label">Issued Books</div>
                </div>
                <div className="stat-card">
                   <div className="stat-value" style={{color: 'var(--danger)'}}>{issues.filter(i => i.status === 'Issued' && new Date(i.due_date) < new Date()).length}</div>
                   <div className="stat-label">Overdue Returns</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{display: 'flex', gap: '1rem'}}>
                       <button className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>Catalog</button>
                       <button className={`tab-btn ${activeTab === 'issued' ? 'active' : ''}`} onClick={() => setActiveTab('issued')}>Issued History</button>
                    </div>
                    <div className="search-box-pro">
                        <Search size={16} />
                        <input type="text" placeholder="Search by title, author, or acc no..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="table-wrapper">
                    {activeTab === 'catalog' ? (
                        <table>
                            <thead><tr><th>Acc No</th><th>Title & Author</th><th>Category</th><th>Inventory</th><th>Shelf</th><th>Actions</th></tr></thead>
                            <tbody>
                                {filtered.map((b, i) => (
                                    <tr key={b.id || i}>
                                        <td className="font-mono">{b.accession_no}</td>
                                        <td>
                                            <div className="font-bold">{b.title}</div>
                                            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{b.author}</div>
                                        </td>
                                        <td><span className="badge badge-purple">{b.category}</span></td>
                                        <td>
                                            <div style={{fontSize: '0.85rem'}}>
                                               <span style={{fontWeight: 800, color: b.available > 0 ? 'var(--accent)' : 'var(--danger)'}}>{b.available}</span>
                                               <span style={{color: 'var(--text-muted)'}}> / {b.quantity}</span>
                                            </div>
                                        </td>
                                        <td className="font-mono">{b.shelf_location}</td>
                                        <td>
                                            <button className="btn-issue-sm" onClick={() => handleIssueClick(b)}>Issue Book</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table>
                           <thead><tr><th>Book Info</th><th>Student</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead>
                           <tbody>
                              {issues.map((i, idx) => (
                                 <tr key={i.id || idx}>
                                    <td>
                                       <div className="font-bold">{i.books?.title}</div>
                                       <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{i.books?.accession_no}</div>
                                    </td>
                                    <td>
                                       <div className="font-bold">{i.students?.name}</div>
                                       <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{i.students?.class_name}-{i.students?.section}</div>
                                    </td>
                                    <td>{new Date(i.issue_date).toLocaleDateString()}</td>
                                    <td style={{color: new Date(i.due_date) < new Date() && i.status === 'Issued' ? 'var(--danger)' : 'inherit'}}>
                                       {new Date(i.due_date).toLocaleDateString()}
                                    </td>
                                    <td>
                                       <span className={`badge ${i.status === 'Returned' ? 'badge-success' : 'badge-warning'}`}>
                                          {i.status}
                                       </span>
                                    </td>
                                    <td>
                                       {i.status === 'Issued' && (
                                          <button className="btn-return-sm" onClick={() => handleReturn(i.id)}>Return</button>
                                       )}
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
                    <div className="modal-card fade-in">
                        <div className="card-header">
                            <h3 className="card-title">Add New Title</h3>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(newBook); }} className="modal-body">
                            <div className="form-group">
                                <label>Accession No</label>
                                <input type="text" className="form-control" required value={newBook.accession_no} onChange={e => setNewBook({...newBook, accession_no: e.target.value})} placeholder="e.g. LIB-2024-001" />
                            </div>
                            <div className="form-group">
                                <label>Book Title</label>
                                <input type="text" className="form-control" required value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} placeholder="e.g. The Great Gatsby" />
                            </div>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                                <div className="form-group">
                                    <label>Author</label>
                                    <input type="text" className="form-control" required value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} placeholder="F. Scott Fitzgerald" />
                                </div>
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input type="number" className="form-control" required value={newBook.quantity} onChange={e => setNewBook({...newBook, quantity: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Shelf Location</label>
                                <input type="text" className="form-control" value={newBook.shelf_location} onChange={e => setNewBook({...newBook, shelf_location: e.target.value})} placeholder="e.g. R-12, S-2" />
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                                <button type="button" className="btn-glass" style={{flex: 1}} onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{flex: 1}} disabled={addMutation.isPending}>
                                    {addMutation.isPending ? 'Saving...' : 'Add to Catalog'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ISSUE BOOK MODAL */}
            {showIssueModal && (
                <div className="modal-overlay">
                    <div className="modal-card fade-in">
                        <div className="card-header">
                            <h3 className="card-title">Issue Book</h3>
                        </div>
                        <div className="modal-body">
                            <div style={{marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)'}}>
                                <div className="font-bold" style={{color: 'var(--primary-light)'}}>{selectedBook?.title}</div>
                                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{selectedBook?.author} • {selectedBook?.accession_no}</div>
                            </div>
                            
                            <form onSubmit={(e) => { e.preventDefault(); issueMutation.mutate({ bookId: selectedBook.id, ...issueData }); }}>
                                <div className="form-group">
                                    <label>Select Student</label>
                                    <select className="form-control" required value={issueData.studentId} onChange={e => setIssueData({...issueData, studentId: e.target.value})}>
                                        <option value="">-- Choose Student --</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.class_name}-{s.section})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input type="date" className="form-control" required value={issueData.dueDate} onChange={e => setIssueData({...issueData, dueDate: e.target.value})} />
                                </div>
                                <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
                                    <button type="button" className="btn-glass" style={{flex: 1}} onClick={() => setShowIssueModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{flex: 1}} disabled={issueMutation.isPending}>
                                        {issueMutation.isPending ? 'Processing...' : 'Confirm Issue'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Library
