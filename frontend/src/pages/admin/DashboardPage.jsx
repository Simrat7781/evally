import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { ClipboardList, Users, BarChart2, Plus, ChevronRight, Calendar } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
      <div className={`${color} rounded-xl p-3 text-white`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // We load assessments list from the endpoint we'll add
    api.get('/assessments')
      .then(r => setAssessments(r.data || []))
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, Super Admin</p>
        </div>
        <button
          onClick={() => navigate('/admin/assessments/new')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <Plus size={16} />
          New Assessment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard icon={ClipboardList} label="Total Assessments" value={assessments.length} color="bg-indigo-500" />
        <StatCard icon={Users} label="Active Students" value="—" color="bg-emerald-500" />
        <StatCard icon={BarChart2} label="Completed Exams" value="—" color="bg-amber-500" />
      </div>

      {/* Recent assessments */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Assessments</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No assessments yet.</p>
            <button
              onClick={() => navigate('/admin/assessments/new')}
              className="mt-4 text-indigo-600 text-sm hover:underline font-medium"
            >
              Create your first assessment →
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {assessments.slice(0, 10).map(a => (
              <li
                key={a.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition"
                onClick={() => navigate(`/admin/assessments/${a.id}`)}
              >
                <div>
                  <p className="font-medium text-gray-900">{a.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} /> {a.durationMinutes} min
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                      a.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {a.difficulty}
                    </span>
                    <span className="text-xs text-gray-400">{a.totalQuestions} questions</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
