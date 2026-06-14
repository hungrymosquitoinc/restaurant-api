import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) return data
    return null
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        if (profile) setUser({ id: session.user.id, ...profile })
        else setUser({ id: session.user.id, email: session.user.email })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        if (profile) setUser({ id: session.user.id, ...profile })
        else setUser({ id: session.user.id, email: session.user.email })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid')) return { ok: false, reason: 'invalid' }
      return { ok: false, reason: error.message }
    }
    if (data?.user) {
      const profile = await fetchProfile(data.user.id)
      const userData = profile
        ? { id: data.user.id, ...profile }
        : { id: data.user.id, email: data.user.email }
      setUser(userData)
      return { ok: true, user: userData }
    }
    return { ok: true }
  }

  const register = async (name, email, password, phone) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    })
    if (result.error) {
      if (result.error.message.includes('already')) return false
      throw result.error
    }
    if (result.data.user) {
      await supabase.from('profiles').insert({
        id: result.data.user.id,
        name,
        role: 'user',
        phone: phone || '',
        is_active: true,
      })
      return true
    }
    return false
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const changePassword = async (currentPassword, newPassword) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email,
      password: currentPassword,
    })
    if (signInError) return { ok: false, reason: 'Current password is incorrect' }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { ok: false, reason: error.message }
    return { ok: true }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, changePassword, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
