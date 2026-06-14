import { useState } from 'react'
import { useOrder } from '../contexts/OrderContext'

const statusColors = {
  confirmed: '#2196f3',
  preparing: '#9c27b0',
  ready: '#4caf50',
}

export default function Kitchen() {
  const { getAllOrders, updateStatus } = useOrder()
  const [filter, setFilter] = useState('all')

  const all = getAllOrders()
  const orders = filter === 'all'
    ? all.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status))
    : all.filter(o => o.status === filter)

  const handleStatus = (orderId, newStatus) => {
    updateStatus(orderId, newStatus)
  }

  const badges = {
    'dine-in': { label: '🍽️ Dine In', bg: '#e3f2fd', color: '#1565c0' },
    'takeout': { label: '🥡 Takeout', bg: '#fff3e0', color: '#e65100' },
  }

  return (
    <div className="kitchen-page">
      <div className="kitchen-header">
        <h1>👨‍🍳 Kitchen Display</h1>
        <div className="filter-tabs">
          {[
            { key: 'all', icon: '🔥', label: 'Active' },
            { key: 'confirmed', icon: '📋', label: 'Confirmed' },
            { key: 'preparing', icon: '👨‍🍳', label: 'Preparing' },
            { key: 'ready', icon: '✅', label: 'Ready' },
          ].map(f => (
            <button key={f.key} className={`cat-tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon" style={{ fontSize: '5rem' }}>✅</span>
          <h2 style={{ fontSize: '1.8rem' }}>All caught up!</h2>
          <p style={{ fontSize: '1.1rem' }}>No orders in the kitchen right now</p>
        </div>
      ) : (
        <div className="kitchen-orders">
          {orders.map(order => (
            <div key={order.id} className="kitchen-card" style={{ borderLeftColor: statusColors[order.status] || '#ccc' }}>
              <div className="kitchen-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span className="kitchen-order-id">#{order.id}</span>
                  <span className="kitchen-type-badge" style={{ background: badges[order.orderType]?.bg || '#e8f5e9', color: badges[order.orderType]?.color || '#2e7d32' }}>
                    {badges[order.orderType]?.label || '🥡 Takeout'}
                  </span>
                  {order.delivery?.table && <span className="kitchen-table">🍽️ Table {order.delivery.table}</span>}
                  {order.delivery?.address && <span className="kitchen-table">📍 {order.delivery.address}</span>}
                </div>
                <span className={`order-status status-${order.status}`}>{order.status === 'confirmed' ? '📋 Confirmed' : order.status === 'preparing' ? '👨‍🍳 Preparing' : '✅ Ready'}</span>
              </div>
              <div className="kitchen-items">
                {order.items.map((item, i) => (
                  <div key={i} className="kitchen-item">
                    <span className="kitchen-item-qty">{item.quantity}x</span>
                    <span className="kitchen-item-name"><img className="kitchen-item-img" src={item.image || 'https://placehold.co/200x200/e0e0e0/999?text=No+Image'} alt={item.name} style={{ width: 20, height: 20, borderRadius: 4, verticalAlign: 'middle', marginRight: 4 }} /> {item.name}</span>
                  </div>
                ))}
              </div>
              {order.delivery?.notes && (
                <div className="kitchen-notes">📝 {order.delivery.notes}</div>
              )}
              <div className="kitchen-actions">
                {order.status === 'confirmed' && (
                  <button className="btn btn-primary btn-block kitchen-action-btn" onClick={() => handleStatus(order.id, 'preparing')}>
                    🔪 Start Cooking
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button className="btn btn-success btn-block kitchen-done-btn" onClick={() => handleStatus(order.id, 'ready')}>
                    ✅ Done! Press when Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <span className="kitchen-ready-badge">✅ Ready for pickup / serving</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}