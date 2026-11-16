import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle } from 'lucide-react'

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function Timer({ seconds, onExpire }) {
  const [remaining, setRemaining] = useState(seconds)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [onExpire])

  const h = Math.floor(remaining / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = remaining % 60

  const isLow = remaining < 300 // 5 min warning

  return (
    <div className={`flex items-center gap-2 font-mono text-base font-bold px-4 py-2 rounded-xl ${
      isLow ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-indigo-100 text-indigo-700'
    }`}>
      <Clock size={16} />
      {h > 0 && `${String(h).padStart(2, '0')}:`}
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  )
}

export default function ExamPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})     // { questionId: 'A' | 'B' | 'C' | 'D' }
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flagged, setFlagged] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  // Tab switch warning
  const [tabWarnings, setTabWarnings] = useState(0)

  useEffect(() => {
    const raw = sessionStorage.getItem('student_session')
    if (!raw) { navigate('/student/login'); return }
    const s = JSON.parse(raw)
    setSession(s)

    // Load questions for this assessment
    api.get(`/student/exam/${s.assessmentId}/questions`, {
      headers: { Authorization: `Bearer ${s.token}` },
    }).then(r => {
      // Shuffle questions for this student
      setQuestions(shuffleArray(r.data || []))
    }).catch(() => {
      toast.error('Failed to load exam questions')
      navigate('/student/login')
    }).finally(() => setLoading(false))
  }, [navigate])

  // Fullscreen hint
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {})
  }, [])

  // Tab switch detection
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && !submitted) {
        setTabWarnings(w => w + 1)
        toast('⚠️ Tab switch detected! This has been recorded.', { duration: 4000 })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [submitted])

  const handleExpire = useCallback(() => {
    if (!submitted) handleSubmit(true)
  }, [submitted])

  async function handleSubmit(autoSubmit = false) {
    if (submitting || submitted) return
    if (!autoSubmit) {
      const unanswered = questions.filter(q => !answers[q.id]).length
      if (unanswered > 0) {
        if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return
      }
    }

    setSubmitting(true)
    setSubmitted(true)

    try {
      const payload = {
        studentId: session.studentId,
        assessmentId: session.assessmentId,
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
          questionId: parseInt(questionId),
          selectedOption,
        })),
        tabSwitchCount: tabWarnings,
      }

      const { data } = await api.post('/student/exam/submit', payload, {
        headers: { Authorization: `Bearer ${session.token}` },
      })

      sessionStorage.setItem('exam_result', JSON.stringify(data))
      toast.success('Exam submitted successfully!')
      navigate('/student/complete')
    } catch (err) {
      toast.error(err.response?.data || 'Submission failed')
      setSubmitting(false)
      setSubmitted(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your exam…</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500">No questions available for this assessment.</p>
      </div>
    )
  }

  const q = questions[currentIdx]
  const OPTIONS = ['A', 'B', 'C', 'D']
  const optionMap = { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }
  const answered = Object.keys(answers).length
  const durationSeconds = (session?.durationMinutes || 60) * 60

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <span className="font-bold text-indigo-700 text-lg">Evally</span>
          <span className="text-gray-400 text-sm ml-3">
            Enrollment: <span className="font-medium text-gray-700">{session?.enrollmentNumber}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {tabWarnings > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
              <AlertTriangle size={13} /> {tabWarnings} tab switch{tabWarnings > 1 ? 'es' : ''} detected
            </div>
          )}
          <Timer seconds={durationSeconds} onExpire={handleExpire} />
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit Exam'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span>{answered} answered · {questions.length - answered} remaining</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <p className="text-gray-900 font-medium text-base leading-relaxed flex-1">
                <span className="text-indigo-400 font-bold mr-2">Q{currentIdx + 1}.</span>
                {q.questionText}
              </p>
              <button
                onClick={() => setFlagged(prev => {
                  const s = new Set(prev)
                  s.has(q.id) ? s.delete(q.id) : s.add(q.id)
                  return s
                })}
                className={`shrink-0 p-2 rounded-lg transition ${
                  flagged.has(q.id) ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:bg-gray-100'
                }`}
                title="Flag for review"
              >
                <Flag size={16} />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                  className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl border-2 text-left transition ${
                    answers[q.id] === opt
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    answers[q.id] === opt ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {opt}
                  </span>
                  <span className="text-sm">{optionMap[opt]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
              disabled={currentIdx === questions.length - 1}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Question navigator sidebar */}
        <aside className="w-56 border-l border-gray-200 bg-white px-4 py-6 overflow-y-auto shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Questions</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((qn, idx) => {
              const isAnswered = !!answers[qn.id]
              const isFlagged = flagged.has(qn.id)
              const isCurrent = idx === currentIdx
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-full aspect-square text-xs font-semibold rounded-lg flex items-center justify-center transition ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isFlagged
                      ? 'bg-amber-200 text-amber-800'
                      : isAnswered
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          <div className="mt-5 space-y-2 text-xs">
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-200 inline-block" /> Answered</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-amber-200 inline-block" /> Flagged</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-100 inline-block" /> Not visited</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-indigo-600 inline-block" /> Current</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
