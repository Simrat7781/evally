import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart2,
  LogOut,
  BookOpen,
} from 'lucide-react'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/assessments/new', label: 'New Assessment', icon: ClipboardList },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/results', label: 'Results', icon: BarChart2 },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-indigo-800">
          <div className="bg-indigo-500 rounded-lg p-2">
            <BookOpen size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Evally</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-700 text-white shadow'
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-indigo-800 px-4 py-4">
          <div className="mb-3 px-2">
            <p className="text-xs text-indigo-300">Signed in as</p>
            <p className="text-sm font-semibold truncate">{user?.email}</p>
            <span className="text-xs bg-indigo-700 text-indigo-200 rounded px-2 py-0.5 mt-1 inline-block">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm text-indigo-200 hover:bg-indigo-800 hover:text-white transition"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
