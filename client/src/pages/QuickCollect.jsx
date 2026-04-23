import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, User, CheckCircle, ArrowRight, X, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QuickCollect = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [amount, setAmount] = useState('');
    const searchInputRef = useRef(null);
    const queryClient = useQueryClient();

    // Fetch students with pending fees
    const { data: students = [], isLoading } = useQuery({
        queryKey: ['pending-fees'],
        queryFn: async () => {
            const { data } = await axios.get('/fees'); // Reusing the /fees endpoint which returns all students with their balances
            return data.filter(s => s.balance > 0);
        }
    });

    const collectMutation = useMutation({
        mutationFn: async (variables) => {
            await axios.post('/fees/collect', variables);
            // Optionally hit a webhook/route to send WhatsApp receipt here if not handled in backend
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-fees'] });
            toast.success("Cash Recorded & Receipt Sent via WhatsApp! ✅");
            setSelectedStudent(null);
            setAmount('');
            setSearchQuery('');
            if (searchInputRef.current) searchInputRef.current.focus();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to record payment.");
        }
    });

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.includes(searchQuery)
    ).slice(0, 5); // show top 5

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setAmount(student.balance);
    };

    const handleCollect = (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) return toast.error("Enter a valid amount.");
        
        collectMutation.mutate({
            studentId: selectedStudent.id,
            feeType: 'Monthly Tuition', // Default to tuition for quick collect
            amountPaid: parseFloat(amount),
            isFullPayment: parseFloat(amount) >= selectedStudent.balance
        });
    };

    return (
        <div className="page-workspace" style={{ padding: '0.5rem', maxWidth: '500px', margin: '0 auto', paddingBottom: '100px' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem', textAlign: 'left', padding: '1rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>Collect Fees</h1>
                <p style={{ color: 'var(--text-muted)' }}>Tap to record cash & alert parent</p>
            </div>

            {!selectedStudent ? (
                <div className="premium-search-container" style={{ padding: '0 1rem' }}>
                    <div className="omnisearch-bar" style={{ marginBottom: '1.5rem', width: '100%' }}>
                        <Search size={20} className="text-muted" />
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            placeholder="Student name or phone..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ height: '50px', fontSize: '1rem' }}
                            autoFocus
                        />
                    </div>

                    <div className="search-results-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {isLoading ? (
                            <div className="sync-overlay"><Loader2 className="animate-spin" /></div>
                        ) : searchQuery.length > 1 ? (
                            filteredStudents.length > 0 ? filteredStudents.map(student => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    key={student.id} 
                                    className="stat-card premium-card" 
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', cursor: 'pointer' }}
                                    onClick={() => handleSelectStudent(student)}
                                >
                                    <div className="card-icon-floating"><DollarSign size={60} /></div>
                                    <div style={{ position: 'relative', zIndex: 2 }}>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{student.name}</h4>
                                        <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{student.className}-{student.section}</span>
                                    </div>
                                    <div style={{ textAlign: 'right', position: 'relative', zIndex: 2 }}>
                                        <div style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '1.2rem' }}>₹{student.balance}</div>
                                        <ArrowRight size={16} className="text-muted" />
                                    </div>
                                </motion.div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No pending fees found.</div>
                            )
                        ) : (
                            <div className="ai-chat-prompt" style={{ borderRadius: 'var(--radius-xl)' }}>
                                <div className="ai-icon"><Wallet size={24} color="var(--primary)" /></div>
                                <h4>Cash Collection Mode</h4>
                                <p>Search for a student above to record a payment and send an instant WhatsApp receipt.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <AnimatePresence>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="quick-collect-active" 
                        style={{ padding: '0 1rem' }}
                    >
                        <div className="premium-card glow-indigo" style={{ padding: '2rem', borderRadius: 'var(--radius-2xl)', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.25rem' }}>{selectedStudent.name}</h2>
                                    <p className="text-accent" style={{ fontWeight: 800 }}>{selectedStudent.className}-{selectedStudent.section} • {selectedStudent.admissionNo}</p>
                                </div>
                                <button className="btn-glass" style={{ padding: '0.5rem', borderRadius: '50%' }} onClick={() => setSelectedStudent(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ marginTop: '2.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pending Balance</label>
                                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'white', letterSpacing: '-2px' }}>₹{selectedStudent.balance}</div>
                            </div>
                        </div>

                        <form onSubmit={handleCollect}>
                            <div className="form-group premium-input-group">
                                <label style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>Amount Received (Cash)</label>
                                <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                                    <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>₹</span>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        max={selectedStudent.balance}
                                        required
                                        autoFocus
                                        style={{ 
                                            paddingLeft: '50px', 
                                            height: '80px', 
                                            fontSize: '2.5rem', 
                                            fontWeight: 900, 
                                            borderRadius: 'var(--radius-xl)',
                                            background: 'var(--bg-surface)',
                                            border: '2px solid var(--glass-border-bright)'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="sticky-mobile-action" style={{ 
                                position: 'fixed', bottom: '110px', left: '20px', right: '20px', zIndex: 1100 
                            }}>
                                <button 
                                    type="submit" 
                                    className="btn-primary w-full" 
                                    disabled={collectMutation.isPending}
                                    style={{ 
                                        height: '70px', 
                                        fontSize: '1.1rem', 
                                        borderRadius: 'var(--radius-xl)',
                                        background: 'linear-gradient(135deg, var(--accent), #0f766e)',
                                        boxShadow: '0 15px 35px rgba(20, 184, 166, 0.4)',
                                        border: 'none'
                                    }}
                                >
                                    {collectMutation.isPending ? <Loader2 className="animate-spin" /> : (
                                        <>
                                            <CheckCircle size={22} />
                                            Record & Send Receipt
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </AnimatePresence>
            )}
        </div>
    );
};

export default QuickCollect;
