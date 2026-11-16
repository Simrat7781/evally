import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, Shuffle, CheckSquare, ChevronRight } from 'lucide-react'

const RULES = [
  { icon: Clock, text: 'The exam is time-bound. The timer starts as soon as you click "Start Exam".' },
  { icon: Shuffle, text: 'Questions are shuffled randomly — every student gets a different order.' },
  { icon: AlertTriangle, text: 'Do NOT close or refresh the browser during the exam. Your progress may be lost.' },
  { icon: AlertTriangle, text: 'Do NOT switch tabs or minimize the browser. This is flagged automatically.' },
  { icon: CheckSquare, text: 'Each MCQ has exactly one correct answer. Choose carefully before moving on.' },
  { icon: CheckSquare, text: 'You can navigate back and forth between questions before submitting.' },
  { icon: AlertTriangle, text: 'Once you submit the exam, it cannot be retaken.' },
]

export default function InstructionsPage() {
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)
  const [session, setSession] = useState(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('student_session')
    if (!raw) {
      navigate('/student/login')
      return
    }
    setSession(JSON.parse(raw))
  }, [navigate])

  function handleStart() {
    if (!agreed) return
    navigate('/student/exam')
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-8 py-6 text-white">
            <h1 className="text-xl font-bold">Exam Instructions</h1>
            <p className="text-indigo-200 text-sm mt-1">
              Please read carefully before starting your exam.
            </p>
          </div>

          <div className="px-8 py-6">
            {/* Student info */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4 mb-6">
              <p className="text-sm text-indigo-700">
                <span className="font-semibold">Enrollment Number:</span> {session.enrollmentNumber}
              </p>
            </div>

            {/* Rules */}
            <h2 className="font-semibold text-gray-900 mb-4">Important Rules</h2>
            <ul className="space-y-3 mb-6">
              {RULES.map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <div className="mt-0.5 shrink-0">
                    <Icon size={16} className="text-indigo-500" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
              <p className="text-sm text-amber-800 font-medium">
                ⚠️ Exam integrity is monitored. Suspicious behavior will be recorded and reviewed.
              </p>
            </div>

            {/* Agreement */}
            <label className="flex items-center gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                I have read and understood all the instructions. I agree to follow the exam rules.
              </span>
            </label>

            <button
              onClick={handleStart}
              disabled={!agreed}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start Exam <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
