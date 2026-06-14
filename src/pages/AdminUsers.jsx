import { useState, useEffect, useCallback } from 'react'
import { getUsers, toggleUserActive, deleteUser, updateUser, registerCook, getOrphanAuthUsers, deleteAuthUser, registerAdmin } from '../data/users'
import { useAuth } from '../contexts/AuthContext'
import { useOrder } from '../contexts/OrderContext'

const ROLE_COLORS = {
  admin: { bg: '#fce4ec', color: '#c62828' },
  superadmin: { bg: '#f3e5f5', color: '#6a1b9a' },
  cook: { bg: '#e8f5e9', color: '#2e7d32' },
  user: { bg: '#e3f2fd', color: '#1565c0' },
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [editName, setEditName] = useState('')
  const [showAddCook, setShowAddCook] = useState(false)
  const [cookForm, setCookForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [cookMsg, setCookMsg] = useState('')
  const [orphans, setOrphans] = useState([])
  const [orphanMsg, setOrphanMsg] = useState('')
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' })
  const [adminMsg, setAdminMsg] = useState('')
  const { user } = useAuth()
  const { getAllOrders } = useOrder()

  const loadOrphans = useCallback(async () => {
    const o = await getOrphanAuthUsers()
    setOrphans(o)
  }, [])

  useEffect(() => { getUsers().then(setUsers); loadOrphans() }, [loadOrphans])

  const handleDeleteOrphan = async (id, email) => {
    if (!window.confirm(`Delete orphan auth user ${email}? This cannot be undone.`)) return
    try {
      await deleteAuthUser(id)
      setOrphanMsg(`${email} deleted`)
      loadOrphans()
    } catch (e) {
      setOrphanMsg(`Failed: ${e.message}`)
    }
  }

  const allOrders = getAllOrders()
  const guestOrders = allOrders.filter(o => !o.user_id && o.delivery?.guestName)

  const guestMap = {}
  guestOrders.forEach(o => {
    const key = `${o.delivery.guestName}|${o.delivery.guestPhone||''}`
    if (!guestMap[key]) guestMap[key] = { name: o.delivery.guestName, phone: o.delivery.guestPhone || '', orders: 0, lastOrder: o.createdAt }
    guestMap[key].orders++
    if (o.createdAt > guestMap[key].lastOrder) guestMap[key].lastOrder = o.createdAt
  })
  const guests = Object.values(guestMap).sort((a, b) => b.orders - a.orders)

  const handleToggle = async (id) => {
    const updated = await toggleUserActive(id)
    if (updated) setUsers(updated)
    loadOrphans()
  }

  const handleDelete = (user) => {
    if (user.role === 'admin' || user.isSuperAdmin) return
    setDeleteTarget(user)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const updated = await deleteUser(deleteTarget.id)
    if (updated) setUsers(updated)
    setDeleteTarget(null)
  }


  const handleEditName = (user) => {
    setEditTarget(user)
    setEditName(user.name)
  }

  const saveEditName = async () => {
    if (!editName.trim()) return
    const updated = await updateUser(editTarget.id, { name: editName.trim() })
    if (updated) setUsers(updated)
    setEditTarget(null)
  }

  const handleAddCook = async () => {
    setCookMsg('')
    const { name, email, password, phone } = cookForm
    if (!name || !email || !password) return setCookMsg('Name, email, and password required')
    if (password.length < 8) return setCookMsg('Password must be at least 8 characters')
    const result = await registerCook(name, email, password, phone)
    if (!result) return setCookMsg('Email already in use')
    const updated = await getUsers()
    setUsers(updated)
    setCookForm({ name: '', email: '', password: '', phone: '' })
    setShowAddCook(false)
  }

  const handleAddAdmin = async () => {
    setAdminMsg('')
    const { name, email, password } = adminForm
    if (!name || !email || !password) return setAdminMsg('Name, email, and password required')
    if (password.length < 8) return setAdminMsg('Password must be at least 8 characters')
    try {
      await registerAdmin(email, password, name)
      const updated = await getUsers()
      setUsers(updated)
      setAdminForm({ name: '', email: '', password: '' })
      setShowAddAdmin(false)
    } catch (e) {
      setAdminMsg(e.message)
    }
  }

  const filtered = filter === 'all' ? users : filter === 'active' ? users.filter(u => u.isActive) : users.filter(u => !u.isActive)

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>User Management</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {user?.is_super_admin && (
            <button className="btn btn-sm btn-primary" onClick={() => setShowAddAdmin(true)}>+ Add Admin</button>
          )}
          <button className="btn btn-sm btn-primary" onClick={() => setShowAddCook(true)}>+ Add Cook</button>
        </div>
      </div>

      <div className="filter-tabs" style={{ marginBottom: 16 }}>
        {[
          { key: 'all', label: `All (${users.length})` },
          { key: 'active', label: `Active (${users.filter(u => u.isActive).length})` },
          { key: 'inactive', label: `Inactive (${users.filter(u => !u.isActive).length})` },
        ].map(f => (
          <button key={f.key} className={`cat-tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="admin-menu-list">
        {filtered.map(u => {
          const rc = ROLE_COLORS[u.role] || { bg: '#f5f5f5', color: '#333' }
          return (
            <div key={u.id} className="admin-menu-item">
              <div className="admin-menu-info">
                <span style={{
                  width: 44, height: 44, borderRadius: '50%', background: rc.bg, color: rc.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem',
                }}>
                  {u.name.charAt(0).toUpperCase()}
                </span>
                <div style={{ flex: 1 }}>
                  <strong>{u.name}</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0' }}>
                    {u.email} {u.phone ? `· ${u.phone}` : ''}
                  </p>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: rc.bg, color: rc.color, textTransform: 'uppercase',
                  }}>
                    {u.isSuperAdmin ? 'Super Admin' : u.role}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label className="toggle-switch">
                  <input type="checkbox" checked={u.isActive} onChange={() => handleToggle(u.id)} />
                  <span className="toggle-slider">{u.isActive ? 'Active' : 'Inactive'}</span>
                </label>
                {u.role === 'cook' && (
                  <button className="btn btn-sm" onClick={() => handleEditName(u)}
                    style={{ minWidth: 44, padding: '8px 12px', fontSize: '1rem' }}>
                    ✏
                  </button>
                )}
                {u.role !== 'admin' && !u.isSuperAdmin && (
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u)}
                    style={{ minWidth: 44, padding: '8px 12px', fontSize: '1rem' }}>
                    🗑
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">👤</span>
            <h2>No users found</h2>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Delete User?</h2>
            <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.email})?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-block" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-block btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Cook Name</h2>
            <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)}
              placeholder="Cook name" style={{ marginBottom: 16 }} autoFocus />
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-block" onClick={() => setEditTarget(null)}>Cancel</button>
              <button className="btn btn-block btn-primary" onClick={saveEditName}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showAddCook && (
        <div className="modal-overlay" onClick={() => { setShowAddCook(false); setCookMsg('') }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16 }}>Add Cook Account</h2>
            {cookMsg && <p style={{ color: 'var(--error)', marginBottom: 12 }}>{cookMsg}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="form-input" value={cookForm.name} onChange={e => setCookForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" />
              <input className="form-input" type="email" value={cookForm.email} onChange={e => setCookForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" />
              <input className="form-input" type="text" value={cookForm.phone} onChange={e => setCookForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone (optional)" />
              <input className="form-input" type="password" value={cookForm.password} onChange={e => setCookForm(f => ({ ...f, password: e.target.value }))} placeholder="Password (min 8 characters)" />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn btn-block" onClick={() => { setShowAddCook(false); setCookMsg('') }}>Cancel</button>
              <button className="btn btn-block btn-primary" onClick={handleAddCook}>Add Cook</button>
            </div>
          </div>
        </div>
      )}

      {showAddAdmin && (
        <div className="modal-overlay" onClick={() => { setShowAddAdmin(false); setAdminMsg('') }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16 }}>Add Admin Account</h2>
            {adminMsg && <p style={{ color: 'var(--error)', marginBottom: 12 }}>{adminMsg}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="form-input" value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" />
              <input className="form-input" type="email" value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" />
              <input className="form-input" type="password" value={adminForm.password} onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))} placeholder="Password (min 8 characters)" />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn btn-block" onClick={() => { setShowAddAdmin(false); setAdminMsg('') }}>Cancel</button>
              <button className="btn btn-block btn-primary" onClick={handleAddAdmin}>Add Admin</button>
            </div>
          </div>
        </div>
      )}

      {orphans.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2>Orphaned Auth Users ({orphans.length})</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            These users exist in Supabase Auth but have no profile. Clean them up to reduce clutter.
          </p>
          {orphanMsg && <p style={{ color: 'var(--success)', marginBottom: 8 }}>{orphanMsg}</p>}
          <div className="admin-menu-list">
            {orphans.map(u => (
              <div key={u.id} className="admin-menu-item">
                <div className="admin-menu-info">
                  <div style={{ flex: 1 }}>
                    <strong>{u.email}</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0' }}>
                      {u.createdAt && `Created ${new Date(u.createdAt).toLocaleDateString()}`}
                      {u.lastSignIn && ` · Last login ${new Date(u.lastSignIn).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteOrphan(u.id, u.email)}
                  style={{ minWidth: 44, padding: '8px 12px', fontSize: '1rem' }}>
                  🗑
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {guests.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2>Guest Visitors ({guests.length} unique)</h2>
          <div className="admin-menu-list">
            {guests.map((g, i) => (
              <div key={i} className="admin-menu-item">
                <div className="admin-menu-info">
                  <span style={{
                    width: 44, height: 44, borderRadius: '50%', background: '#f3e5f5', color: '#9c27b0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem',
                  }}>
                    {g.name.charAt(0).toUpperCase()}
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong>{g.name}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0' }}>
                      {g.phone ? `📞 ${g.phone}` : 'No phone'}
                    </p>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: '#f3e5f5', color: '#9c27b0', textTransform: 'uppercase',
                    }}>
                      Guest
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: '1.2rem', color: '#9c27b0' }}>{g.orders}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>orders</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
