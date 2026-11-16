import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Users, Upload, Download, Trash2, Copy, RefreshCw,
  CheckCircle, Clock, Hash, FileText
} from 'lucide-react'

function Badge({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[color]}`}>
      {children}
    </span>
  )
}

export default function AssessmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [assessment, setAssessment] = useState(null)
  const [students, setStudents] = useState([]) // temp credentials
  const [enrollmentInput, setEnrollmentInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Load assessment details
    api.get(`/assessments/${id}`)
      .then(r => setAssessment(r.data))
      .catch(() => toast.error('Assessment not found'))
      .finally(() => setLoading(false))

    // Load existing temp students for this assessment
    api.get(`/assessments/${id}/students`)
      .then(r => setStudents(r.data || []))
      .catch(() => setStudents([]))
  }, [id])

  async function handleGenerateCredentials() {
    const lines = enrollmentInput.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return toast.error('Enter at least one enrollment number')
    setGenerating(true)
    try {
      const { data } = await api.post(`/assessments/${id}/students/generate`, {
        enrollmentNumbers: lines,
      })
      setStudents(data)
      toast.success(`Generated credentials for ${data.length} students`)
      setEnrollmentInput('')
    } catch (err) {
      toast.error(err.response?.data || 'Failed to generate credentials')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCleanup() {
    if (!confirm('This will permanently delete all temp credentials and student data for this assessment. Continue?')) return
    try {
      await api.delete(`/assessments/${id}/students/cleanup`)
      setStudents([])
      toast.success('Cleanup complete. All temp credentials removed.')
    } catch (err) {
      toast.error(err.response?.data || 'Cleanup failed')
    }
  }

  function copyAll() {
    const text = students.map(s =>
      `${s.enrollmentNumber} | ${s.username} | ${s.password}`
    ).join('\n')
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  function exportCSV() {
    const header = 'EnrollmentNumber,Username,Password,ExamLink\n'
    const examLink = `${window.location.origin}/student/login?a=${id}`
    const rows = students.map(s =>
      `${s.enrollmentNumber},${s.username},${s.password},${examLink}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${assessment?.title?.replace(/\s+/g, '_')}_credentials.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  if (loading) {
    return <div className="p-8 text-gray-400">Loading assessment…</div>
  }

  if (!assessment) {
    return <div className="p-8 text-red-500">Assessment not found.</div>
  }

  const examLink = `${window.location.origin}/student/login?a=${id}`

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{assessment.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={assessment.difficulty === 'Hard' ? 'red' : assessment.difficulty === 'Medium' ? 'amber' : 'green'}>
            {assessment.difficulty}
          </Badge>
          <Badge color="indigo">{assessment.durationMinutes} min</Badge>
          <Badge>{assessment.totalQuestions} questions</Badge>
        </div>
      </div>

      {/* Exam link */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-indigo-700 mb-1">Student Exam Link</p>
          <p className="text-sm text-indigo-900 font-mono break-all">{examLink}</p>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(examLink); toast.success('Link copied!') }}
          className="ml-4 p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg"
        >
          <Copy size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {['overview', 'students'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition capitalize ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-5">
          <InfoCard icon={Hash} label="Total Questions" value={assessment.totalQuestions} />
          <InfoCard icon={Clock} label="Duration" value={`${assessment.durationMinutes} minutes`} />
          <InfoCard icon={FileText} label="Difficulty" value={assessment.difficulty} />
          <InfoCard icon={CheckCircle} label="Status" value={assessment.active ? 'Active' : 'Inactive'} />
        </div>
      )}

      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Enrollment upload */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Upload size={16} /> Upload Enrollment Numbers
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Paste enrollment numbers (one per line). Evally will generate a unique username &amp; password for each.
            </p>
            <textarea
              value={enrollmentInput}
              onChange={e => setEnrollmentInput(e.target.value)}
              rows={6}
              placeholder={'ENR001\nENR002\nENR003'}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleGenerateCredentials}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60"
              >
                <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Generating…' : 'Generate Credentials'}
              </button>
            </div>
          </div>

          {/* Credentials table */}
          {students.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users size={16} /> {students.length} Students
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Copy size={13} /> Copy All
                  </button>
                  <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50">
                    <Download size={13} /> Export CSV
                  </button>
                  <button onClick={handleCleanup} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-700 border border-red-300 rounded-lg hover:bg-red-50">
                    <Trash2 size={13} /> Cleanup
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="text-left px-6 py-3">#</th>
                      <th className="text-left px-6 py-3">Enrollment No.</th>
                      <th className="text-left px-6 py-3">Username</th>
                      <th className="text-left px-6 py-3">Password</th>
                      <th className="text-left px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((s, i) => (
                      <tr key={s.id || i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">{s.enrollmentNumber}</td>
                        <td className="px-6 py-3 font-mono text-indigo-700">{s.username}</td>
                        <td className="px-6 py-3 font-mono text-gray-700">{s.password}</td>
                        <td className="px-6 py-3">
                          <Badge color={s.examCompleted ? 'green' : 'amber'}>
                            {s.examCompleted ? 'Completed' : 'Pending'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {students.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl shadow-sm">
              <Users size={36} className="mx-auto mb-3 text-gray-300" />
              No students added yet. Upload enrollment numbers above.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
      <div className="bg-indigo-50 rounded-xl p-3 text-indigo-600">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-base font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
