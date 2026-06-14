import { supabase } from '../lib/supabase'
import { apiGet, apiPost } from '../lib/api'

function normalizeProfile(p) {
  return { ...p, isActive: p.is_active, isSuperAdmin: p.is_super_admin }
}

export async function getUsers() {
  const { data, error } = await supabase.from('profiles').select('*').order('name')
  if (error) throw error
  return (data || []).map(normalizeProfile)
}

export async function toggleUserActive(userId) {
  const { data: profile } = await supabase.from('profiles').select('is_active').eq('id', userId).single()
  if (!profile) return null
  const { data, error } = await supabase.from('profiles').update({ is_active: !profile.is_active }).eq('id', userId).select()
  if (error) throw error
  return getUsers()
}

export async function deleteUser(userId) {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  if (!profile || profile.role === 'admin') return null
  const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId)
  if (profileError) throw profileError
  try {
    await apiPost('/admin/delete-user', { userId })
  } catch (e) {
    console.warn('Auth user deletion failed:', e.message)
  }
  return getUsers()
}

export async function updateUser(userId, updates) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) throw error
  return getUsers()
}

export async function registerUser(name, email, password, phone) {
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone, role: 'user' } },
  })
  if (signUpError) {
    if (signUpError.message.includes('already')) return null
    throw signUpError
  }
  if (!authData.user) return null
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    name,
    role: 'user',
    phone: phone || '',
    is_active: true,
  })
  if (profileError) throw profileError
  return { id: authData.user.id, name, email, role: 'user', phone: phone || '', isActive: true }
}

export async function getOrphanAuthUsers() {
  try {
    const authUsers = await apiGet('/admin/auth-users')
    const { data: profiles } = await supabase.from('profiles').select('id')
    const profileIds = new Set((profiles || []).map(p => p.id))
    return authUsers.filter(u => !profileIds.has(u.id))
  } catch { return [] }
}

export async function deleteAuthUser(userId) {
  await apiPost('/admin/delete-user', { userId })
}

export async function registerCook(name, email, password, phone) {
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone, role: 'cook' } },
  })
  if (signUpError) {
    if (signUpError.message.includes('already')) return null
    throw signUpError
  }
  if (!authData.user) return null
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    name,
    role: 'cook',
    phone: phone || '',
    is_active: true,
  })
  if (profileError) throw profileError
  return { id: authData.user.id, name, email, role: 'cook', phone: phone || '', isActive: true }
}
