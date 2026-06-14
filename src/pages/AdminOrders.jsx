import { useOrder } from '../contexts/OrderContext'
import OrderCard from '../components/OrderCard'
import { useState } from 'react'

export default function AdminOrders() {
  const { getAllOrders, updateStatus } = useOrder()
  const [filter, setFilter] = useState('all')

  const orders = getAllOrders()
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const handleStatusChange = (orderId, newStatus) => {
    updateStatus(orderId, newStatus)
  }

  return (
    <div className="admin-page">
      <h1>Order Management</h1>
      <div className="filter-tabs">
        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map(f => (
          <button key={f} className={`cat-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h2>No {filter !== 'all' ? filter : ''} orders</h2>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map(order => (
            <OrderCard key={order.id} order={order} showLink={false} isAdmin={true} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
