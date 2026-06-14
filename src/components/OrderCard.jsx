import { Link } from 'react-router-dom'

const statusColors = {
  pending: '#ff9800',
  confirmed: '#2196f3',
  preparing: '#9c27b0',
  ready: '#4caf50',
  delivered: '#607d8b',
  cancelled: '#f44336',
}

const nextSteps = {
  pending: ['confirmed'],
  confirmed: ['preparing'],
  preparing: ['ready'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
};

export default function OrderCard({ order, showLink = true, onStatusChange, isAdmin = false }) {
  const next = nextSteps[order.status] || [];

  const content = (
    <div className="order-card" style={{ borderLeftColor: statusColors[order.status] || '#ccc' }}>
      <div className="order-card-header">
        <span className="order-id">{order.id}</span>
        <span className={`order-status status-${order.status}`}>{order.status}</span>
      </div>
      <div className="order-card-items">
        {order.items.slice(0, 3).map((item, i) => (
          <span key={i} className="order-item-name">{item.name} x{item.quantity}{i < Math.min(order.items.length, 3) - 1 ? ', ' : ''}</span>
        ))}
        {order.items.length > 3 && <span> ...and {order.items.length - 3} more</span>}
      </div>
      {isAdmin && !order.userId && order.delivery?.guestName && (
        <div style={{ fontSize: '0.8rem', color: '#9c27b0', fontWeight: 600, marginBottom: 6 }}>
          👤 Guest: {order.delivery.guestName}{order.delivery?.guestPhone ? ` · ${order.delivery.guestPhone}` : ''}
        </div>
      )}
      <div className="order-card-footer">
        <span className="order-total">₱{order.total}</span>
        <span>
          {order.payment && (
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: order.payment.status === 'paid' ? '#2e7d32' : '#e65100', marginRight: 8 }}>
              {order.payment.method === 'Credit Card' ? '💳' : '💵'} {order.payment.status}
            </span>
          )}
          <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
        </span>
      </div>
      {isAdmin && onStatusChange && (
        <div className="order-actions">
          <select
            value={order.status}
            onChange={(e) => onStatusChange(order.id, e.target.value)}
            className="status-select"
          >
            <option value={order.status}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</option>
            {next.map(s => <option key={s} value={s}>→ {s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            {order.status !== 'cancelled' && order.status !== 'delivered' && next.length > 0 && <option disabled>───</option>}
            {order.status !== 'cancelled' && order.status !== 'delivered' && <option value="cancelled">Cancel Order</option>}
          </select>
        </div>
      )}
    </div>
  )

  if (showLink && !isAdmin) return <Link to={`/orders/${order.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</Link>
  return content
}
