import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, formatTimestamp, getTrimmedSignature } from '../lib/utils'
import { downloadPng } from '../lib/downloadPng'
import InvitationCard from '../components/InvitationCard'

export default function Admin() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
  }, [])

  if (loading) return null
  if (!session) return <LoginView onLogin={setSession} />
  return <Dashboard session={session} onLogout={() => setSession(null)} />
}

/* ─── Login ─── */
function LoginView({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleLogin = async () => {
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter email and password.')
      return
    }
    setBusy(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (err) { setError(err.message); return }
    onLogin(data.session)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-brand-dark via-brand to-accent text-white h-16 flex items-center px-8 shadow-md">
        <h1 className="text-lg font-semibold">LamAsia <span className="font-normal opacity-75">Admin</span></h1>
      </header>
      <div className="max-w-[400px] mx-auto mt-24 px-6">
        <div className="bg-white rounded-xl p-7 shadow-lg">
          <img src="/logo.png" alt="LamAsia" className="h-10 mx-auto mb-5 block" />
          <h2 className="text-xs uppercase tracking-wider text-gray-500 text-center mb-5 font-semibold">Admin Login</h2>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5">Email</label>
            <input type="email" className="input-field" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button className="btn-primary" onClick={handleLogin} disabled={busy}>
            {busy ? 'Logging in...' : 'Log In'}
          </button>
          {error && <div className="mt-3 p-2.5 bg-red-50 text-red-800 rounded-lg text-xs">{error}</div>}
        </div>
      </div>
    </div>
  )
}

/* ─── Dashboard ─── */
function Dashboard({ session, onLogout }) {
  const [requests, setRequests] = useState([])
  const [tab, setTab] = useState('pending')
  const [viewData, setViewData] = useState(null)
  const [approveId, setApproveId] = useState(null)
  const [search, setSearch] = useState('')

  const loadRequests = useCallback(async () => {
    const { data } = await supabase.from('requests').select('*').order('created_at', { ascending: false })
    setRequests(data || [])
  }, [])

  useEffect(() => { loadRequests() }, [loadRequests])

  const counts = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }

  const filtered = requests.filter((r) => {
    if (r.status !== tab) return false
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    const ref = r.id.split('-')[0].toLowerCase()
    return ref.includes(q) || r.id.toLowerCase().includes(q) ||
      (r.supplier_name || '').toLowerCase().includes(q) ||
      (r.contact_person || '').toLowerCase().includes(q)
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const updateStatus = async (id, status) => {
    await supabase.from('requests').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id)
    await loadRequests()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-brand-dark via-brand to-accent text-white h-16 flex justify-between items-center px-8 shadow-md relative z-10">
        <h1 className="text-lg font-semibold">LamAsia <span className="font-normal opacity-75">Admin Dashboard</span></h1>
        <div className="flex items-center gap-4">
          <span className="text-xs opacity-80">{session.user.email}</span>
          <button onClick={handleLogout} className="bg-white/10 border border-white/25 text-white px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-white/20 transition-colors">
            Log out
          </button>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto p-7">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          {(['pending', 'approved', 'rejected']).map((status) => {
            const colors = {
              pending: { bar: 'bg-amber-400', num: 'text-amber-600', active: 'border-amber-400' },
              approved: { bar: 'bg-green-500', num: 'text-green-600', active: 'border-green-500' },
              rejected: { bar: 'bg-red-500', num: 'text-red-600', active: 'border-red-500' },
            }
            const c = colors[status]
            return (
              <button
                key={status}
                onClick={() => setTab(status)}
                className={`bg-white rounded-xl p-5 border transition-all text-left cursor-pointer relative overflow-hidden hover:shadow-md ${
                  tab === status ? `${c.active} border-2 shadow-md` : 'border-gray-200'
                }`}
              >
                <div className={`absolute top-0 left-0 right-0 h-[3px] ${c.bar}`} />
                <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                  {status}
                </div>
                <div className={`text-3xl font-bold ${c.num}`}>{counts[status]}</div>
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 gap-3">
            <div className="text-sm font-bold whitespace-nowrap">
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Requests{' '}
              <span className="font-normal text-gray-500 text-xs ml-1.5">{filtered.length} total</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search ref, supplier, contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-56 focus:outline-none focus:border-brand-light focus:ring-2 focus:ring-accent/20"
              />
              <button
                onClick={loadRequests}
                className="bg-gray-100 border border-gray-200 text-gray-500 px-3.5 py-1.5 rounded-lg text-xs cursor-pointer font-medium hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">
              <span className="text-4xl block mb-3 opacity-50">
                {tab === 'pending' ? '📋' : tab === 'approved' ? '✅' : '❌'}
              </span>
              No {tab} requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {['Ref', 'Supplier', 'Appointment', 'Contact', 'Submitted', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-200">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const ref = r.id.split('-')[0].toUpperCase()
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 text-sm border-b border-gray-100">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded font-semibold tracking-wide text-brand">{ref}</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm border-b border-gray-100 font-semibold">{r.supplier_name}</td>
                        <td className="px-4 py-3.5 text-sm border-b border-gray-100">{r.day}, {formatDate(r.appointment_date)}</td>
                        <td className="px-4 py-3.5 text-sm border-b border-gray-100">{r.contact_person}</td>
                        <td className="px-4 py-3.5 text-sm border-b border-gray-100">{formatTimestamp(r.created_at)}</td>
                        <td className="px-4 py-3.5 text-sm border-b border-gray-100">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3.5 text-sm border-b border-gray-100">
                          {r.status === 'pending' && (
                            <>
                              <ActionBtn color="green" onClick={() => setApproveId(r.id)}>Approve</ActionBtn>
                              <ActionBtn color="red" onClick={() => updateStatus(r.id, 'rejected')}>Reject</ActionBtn>
                            </>
                          )}
                          <ActionBtn color="blue" onClick={() => setViewData(r)}>View Card</ActionBtn>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Card Modal */}
      {viewData && (
        <Modal onClose={() => setViewData(null)}>
          <InvitationCard data={viewData} />
          <div className="flex gap-2.5 mt-4">
            <button className="btn-secondary" onClick={() => downloadPng(viewData)}>Download PNG</button>
            <button className="btn-primary" onClick={() => window.print()}>Print / Save PDF</button>
          </div>
        </Modal>
      )}

      {/* Approve Modal */}
      {approveId && (
        <ApproveModal
          id={approveId}
          onClose={() => setApproveId(null)}
          onApproved={() => { setApproveId(null); loadRequests() }}
        />
      )}
    </div>
  )
}

/* ─── Approve Modal ─── */
function ApproveModal({ id, onClose, onApproved }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const drawingRef = useRef(false)
  const hasInkRef = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1c2733'
    ctxRef.current = ctx
  }, [])

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const t = e.touches ? e.touches[0] : e
    return { x: t.clientX - rect.left, y: t.clientY - rect.top }
  }

  const handleStart = (e) => {
    drawingRef.current = true
    hasInkRef.current = true
    setHasInk(true)
    const { x, y } = getPos(e)
    ctxRef.current.beginPath()
    ctxRef.current.moveTo(x, y)
    e.preventDefault()
  }

  const handleMove = (e) => {
    if (!drawingRef.current) return
    const { x, y } = getPos(e)
    ctxRef.current.lineTo(x, y)
    ctxRef.current.stroke()
    e.preventDefault()
  }

  const handleEnd = () => { drawingRef.current = false }

  useEffect(() => {
    window.addEventListener('mouseup', handleEnd)
    return () => window.removeEventListener('mouseup', handleEnd)
  }, [])

  const clearSig = () => {
    const canvas = canvasRef.current
    ctxRef.current?.clearRect(0, 0, canvas.width, canvas.height)
    hasInkRef.current = false
    setHasInk(false)
  }

  const handleConfirm = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!hasInkRef.current) { setError('Please provide your signature.'); return }
    setError('')
    setBusy(true)

    const trimmed = getTrimmedSignature(canvasRef.current, ctxRef.current)
    const sigData = trimmed ? trimmed.toDataURL('image/png') : canvasRef.current.toDataURL('image/png')

    const { error: err } = await supabase.from('requests').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      approved_by: name.trim(),
      approver_signature: sigData,
    }).eq('id', id)

    setBusy(false)
    if (err) { setError('Error: ' + err.message); return }
    onApproved()
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <h3 className="text-lg font-bold mb-5">Approve Request</h3>
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1.5">Approved By</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. John Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1.5">Your Signature</label>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-[150px] border border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-crosshair block touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
          {!hasInk && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
              Sign here with mouse or finger
            </div>
          )}
        </div>
        <button type="button" onClick={clearSig} className="text-brand-light text-xs cursor-pointer mt-1 bg-transparent border-none">
          Clear signature
        </button>
      </div>
      {error && <div className="p-2.5 bg-red-50 text-red-800 rounded-lg text-xs mb-3">{error}</div>}
      <div className="flex gap-2.5">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleConfirm} disabled={busy}>
          {busy ? 'Approving...' : 'Confirm Approval'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Shared UI pieces ─── */
function Modal({ children, onClose, maxWidth = 'max-w-[720px]' }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-gray-100 rounded-2xl p-7 ${maxWidth} w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-[modalIn_0.2s_ease]`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-5 bg-white border border-gray-200 w-8 h-8 rounded-lg text-lg cursor-pointer text-gray-500 flex items-center justify-center hover:bg-gray-100 hover:text-gray-800 transition-colors"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${styles[status]}`}>
      {status}
    </span>
  )
}

function ActionBtn({ children, color, onClick }) {
  const styles = {
    green: 'bg-green-100 text-green-800 hover:bg-green-200',
    red: 'bg-red-100 text-red-800 hover:bg-red-200',
    blue: 'bg-blue-50 text-brand hover:bg-blue-100',
  }
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none mr-1.5 transition-colors active:scale-95 ${styles[color]}`}
    >
      {children}
    </button>
  )
}
