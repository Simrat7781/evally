import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { Users, Search, Download, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/students')
      .then(r => setStudents(r.data || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = students.filter(s =>
    s.enrollmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase())
  )

  function exportCSV() {
    if (filtered.length === 0) return
    const header = 'EnrollmentNumber,Username,Assessment,Status\n'
    const rows = filtered.map(s =>
      `${s.enrollmentNumber},${s.username},${s.assessmentTitle || ''},${s.examCompleted ? 'Completed' : 'Pending'}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students_all.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported')
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Students</h1>
          <p className="text-sm text-gray-500 mt-1">Manage temporary exam credentials</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by enrollment or username…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No students found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-6 py-3">#</th>
                  <th className="text-left px-6 py-3">Enrollment No.</th>
                  <th className="text-left px-6 py-3">Username</th>
                  <th className="text-left px-6 py-3">Assessment</th>
                  <th className="text-left px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s, i) => (
                  <tr key={s.id || i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{s.enrollmentNumber}</td>
                    <td className="px-6 py-3 font-mono text-indigo-700">{s.username}</td>
                    <td className="px-6 py-3 text-gray-600">{s.assessmentTitle || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        s.examCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {s.examCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
