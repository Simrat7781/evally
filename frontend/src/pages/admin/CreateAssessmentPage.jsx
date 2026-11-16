import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Sparkles, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

const SECTIONS = ['Aptitude', 'Reasoning', 'DSA', 'Automata', 'Debugging', 'Coding', 'English']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

function SectionConfig({ section, config, onChange }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-800">{section}</span>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={e => onChange({ ...config, enabled: e.target.checked })}
            className="rounded border-gray-300 text-indigo-600"
          />
          Include
        </label>
      </div>
      {config.enabled && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Questions</label>
            <input
              type="number"
              min={1}
              max={50}
              value={config.count}
              onChange={e => onChange({ ...config, count: parseInt(e.target.value) || 1 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Difficulty</label>
            <select
              value={config.difficulty}
              onChange={e => onChange({ ...config, difficulty: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionPreviewCard({ q, index, onApprove, onReject, approved, rejected }) {
  return (
    <div className={`border rounded-xl p-4 transition ${
      approved ? 'border-green-400 bg-green-50' :
      rejected ? 'border-red-300 bg-red-50 opacity-60' :
      'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-medium text-gray-900 flex-1">
          <span className="text-gray-400 mr-1">Q{index + 1}.</span> {q.questionText}
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onApprove(index)}
            className={`p-1.5 rounded-lg transition ${approved ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'}`}
          >
            <CheckCircle size={16} />
          </button>
          <button
            onClick={() => onReject(index)}
            className={`p-1.5 rounded-lg transition ${rejected ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600'}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
        {['A', 'B', 'C', 'D'].map(opt => (
          <div
            key={opt}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
              q.correctOption === opt ? 'bg-green-100 text-green-800 font-semibold' : 'bg-gray-50'
            }`}
          >
            <span className="font-bold">{opt}.</span> {q[`option${opt}`]}
          </div>
        ))}
      </div>
      {q.explanation && (
        <p className="mt-2 text-xs text-gray-500 italic">💡 {q.explanation}</p>
      )}
    </div>
  )
}

export default function CreateAssessmentPage() {
  const navigate = useNavigate()

  // Step 1: Assessment meta
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60)
  const [globalDifficulty, setGlobalDifficulty] = useState('Medium')

  // Step 2: Sections
  const [sections, setSections] = useState(
    Object.fromEntries(SECTIONS.map(s => [s, { enabled: false, count: 5, difficulty: 'Medium' }]))
  )

  // Step 3: AI generated questions
  const [generatedBySection, setGeneratedBySection] = useState({}) // { section: [questions] }
  const [approvedBySection, setApprovedBySection] = useState({})   // { section: Set(indices) }
  const [rejectedBySection, setRejectedBySection] = useState({})
  const [generating, setGenerating] = useState(false)
  const [currentGenSection, setCurrentGenSection] = useState(null)

  // Step
  const [step, setStep] = useState(1)
  const [savedAssessment, setSavedAssessment] = useState(null)
  const [saving, setSaving] = useState(false)

  const enabledSections = SECTIONS.filter(s => sections[s].enabled)

  async function handleCreateAssessment() {
    if (!title.trim()) return toast.error('Title is required')
    if (enabledSections.length === 0) return toast.error('Enable at least one section')
    setSaving(true)
    try {
      const { data } = await api.post('/assessments', {
        title,
        description,
        durationMinutes: duration,
        difficulty: globalDifficulty,
      })
      setSavedAssessment(data)
      setStep(2)
      toast.success('Assessment created! Now generate questions.')
    } catch (err) {
      toast.error(err.response?.data || 'Failed to create assessment')
    } finally {
      setSaving(false)
    }
  }

  async function generateForSection(section) {
    const cfg = sections[section]
    setCurrentGenSection(section)
    setGenerating(true)
    try {
      const { data } = await api.post('/ai/generate', {
        topic: section,
        difficulty: cfg.difficulty,
        numberOfQuestions: cfg.count,
      })
      setGeneratedBySection(prev => ({ ...prev, [section]: data }))
      // Auto-approve all
      setApprovedBySection(prev => ({
        ...prev,
        [section]: new Set(data.map((_, i) => i)),
      }))
      setRejectedBySection(prev => ({ ...prev, [section]: new Set() }))
      toast.success(`Generated ${data.length} questions for ${section}`)
    } catch (err) {
      toast.error(`Failed to generate for ${section}: ${err.response?.data || err.message}`)
    } finally {
      setGenerating(false)
      setCurrentGenSection(null)
    }
  }

  function handleApprove(section, idx) {
    setApprovedBySection(prev => {
      const s = new Set(prev[section] || [])
      s.add(idx)
      return { ...prev, [section]: s }
    })
    setRejectedBySection(prev => {
      const s = new Set(prev[section] || [])
      s.delete(idx)
      return { ...prev, [section]: s }
    })
  }

  function handleReject(section, idx) {
    setRejectedBySection(prev => {
      const s = new Set(prev[section] || [])
      s.add(idx)
      return { ...prev, [section]: s }
    })
    setApprovedBySection(prev => {
      const s = new Set(prev[section] || [])
      s.delete(idx)
      return { ...prev, [section]: s }
    })
  }

  async function handleSaveAllQuestions() {
    const allApproved = []
    for (const section of enabledSections) {
      const qs = generatedBySection[section] || []
      const approved = approvedBySection[section] || new Set()
      qs.forEach((q, i) => {
        if (approved.has(i)) allApproved.push(q)
      })
    }
    if (allApproved.length === 0) return toast.error('No questions approved!')
    setSaving(true)
    try {
      await api.post(`/assessments/${savedAssessment.id}/questions`, allApproved)
      toast.success(`${allApproved.length} questions saved!`)
      navigate(`/admin/assessments/${savedAssessment.id}`)
    } catch (err) {
      toast.error(err.response?.data || 'Failed to save questions')
    } finally {
      setSaving(false)
    }
  }

  const allSectionsGenerated = enabledSections.every(s => generatedBySection[s])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step === 1 ? navigate('/admin') : setStep(1)} className="text-gray-500 hover:text-gray-800">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Assessment</h1>
          <p className="text-sm text-gray-500">Step {step} of 2</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-indigo-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Assessment Details</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Campus Placement Drive 2025"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of this assessment…"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (minutes)</label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={duration}
                  onChange={e => setDuration(parseInt(e.target.value) || 60)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Default Difficulty</label>
                <select
                  value={globalDifficulty}
                  onChange={e => setGlobalDifficulty(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Configure Sections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SECTIONS.map(section => (
                <SectionConfig
                  key={section}
                  section={section}
                  config={sections[section]}
                  onChange={cfg => setSections(prev => ({ ...prev, [section]: cfg }))}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateAssessment}
            disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-60"
          >
            {saving ? 'Creating…' : 'Create Assessment & Generate Questions →'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
            <Sparkles size={18} className="text-indigo-600" />
            <div>
              <p className="text-sm font-medium text-indigo-900">AI Question Generation</p>
              <p className="text-xs text-indigo-700">Generate questions for each section, review them, then save.</p>
            </div>
          </div>

          {enabledSections.map(section => {
            const qs = generatedBySection[section]
            const approved = approvedBySection[section] || new Set()
            const rejected = rejectedBySection[section] || new Set()
            const isGen = currentGenSection === section && generating

            return (
              <div key={section} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{section}</h3>
                    <p className="text-xs text-gray-500">
                      {sections[section].count} questions · {sections[section].difficulty}
                    </p>
                  </div>
                  <button
                    onClick={() => generateForSection(section)}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-60"
                  >
                    <Sparkles size={14} />
                    {isGen ? 'Generating…' : qs ? 'Regenerate' : 'Generate'}
                  </button>
                </div>

                {qs && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                      <span className="text-green-600 font-medium">{approved.size} approved</span>
                      <span className="text-red-500">{rejected.size} rejected</span>
                      <span>{qs.length - approved.size - rejected.size} pending</span>
                    </div>
                    {qs.map((q, i) => (
                      <QuestionPreviewCard
                        key={i}
                        q={q}
                        index={i}
                        onApprove={(idx) => handleApprove(section, idx)}
                        onReject={(idx) => handleReject(section, idx)}
                        approved={approved.has(i)}
                        rejected={rejected.has(i)}
                      />
                    ))}
                  </div>
                )}

                {!qs && !isGen && (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    Click "Generate" to create AI-powered questions for this section.
                  </div>
                )}
                {isGen && (
                  <div className="text-center py-6 text-indigo-500 text-sm animate-pulse">
                    Generating questions…
                  </div>
                )}
              </div>
            )
          })}

          <div className="sticky bottom-4">
            <button
              onClick={handleSaveAllQuestions}
              disabled={saving || !allSectionsGenerated}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition disabled:opacity-60 shadow-lg"
            >
              {saving ? 'Saving…' : `Save All Approved Questions & Continue →`}
            </button>
            {!allSectionsGenerated && (
              <p className="text-center text-xs text-gray-400 mt-2">
                Generate questions for all enabled sections first
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
