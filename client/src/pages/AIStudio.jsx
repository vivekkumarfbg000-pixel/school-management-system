import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Sparkles, FileText, CheckCircle, Clock, BookOpen, Brain, Download, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const AIStudio = () => {
    const { token } = useAuth()
    const headers = { Authorization: `Bearer ${token}` }
    const [activeTab, setActiveTab] = useState('lesson') // 'lesson' or 'exam'

    // Lesson Plan State
    const [lessonData, setLessonData] = useState({ topic: '', gradeLevel: '', duration: 45 })
    const [lessonResult, setLessonResult] = useState('')

    // Exam Gen State
    const [examData, setExamData] = useState({ topic: '', gradeLevel: '', questionCount: 10, difficulty: 'Medium' })
    const [examResult, setExamResult] = useState(null)

    const lessonMutation = useMutation({
        mutationFn: async (data) => {
            const res = await axios.post('/api/ai/lesson-plan', data, { headers })
            return res.data
        },
        onSuccess: (data) => {
            setLessonResult(data.markdown)
            toast.success("Lesson Plan generated successfully!")
        },
        onError: () => toast.error("Failed to generate lesson plan")
    })

    const examMutation = useMutation({
        mutationFn: async (data) => {
            const res = await axios.post('/api/ai/exam-gen', data, { headers })
            return res.data
        },
        onSuccess: (data) => {
            setExamResult(data)
            toast.success("Exam Question Bank generated!")
        },
        onError: () => toast.error("Failed to generate exam questions")
    })

    const handleGenerateLesson = (e) => {
        e.preventDefault()
        lessonMutation.mutate(lessonData)
    }

    const handleGenerateExam = (e) => {
        e.preventDefault()
        examMutation.mutate(examData)
    }

    const downloadText = (filename, text) => {
        const element = document.createElement("a");
        const file = new Blob([text], {type: 'text/markdown'});
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    const downloadExamJSON = () => {
        const element = document.createElement("a");
        const file = new Blob([JSON.stringify(examResult, null, 2)], {type: 'application/json'});
        element.href = URL.createObjectURL(file);
        element.download = `${examResult.examTitle || 'exam'}.json`;
        document.body.appendChild(element);
        element.click();
    }

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div className="header-text">
                    <h1><Sparkles size={24} style={{ display: 'inline', color: 'var(--primary)', marginRight: '0.5rem', marginBottom: '-5px' }}/> AI Educator Studio</h1>
                    <p>Automate your curriculum planning and exam generation with advanced AI models.</p>
                </div>
            </div>

            <div className="filter-strip" style={{ marginBottom: '2rem' }}>
                <div className="filter-scroll">
                    <button onClick={() => setActiveTab('lesson')} className={`filter-btn ${activeTab === 'lesson' ? 'active' : ''}`}>
                        <BookOpen size={16} style={{ display: 'inline', marginRight: '6px' }}/> Lesson Architect
                    </button>
                    <button onClick={() => setActiveTab('exam')} className={`filter-btn ${activeTab === 'exam' ? 'active' : ''}`}>
                        <Brain size={16} style={{ display: 'inline', marginRight: '6px' }}/> Exam Forge
                    </button>
                </div>
            </div>

            <AnimatePresence mode='wait'>
                {activeTab === 'lesson' && (
                    <motion.div key="lesson" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="content-grid" style={{ gridTemplateColumns: 'minmax(350px, 1fr) 2fr' }}>
                        <div className="card glass-card">
                            <div className="card-header"><h3 className="card-title">Plan Parameters</h3></div>
                            <form onSubmit={handleGenerateLesson} style={{ padding: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Subject / Topic</label>
                                    <input className="glass-input" required value={lessonData.topic} onChange={e=>setLessonData({...lessonData, topic: e.target.value})} placeholder="e.g. Photosynthesis, World War 2" />
                                </div>
                                <div className="form-group">
                                    <label>Grade Level</label>
                                    <input className="glass-input" required value={lessonData.gradeLevel} onChange={e=>setLessonData({...lessonData, gradeLevel: e.target.value})} placeholder="e.g. 10, A-Level" />
                                </div>
                                <div className="form-group">
                                    <label>Duration (Minutes)</label>
                                    <input type="number" className="glass-input" required value={lessonData.duration} onChange={e=>setLessonData({...lessonData, duration: e.target.value})} min="15" max="180" />
                                </div>
                                <button type="submit" disabled={lessonMutation.isPending} className="btn-primary w-full" style={{ marginTop: '1rem' }}>
                                    {lessonMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Plan</>}
                                </button>
                            </form>
                        </div>
                        <div className="card glass-card" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 className="card-title"><FileText size={16} /> Output</h3>
                                {lessonResult && (
                                    <button className="btn-glass btn-sm" onClick={() => downloadText(`${lessonData.topic}_LessonPlan.md`, lessonResult)}>
                                        <Download size={14} /> Export MD
                                    </button>
                                )}
                            </div>
                            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: 'hsla(0,0%,0%,0.2)', borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)' }}>
                                {lessonResult ? (
                                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {lessonResult}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                        <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                        <p>Enter parameters on the left to generate a comprehensive lesson plan.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'exam' && (
                    <motion.div key="exam" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="content-grid" style={{ gridTemplateColumns: 'minmax(350px, 1fr) 2fr' }}>
                        <div className="card glass-card">
                            <div className="card-header"><h3 className="card-title">Quiz Parameters</h3></div>
                            <form onSubmit={handleGenerateExam} style={{ padding: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Subject / Topic</label>
                                    <input className="glass-input" required value={examData.topic} onChange={e=>setExamData({...examData, topic: e.target.value})} placeholder="e.g. Algebra, Chemical Bonds" />
                                </div>
                                <div className="form-group">
                                    <label>Grade Level</label>
                                    <input className="glass-input" required value={examData.gradeLevel} onChange={e=>setExamData({...examData, gradeLevel: e.target.value})} placeholder="e.g. 8, University" />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Count</label>
                                        <input type="number" className="glass-input" required value={examData.questionCount} onChange={e=>setExamData({...examData, questionCount: e.target.value})} min="5" max="50" />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Difficulty</label>
                                        <select className="glass-select" value={examData.difficulty} onChange={e=>setExamData({...examData, difficulty: e.target.value})}>
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={examMutation.isPending} className="btn-primary w-full" style={{ marginTop: '1rem' }}>
                                    {examMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Forging...</> : <><Sparkles size={16} /> Generate Exam</>}
                                </button>
                            </form>
                        </div>
                        <div className="card glass-card" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 className="card-title"><FileText size={16} /> Question Bank</h3>
                                {examResult && (
                                    <button className="btn-glass btn-sm" onClick={downloadExamJSON}>
                                        <Download size={14} /> Export JSON
                                    </button>
                                )}
                            </div>
                            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: 'hsla(0,0%,0%,0.2)' }}>
                                {examResult ? (
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary-light)' }}>{examResult.examTitle}</h2>
                                        {examResult.questions?.map((q, idx) => (
                                            <div key={idx} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
                                                <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>{idx + 1}. {q.question}</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                                    {q.options?.map((opt, i) => (
                                                        <div key={i} style={{ padding: '0.5rem 1rem', background: 'hsla(0,0%,100%,0.05)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>{String.fromCharCode(65 + i)}. {opt}</div>
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginBottom: '0.5rem' }}>✓ Answer: {q.correctAnswer}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>💡 Explanation: {q.explanation}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                        <Brain size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                        <p>Generate a structural JSON question bank directly from topic constraints.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default AIStudio
