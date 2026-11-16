import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { BookOpen, User, Lock, Eye, EyeOff } from 'lucide-react'

export default function StudentLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const assessmentId = params.get('a')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/student/login', { username, password })
      // Store student session
      sessionStorage.setItem('student_session', JSON.stringify({
        token: data.token,
        enrollmentNumber: data.enrollmentNumber,
        assessmentId: data.assessmentId,
        studentId: data.studentId,
      }))
      toast.success('Logged in! Please read the instructions.')
      navigate('/student/instructions')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials. Please check your username and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 text-white rounded-2xl p-4 mb-3">
              <BookOpen size={30} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Evally</h1>
            <p className="text-sm text-gray-500 mt-1">Student Exam Portal</p>
          </div>

          <h2 className="text-base font-semibold text-gray-800 mb-5">Enter Your Credentials</h2>
          <p className="text-xs text-gray-500 mb-5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Use the username and password provided to you by your college/exam coordinator.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Your exam username"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your exam password"
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Start Exam →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
