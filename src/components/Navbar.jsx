import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

export default function Navbar() {
  const { user, logout, changePassword } = useAuth()
  const { count } = useCart()
  const location = useLocation()
  const [showChangePw, setShowChangePw] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')

  const validatePassword = (pw) => {
    if (pw.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter'
    if (!/[a-z]/.test(pw)) return 'Password must contain a lowercase letter'
    if (!/[0-9]/.test(pw)) return 'Password must contain a number'
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain a special character'
    return null
  }

  const handleChangePw = () => {
    setPwMsg('')
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) return setPwMsg('All fields required')
    if (pwForm.newPw !== pwForm.confirm) return setPwMsg('New passwords do not match')
    const pwErr = validatePassword(pwForm.newPw)
    if (pwErr) return setPwMsg(pwErr)
    const result = changePassword(pwForm.current, pwForm.newPw)
    if (!result.ok) return setPwMsg(result.reason)
    setPwMsg('Password updated successfully')
    setPwForm({ current: '', newPw: '', confirm: '' })
  }

  if (!user) {
    return (
      <nav className="navbar">
        <Link to="/" className="nav-brand">Zpectrum Restobar</Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/menu" className={`nav-link ${location.pathname === '/menu' ? 'active' : ''}`}>Menu</Link>
          <Link to="/cart" className={`nav-link cart-link ${location.pathname === '/cart' ? 'active' : ''}`}>
            Cart {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>
          <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}>Login</Link>
        </div>
      </nav>
    )
  }

  const role = user.role

  return (
    <nav className="navbar">
      <Link to={role === 'admin' ? '/admin' : role === 'cook' ? '/kitchen' : '/'} className="nav-brand">Zpectrum Restobar</Link>
      <div className="nav-links">
        {role === 'admin' ? (
          <>
            <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>Dashboard</Link>
            <Link to="/admin/orders" className={`nav-link ${location.pathname === '/admin/orders' ? 'active' : ''}`}>Orders</Link>
            <Link to="/admin/menu" className={`nav-link ${location.pathname === '/admin/menu' ? 'active' : ''}`}>Menu</Link>
            <Link to="/admin/reports" className={`nav-link ${location.pathname === '/admin/reports' ? 'active' : ''}`}>Reports</Link>
            <Link to="/admin/payments" className={`nav-link ${location.pathname === '/admin/payments' ? 'active' : ''}`}>Payments</Link>
            <Link to="/admin/users" className={`nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}>Users</Link>
          </>
        ) : role === 'cook' ? (
          <>
            <Link to="/kitchen" className={`nav-link ${location.pathname === '/kitchen' ? 'active' : ''}`}>Kitchen</Link>
            <Link to="/orders" className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}>Orders</Link>
          </>
        ) : (
          <>
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
            <Link to="/menu" className={`nav-link ${location.pathname === '/menu' ? 'active' : ''}`}>Menu</Link>
            <Link to="/orders" className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}>Orders</Link>
            <Link to="/cart" className={`nav-link cart-link ${location.pathname === '/cart' ? 'active' : ''}`}>
              Cart {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>
          </>
        )}
        <button onClick={() => setShowChangePw(true)} className="nav-link" style={{ fontSize: '0.75rem' }}>🔑</button>
        <button onClick={logout} className="nav-link logout-btn">Logout</button>
      </div>

      {showChangePw && (
        <div className="modal-overlay" onClick={() => setShowChangePw(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Change Password</h2>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
            </div>
            {pwMsg && (
              <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, color: pwMsg.includes('success') ? 'var(--success)' : 'var(--danger)' }}>
                {pwMsg}
              </p>
            )}
            <div className="form-row" style={{ gap: 8 }}>
              <button className="btn btn-block" onClick={() => { setShowChangePw(false); setPwMsg(''); setPwForm({ current: '', newPw: '', confirm: '' }) }}>Cancel</button>
              <button className="btn btn-primary btn-block" onClick={handleChangePw}>Update</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
