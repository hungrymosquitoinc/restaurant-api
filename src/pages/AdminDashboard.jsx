import { Link } from 'react-router-dom'
import { useOrder } from '../contexts/OrderContext'

export default function AdminDashboard() {
  const { getAllOrders } = useOrder()
  const orders = getAllOrders()

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
    cardPayments: orders.filter(o => o.payment?.method === 'Credit Card').length,
    cashPayments: orders.filter(o => o.payment?.method === 'Cash on Delivery' || (!o.payment)).length,
    guestOrders: orders.filter(o => o.userId === null).length,
  }

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-value">{stats.total}</span><span className="stat-label">Total Orders</span></div>
        <div className="stat-card pending"><span className="stat-value">{stats.pending}</span><span className="stat-label">Pending</span></div>
        <div className="stat-card preparing"><span className="stat-value">{stats.preparing}</span><span className="stat-label">Preparing</span></div>
        <div className="stat-card ready"><span className="stat-value">{stats.ready}</span><span className="stat-label">Ready</span></div>
        <div className="stat-card completed"><span className="stat-value">{stats.completed}</span><span className="stat-label">Delivered</span></div>
        <div className="stat-card revenue"><span className="stat-value">₱{stats.revenue}</span><span className="stat-label">Revenue</span></div>
        <div className="stat-card" style={{ borderTopColor: '#1565c0' }}><span className="stat-value">💳 {stats.cardPayments}</span><span className="stat-label">Card</span></div>
        <div className="stat-card" style={{ borderTopColor: '#2e7d32' }}><span className="stat-value">💵 {stats.cashPayments}</span><span className="stat-label">Cash</span></div>
        <div className="stat-card" style={{ borderTopColor: '#9c27b0' }}><span className="stat-value">👤 {stats.guestOrders}</span><span className="stat-label">Guest Orders</span></div>
      </div>

      <div className="admin-actions">
        <Link to="/admin/orders" className="btn btn-primary">Manage Orders</Link>
        <Link to="/admin/menu" className="btn btn-secondary">Edit Menu</Link>
      </div>

      {recentOrders.length > 0 && (
        <section>
          <h2>Recent Orders</h2>
          <div className="orders-list">
            {recentOrders.map(order => (
              <div key={order.id} className="order-card" style={{ borderLeftColor: '#2196f3' }}>
                <div className="order-card-header">
                  <span className="order-id">{order.id}</span>
                  <span className={`order-status status-${order.status}`}>{order.status}</span>
                </div>
                <div className="order-card-footer">
                  <span className="order-total">₱{order.total}</span>
                  <span>
                    {order.payment && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#2e7d32', marginRight: 8 }}>
                        {order.payment.method === 'Credit Card' ? '💳' : '💵'}
                      </span>
                    )}
                    <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
