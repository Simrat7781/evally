import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { BarChart2, Download, Trophy, TrendingUp, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResultsPage() {
  const [results, setResults] = useState([])
  const [assessments, setAssessments] = useState([])
  const [selectedAssessment, setSelectedAssessment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/assessments')
      .then(r => setAssessments(r.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedAssessment) return
    setLoading(true)
    api.get(`/assessments/${selectedAssessment}/results`)
      .then(r => setResults(r.data || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [selectedAssessment])

  function exportExcel() {
    if (results.length === 0) return
    // Build CSV (opens in Excel)
    const header = 'Rank,EnrollmentNumber,StudentName,Score,TotalMarks,Percentage,Status\n'
    const rows = results.map((r, i) =>
      `${i + 1},${r.enrollmentNumber},${r.studentName || ''},${r.score},${r.totalMarks},${r.percentage?.toFixed(1)}%,${r.passed ? 'Pass' : 'Fail'}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const asmTitle = assessments.find(a => a.id == selectedAssessment)?.title || 'results'
    a.download = `${asmTitle.replace(/\s+/g, '_')}_results.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Results exported')
  }

  const avg = results.length > 0
    ? (results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length).toFixed(1)
    : null
  const topScore = results.length > 0 ? Math.max(...results.map(r => r.percentage || 0)).toFixed(1) : null
  const passCount = results.filter(r => r.passed).length

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results & Reports</h1>
          <p className="text-sm text-gray-500 mt-1">View rankings and export reports</p>
        </div>
        {results.length > 0 && (
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition"
          >
            <Download size={15} /> Export to Excel
          </button>
        )}
      </div>

      {/* Select assessment */}
      <div className="mb-6">
        <select
          value={selectedAssessment}
          onChange={e => setSelectedAssessment(e.target.value)}
          className="w-full md:w-80 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">— Select Assessment —</option>
          {assessments.map(a => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      </div>

      {/* Summary stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={BarChart2} label="Total Appeared" value={results.length} color="bg-indigo-500" />
          <StatCard icon={Trophy} label="Top Score" value={`${topScore}%`} color="bg-amber-500" />
          <StatCard icon={TrendingUp} label="Average Score" value={`${avg}%`} color="bg-blue-500" />
          <StatCard icon={TrendingDown} label="Pass Count" value={passCount} color="bg-green-500" />
        </div>
      )}

      {/* Results table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {!selectedAssessment && (
          <div className="p-12 text-center text-gray-400">
            <BarChart2 size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Select an assessment to view results</p>
          </div>
        )}

        {selectedAssessment && loading && (
          <div className="p-8 text-center text-gray-400">Loading results…</div>
        )}

        {selectedAssessment && !loading && results.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <p className="text-sm">No results yet for this assessment.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Rank</th>
                  <th className="text-left px-6 py-3">Enrollment No.</th>
                  <th className="text-left px-6 py-3">Name</th>
                  <th className="text-right px-6 py-3">Score</th>
                  <th className="text-right px-6 py-3">Percentage</th>
                  <th className="text-left px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((r, i) => (
                  <tr key={r.id || i} className={`hover:bg-gray-50 ${i === 0 ? 'bg-amber-50' : ''}`}>
                    <td className="px-6 py-3">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">{r.enrollmentNumber}</td>
                    <td className="px-6 py-3 text-gray-600">{r.studentName || '—'}</td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-900">
                      {r.score} / {r.totalMarks}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold">
                      <span className={r.percentage >= 60 ? 'text-green-600' : 'text-red-500'}>
                        {r.percentage?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {r.passed ? 'Pass' : 'Fail'}
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

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-3">
      <div className={`${color} rounded-xl p-2.5 text-white`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
