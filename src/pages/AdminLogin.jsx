import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const res = login(email, password)
    if (!res.ok) {
      if (res.reason === 'inactive') setError('Your account has been deactivated.')
      else setError('Invalid credentials')
      return
    }
    if (res.user.role !== 'admin') { setError('Not an admin account'); return }
    navigate('/admin')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Admin Portal</h1>
        <p className="auth-subtitle">Restaurant staff login</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter admin email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter admin password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Admin Sign In</button>
        </form>
      </div>
    </div>
  )
}
