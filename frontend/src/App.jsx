import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AuthProvider } from './context/AuthContext'

// Auth
import LoginPage from './pages/LoginPage'

// Admin pages
import AdminLayout from './layouts/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import CreateAssessmentPage from './pages/admin/CreateAssessmentPage'
import AssessmentDetailPage from './pages/admin/AssessmentDetailPage'
import StudentsPage from './pages/admin/StudentsPage'
import ResultsPage from './pages/admin/ResultsPage'

// Student pages
import StudentLoginPage from './pages/student/StudentLoginPage'
import InstructionsPage from './pages/student/InstructionsPage'
import ExamPage from './pages/student/ExamPage'
import ExamCompletePage from './pages/student/ExamCompletePage'

function ProtectedRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student/login" element={<StudentLoginPage />} />
      <Route path="/student/instructions" element={<InstructionsPage />} />
      <Route path="/student/exam" element={<ExamPage />} />
      <Route path="/student/complete" element={<ExamCompletePage />} />

      {/* Admin / Super Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="SUPER_ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="assessments/new" element={<CreateAssessmentPage />} />
        <Route path="assessments/:id" element={<AssessmentDetailPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="results" element={<ResultsPage />} />
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={
          user?.role === 'SUPER_ADMIN'
            ? <Navigate to="/admin" replace />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
