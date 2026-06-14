import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

function safeGet(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def }
  catch { return def }
}

function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) }
  catch { }
}

function normalizeOrder(o) {
  return {
    ...o,
    id: o.display_id,
    userId: o.user_id,
    orderType: o.order_type,
    statusHistory: o.status_history,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    guestName: o.guest_name,
    guestPhone: o.guest_phone,
  }
}

const OrderContext = createContext(null)

function generateOrderId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase()
}

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([])
  const [activeStatus, setActiveStatus] = useState('')
  const { user } = useAuth()

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (!error && data) setOrders(data.map(normalizeOrder))
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const placeOrder = async (items, total, userId, delivery, orderType = 'takeout', payment = {}) => {
    const order = {
      display_id: generateOrderId(),
      user_id: userId || null,
      guest_name: delivery?.guestName || '',
      guest_phone: delivery?.guestPhone || '',
      items,
      total,
      status: 'pending',
      status_history: [{ status: 'pending', time: new Date().toLocaleString() }],
      order_type: orderType,
      delivery,
      payment: {
        method: payment.method || 'cash',
        status: payment.status || 'paid',
        paidAt: payment.status === 'paid' ? new Date().toISOString() : null,
        paymongoSourceId: payment.paymongoSourceId || null,
        paymongoPaymentId: payment.paymongoPaymentId || null,
      },
    }
    const { data, error } = await supabase.from('orders').insert(order).select().single()
    if (error) throw error
    const normalized = normalizeOrder(data)
    setOrders(prev => [normalized, ...prev])
    setActiveStatus('pending')
    return normalized
  }

  const createPendingOrder = (items, total, userId, delivery, orderType, payment) => {
    const pendingOrder = {
      items: [...items],
      total,
      userId,
      delivery,
      orderType,
      payment: {
        method: payment.method,
        status: 'pending_payment',
        paymongoSourceId: payment.paymongoSourceId || null,
      },
      createdAt: new Date().toISOString(),
    }
    safeSet('bb_pending_order', pendingOrder)
    return pendingOrder
  }

  const confirmPendingOrder = async () => {
    const pending = safeGet('bb_pending_order', null)
    if (!pending) return null
    safeSet('bb_pending_order', null)
    return await placeOrder(
      pending.items, pending.total, pending.userId,
      pending.delivery, pending.orderType, { ...pending.payment, status: 'paid' }
    )
  }

  const updatePaymentStatus = async (orderId, paymentStatus, paymentId) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    const payment = { ...order.payment, status: paymentStatus, paidAt: paymentStatus === 'paid' ? new Date().toISOString() : order.payment?.paidAt, paymongoPaymentId: paymentId || order.payment?.paymongoPaymentId }
    const { error } = await supabase.from('orders').update({ payment }).eq('display_id', orderId)
    if (!error) fetchOrders()
  }

  const updateStatus = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    const statusHistory = [...(order.statusHistory || []), { status: newStatus, time: new Date().toLocaleString() }]
    const { error } = await supabase.from('orders').update({ status: newStatus, status_history: statusHistory }).eq('display_id', orderId)
    if (!error) fetchOrders()
  }

  const getUserOrders = (userId) => orders.filter(o => o.userId === userId)
  const getAllOrders = () => orders
  const getOrder = (id) => orders.find(o => o.id === id)

  return (
    <OrderContext.Provider value={{
      orders, placeOrder, createPendingOrder, confirmPendingOrder,
      updatePaymentStatus, updateStatus, getUserOrders, getAllOrders, getOrder,
      activeStatus, setActiveStatus,
    }}>
      {children}
    </OrderContext.Provider>
  )
}

export const useOrder = () => useContext(OrderContext)
