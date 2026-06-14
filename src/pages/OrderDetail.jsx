import { useParams, Link } from 'react-router-dom'
import { useOrder } from '../contexts/OrderContext'

const statusColors = {
  pending: '#ff9800',
  confirmed: '#2196f3',
  preparing: '#9c27b0',
  ready: '#4caf50',
  delivered: '#607d8b',
  cancelled: '#f44336',
}

const statusSteps = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

export default function OrderDetail() {
  const { id } = useParams()
  const { getOrder } = useOrder()
  const order = getOrder(id)

  if (!order) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🔍</span>
        <h2>Order not found</h2>
        <Link to="/orders" className="btn btn-primary">View My Orders</Link>
      </div>
    )
  }

  const currentStep = statusSteps.indexOf(order.status)

  return (
    <div className="order-detail-page">
      <div className="order-detail-header">
        <h1>Order {order.id}</h1>
        <span className={`order-status status-${order.status}`}>{order.status}</span>
      </div>

      <div className="order-timeline">
        {statusSteps.map((step, i) => (
          <div key={step} className={`timeline-step ${i <= currentStep ? 'completed' : ''} ${i === currentStep ? 'current' : ''}`}>
            <div className="timeline-dot" style={{ background: i <= currentStep ? statusColors[step] : '#ddd' }}></div>
            <span className="timeline-label">{step.charAt(0).toUpperCase() + step.slice(1)}</span>
          </div>
        ))}
      </div>

      <section className="order-section">
        <h2>Items</h2>
        <div className="order-items">
          {order.items.map((item, i) => (
            <div key={i} className="order-item">
              <span><img className="order-item-img" src={item.image || 'https://placehold.co/200x200/e0e0e0/999?text=No+Image'} alt={item.name} style={{ width: 24, height: 24, borderRadius: 4, verticalAlign: 'middle', marginRight: 6 }} /> {item.name}</span>
              <span>x{item.quantity}</span>
              <span>₱{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="order-total-line">
          <strong>Total</strong>
          <strong>₱{order.total}</strong>
        </div>
      </section>

      <section className="order-section">
        <h2>Delivery</h2>
        <p><strong>Address:</strong> {order.delivery?.address || 'N/A'}</p>
        {order.delivery?.notes && <p><strong>Notes:</strong> {order.delivery.notes}</p>}
      </section>

      {order.payment && (
        <section className="order-section">
          <h2>Payment</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
            <span>
              {order.payment.method === 'Credit Card' ? '💳' : order.payment.type === 'crypto' ? '₿' : order.payment.accountNumber ? (order.payment.type === 'bank' ? '🏦' : '📱') : '💵'}
              {' '}{order.payment.method}
            </span>
            <span style={{ color: '#2e7d32', fontWeight: 700 }}>✅ {order.payment.status}</span>
          </div>
          {order.payment.accountNumber && (
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 12, marginTop: 8 }}>
              <p style={{ fontSize: '0.85rem' }}><strong>{order.payment.type === 'crypto' ? 'Wallet' : 'Account'}:</strong> {order.payment.accountName}</p>
              <p style={{ fontSize: '0.85rem' }}><strong>{order.payment.type === 'crypto' ? 'Address' : 'Number'}:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{order.payment.accountNumber}</span></p>
              {order.payment.type === 'crypto' && order.payment.network && (
                <p style={{ fontSize: '0.85rem', marginTop: 4 }}><strong>Network:</strong> <span style={{ fontWeight: 700, color: '#7b1fa2' }}>{order.payment.network}</span></p>
              )}
              {order.payment.type === 'crypto' && order.payment.memoTag && (
                <p style={{ fontSize: '0.85rem', marginTop: 2 }}><strong>Dest. Tag / Memo:</strong> {order.payment.memoTag}</p>
              )}
            </div>
          )}
          <p style={{ fontSize: '0.8rem', color: '#888', marginTop: 6 }}>
            Paid at: {new Date(order.payment.paidAt).toLocaleString()}
          </p>
        </section>
      )}

      <section className="order-section">
        <h2>Status History</h2>
        <div className="status-history">
          {order.statusHistory.map((entry, i) => (
            <div key={i} className="history-entry">
              <span className={`status-badge status-${entry.status}`}>{entry.status}</span>
              <span className="history-time">{entry.time}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
