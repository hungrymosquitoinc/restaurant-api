import { useAuth } from '../contexts/AuthContext'
import { useOrder } from '../contexts/OrderContext'
import OrderCard from '../components/OrderCard'

export default function Orders() {
  const { user } = useAuth()
  const { getUserOrders } = useOrder()
  const orders = getUserOrders(user.id)

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h2>No orders yet</h2>
          <p>Place your first order and it will appear here</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
