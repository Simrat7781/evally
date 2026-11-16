import { useEffect, useState } from 'react'
import { CheckCircle, Award, XCircle } from 'lucide-react'

export default function ExamCompletePage() {
  const [result, setResult] = useState(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('exam_result')
    if (raw) setResult(JSON.parse(raw))
    // Clear session after completion
    sessionStorage.removeItem('student_session')
    sessionStorage.removeItem('exam_result')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-green-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
            result?.passed ? 'bg-green-100' : 'bg-indigo-100'
          }`}>
            {result?.passed
              ? <Award size={40} className="text-green-600" />
              : <CheckCircle size={40} className="text-indigo-600" />
            }
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Exam Submitted!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Thank you for completing the assessment. Your responses have been recorded.
          </p>

          {result && (
            <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Enrollment Number</span>
                <span className="font-semibold text-gray-900">{result.enrollmentNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Score</span>
                <span className="font-semibold text-gray-900">{result.score} / {result.totalMarks}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Percentage</span>
                <span className={`font-bold ${result.passed ? 'text-green-600' : 'text-red-500'}`}>
                  {result.percentage?.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Result</span>
                <span className={`font-bold ${result.passed ? 'text-green-600' : 'text-red-500'}`}>
                  {result.passed ? '✓ Pass' : '✗ Fail'}
                </span>
              </div>
            </div>
          )}

          {!result && (
            <div className="bg-indigo-50 rounded-xl p-4 mb-6 text-sm text-indigo-800">
              Your results will be available once the assessment period ends.
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            Your session has been closed. This window can be safely closed. Do not attempt to re-login with the same credentials.
          </div>
        </div>
      </div>
    </div>
  )
}
