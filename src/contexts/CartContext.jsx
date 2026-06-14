import { createContext, useContext, useState, useEffect } from 'react'

function safeGet(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def }
  catch { return def }
}

function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) }
  catch { }
}

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => safeGet('bb_cart', []))

  useEffect(() => {
    safeSet('bb_cart', items)
  }, [items])

  const addItem = (menuItem, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === menuItem.id)
      if (existing) {
        return prev.map(i =>
          i.id === menuItem.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { ...menuItem, quantity }]
    })
  }

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id))

  const updateQty = (id, quantity) => {
    if (quantity <= 0) return removeItem(id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
  }

  const clearCart = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
